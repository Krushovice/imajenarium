from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from pgvector.sqlalchemy import Vector
from sqlalchemy import DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.users import User

# Default metric axes for Literary DNA.
# Values range 0.0..1.0. Stored as JSONB so axes can evolve without migrations.
DEFAULT_METRICS: dict[str, float] = {
    "darkness": 0.5,
    "tension": 0.5,
    "romanticism": 0.5,
    "philosophy": 0.5,
    "humor": 0.5,
    "adventure": 0.5,
    "social_themes": 0.5,
    "psychological_depth": 0.5,
    "lyrical": 0.5,
    "pacing": 0.5,  # 0=contemplative, 1=fast-paced
}

EMBEDDING_DIM = 384


class LiteraryDNA(BaseModel):
    __tablename__ = "literary_dna"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    metrics: Mapped[dict] = mapped_column(JSONB, nullable=False, server_default="{}")
    embedding: Mapped[list[float] | None] = mapped_column(Vector(EMBEDDING_DIM), nullable=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False, server_default="1")
    last_computed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    user: Mapped[User] = relationship("User", back_populates="literary_dna")
