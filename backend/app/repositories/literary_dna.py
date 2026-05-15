from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.literary_dna import LiteraryDNA
from app.repositories.base import BaseRepository


class LiteraryDNARepository(BaseRepository[LiteraryDNA]):
    model = LiteraryDNA

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_by_user_id(self, user_id: uuid.UUID) -> LiteraryDNA | None:
        result = await self.session.execute(
            select(LiteraryDNA).where(LiteraryDNA.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def find_similar_users(
        self,
        embedding: list[float],
        *,
        exclude_user_id: uuid.UUID | None = None,
        limit: int = 20,
        threshold: float = 0.7,
    ) -> list[LiteraryDNA]:
        """Cosine similarity between user DNA embeddings — powers compatibility."""
        stmt = (
            select(LiteraryDNA)
            .where(LiteraryDNA.embedding.isnot(None))
            .where(
                (1 - LiteraryDNA.embedding.cosine_distance(embedding)) >= threshold
            )
            .order_by(LiteraryDNA.embedding.cosine_distance(embedding))
            .limit(limit)
        )
        if exclude_user_id is not None:
            stmt = stmt.where(LiteraryDNA.user_id != exclude_user_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def upsert_for_user(self, user_id: uuid.UUID, data: dict) -> LiteraryDNA:
        """Create or update DNA record for user."""
        existing = await self.get_by_user_id(user_id)
        if existing:
            return await self.update(existing, data)
        return await self.create({"user_id": user_id, **data})
