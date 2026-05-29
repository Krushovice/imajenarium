from __future__ import annotations

import logging
import uuid

from aiogram import F, Router
from aiogram.filters import Command
from aiogram.types import CallbackQuery, Message
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import BookStatus
from app.models.users import User
from app.telegram.keyboards.main import (
    back_to_menu_keyboard,
    book_action_keyboard,
    mood_keyboard,
)
from app.telegram.utils.formatters import (
    format_book_card,
    format_no_account_warning,
    format_recommendations_header,
    format_share_card,
)

logger = logging.getLogger(__name__)

router = Router(name="books")

_MAX_RECS = 5

_MOOD_LABELS: dict[str, str] = {
    "inspirational": "Вдохновение 🌅",
    "melancholic": "Меланхолия 😔",
    "adventurous": "Приключение 🎭",
    "philosophical": "Философия 🤔",
    "romantic": "Любовь 💝",
    "humorous": "Юмор 😂",
    "mysterious": "Мистика 😱",
    "cozy": "Уют 🌿",
}


async def _make_rec_service(db: AsyncSession):
    from app.ai import get_active_provider, get_embedding_service, get_prompt_registry
    from app.ai.tasks.recommendation import RecommendationAIService
    from app.repositories.books import BookRepository
    from app.repositories.literary_dna import LiteraryDNARepository
    from app.repositories.recommendations import RecommendationRepository
    from app.repositories.user_books import UserBookRepository
    from app.services.recommendations import RecommendationService

    return RecommendationService(
        rec_repo=RecommendationRepository(db),
        book_repo=BookRepository(db),
        dna_repo=LiteraryDNARepository(db),
        user_book_repo=UserBookRepository(db),
        ai=RecommendationAIService(get_active_provider(), get_prompt_registry()),
        embeddings=get_embedding_service(),
    )


@router.message(Command("recommend"))
async def cmd_recommend(
    message: Message,
    db: AsyncSession,
    tg_user: User | None = None,
) -> None:
    if not tg_user:
        await message.answer(format_no_account_warning())
        return

    await message.answer("⏳ Подбираю рекомендации…")
    try:
        svc = await _make_rec_service(db)
        recs = await svc.refresh_dna_recommendations(tg_user.id, count=_MAX_RECS)
        if not recs:
            await message.answer(
                "Пока недостаточно данных для рекомендаций.\n"
                "Добавьте книги в профиль, чтобы я лучше вас понял.",
                reply_markup=back_to_menu_keyboard(),
            )
            return
        await message.answer(format_recommendations_header(len(recs)))
        for rec in recs:
            from app.repositories.books import BookRepository
            book = await BookRepository(db).get(rec.book_id)
            title = book.title if book else "Неизвестная книга"
            author = book.author if book else ""
            description = book.description if book else None
            text = format_book_card(
                title=title,
                author=author,
                description=description,
                score=float(rec.score) if rec.score else None,
            )
            await message.answer(text, reply_markup=book_action_keyboard(str(rec.book_id)))
    except Exception:
        logger.exception("recommend error for user %s", tg_user.id)
        await message.answer("Произошла ошибка. Попробуйте позже.", reply_markup=back_to_menu_keyboard())


@router.callback_query(F.data == "get_recs")
async def cb_get_recs(query: CallbackQuery, db: AsyncSession, tg_user: User | None = None) -> None:
    await query.answer("Загружаю рекомендации…")
    await cmd_recommend(query.message, db=db, tg_user=tg_user)


@router.message(Command("mood"))
async def cmd_mood(message: Message) -> None:
    await message.answer(
        "😊 <b>Рекомендации по настроению</b>\n\nКакое у вас настроение сейчас?",
        reply_markup=mood_keyboard(),
    )


@router.callback_query(F.data == "by_mood")
async def cb_by_mood(query: CallbackQuery) -> None:
    await query.message.edit_text(
        "😊 <b>Рекомендации по настроению</b>\n\nКакое у вас настроение сейчас?",
        reply_markup=mood_keyboard(),
    )
    await query.answer()


