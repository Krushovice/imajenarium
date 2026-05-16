from __future__ import annotations

import hashlib
import hmac
import time
import uuid

import redis.asyncio as aioredis

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    new_token_id,
    verify_password,
)
from app.models.users import User
from app.repositories.users import UserRepository
from app.schemas.auth import (
    GoogleCallbackRequest,
    LoginRequest,
    RegisterRequest,
    TelegramAuthRequest,
)

_REFRESH_PREFIX = "refresh:"
_GUEST_DOMAIN = "@guest.internal"
_TELEGRAM_DOMAIN = "@telegram.internal"


class AuthError(Exception):
    def __init__(self, message: str, status_code: int = 400) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class AuthService:
    def __init__(self, user_repo: UserRepository, redis: aioredis.Redis) -> None:
        self._users = user_repo
        self._redis = redis

    # ------------------------------------------------------------------
    # 2.2 Email/Password
    # ------------------------------------------------------------------

    async def register(self, data: RegisterRequest) -> tuple[User, str, str]:
        if await self._users.email_exists(data.email.lower()):
            raise AuthError("Email already registered", 409)
        if await self._users.username_exists(data.username.lower()):
            raise AuthError("Username already taken", 409)

        user = await self._users.create(
            {
                "email": data.email.lower(),
                "username": data.username.lower(),
                "hashed_password": hash_password(data.password),
                "display_name": data.display_name or data.username,
                "is_active": True,
                "is_verified": False,
            }
        )
        access, refresh = await self._issue_tokens(user)
        return user, access, refresh

    async def login(self, data: LoginRequest) -> tuple[User, str, str]:
        user = await self._users.get_by_email(data.email.lower())
        if not user or not user.hashed_password:
            raise AuthError("Invalid credentials", 401)
        if not verify_password(data.password, user.hashed_password):
            raise AuthError("Invalid credentials", 401)
        if not user.is_active:
            raise AuthError("Account disabled", 403)
        access, refresh = await self._issue_tokens(user)
        return user, access, refresh

    # ------------------------------------------------------------------
    # 2.1 Refresh + Logout
    # ------------------------------------------------------------------

    async def refresh(self, refresh_token: str) -> tuple[User, str, str]:
        try:
            payload = decode_token(refresh_token)
        except Exception:
            raise AuthError("Invalid refresh token", 401)

        if payload.get("type") != "refresh":
            raise AuthError("Invalid token type", 401)

        token_id: str | None = payload.get("jti")
        user_id: str | None = payload.get("sub")

        if not token_id or not user_id:
            raise AuthError("Malformed token", 401)

        stored = await self._redis.get(f"{_REFRESH_PREFIX}{token_id}")
        if stored is None or stored != user_id:
            raise AuthError("Refresh token revoked or invalid", 401)

        user = await self._users.get(uuid.UUID(user_id))
        if not user or not user.is_active:
            raise AuthError("User not found or inactive", 401)

        await self._redis.delete(f"{_REFRESH_PREFIX}{token_id}")
        access, new_refresh = await self._issue_tokens(user)
        return user, access, new_refresh

    async def logout(self, refresh_token: str) -> None:
        try:
            payload = decode_token(refresh_token)
        except Exception:
            return
        token_id = payload.get("jti")
        if token_id:
            await self._redis.delete(f"{_REFRESH_PREFIX}{token_id}")

    # ------------------------------------------------------------------
    # 2.3 Telegram
    # ------------------------------------------------------------------

    async def telegram_auth(self, data: TelegramAuthRequest) -> tuple[User, str, str]:
        if not settings.telegram_bot_token:
            raise AuthError("Telegram auth not configured", 503)
        if not self._verify_telegram_hash(data):
            raise AuthError("Invalid Telegram signature", 401)
        if time.time() - data.auth_date > 86400:
            raise AuthError("Telegram auth data expired", 401)

        user = await self._users.get_by_telegram_id(data.id)
        if user is None:
            username = (data.username or f"tg_{data.id}").lower()
            if await self._users.username_exists(username):
                username = f"tg_{data.id}"
            user = await self._users.create(
                {
                    "email": f"tg_{data.id}{_TELEGRAM_DOMAIN}",
                    "username": username,
                    "display_name": f"{data.first_name} {data.last_name or ''}".strip(),
                    "avatar_url": data.photo_url,
                    "telegram_id": data.id,
                    "telegram_username": data.username,
                    "is_active": True,
                    "is_verified": True,
                }
            )
        else:
            user = await self._users.update(
                user,
                {
                    "telegram_username": data.username,
                    "display_name": f"{data.first_name} {data.last_name or ''}".strip(),
                    "avatar_url": data.photo_url or user.avatar_url,
                },
            )

        access, refresh = await self._issue_tokens(user)
        return user, access, refresh

    @staticmethod
    def _verify_telegram_hash(data: TelegramAuthRequest) -> bool:
        bot_token = settings.telegram_bot_token
        if not bot_token:
            return False
        secret_key = hashlib.sha256(bot_token.encode()).digest()
        fields: dict[str, str] = {
            "id": str(data.id),
            "first_name": data.first_name,
            "auth_date": str(data.auth_date),
        }
        if data.last_name:
            fields["last_name"] = data.last_name
        if data.username:
            fields["username"] = data.username
        if data.photo_url:
            fields["photo_url"] = data.photo_url
        check_string = "\n".join(f"{k}={v}" for k, v in sorted(fields.items()))
        computed = hmac.new(secret_key, check_string.encode(), hashlib.sha256).hexdigest()
        return hmac.compare_digest(computed, data.hash)

    # ------------------------------------------------------------------
    # 2.4 Google OAuth
    # ------------------------------------------------------------------

    async def google_callback(self, code: str, redirect_uri: str) -> tuple[User, str, str]:
        import httpx

        if not settings.google_client_id or not settings.google_client_secret:
            raise AuthError("Google OAuth not configured", 503)

        async with httpx.AsyncClient() as client:
            token_resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code",
                },
            )
            if token_resp.status_code != 200:
                raise AuthError("Google token exchange failed", 401)

            access_tok = token_resp.json().get("access_token")

            userinfo_resp = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_tok}"},
            )
            if userinfo_resp.status_code != 200:
                raise AuthError("Failed to fetch Google user info", 401)
            guser = userinfo_resp.json()

        email: str = guser.get("email", "").lower()
        name: str = guser.get("name", "")
        avatar: str | None = guser.get("picture")

        if not email:
            raise AuthError("Google account has no email", 400)

        user = await self._users.get_by_email(email)
        if user is None:
            base = email.split("@")[0]
            username = base
            suffix = 1
            while await self._users.username_exists(username):
                username = f"{base}{suffix}"
                suffix += 1
            user = await self._users.create(
                {
                    "email": email,
                    "username": username,
                    "display_name": name,
                    "avatar_url": avatar,
                    "is_active": True,
                    "is_verified": True,
                }
            )
        else:
            user = await self._users.update(user, {"avatar_url": avatar or user.avatar_url})

        access, refresh = await self._issue_tokens(user)
        return user, access, refresh

    # ------------------------------------------------------------------
    # 2.5 Guest mode
    # ------------------------------------------------------------------

    async def create_guest(self) -> tuple[User, str, str]:
        guest_uuid = str(uuid.uuid4())
        user = await self._users.create(
            {
                "email": f"guest_{guest_uuid}{_GUEST_DOMAIN}",
                "username": f"guest_{guest_uuid[:8]}",
                "display_name": "Guest Reader",
                "is_active": True,
                "is_verified": False,
            }
        )
        access, refresh = await self._issue_tokens(user, guest=True)
        return user, access, refresh

    @staticmethod
    def is_guest(user: User) -> bool:
        return user.email.endswith(_GUEST_DOMAIN)

    # ------------------------------------------------------------------
    # Token internals
    # ------------------------------------------------------------------

    async def _issue_tokens(self, user: User, *, guest: bool = False) -> tuple[str, str]:
        token_id = new_token_id()
        user_id = str(user.id)
        expire_days = 1 if guest else settings.refresh_token_expire_days

        access = create_access_token(user_id)
        refresh = create_refresh_token(user_id, jti=token_id, expire_days=expire_days)

        await self._redis.set(f"{_REFRESH_PREFIX}{token_id}", user_id, ex=expire_days * 86400)
        return access, refresh
