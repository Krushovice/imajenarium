from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class NewsFeedItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    source_name: str
    title: str
    url: str
    author: str | None
    published_at: datetime | None
    ai_summary: str | None
    emotional_tags: list[str]
    mood: str | None
    atmosphere: str | None
    created_at: datetime


class NewsFeedResponse(BaseModel):
    items: list[NewsFeedItemOut]
    total: int
    personalized: bool = False


class RssSource(BaseModel):
    name: str
    url: str


class SourcesResponse(BaseModel):
    sources: list[RssSource]


class RefreshResult(BaseModel):
    fetched: int = Field(description="New items saved from RSS")
    tagged: int = Field(description="Items AI-tagged in this run")
    sources_checked: int
