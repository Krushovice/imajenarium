from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.news_feed import NewsFeedItem
from app.repositories.base import BaseRepository


class NewsFeedRepository(BaseRepository[NewsFeedItem]):
    model = NewsFeedItem

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_by_url(self, url: str) -> NewsFeedItem | None:
        result = await self.session.execute(
            select(NewsFeedItem).where(NewsFeedItem.url == url)
        )
        return result.scalar_one_or_none()

    async def get_untagged(self, *, limit: int = 20) -> list[NewsFeedItem]:
        result = await self.session.execute(
            select(NewsFeedItem)
            .where(NewsFeedItem.ai_summary.is_(None))
            .order_by(NewsFeedItem.published_at.desc().nullslast())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_recent(self, *, limit: int = 50, offset: int = 0) -> list[NewsFeedItem]:
        result = await self.session.execute(
            select(NewsFeedItem)
            .order_by(NewsFeedItem.published_at.desc().nullslast())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def find_by_embedding(
        self,
        embedding: list[float],
        *,
        limit: int = 20,
        threshold: float = 0.3,
    ) -> list[NewsFeedItem]:
        """Cosine similarity — personalized feed ranked by DNA embedding."""
        result = await self.session.execute(
            select(NewsFeedItem)
            .where(NewsFeedItem.embedding.isnot(None))
            .where(
                (1 - NewsFeedItem.embedding.cosine_distance(embedding)) >= threshold
            )
            .order_by(NewsFeedItem.embedding.cosine_distance(embedding))
            .limit(limit)
        )
        return list(result.scalars().all())
