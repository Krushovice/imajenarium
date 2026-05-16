from __future__ import annotations

import uuid

from app.models.reading_diary import DiaryEntry
from app.repositories.books import BookRepository
from app.repositories.exceptions import EntityNotFoundError
from app.repositories.reading_diary import DiaryRepository


class DiaryService:
    def __init__(
        self,
        diary_repo: DiaryRepository,
        book_repo: BookRepository,
    ) -> None:
        self._diary = diary_repo
        self._books = book_repo

    async def create_entry(
        self,
        user_id: uuid.UUID,
        *,
        content: str,
        book_id: uuid.UUID | None = None,
        mood: str | None = None,
        emotion_tags: list[str] | None = None,
        quotes: list[str] | None = None,
        is_private: bool = False,
    ) -> DiaryEntry:
        if book_id is not None:
            book = await self._books.get(book_id)
            if book is None:
                raise EntityNotFoundError(f"Book {book_id} not found")

        return await self._diary.create({
            "user_id": user_id,
            "book_id": book_id,
            "content": content,
            "mood": mood,
            "emotion_tags": emotion_tags or [],
            "quotes": quotes or [],
            "is_private": is_private,
        })

    async def get_entry(self, entry_id: uuid.UUID, user_id: uuid.UUID) -> DiaryEntry:
        entry = await self._diary.get(entry_id)
        if entry is None or entry.user_id != user_id:
            raise EntityNotFoundError(f"Diary entry {entry_id} not found")
        return entry

    async def list_entries(
        self,
        user_id: uuid.UUID,
        *,
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[list[DiaryEntry], int]:
        entries = await self._diary.get_by_user(user_id, offset=offset, limit=limit)
        return entries, len(entries)

    async def list_by_book(
        self,
        user_id: uuid.UUID,
        book_id: uuid.UUID,
    ) -> list[DiaryEntry]:
        return await self._diary.get_by_book(user_id, book_id)

    async def update_entry(
        self,
        entry_id: uuid.UUID,
        user_id: uuid.UUID,
        updates: dict,
    ) -> DiaryEntry:
        entry = await self.get_entry(entry_id, user_id)
        return await self._diary.update(entry, updates)

    async def delete_entry(self, entry_id: uuid.UUID, user_id: uuid.UUID) -> None:
        entry = await self.get_entry(entry_id, user_id)
        await self._diary.delete(entry)
