#!/usr/bin/env python3
"""
Run: cd backend && python -m scripts.seed_books

Seeds the books catalog. Skips books that already exist (by title+author).
Optionally generates embeddings if --embed flag is passed.
"""
from __future__ import annotations

import asyncio
import logging
import sys
from pathlib import Path

# Make sure backend/ is on sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed_books")


async def main(embed: bool = False) -> None:
    from sqlalchemy import select

    from app.core.database import AsyncSessionFactory
    from app.db.seed import SEED_BOOKS
    from app.models.books import Book

    async with AsyncSessionFactory() as session:
        seeded = 0
        skipped = 0

        for data in SEED_BOOKS:
            result = await session.execute(
                select(Book).where(Book.title == data["title"], Book.author == data["author"])
            )
            existing = result.scalar_one_or_none()
            if existing:
                skipped += 1
                continue

            book = Book(**data)
            session.add(book)
            seeded += 1
            logger.info("+ %s — %s", data["title"], data["author"])

        await session.commit()
        logger.info("Done. Seeded: %d, skipped (already exist): %d", seeded, skipped)

    if embed:
        logger.info("Generating embeddings...")
        from app.core.database import AsyncSessionFactory
        from app.services.books import BookService
        from app.repositories.books import BookRepository
        from app.ai.embeddings import get_embedding_service

        async with AsyncSessionFactory() as session:
            svc = BookService(BookRepository(session), get_embedding_service())
            count = await svc.generate_embeddings_for_all()
            await session.commit()
            logger.info("Embedded %d books.", count)


if __name__ == "__main__":
    embed_flag = "--embed" in sys.argv
    asyncio.run(main(embed=embed_flag))
