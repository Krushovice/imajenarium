from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import BookStatus
from app.models.user_books import UserBook
from app.repositories.base import BaseRepository


class UserBookRepository(BaseRepository[UserBook]):
    model = UserBook

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_with_book(self, id: uuid.UUID) -> UserBook | None:
        result = await self.session.execute(
            select(UserBook).where(UserBook.id == id).options(selectinload(UserBook.book))
        )
        return result.scalar_one_or_none()

    async def get_by_user_and_book(
        self, user_id: uuid.UUID, book_id: uuid.UUID
    ) -> UserBook | None:
        result = await self.session.execute(
            select(UserBook)
            .where(UserBook.user_id == user_id, UserBook.book_id == book_id)
        )
        return result.scalar_one_or_none()

    async def get_user_library(
        self,
        user_id: uuid.UUID,
        *,
        status: BookStatus | None = None,
        offset: int = 0,
        limit: int = 50,
    ) -> list[UserBook]:
        stmt = (
            select(UserBook)
            .where(UserBook.user_id == user_id)
            .options(selectinload(UserBook.book))
            .order_by(UserBook.updated_at.desc())
            .offset(offset)
            .limit(limit)
        )
        if status is not None:
            stmt = stmt.where(UserBook.status == status)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count_by_user(
        self, user_id: uuid.UUID, *, status: BookStatus | None = None
    ) -> int:
        stmt = select(func.count()).select_from(UserBook).where(UserBook.user_id == user_id)
        if status is not None:
            stmt = stmt.where(UserBook.status == status)
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def get_recently_finished(
        self, user_id: uuid.UUID, *, limit: int = 10
    ) -> list[UserBook]:
        result = await self.session.execute(
            select(UserBook)
            .where(UserBook.user_id == user_id, UserBook.status == BookStatus.READ)
            .order_by(UserBook.finished_at.desc().nulls_last())
            .limit(limit)
        )
        return list(result.scalars().all())
