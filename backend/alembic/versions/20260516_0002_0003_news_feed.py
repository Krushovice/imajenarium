"""add news_feed_items table

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-16 00:02:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from pgvector.sqlalchemy import Vector
from sqlalchemy.dialects import postgresql

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

EMBEDDING_DIM = 384


def upgrade() -> None:
    op.create_table(
        "news_feed_items",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("source_name", sa.String(200), nullable=False),
        sa.Column("source_url", sa.String(512), nullable=False),
        sa.Column("title", sa.String(1000), nullable=False),
        sa.Column("url", sa.String(2048), nullable=False),
        sa.Column("author", sa.String(300), nullable=True),
        sa.Column("raw_excerpt", sa.Text, nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ai_summary", sa.Text, nullable=True),
        sa.Column(
            "emotional_tags",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column("mood", sa.String(100), nullable=True),
        sa.Column("atmosphere", sa.String(200), nullable=True),
        sa.Column("embedding", Vector(EMBEDDING_DIM), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_news_feed_items_url", "news_feed_items", ["url"], unique=True)
    op.create_index("ix_news_feed_items_published_at", "news_feed_items", ["published_at"])


def downgrade() -> None:
    op.drop_index("ix_news_feed_items_published_at", table_name="news_feed_items")
    op.drop_index("ix_news_feed_items_url", table_name="news_feed_items")
    op.drop_table("news_feed_items")
