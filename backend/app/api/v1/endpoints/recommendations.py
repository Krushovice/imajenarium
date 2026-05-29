from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.ai import get_embedding_service
from app.ai.tasks.recommendation import RecommendationAIService
from app.api.deps import ActiveUser, DBSession
from app.core.redis import RedisDep
from app.models.enums import RecommendationSource
from app.repositories.books import BookRepository
from app.repositories.literary_dna import LiteraryDNARepository
from app.repositories.recommendations import RecommendationRepository
from app.repositories.user_books import UserBookRepository
from app.schemas.recommendations import (
    EphemeralListResponse,
    EphemeralRecommendation,
    MarkSeenRequest,
    MoodRecommendationRequest,
    PromptRecommendationRequest,
    RecommendationListResponse,
    RecommendationOut,
)
from app.services.recommendations import RecommendationService

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


# ---------------------------------------------------------------------------
# Dependency factory
# ---------------------------------------------------------------------------


def _make_svc(db: DBSession, redis: RedisDep) -> RecommendationService:
    from app.ai import get_active_provider, get_prompt_registry

    ai = RecommendationAIService(get_active_provider(), get_prompt_registry())
    return RecommendationService(
        rec_repo=RecommendationRepository(db),
        book_repo=BookRepository(db),
        dna_repo=LiteraryDNARepository(db),
        user_book_repo=UserBookRepository(db),
        ai=ai,
        embeddings=get_embedding_service(),
        redis=redis,
    )


SvcDep = Annotated[RecommendationService, Depends(_make_svc)]


# ---------------------------------------------------------------------------
# 6.1 — DNA similarity (stored)
# ---------------------------------------------------------------------------


@router.post(
    "/refresh/dna",
    response_model=RecommendationListResponse,
    summary="6.1 — Recompute DNA-based recommendations via pgvector",
)
async def refresh_dna(
    user: ActiveUser,
    svc: SvcDep,
    count: int = Query(default=20, ge=1, le=50),
) -> RecommendationListResponse:
    recs = await svc.refresh_dna_recommendations(user.id, count=count)
    return RecommendationListResponse(items=recs, total=len(recs))  # type: ignore[arg-type]


# ---------------------------------------------------------------------------
# 6.3 — Collaborative filtering (stored) — before /{rec_id} routes
# ---------------------------------------------------------------------------


@router.post(
    "/refresh/collaborative",
    response_model=RecommendationListResponse,
    summary="6.3 — Recompute collaborative filtering recommendations",
)
async def refresh_collaborative(
    user: ActiveUser,
    svc: SvcDep,
    count: int = Query(default=20, ge=1, le=50),
) -> RecommendationListResponse:
    recs = await svc.refresh_collaborative_recommendations(user.id, count=count)
    return RecommendationListResponse(items=recs, total=len(recs))  # type: ignore[arg-type]


# ---------------------------------------------------------------------------
# 6.2 — Mood-based (ephemeral)
# ---------------------------------------------------------------------------


@router.post(
    "/by-mood",
    response_model=EphemeralListResponse,
    summary="6.2 — AI recommendations by current mood/emotion",
)
async def by_mood(
    body: MoodRecommendationRequest,
    user: ActiveUser,
    svc: SvcDep,
) -> EphemeralListResponse:
    items = await svc.recommend_by_mood(user.id, body.mood, context=body.context, count=body.count)
    return EphemeralListResponse(items=[EphemeralRecommendation(**i) for i in items])


# ---------------------------------------------------------------------------
# 6.4 — From emotional reviews (ephemeral)
# ---------------------------------------------------------------------------


@router.post(
    "/from-reviews",
    response_model=EphemeralListResponse,
    summary="6.4 — AI recommendations derived from user's emotional review patterns",
)
async def from_reviews(
    user: ActiveUser,
    svc: SvcDep,
    count: int = Query(default=5, ge=1, le=20),
) -> EphemeralListResponse:
    items = await svc.recommend_from_reviews(user.id, count=count)
    return EphemeralListResponse(items=[EphemeralRecommendation(**i) for i in items])


# ---------------------------------------------------------------------------
# 6.5 — Free-text AI prompt (ephemeral)
# ---------------------------------------------------------------------------


@router.post(
    "/ai-prompt",
    response_model=EphemeralListResponse,
    summary="6.5 — AI recommendations from free-text prompt ('like X but darker')",
)
async def ai_prompt(
    body: PromptRecommendationRequest,
    user: ActiveUser,
    svc: SvcDep,
) -> EphemeralListResponse:
    items = await svc.recommend_from_prompt(user.id, body.prompt, count=body.count)
    return EphemeralListResponse(items=[EphemeralRecommendation(**i) for i in items])


# ---------------------------------------------------------------------------
# GET stored recommendations feed
# ---------------------------------------------------------------------------


@router.get(
    "",
    response_model=RecommendationListResponse,
    summary="Get active stored recommendations (DNA + collaborative)",
)
async def get_recommendations(
    user: ActiveUser,
    svc: SvcDep,
    source: RecommendationSource | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
) -> RecommendationListResponse:
    recs = await svc.get_recommendations(user.id, source=source, limit=limit)
    return RecommendationListResponse(items=recs, total=len(recs))  # type: ignore[arg-type]


# ---------------------------------------------------------------------------
# 6.6 — Explain a stored recommendation
# ---------------------------------------------------------------------------


@router.post(
    "/{rec_id}/explain",
    response_model=RecommendationOut,
    summary="6.6 — Generate or retrieve AI explanation for a stored recommendation",
)
async def explain(
    rec_id: uuid.UUID,
    user: ActiveUser,
    svc: SvcDep,
) -> RecommendationOut:
    rec = await svc.explain_recommendation(rec_id, user.id)
    if rec is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recommendation not found")
    return rec  # type: ignore[return-value]


# ---------------------------------------------------------------------------
# Interaction: mark seen / dismiss
# ---------------------------------------------------------------------------


@router.post(
    "/mark-seen",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
    summary="Mark recommendations as seen",
)
async def mark_seen(
    body: MarkSeenRequest,
    user: ActiveUser,
    svc: SvcDep,
) -> None:
    await svc.mark_seen(body.ids)


@router.delete(
    "/{rec_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
    summary="Dismiss a recommendation",
)
async def dismiss(
    rec_id: uuid.UUID,
    user: ActiveUser,
    svc: SvcDep,
) -> None:
    ok = await svc.dismiss(rec_id, user.id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recommendation not found")
