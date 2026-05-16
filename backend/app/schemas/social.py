from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import FriendshipStatus


# ---------------------------------------------------------------------------
# 8.1 — Friendship schemas
# ---------------------------------------------------------------------------


class FriendRequestCreate(BaseModel):
    addressee_id: uuid.UUID


class FriendshipOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    requester_id: uuid.UUID
    addressee_id: uuid.UUID
    status: FriendshipStatus
    literary_compatibility_score: float | None
    created_at: datetime


class FriendOut(BaseModel):
    """Flat view of a friend user for list responses."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    username: str
    display_name: str | None
    avatar_url: str | None
    bio: str | None


class FriendWithCompatibility(BaseModel):
    friend: FriendOut
    friendship_id: uuid.UUID
    compatibility_score: float | None
    friendship_since: datetime


class FriendListResponse(BaseModel):
    items: list[FriendWithCompatibility]
    total: int


class PendingRequestOut(BaseModel):
    friendship_id: uuid.UUID
    requester: FriendOut
    created_at: datetime


class PendingRequestsResponse(BaseModel):
    items: list[PendingRequestOut]
    total: int


# ---------------------------------------------------------------------------
# 8.2 — Literary Compatibility
# ---------------------------------------------------------------------------


class CompatibilityResult(BaseModel):
    score: float = Field(ge=0.0, le=1.0)
    label: str
    shared_dimensions: list[str]
    connection_narrative: str
    recommended_exchange: str


# ---------------------------------------------------------------------------
# 8.3 — Shared recommendations
# ---------------------------------------------------------------------------


class SharedBookRecommendation(BaseModel):
    title: str
    author: str
    book_id: uuid.UUID | None = None
    friend_rating: int | None = None
    friend_review: str | None = None
    score: float


class SharedRecommendationsResponse(BaseModel):
    friend_id: uuid.UUID
    compatibility_score: float | None
    items: list[SharedBookRecommendation]


# ---------------------------------------------------------------------------
# 8.4 — Reading Journey
# ---------------------------------------------------------------------------


class ReadingJourneyRequest(BaseModel):
    goal: str = Field(
        min_length=1,
        max_length=500,
        description="What the reader wants from this journey, e.g. 'explore grief through literature' or 'read more philosophy without losing beauty'",
    )
    count: int = Field(default=7, ge=3, le=15)


class JourneyStep(BaseModel):
    position: int
    title: str
    author: str
    why_now: str
    emotional_transition: str
    dominant_emotion: str
    atmosphere: str
    book_id: uuid.UUID | None = None


class ReadingJourneyResponse(BaseModel):
    journey_title: str
    journey_narrative: str
    steps: list[JourneyStep]
