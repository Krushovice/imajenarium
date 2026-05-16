from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import RecommendationSource
from app.models.recommendations import Recommendation
from app.repositories.base import BaseRepository


class RecommendationRepository(BaseRepository[Recommendation]):
    model = Recommendation

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_active(
        self,
        user_id: uuid.UUID,
        *,
        source: RecommendationSource | None = None,
        limit: int = 20,
    ) -> list[Recommendation]:
        """Non-dismissed, non-expired recommendations with book eager-loaded."""
        now = datetime.now(timezone.utc)
        stmt = (
            select(Recommendation)
            .where(
                Recommendation.user_id == user_id,
                Recommendation.dismissed.is_(False),
                (Recommendation.expires_at.is_(None)) | (Recommendation.expires_at > now),
            )
            .options(selectinload(Recommendation.book))
            .order_by(Recommendation.score.desc())
            .limit(limit)
        )
        if source is not None:
            stmt = stmt.where(Recommendation.source == source)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_unseen(
        self, user_id: uuid.UUID, *, limit: int = 10
    ) -> list[Recommendation]:
        now = datetime.now(timezone.utc)
        result = await self.session.execute(
            select(Recommendation)
            .where(
                Recommendation.user_id == user_id,
                Recommendation.seen.is_(False),
                Recommendation.dismissed.is_(False),
                (Recommendation.expires_at.is_(None)) | (Recommendation.expires_at > now),
            )
            .order_by(Recommendation.score.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def mark_seen(self, ids: list[uuid.UUID]) -> None:
        if not ids:
            return
        await self.session.execute(
            update(Recommendation)
            .where(Recommendation.id.in_(ids))
            .values(seen=True)
        )

    async def dismiss(self, recommendation_id: uuid.UUID) -> None:
        await self.session.execute(
            update(Recommendation)
            .where(Recommendation.id == recommendation_id)
            .values(dismissed=True)
        )

    async def delete_by_source(
        self, user_id: uuid.UUID, source: RecommendationSource
    ) -> int:
        """Delete all recommendations for user+source (used before refresh)."""
        from sqlalchemy import delete
        result = await self.session.execute(
            delete(Recommendation).where(
                Recommendation.user_id == user_id,
                Recommendation.source == source,
            )
        )
        return result.rowcount

    async def get_existing_book_ids(self, user_id: uuid.UUID) -> set[uuid.UUID]:
        """Return book_ids of non-dismissed recommendations for dedup."""
        result = await self.session.execute(
            select(Recommendation.book_id).where(
                Recommendation.user_id == user_id,
                Recommendation.dismissed.is_(False),
            )
        )
        return {row[0] for row in result.all()}
