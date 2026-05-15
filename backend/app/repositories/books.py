from __future__ import annotations

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.books import Book
from app.repositories.base import BaseRepository


class BookRepository(BaseRepository[Book]):
    model = Book

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_by_isbn(self, isbn: str) -> Book | None:
        result = await self.session.execute(select(Book).where(Book.isbn == isbn))
        return result.scalar_one_or_none()

    async def search_by_title(self, query: str, *, limit: int = 20) -> list[Book]:
        """Full-text search via pg_trgm similarity on title + author."""
        result = await self.session.execute(
            select(Book)
            .where(
                func.similarity(Book.title, query) > 0.1
            )
            .order_by(func.similarity(Book.title, query).desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def find_similar_by_embedding(
        self,
        embedding: list[float],
        *,
        limit: int = 20,
        threshold: float = 0.7,
    ) -> list[Book]:
        """Cosine similarity search via pgvector."""
        result = await self.session.execute(
            select(Book)
            .where(Book.mood_embedding.isnot(None))
            .where(
                # pgvector cosine distance operator: 1 - distance = similarity
                (1 - Book.mood_embedding.cosine_distance(embedding)) >= threshold
            )
            .order_by(Book.mood_embedding.cosine_distance(embedding))
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_emotional_tag(self, tag: str, *, limit: int = 50) -> list[Book]:
        """JSONB array contains query — uses GIN index."""
        result = await self.session.execute(
            select(Book)
            .where(Book.emotional_tags.contains([tag]))
            .limit(limit)
        )
        return list(result.scalars().all())
