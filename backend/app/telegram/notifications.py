from __future__ import annotations

import logging
from typing import Sequence

from aiogram import Bot
from aiogram.exceptions import TelegramForbiddenError, TelegramBadRequest

from app.telegram.utils.formatters import (
    format_book_card,
    format_daily_mood_prompt,
    format_reading_streak,
)

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self, bot: Bot) -> None:
        self._bot = bot

    async def _safe_send(self, chat_id: int, text: str, **kwargs) -> bool:
        """Send message, return False if user blocked the bot."""
        try:
            await self._bot.send_message(chat_id, text, **kwargs)
            return True
        except TelegramForbiddenError:
            logger.warning("Bot blocked by user tg_id=%s", chat_id)
            return False
        except TelegramBadRequest as e:
            logger.warning("Bad request tg_id=%s: %s", chat_id, e)
            return False
        except Exception:
            logger.exception("Failed to send notification to tg_id=%s", chat_id)
            return False

    async def send_daily_mood_prompt(self, tg_id: int, name: str | None = None) -> bool:
        from app.telegram.keyboards.main import mood_keyboard

        return await self._safe_send(
            tg_id,
            format_daily_mood_prompt(name),
            reply_markup=mood_keyboard(),
        )

    async def send_reading_streak(self, tg_id: int, days: int, name: str | None = None) -> bool:
        return await self._safe_send(tg_id, format_reading_streak(days=days, name=name))

    async def send_recommendation(
        self,
        tg_id: int,
        title: str,
        author: str,
        description: str | None = None,
        book_id: str | None = None,
    ) -> bool:
        from app.telegram.keyboards.main import book_action_keyboard, back_to_menu_keyboard

        text = (
            "🌟 <b>Рекомендация дня</b>\n\n"
            + format_book_card(title=title, author=author, description=description)
        )
        kb = book_action_keyboard(book_id) if book_id else back_to_menu_keyboard()
        return await self._safe_send(tg_id, text, reply_markup=kb)

    async def broadcast(
        self,
        tg_ids: Sequence[int],
        text: str,
        **kwargs,
    ) -> tuple[int, int]:
        """Send text to multiple users. Returns (sent, failed) counts."""
        sent = failed = 0
        for tg_id in tg_ids:
            ok = await self._safe_send(tg_id, text, **kwargs)
            if ok:
                sent += 1
            else:
                failed += 1
        return sent, failed
