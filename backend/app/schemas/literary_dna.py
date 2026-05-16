from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class LiteraryDNAOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    metrics: dict[str, Any]
    version: int
    last_computed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class LiteraryDNAPatch(BaseModel):
    metrics: dict[str, float] = Field(default_factory=dict)


class OnboardingQuestion(BaseModel):
    id: str
    question: str
    options: list[str]
    multi_select: bool = False


class OnboardingAnswers(BaseModel):
    answers: dict[str, str | list[str]]


class ReviewDNAUpdateRequest(BaseModel):
    book_title: str = Field(min_length=1, max_length=500)
    review_text: str = Field(min_length=10, max_length=10000)
