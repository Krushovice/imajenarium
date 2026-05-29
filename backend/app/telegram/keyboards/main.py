from __future__ import annotations

from aiogram.types import InlineKeyboardMarkup
from aiogram.utils.keyboard import InlineKeyboardBuilder


def main_menu_keyboard(linked: bool = False) -> InlineKeyboardMarkup:
    kb = InlineKeyboardBuilder()
    kb.button(text="📚 Мои книги", callback_data="my_books")
    kb.button(text="🌟 Рекомендации", callback_data="get_recs")
    kb.button(text="😊 По настроению", callback_data="by_mood")
    kb.button(text="📖 Сейчас читаю", callback_data="reading")
    if not linked:
        kb.button(text="🔗 Привязать аккаунт", callback_data="link_account")
    kb.adjust(2)
    return kb.as_markup()


def mood_keyboard() -> InlineKeyboardMarkup:
    kb = InlineKeyboardBuilder()
    kb.button(text="🌅 Вдохновение", callback_data="mood:inspirational")
    kb.button(text="😔 Меланхолия", callback_data="mood:melancholic")
    kb.button(text="🎭 Приключение", callback_data="mood:adventurous")
    kb.button(text="🤔 Философия", callback_data="mood:philosophical")
    kb.button(text="💝 Любовь", callback_data="mood:romantic")
    kb.button(text="😂 Юмор", callback_data="mood:humorous")
    kb.button(text="😱 Мистика", callback_data="mood:mysterious")
    kb.button(text="🌿 Уют", callback_data="mood:cozy")
    kb.adjust(2)
    return kb.as_markup()


def book_action_keyboard(book_id: str) -> InlineKeyboardMarkup:
    kb = InlineKeyboardBuilder()
    kb.button(text="✅ Прочитал(а)", callback_data=f"mark_read:{book_id}")
    kb.button(text="📚 В список", callback_data=f"add_list:{book_id}")
    kb.button(text="🔗 Поделиться", callback_data=f"share:{book_id}")
    kb.adjust(2)
    return kb.as_markup()


def back_to_menu_keyboard() -> InlineKeyboardMarkup:
    kb = InlineKeyboardBuilder()
    kb.button(text="🏠 Главное меню", callback_data="main_menu")
    return kb.as_markup()
