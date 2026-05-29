from __future__ import annotations

import logging
import secrets

from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import CallbackQuery, Message
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.users import User
from app.repositories.users import UserRepository
from app.telegram.keyboards.main import back_to_menu_keyboard

logger = logging.getLogger(__name__)

router = Router(name="auth")

_REDIS_LINK_PREFIX = "tg_link:"


@router.message(Command("link"))
async def cmd_link(
    message: Message,
    db: AsyncSession,
    tg_user: User | None = None,
) -> None:
    if tg_user:
        await message.answer(
            f"✅ Аккаунт уже привязан: <b>{tg_user.display_name or tg_user.username}</b>",
            reply_markup=back_to_menu_keyboard(),
        )
        return

    parts = message.text.split(maxsplit=1) if message.text else []
    if len(parts) < 2:
        await message.answer(
            "Укажите токен привязки:\n\n"
            "<code>/link &lt;ваш_токен&gt;</code>\n\n"
            "Токен получите в разделе «Профиль → Telegram» на сайте Book Imaginarium."
        )
        return

    token = parts[1].strip()
    from app.core.redis import get_redis_client

    redis = get_redis_client()
    user_id_bytes = await redis.get(f"{_REDIS_LINK_PREFIX}{token}")

    if not user_id_bytes:
        await message.answer(
            "❌ Токен недействителен или истёк.\n\n"
            "Сгенерируйте новый в профиле на сайте."
        )
        return

    import uuid

    user_id = uuid.UUID(user_id_bytes.decode())
    repo = UserRepository(db)
    user = await repo.get(user_id)

    if user is None:
        await message.answer("❌ Пользователь не найден.")
        return

    if user.telegram_id and user.telegram_id != message.from_user.id:
        await message.answer("⚠️ К этому аккаунту уже привязан другой Telegram.")
        return

    await repo.update(
        user_id,
        {
            "telegram_id": message.from_user.id,
            "telegram_username": message.from_user.username,
        },
    )
    await redis.delete(f"{_REDIS_LINK_PREFIX}{token}")

    logger.info("Telegram linked: user=%s tg_id=%s", user_id, message.from_user.id)
    await message.answer(
        f"✅ Аккаунт <b>{user.display_name or user.username}</b> успешно привязан!\n\n"
        "Теперь вам доступны персональные рекомендации на основе Literary DNA.",
        reply_markup=back_to_menu_keyboard(),
    )


@router.message(Command("unlink"))
async def cmd_unlink(
    message: Message,
    db: AsyncSession,
    tg_user: User | None = None,
) -> None:
    if not tg_user:
        await message.answer("Аккаунт не привязан.")
        return

    repo = UserRepository(db)
    await repo.update(
        tg_user.id,
        {"telegram_id": None, "telegram_username": None},
    )
    await message.answer(
        "✅ Telegram отвязан от аккаунта Book Imaginarium.",
        reply_markup=back_to_menu_keyboard(),
    )


@router.message(Command("me"))
async def cmd_me(message: Message, tg_user: User | None = None) -> None:
    if not tg_user:
        await message.answer(
            "Аккаунт не привязан.\n\n"
            "Используйте /link &lt;токен&gt; для привязки."
        )
        return

    await message.answer(
        f"👤 <b>Ваш профиль</b>\n\n"
        f"Имя: {tg_user.display_name or tg_user.username}\n"
        f"Email: {tg_user.email}\n"
        f"Telegram: @{tg_user.telegram_username or '—'}",
        reply_markup=back_to_menu_keyboard(),
    )


@router.callback_query(F.data == "link_account")
async def cb_link_account(query: CallbackQuery) -> None:
    await query.message.edit_text(
        "🔗 <b>Привязка аккаунта</b>\n\n"
        "1. Войдите на сайт Book Imaginarium\n"
        "2. Перейдите в Профиль → Telegram\n"
        "3. Скопируйте токен\n"
        "4. Отправьте: <code>/link &lt;токен&gt;</code>"
    )
    await query.answer()
