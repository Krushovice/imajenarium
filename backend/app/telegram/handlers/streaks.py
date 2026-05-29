from __future__ import annotations

import logging
from datetime import date, timedelta, timezone
from datetime import datetime as dt

from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.users import User
from app.telegram.keyboards.main import back_to_menu_keyboard
from app.telegram.utils.formatters import format_reading_streak

logger = logging.getLogger(__name__)

router = Router(name="streaks")


async def _compute_streak(user_id, db: AsyncSession) -> int:
    """Count consecutive days where user has diary entries or marked books read."""
    from sqlalchemy import func, select

    from app.models.reading_diary import DiaryEntry

    today = date.today()
    streak = 0
    check_date = today

    for _ in range(365):
        start = dt.combine(check_date, dt.min.time()).replace(tzinfo=timezone.utc)
        end = dt.combine(check_date + timedelta(days=1), dt.min.time()).replace(tzinfo=timezone.utc)

        result = await db.execute(
            select(func.count()).where(
                DiaryEntry.user_id == user_id,
                DiaryEntry.created_at >= start,
                DiaryEntry.created_at < end,
            )
        )
        count = result.scalar_one()
        if count == 0:
            break
        streak += 1
        check_date -= timedelta(days=1)

    return streak


@router.message(Command("streak"))
async def cmd_streak(
    message: Message,
    db: AsyncSession,
    tg_user: User | None = None,
) -> None:
    if not tg_user:
        await message.answer(
            "Привяжите аккаунт, чтобы отслеживать читательские серии.\n/link &lt;токен&gt;"
        )
        return

    streak = await _compute_streak(tg_user.id, db)
    name = tg_user.display_name or tg_user.username

    if streak == 0:
        await message.answer(
            f"📚 Привет, {name}!\n\n"
            "У вас пока нет активной читательской серии.\n"
            "Добавьте запись в дневник сегодня, чтобы начать! 📖",
            reply_markup=back_to_menu_keyboard(),
        )
    else:
        await message.answer(
            format_reading_streak(days=streak, name=name),
            reply_markup=back_to_menu_keyboard(),
        )
