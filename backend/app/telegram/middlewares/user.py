from __future__ import annotations

from typing import Any, Awaitable, Callable

from aiogram import BaseMiddleware
from aiogram.types import TelegramObject
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.users import User
from app.repositories.users import UserRepository


class UserMiddleware(BaseMiddleware):
    """Attach tg_user (User | None) to handler data based on telegram_id."""

    async def __call__(
        self,
        handler: Callable[[TelegramObject, dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: dict[str, Any],
    ) -> Any:
        db: AsyncSession | None = data.get("db")
        tg_user: User | None = None

        from_user = getattr(event, "from_user", None)
        if from_user is None:
            event_obj = data.get("event_update")
            if event_obj:
                for attr in ("message", "callback_query", "inline_query"):
                    sub = getattr(event_obj, attr, None)
                    if sub and hasattr(sub, "from_user"):
                        from_user = sub.from_user
                        break

        if db and from_user and from_user.id:
            tg_user = await UserRepository(db).get_by_telegram_id(from_user.id)

        data["tg_user"] = tg_user
        return await handler(event, data)
