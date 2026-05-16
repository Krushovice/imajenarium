from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import RecommendationSource
from app.schemas.books import BookSearchResult


class RecommendationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    book_id: uuid.UUID
    book: BookSearchResult | None = None
    score: float
    source: RecommendationSource
    ai_explanation: str | None
    seen: bool
    clicked: bool
    dismissed: bool
    expires_at: datetime | None
    created_at: datetime


class EphemeralRecommendation(BaseModel):
    """AI-generated suggestion — not persisted in DB."""
    title: str
    author: str
    book_id: uuid.UUID | None = None
    book: BookSearchResult | None = None
    explanation: str
    dominant_emotion: str | None = None
    atmosphere: str | None = None
    score: float = 1.0


class RecommendationListResponse(BaseModel):
    items: list[RecommendationOut]
    total: int


class EphemeralListResponse(BaseModel):
    items: list[EphemeralRecommendation]


class MoodRecommendationRequest(BaseModel):
    mood: str = Field(min_length=1, max_length=500)
    context: str = Field(default="", max_length=1000)
    count: int = Field(default=5, ge=1, le=20)


class PromptRecommendationRequest(BaseModel):
    prompt: str = Field(
        min_length=1,
        max_length=1000,
        description="Free-form request, e.g. 'like Kafka but cozy and melancholic'",
    )
    count: int = Field(default=5, ge=1, le=20)


class MarkSeenRequest(BaseModel):
    ids: list[uuid.UUID] = Field(min_length=1, max_length=100)
