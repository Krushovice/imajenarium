from __future__ import annotations

from typing import TYPE_CHECKING

from pgvector.sqlalchemy import Vector
from sqlalchemy import Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.reading_diary import DiaryEntry
    from app.models.recommendations import Recommendation
    from app.models.user_books import UserBook

EMBEDDING_DIM = 384


class Book(BaseModel):
    __tablename__ = "books"

    title: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    author: Mapped[str] = mapped_column(String(300), nullable=False, index=True)
    isbn: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
    cover_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    published_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    language: Mapped[str] = mapped_column(String(10), nullable=False, server_default="ru")
    page_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # AI-generated
    emotional_tags: Mapped[list] = mapped_column(JSONB, nullable=False, server_default="'[]'")
    mood_embedding: Mapped[list[float] | None] = mapped_column(Vector(EMBEDDING_DIM), nullable=True)
    ai_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    # External IDs
    goodreads_id: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)
    openlibrary_id: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)

    user_books: Mapped[list[UserBook]] = relationship("UserBook", back_populates="book")
    diary_entries: Mapped[list[DiaryEntry]] = relationship("DiaryEntry", back_populates="book")
    recommendations: Mapped[list[Recommendation]] = relationship(
        "Recommendation", back_populates="book"
    )
