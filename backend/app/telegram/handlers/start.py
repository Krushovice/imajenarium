from __future__ import annotations

from aiogram import Router, F
from aiogram.filters import Command, CommandStart
from aiogram.types import CallbackQuery, Message

from app.models.users import User
from app.telegram.keyboards.main import main_menu_keyboard

router = Router(name="start")

_WELCOME = (
    "📚 <b>Book Imaginarium</b>\n\n"
    "Привет! Я ваш персональный AI-библиотекарь.\n\n"
    "Подбираю книги по <b>настроению и эмоциям</b> — "
    "не по жанрам.\n\n"
    "Что хотите?"
)

_HELP = (
    "<b>Команды бота:</b>\n\n"
    "/start — главное меню\n"
    "/recommend — AI-рекомендации по вашему профилю\n"
    "/mood — рекомендации по настроению\n"
    "/reading — текущий список чтения\n"
    "/link &lt;токен&gt; — привязать аккаунт Book Imaginarium\n"
    "/unlink — отвязать аккаунт\n"
    "/me — информация о вашем профиле\n"
    "/help — эта справка"
)


@router.message(CommandStart())
async def cmd_start(message: Message, tg_user: User | None = None) -> None:
    linked = tg_user is not None
    await message.answer(_WELCOME, reply_markup=main_menu_keyboard(linked=linked))


@router.message(Command("help"))
async def cmd_help(message: Message) -> None:
    await message.answer(_HELP)


@router.callback_query(F.data == "main_menu")
async def cb_main_menu(query: CallbackQuery, tg_user: User | None = None) -> None:
    linked = tg_user is not None
    await query.message.edit_text(_WELCOME, reply_markup=main_menu_keyboard(linked=linked))
    await query.answer()
