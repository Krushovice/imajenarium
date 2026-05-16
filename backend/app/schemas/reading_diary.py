from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class DiaryEntryCreate(BaseModel):
    book_id: uuid.UUID | None = None
    content: str = Field(min_length=1, max_length=50000)
    mood: str | None = Field(default=None, max_length=50)
    emotion_tags: list[str] = Field(default_factory=list)
    quotes: list[str] = Field(default_factory=list)
    is_private: bool = False


class DiaryEntryUpdate(BaseModel):
    content: str | None = Field(default=None, min_length=1, max_length=50000)
    mood: str | None = Field(default=None, max_length=50)
    emotion_tags: list[str] | None = None
    quotes: list[str] | None = None
    is_private: bool | None = None


class DiaryEntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    book_id: uuid.UUID | None
    content: str
    mood: str | None
    emotion_tags: list[Any]
    quotes: list[Any]
    ai_emotional_analysis: dict | None
    dna_impact_applied: bool
    is_private: bool
    created_at: datetime
    updated_at: datetime


class DiaryListResponse(BaseModel):
    items: list[DiaryEntryOut]
    total: int
    offset: int
    limit: int


class DiaryAnalyzeResponse(BaseModel):
    entry: DiaryEntryOut
    dna_updated: bool
