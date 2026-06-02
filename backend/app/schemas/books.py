from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import BookStatus


# ---------------------------------------------------------------------------
# Book schemas
# ---------------------------------------------------------------------------


class BookOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    author: str
    isbn: str | None
    cover_url: str | None
    description: str | None
    published_year: int | None
    language: str
    page_count: int | None
    emotional_tags: list[Any]
    ai_summary: str | None
    goodreads_id: str | None
    openlibrary_id: str | None
    created_at: datetime
    updated_at: datetime


class BookSearchResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    author: str
    cover_url: str | None
    description: str | None
    published_year: int | None
    emotional_tags: list[Any]
    ai_summary: str | None


class BookSearchQuery(BaseModel):
    q: str = Field(min_length=1, max_length=500)
    limit: int = Field(default=20, ge=1, le=100)
    threshold: float = Field(default=0.3, ge=0.0, le=1.0)


class SemanticSearchRequest(BaseModel):
    text: str = Field(min_length=1, max_length=1000, description="Free-form query, e.g. 'dark and melancholic love story'")
    limit: int = Field(default=20, ge=1, le=100)
    threshold: float = Field(default=0.3, ge=0.0, le=1.0)


# ---------------------------------------------------------------------------
# UserBook schemas
# ---------------------------------------------------------------------------


class UserBookCreate(BaseModel):
    status: BookStatus
    rating: int | None = Field(default=None, ge=1, le=10)
    review: str | None = Field(default=None, max_length=10000)
    quotes: list[str] = Field(default_factory=list)
    started_at: date | None = None
    finished_at: date | None = None
    is_private: bool = False


class UserBookUpdate(BaseModel):
    status: BookStatus | None = None
    rating: int | None = Field(default=None, ge=1, le=10)
    review: str | None = Field(default=None, max_length=10000)
    quotes: list[str] | None = None
    started_at: date | None = None
    finished_at: date | None = None
    is_private: bool | None = None


class UserBookOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    book_id: uuid.UUID
    book: BookSearchResult | None = None
    status: BookStatus
    rating: int | None
    review: str | None
    quotes: list[Any]
    started_at: date | None
    finished_at: date | None
    is_private: bool
    created_at: datetime
    updated_at: datetime


class UserLibraryResponse(BaseModel):
    items: list[UserBookOut]
    total: int
    offset: int
    limit: int


class FriendQuoteAuthor(BaseModel):
    id: uuid.UUID
    username: str
    display_name: str | None
    avatar_url: str | None


class FriendQuoteOut(BaseModel):
    author: FriendQuoteAuthor
    quotes: list[str]
    rating: int | None
