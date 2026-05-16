from __future__ import annotations

from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import DateTime, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel

EMBEDDING_DIM = 384


class NewsFeedItem(BaseModel):
    __tablename__ = "news_feed_items"

    source_name: Mapped[str] = mapped_column(String(200), nullable=False)
    source_url: Mapped[str] = mapped_column(String(512), nullable=False)
    title: Mapped[str] = mapped_column(String(1000), nullable=False)
    url: Mapped[str] = mapped_column(String(2048), nullable=False, unique=True, index=True)
    author: Mapped[str | None] = mapped_column(String(300), nullable=True)
    raw_excerpt: Mapped[str | None] = mapped_column(Text, nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    # AI-generated
    ai_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    emotional_tags: Mapped[list] = mapped_column(
        JSONB, nullable=False, server_default="'[]'"
    )
    mood: Mapped[str | None] = mapped_column(String(100), nullable=True)
    atmosphere: Mapped[str | None] = mapped_column(String(200), nullable=True)
    # For personalization via cosine similarity with user DNA embedding
    embedding: Mapped[list[float] | None] = mapped_column(Vector(EMBEDDING_DIM), nullable=True)
