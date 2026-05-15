from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.reading_diary import DiaryEntry
from app.repositories.base import BaseRepository


class DiaryRepository(BaseRepository[DiaryEntry]):
    model = DiaryEntry

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_by_user(
        self,
        user_id: uuid.UUID,
        *,
        offset: int = 0,
        limit: int = 50,
        include_private: bool = True,
    ) -> list[DiaryEntry]:
        stmt = (
            select(DiaryEntry)
            .where(DiaryEntry.user_id == user_id)
            .order_by(DiaryEntry.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        if not include_private:
            stmt = stmt.where(DiaryEntry.is_private.is_(False))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_book(
        self, user_id: uuid.UUID, book_id: uuid.UUID
    ) -> list[DiaryEntry]:
        result = await self.session.execute(
            select(DiaryEntry)
            .where(DiaryEntry.user_id == user_id, DiaryEntry.book_id == book_id)
            .order_by(DiaryEntry.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_unprocessed_for_dna(self, *, limit: int = 50) -> list[DiaryEntry]:
        """Entries not yet reflected in user's DNA — consumed by AI pipeline."""
        result = await self.session.execute(
            select(DiaryEntry)
            .where(DiaryEntry.dna_impact_applied.is_(False))
            .order_by(DiaryEntry.created_at.asc())
            .limit(limit)
        )
        return list(result.scalars().all())