@router.callback_query(F.data.startswith("mood:"))
async def cb_mood_selected(
    query: CallbackQuery,
    db: AsyncSession,
    tg_user: User | None = None,
) -> None:
    mood_key = query.data.split(":", 1)[1]
    mood_label = _MOOD_LABELS.get(mood_key, mood_key)
    await query.answer(f"Ищу книги: {mood_label}")
    await query.message.edit_text(f"⏳ Подбираю книги под настроение «{mood_label}»…")
    try:
        svc = await _make_rec_service(db)
        user_id = tg_user.id if tg_user else None
        results = await svc.recommend_by_mood(
            user_id=user_id,
            mood=mood_label,
            count=_MAX_RECS,
        )
        if not results:
            await query.message.answer(
                f"Не нашёл книг под настроение «{mood_label}» 😔\nПопробуйте другое.",
                reply_markup=mood_keyboard(),
            )
            return
        await query.message.answer(f"📚 Книги под настроение «{mood_label}»:\n")
        for item in results:
            title = item.get("title", "Неизвестная книга")
            author = item.get("author", "")
            explanation = item.get("explanation", "")
            book_id_str = item.get("book_id")
            text = format_book_card(title=title, author=author, description=explanation or None)
            kb = book_action_keyboard(book_id_str) if book_id_str else back_to_menu_keyboard()
            await query.message.answer(text, reply_markup=kb)
    except Exception:
        logger.exception("mood_recs error")
        await query.message.answer("Ошибка загрузки. Попробуйте позже.", reply_markup=back_to_menu_keyboard())


@router.message(Command("reading"))
async def cmd_reading(
    message: Message,
    db: AsyncSession,
    tg_user: User | None = None,
) -> None:
    if not tg_user:
        await message.answer(format_no_account_warning())
        return
    from app.repositories.user_books import UserBookRepository
    books = await UserBookRepository(db).get_user_library(tg_user.id, status=BookStatus.READING)
    if not books:
        await message.answer(
            "📖 Список чтения пуст.\nДобавьте книги через рекомендации или сайт.",
            reply_markup=back_to_menu_keyboard(),
        )
        return
    await message.answer(f"📖 <b>Сейчас читаю</b> ({len(books)}):")
    for ub in books:
        from app.repositories.books import BookRepository
        book = await BookRepository(db).get(ub.book_id)
        title = book.title if book else "Неизвестная книга"
        author = book.author if book else ""
        await message.answer(
            format_book_card(title=title, author=author),
            reply_markup=book_action_keyboard(str(ub.book_id)),
        )


@router.callback_query(F.data == "reading")
async def cb_reading(query: CallbackQuery, db: AsyncSession, tg_user: User | None = None) -> None:
    await query.answer()
    await cmd_reading(query.message, db=db, tg_user=tg_user)


@router.callback_query(F.data == "my_books")
async def cb_my_books(query: CallbackQuery, db: AsyncSession, tg_user: User | None = None) -> None:
    await query.answer()
    await cmd_reading(query.message, db=db, tg_user=tg_user)


@router.callback_query(F.data.startswith("mark_read:"))
async def cb_mark_read(
    query: CallbackQuery,
    db: AsyncSession,
    tg_user: User | None = None,
) -> None:
    if not tg_user:
        await query.answer("Привяжите аккаунт через /link", show_alert=True)
        return
    book_id = uuid.UUID(query.data.split(":", 1)[1])
    from app.repositories.books import BookRepository
    from app.repositories.user_books import UserBookRepository
    repo = UserBookRepository(db)
    existing = await repo.get_by_user_and_book(tg_user.id, book_id)
    if existing:
        await repo.update(existing.id, {"status": BookStatus.READ})
    else:
        await repo.create({"user_id": tg_user.id, "book_id": book_id, "status": BookStatus.READ})
    book = await BookRepository(db).get(book_id)
    title = book.title if book else "книга"
    author = book.author if book else ""
    await query.answer("✅ Отмечено как прочитанное!", show_alert=False)
    await query.message.answer(
        format_share_card(title=title, author=author),
        reply_markup=back_to_menu_keyboard(),
    )


@router.callback_query(F.data.startswith("add_list:"))
async def cb_add_list(
    query: CallbackQuery,
    db: AsyncSession,
    tg_user: User | None = None,
) -> None:
    if not tg_user:
        await query.answer("Привяжите аккаунт через /link", show_alert=True)
        return
    book_id = uuid.UUID(query.data.split(":", 1)[1])
    from app.repositories.user_books import UserBookRepository
    repo = UserBookRepository(db)
    if not await repo.get_by_user_and_book(tg_user.id, book_id):
        await repo.create({"user_id": tg_user.id, "book_id": book_id, "status": BookStatus.WANT_TO_READ})
    await query.answer("📚 Добавлено в список чтения!", show_alert=False)


@router.callback_query(F.data.startswith("share:"))
async def cb_share(query: CallbackQuery, db: AsyncSession) -> None:
    book_id = uuid.UUID(query.data.split(":", 1)[1])
    from app.repositories.books import BookRepository
    book = await BookRepository(db).get(book_id)
    if not book:
        await query.answer("Книга не найдена", show_alert=True)
        return
    await query.answer()
    await query.message.answer(format_share_card(title=book.title, author=book.author))
