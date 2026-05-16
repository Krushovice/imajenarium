from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.ai.tasks.news_feed import NewsFeedAIService
from app.api.deps import ActiveUser, DBSession, OptionalCurrentUser
from app.repositories.literary_dna import LiteraryDNARepository
from app.repositories.news_feed import NewsFeedRepository
from app.schemas.news_feed import NewsFeedResponse, RefreshResult, SourcesResponse
from app.services.news_feed import NewsFeedService

router = APIRouter(prefix="/news-feed", tags=["news-feed"])


def _make_svc(db: DBSession) -> NewsFeedService:
    from app.ai import get_active_provider, get_prompt_registry

    ai = NewsFeedAIService(get_active_provider(), get_prompt_registry())
    return NewsFeedService(
        repo=NewsFeedRepository(db),
        dna_repo=LiteraryDNARepository(db),
        ai=ai,
    )


SvcDep = Annotated[NewsFeedService, Depends(_make_svc)]


# ---------------------------------------------------------------------------
# 9.3 — Personalized feed
# ---------------------------------------------------------------------------


@router.get(
    "",
    response_model=NewsFeedResponse,
    summary="9.3 — Personalized news feed ranked by Literary DNA",
)
async def get_news_feed(
    user: OptionalCurrentUser,
    svc: SvcDep,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> NewsFeedResponse:
    user_id = user.id if user else None
    return await svc.get_feed(user_id, limit=limit, offset=offset)


# ---------------------------------------------------------------------------
# 9.1 — RSS refresh (trigger manually; in production wire to a scheduler)
# ---------------------------------------------------------------------------


@router.post(
    "/refresh",
    response_model=RefreshResult,
    summary="9.1 — Fetch RSS feeds and AI-tag new items",
)
async def refresh_feeds(
    _user: ActiveUser,
    svc: SvcDep,
    tag_batch: int = Query(default=10, ge=1, le=50, description="Max items to AI-tag per call"),
) -> RefreshResult:
    return await svc.refresh_feeds(tag_batch=tag_batch)


# ---------------------------------------------------------------------------
# Sources list
# ---------------------------------------------------------------------------


@router.get(
    "/sources",
    response_model=SourcesResponse,
    summary="List configured RSS sources",
)
async def list_sources() -> SourcesResponse:
    return SourcesResponse(sources=NewsFeedService.list_sources())
