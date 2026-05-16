from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.ai.tasks.social import SocialAIService
from app.api.deps import ActiveUser, DBSession
from app.models.enums import FriendshipStatus
from app.repositories.friendships import FriendshipRepository
from app.repositories.literary_dna import LiteraryDNARepository
from app.repositories.user_books import UserBookRepository
from app.repositories.users import UserRepository
from app.schemas.social import (
    CompatibilityResult,
    FriendListResponse,
    FriendOut,
    FriendRequestCreate,
    FriendshipOut,
    FriendWithCompatibility,
    PendingRequestOut,
    PendingRequestsResponse,
    ReadingJourneyRequest,
    ReadingJourneyResponse,
    SharedRecommendationsResponse,
)
from app.services.social import SocialService

router = APIRouter(prefix="/social", tags=["social"])


# ---------------------------------------------------------------------------
# Dependency factory
# ---------------------------------------------------------------------------


def _make_svc(db: DBSession) -> SocialService:
    from app.ai import get_active_provider, get_prompt_registry

    ai = SocialAIService(get_active_provider(), get_prompt_registry())
    return SocialService(
        friendship_repo=FriendshipRepository(db),
        user_repo=UserRepository(db),
        dna_repo=LiteraryDNARepository(db),
        user_book_repo=UserBookRepository(db),
        ai=ai,
    )


SvcDep = Annotated[SocialService, Depends(_make_svc)]


# ---------------------------------------------------------------------------
# 8.1 — Friend system
# ---------------------------------------------------------------------------


@router.post(
    "/friends/request",
    response_model=FriendshipOut,
    status_code=status.HTTP_201_CREATED,
    summary="8.1 — Send friend request",
)
async def send_friend_request(
    body: FriendRequestCreate,
    user: ActiveUser,
    svc: SvcDep,
) -> FriendshipOut:
    if body.addressee_id == user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot friend yourself")
    friendship = await svc.send_friend_request(user.id, body.addressee_id)
    if friendship is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return friendship  # type: ignore[return-value]


@router.post(
    "/friends/{friendship_id}/accept",
    response_model=FriendshipOut,
    summary="8.1 — Accept friend request",
)
async def accept_friend_request(
    friendship_id: uuid.UUID,
    user: ActiveUser,
    svc: SvcDep,
) -> FriendshipOut:
    friendship = await svc.accept_friend_request(friendship_id, user.id)
    if friendship is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Friend request not found")
    return friendship  # type: ignore[return-value]


@router.delete(
    "/friends/{friendship_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="8.1 — Decline or cancel friend request / unfriend",
)
async def decline_or_cancel(
    friendship_id: uuid.UUID,
    user: ActiveUser,
    svc: SvcDep,
) -> None:
    ok = await svc.decline_or_cancel(friendship_id, user.id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Friendship not found")


@router.get(
    "/friends",
    response_model=FriendListResponse,
    summary="8.1 — List accepted friends",
)
async def list_friends(
    user: ActiveUser,
    svc: SvcDep,
) -> FriendListResponse:
    items = await svc.get_friends(user.id)
    return FriendListResponse(items=items, total=len(items))


@router.get(
    "/friends/pending",
    response_model=PendingRequestsResponse,
    summary="8.1 — List incoming pending friend requests",
)
async def list_pending_requests(
    user: ActiveUser,
    svc: SvcDep,
) -> PendingRequestsResponse:
    friendships = await svc.get_pending_requests(user.id)
    items: list[PendingRequestOut] = [
        PendingRequestOut(
            friendship_id=fs.id,
            requester=FriendOut.model_validate(fs.requester),
            created_at=fs.created_at,
        )
        for fs in friendships
    ]
    return PendingRequestsResponse(items=items, total=len(items))


# ---------------------------------------------------------------------------
# 8.2 — Literary Compatibility
# ---------------------------------------------------------------------------


@router.post(
    "/friends/{friend_id}/compatibility",
    response_model=CompatibilityResult,
    summary="8.2 — Compute AI Literary Compatibility score with a friend",
)
async def compute_compatibility(
    friend_id: uuid.UUID,
    user: ActiveUser,
    svc: SvcDep,
) -> CompatibilityResult:
    result = await svc.compute_literary_compatibility(user.id, friend_id)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Friendship not found or not accepted",
        )
    return result


# ---------------------------------------------------------------------------
# 8.3 — Shared recommendations
# ---------------------------------------------------------------------------


@router.get(
    "/friends/{friend_id}/recommendations",
    response_model=SharedRecommendationsResponse,
    summary="8.3 — Books friend loved that current user hasn't read yet",
)
async def shared_recommendations(
    friend_id: uuid.UUID,
    user: ActiveUser,
    svc: SvcDep,
    count: int = Query(default=10, ge=1, le=50),
) -> SharedRecommendationsResponse:
    result = await svc.get_shared_recommendations(user.id, friend_id, count=count)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Friendship not found or not accepted",
        )
    return result


# ---------------------------------------------------------------------------
# 8.4 — Reading Journey
# ---------------------------------------------------------------------------


@router.post(
    "/reading-journey",
    response_model=ReadingJourneyResponse,
    summary="8.4 — AI builds personalized reading path toward a goal",
)
async def build_reading_journey(
    body: ReadingJourneyRequest,
    user: ActiveUser,
    svc: SvcDep,
) -> ReadingJourneyResponse:
    return await svc.build_reading_journey(user.id, body.goal, count=body.count)
