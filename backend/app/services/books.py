from __future__ import annotations

import logging
import uuid
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.embeddings import LocalEmbeddingService
from app.models.books import Book
from app.models.enums import BookStatus
from app.models.user_books import UserBook
from app.repositories.books import BookRepository
from app.repositories.exceptions import EntityNotFoundError
from app.repositories.user_books import UserBookRepository

logger = logging.getLogger(__name__)


def _book_to_embedding_text(book: Book) -> str:
    """Canonical text for sentence-transformers — title + author + tags + description."""
    parts: list[str] = [
        f"{book.title} by {book.author}",
    ]
    if book.emotional_tags:
        parts.append("Mood: " + ", ".join(str(t) for t in book.emotional_tags))
    if book.ai_summary:
        parts.append(book.ai_summary)
    elif book.description:
        parts.append(book.description[:400])
    return ". ".join(parts)


class BookService:
    def __init__(
        self,
        book_repo: BookRepository,
        embeddings: LocalEmbeddingService,
    ) -> None:
        self._books = book_repo
        self._embed = embeddings

    # ------------------------------------------------------------------
    # 5.2 — Embedding generation
    # ------------------------------------------------------------------

    async def embed_book(self, book: Book) -> Book:
        text = _book_to_embedding_text(book)
        try:
            vectors = await self._embed.embed_async([text])
            return await self._books.update(book, {"mood_embedding": vectors[0]})
        except Exception as exc:
            logger.warning("Embedding failed for book %s: %s", book.id, exc)
            return book

    async def generate_embeddings_for_all(self, *, batch_size: int = 32) -> int:
        """Embed all books that have no mood_embedding. Returns count embedded."""
        offset = 0
        total = 0
        while True:
            books = await self._books.list(offset=offset, limit=batch_size)
            if not books:
                break

            to_embed = [b for b in books if b.mood_embedding is None]
            if to_embed:
                texts = [_book_to_embedding_text(b) for b in to_embed]
                try:
                    vectors = await self._embed.embed_async(texts)
                    for book, vec in zip(to_embed, vectors):
                        await self._books.update(book, {"mood_embedding": vec})
                    total += len(to_embed)
                    logger.info("Embedded %d books (offset=%d)", len(to_embed), offset)
                except Exception as exc:
                    logger.error("Batch embed failed at offset=%d: %s", offset, exc)

            if len(books) < batch_size:
                break
            offset += batch_size

        return total

    # ------------------------------------------------------------------
    # 5.3 — Search
    # ------------------------------------------------------------------

    async def text_search(self, query: str, *, limit: int = 20) -> list[Book]:
        return await self._books.search_by_title(query, limit=limit)

    async def semantic_search(
        self, text: str, *, limit: int = 20, threshold: float = 0.3
    ) -> list[Book]:
        vectors = await self._embed.embed_async([text])
        return await self._books.find_similar_by_embedding(
            vectors[0], limit=limit, threshold=threshold
        )

    # ------------------------------------------------------------------
    # Catalog
    # ------------------------------------------------------------------

    async def get_catalog(self, *, offset: int = 0, limit: int = 50) -> list[Book]:
        return await self._books.list(offset=offset, limit=limit)

    async def get_book(self, book_id: uuid.UUID) -> Book:
        book = await self._books.get(book_id)
        if book is None:
            raise EntityNotFoundError("Book", book_id)
        return book


class UserBookService:
    def __init__(
        self,
        user_book_repo: UserBookRepository,
        book_repo: BookRepository,
        book_svc: BookService,
    ) -> None:
        self._user_books = user_book_repo
        self._books = book_repo
        self._book_svc = book_svc

    # ------------------------------------------------------------------
    # 5.4 — CRUD
    # ------------------------------------------------------------------

    async def add_to_shelf(
        self,
        user_id: uuid.UUID,
        book_id: uuid.UUID,
        *,
        status: BookStatus,
        rating: int | None = None,
        review: str | None = None,
        quotes: list[str] | None = None,
        started_at: date | None = None,
        finished_at: date | None = None,
        is_private: bool = False,
    ) -> UserBook:
        # Verify book exists
        await self._book_svc.get_book(book_id)

        existing = await self._user_books.get_by_user_and_book(user_id, book_id)
        if existing is not None:
            from fastapi import HTTPException, status as http_status
            raise HTTPException(
                status_code=http_status.HTTP_409_CONFLICT,
                detail="Book already in your shelf. Use PATCH to update.",
            )

        data: dict = {
            "user_id": user_id,
            "book_id": book_id,
            "status": status,
            "rating": rating,
            "review": review,
            "quotes": quotes or [],
            "started_at": started_at,
            "finished_at": finished_at,
            "is_private": is_private,
        }
        return await self._user_books.create(data)

    async def update_shelf_entry(
        self,
        user_id: uuid.UUID,
        book_id: uuid.UUID,
        updates: dict,
    ) -> UserBook:
        entry = await self._user_books.get_by_user_and_book(user_id, book_id)
        if entry is None:
            from fastapi import HTTPException, status as http_status
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Book not in your shelf.",
            )
        # Filter out None values so we don't overwrite existing data
        clean = {k: v for k, v in updates.items() if v is not None}
        if not clean:
            return entry
        return await self._user_books.update(entry, clean)

    async def remove_from_shelf(self, user_id: uuid.UUID, book_id: uuid.UUID) -> None:
        entry = await self._user_books.get_by_user_and_book(user_id, book_id)
        if entry is None:
            from fastapi import HTTPException, status as http_status
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Book not in your shelf.",
            )
        await self._user_books.delete(entry)

    async def get_shelf_entry(self, user_id: uuid.UUID, book_id: uuid.UUID) -> UserBook:
        entry = await self._user_books.get_by_user_and_book(user_id, book_id)
        if entry is None:
            from fastapi import HTTPException, status as http_status
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Book not in your shelf.",
            )
        return entry

    async def get_library(
        self,
        user_id: uuid.UUID,
        *,
        status: BookStatus | None = None,
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[list[UserBook], int]:
        items = await self._user_books.get_user_library(
            user_id, status=status, offset=offset, limit=limit
        )
        total = await self._user_books.count_by_user(user_id, status=status)
        return items, total
