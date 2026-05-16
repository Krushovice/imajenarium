from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.ai import get_active_provider, get_embedding_service, get_prompt_registry
from app.ai.tasks.literary_dna import LiteraryDNAService as LiteraryDNAAIService
from app.api.deps import ActiveUser, DBSession
from app.repositories.literary_dna import LiteraryDNARepository
from app.repositories.reading_diary import DiaryRepository
from app.repositories.user_books import UserBookRepository
from app.schemas.literary_dna import (
    LiteraryDNAOut,
    LiteraryDNAPatch,
    OnboardingAnswers,
    OnboardingQuestion,
    ReviewDNAUpdateRequest,
)
from app.services.literary_dna import LiteraryDNABusinessService, ONBOARDING_QUESTIONS

router = APIRouter(prefix="/literary-dna", tags=["literary-dna"])


def _make_service(db: DBSession) -> LiteraryDNABusinessService:
    return LiteraryDNABusinessService(
        dna_repo=LiteraryDNARepository(db),
        user_book_repo=UserBookRepository(db),
        diary_repo=DiaryRepository(db),
        ai_service=LiteraryDNAAIService(get_active_provider(), get_prompt_registry()),
        embeddings=get_embedding_service(),
    )


ServiceDep = Annotated[LiteraryDNABusinessService, Depends(_make_service)]


@router.get(
    "/onboarding/questions",
    response_model=list[OnboardingQuestion],
    summary="Get onboarding questions for initial Literary DNA",
)
async def get_onboarding_questions() -> list[dict]:
    return ONBOARDING_QUESTIONS


@router.post(
    "/onboarding",
    response_model=LiteraryDNAOut,
    status_code=status.HTTP_201_CREATED,
    summary="Submit onboarding answers → build initial Literary DNA (4.4)",
)
async def submit_onboarding(
    body: OnboardingAnswers,
    user: ActiveUser,
    svc: ServiceDep,
) -> LiteraryDNAOut:
    return await svc.initialize_from_onboarding(user.id, body.answers)


@router.get(
    "/me",
    response_model=LiteraryDNAOut,
    summary="Get current user's Literary DNA profile (4.2)",
)
async def get_my_dna(user: ActiveUser, svc: ServiceDep) -> LiteraryDNAOut:
    return await svc.get_or_create(user.id)


@router.patch(
    "/me",
    response_model=LiteraryDNAOut,
    summary="Manually adjust DNA metric axes (4.2)",
)
async def patch_my_dna(
    body: LiteraryDNAPatch,
    user: ActiveUser,
    svc: ServiceDep,
) -> LiteraryDNAOut:
    if not body.metrics:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No metrics provided",
        )
    return await svc.patch_metrics(user.id, body.metrics)


@router.post(
    "/me/recompute",
    response_model=LiteraryDNAOut,
    summary="Recompute DNA from all user data: reviews + diary (4.1)",
)
async def recompute_my_dna(user: ActiveUser, svc: ServiceDep) -> LiteraryDNAOut:
    return await svc.recompute(user.id)


@router.post(
    "/me/update-from-review",
    response_model=LiteraryDNAOut,
    summary="Evolve DNA based on a book review (4.3)",
)
async def update_dna_from_review(
    body: ReviewDNAUpdateRequest,
    user: ActiveUser,
    svc: ServiceDep,
) -> LiteraryDNAOut:
    return await svc.update_from_review(user.id, body.book_title, body.review_text)
