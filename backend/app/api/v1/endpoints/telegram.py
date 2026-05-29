from __future__ import annotations

import hashlib
import hmac
import logging
import secrets
import time
import urllib.parse
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import ActiveUser, DBSession
from app.core.config import settings
from app.core.security import create_access_token
from app.repositories.users import UserRepository
from app.schemas.auth import UserOut

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/telegram", tags=["telegram"])

_REDIS_LINK_PREFIX = "tg_link:"
_MINIAPP_MAX_AGE = 86400  # 24 h — max age of initData


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class LinkTokenResponse(BaseModel):
    token: str
    expires_in: int


class MiniAppAuthRequest(BaseModel):
    init_data: str


class MiniAppAuthResponse(BaseModel):
    access_token: str
    user: UserOut


class WebhookSetupResponse(BaseModel):
    ok: bool
    url: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _validate_init_data(init_data: str, bot_token: str) -> dict:
    """Validate Telegram Mini App initData HMAC. Raises HTTPException on failure."""
    try:
        parsed = dict(urllib.parse.parse_qsl(init_data, strict_parsing=True))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid initData format")

    received_hash = parsed.pop("hash", None)
    if not received_hash:
        raise HTTPException(status_code=400, detail="Missing hash in initData")

    # Check freshness
    auth_date = parsed.get("auth_date")
    if auth_date and (time.time() - int(auth_date)) > _MINIAPP_MAX_AGE:
        raise HTTPException(status_code=401, detail="initData expired")

    data_check_string = "\n".join(
        f"{k}={v}" for k, v in sorted(parsed.items())
    )
    secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    expected_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(expected_hash, received_hash):
        raise HTTPException(status_code=401, detail="Invalid initData signature")

    return parsed


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post("/webhook", include_in_schema=False)
async def telegram_webhook(request: Request) -> Response:
    """Receive updates from Telegram via webhook."""
    from aiogram.types import Update

    from app.telegram.bot import get_bot, get_dispatcher

    secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token", "")
    if not hmac.compare_digest(secret, settings.telegram_secret_token):
        raise HTTPException(status_code=403, detail="Invalid secret token")

    try:
        update_data = await request.json()
        update = Update.model_validate(update_data)
        bot = get_bot()
        dp = get_dispatcher()
        await dp.feed_update(bot, update)
    except RuntimeError as e:
        # Telegram not initialised (token not set)
        logger.warning("Webhook hit but telegram not initialised: %s", e)
    except Exception:
        logger.exception("Error processing webhook update")

    return Response(status_code=200)


@router.get("/link-token", response_model=LinkTokenResponse)
async def get_link_token(current_user: ActiveUser) -> LinkTokenResponse:
    """Generate a short-lived token for linking a Telegram account."""
    from app.core.redis import get_redis_client

    redis = get_redis_client()
    token = secrets.token_urlsafe(24)
    ttl = settings.telegram_link_token_ttl

    await redis.set(f"{_REDIS_LINK_PREFIX}{token}", str(current_user.id), ex=ttl)
    return LinkTokenResponse(token=token, expires_in=ttl)


@router.post("/miniapp/auth", response_model=MiniAppAuthResponse)
async def miniapp_auth(payload: MiniAppAuthRequest, db: DBSession) -> MiniAppAuthResponse:
    """Authenticate Telegram Mini App user via initData validation."""
    if not settings.telegram_bot_token:
        raise HTTPException(status_code=503, detail="Telegram not configured")

    parsed = _validate_init_data(payload.init_data, settings.telegram_bot_token)

    # Parse user from initData
    import json

    user_json_str = parsed.get("user")
    if not user_json_str:
        raise HTTPException(status_code=400, detail="No user in initData")

    try:
        tg_user_data = json.loads(user_json_str)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid user JSON in initData")

    tg_id: int = tg_user_data.get("id")
    tg_username: str | None = tg_user_data.get("username")
    tg_first_name: str | None = tg_user_data.get("first_name")
    tg_last_name: str | None = tg_user_data.get("last_name")
    tg_display = " ".join(filter(None, [tg_first_name, tg_last_name])) or tg_username

    if not tg_id:
        raise HTTPException(status_code=400, detail="Invalid user ID in initData")

    repo = UserRepository(db)
    user = await repo.get_by_telegram_id(tg_id)

    if user is None:
        # Auto-register telegram-only user
        base_username = (tg_username or f"tg{tg_id}").lower()[:48]
        username = base_username
        suffix = 1
        while await repo.username_exists(username):
            username = f"{base_username}{suffix}"
            suffix += 1

        email = f"tg_{tg_id}@telegram.book-imaginarium.local"
        user = await repo.create({
            "email": email,
            "username": username,
            "display_name": tg_display or username,
            "telegram_id": tg_id,
            "telegram_username": tg_username,
            "is_active": True,
            "is_verified": True,
        })
        logger.info("Auto-registered Mini App user: tg_id=%s username=%s", tg_id, username)
    else:
        # Sync telegram_username if changed
        if tg_username and tg_username != user.telegram_username:
            await repo.update(user.id, {"telegram_username": tg_username})

    access_token = create_access_token(str(user.id))
    return MiniAppAuthResponse(
        access_token=access_token,
        user=UserOut.model_validate(user),
    )


@router.post("/setup-webhook", response_model=WebhookSetupResponse)
async def setup_webhook(current_user: ActiveUser) -> WebhookSetupResponse:
    """(Re)register the webhook URL with Telegram."""
    if not settings.telegram_webhook_url:
        raise HTTPException(status_code=400, detail="TELEGRAM_WEBHOOK_URL not configured")

    from app.telegram.bot import get_bot

    try:
        bot = get_bot()
        await bot.set_webhook(
            url=settings.telegram_webhook_url,
            secret_token=settings.telegram_secret_token,
            drop_pending_updates=False,
            allowed_updates=["message", "callback_query", "inline_query"],
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    return WebhookSetupResponse(ok=True, url=settings.telegram_webhook_url)
