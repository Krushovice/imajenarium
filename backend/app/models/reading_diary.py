from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.books import Book
    from app.models.users import User


class DiaryEntry(BaseModel):
    __tablename__ = "reading_diary"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    book_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("books.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    mood: Mapped[str | None] = mapped_column(String(50), nullable=True)
    emotion_tags: Mapped[list] = mapped_column(JSONB, nullable=False, server_default="'[]'")
    quotes: Mapped[list] = mapped_column(JSONB, nullable=False, server_default="'[]'")
    ai_emotional_analysis: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    dna_impact_applied: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="false"
    )
    is_private: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")

    user: Mapped[User] = relationship("User", back_populates="diary_entries")
    book: Mapped[Book | None] = relationship("Book", back_populates="diary_entries")
