from __future__ import annotations

import logging

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.fsm.storage.redis import RedisStorage

from app.core.config import settings

logger = logging.getLogger(__name__)

_bot: Bot | None = None
_dp: Dispatcher | None = None


def create_bot() -> Bot:
    if not settings.telegram_bot_token:
        raise RuntimeError("TELEGRAM_BOT_TOKEN is not set")
    return Bot(
        token=settings.telegram_bot_token,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )


def create_dispatcher(storage: RedisStorage) -> Dispatcher:
    from app.telegram.middlewares.db import DatabaseMiddleware
    from app.telegram.middlewares.user import UserMiddleware
    from app.telegram.router import main_router

    dp = Dispatcher(storage=storage)
    dp.update.middleware(DatabaseMiddleware())
    dp.update.middleware(UserMiddleware())
    dp.include_router(main_router)
    return dp


def get_bot() -> Bot:
    global _bot
    if _bot is None:
        _bot = create_bot()
    return _bot


def get_dispatcher() -> Dispatcher:
    global _dp
    if _dp is None:
        raise RuntimeError("Dispatcher not initialised — call init_telegram() first")
    return _dp


async def init_telegram() -> tuple[Bot, Dispatcher]:
    """Create bot + dispatcher, set webhook. Called from FastAPI lifespan."""
    global _bot, _dp

    if not settings.telegram_bot_token:
        logger.warning("TELEGRAM_BOT_TOKEN not set — Telegram integration disabled")
        return None, None  # type: ignore[return-value]

    from app.core.redis import get_redis_client

    storage = RedisStorage(redis=get_redis_client())

    _bot = create_bot()
    _dp = create_dispatcher(storage)

    if settings.telegram_webhook_url:
        try:
            await _bot.set_webhook(
                url=settings.telegram_webhook_url,
                secret_token=settings.telegram_secret_token,
                drop_pending_updates=True,
                allowed_updates=["message", "callback_query", "inline_query"],
            )
            logger.info("Telegram webhook set: %s", settings.telegram_webhook_url)
        except Exception as exc:
            logger.warning("Telegram webhook setup failed (non-fatal): %s", exc)
    else:
        logger.warning("TELEGRAM_WEBHOOK_URL not set — webhook not registered")

    return _bot, _dp


async def shutdown_telegram() -> None:
    global _bot, _dp
    if _bot:
        await _bot.session.close()
    _bot = None
    _dp = None
