from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.ai import get_active_provider, get_embedding_service, get_prompt_registry
from app.ai.tasks.diary_analysis import DiaryAnalysisAIService
from app.ai.tasks.literary_dna import LiteraryDNAService as LiteraryDNAAIService
from app.api.deps import ActiveUser, DBSession
from app.repositories.books import BookRepository
from app.repositories.literary_dna import LiteraryDNARepository
from app.repositories.reading_diary import DiaryRepository
from app.repositories.user_books import UserBookRepository
from app.repositories.exceptions import EntityNotFoundError
from app.schemas.reading_diary import (
    DiaryAnalyzeResponse,
    DiaryEntryCreate,
    DiaryEntryOut,
    DiaryEntryUpdate,
    DiaryListResponse,
)
from app.services.literary_dna import LiteraryDNABusinessService
from app.services.reading_diary import DiaryService

router = APIRouter(prefix="/diary", tags=["reading-diary"])


# ---------------------------------------------------------------------------
# Dependency factories
# ---------------------------------------------------------------------------


def _make_diary_svc(db: DBSession) -> DiaryService:
    return DiaryService(
        diary_repo=DiaryRepository(db),
        book_repo=BookRepository(db),
    )


def _make_dna_svc(db: DBSession) -> LiteraryDNABusinessService:
    return LiteraryDNABusinessService(
        dna_repo=LiteraryDNARepository(db),
        user_book_repo=UserBookRepository(db),
        diary_repo=DiaryRepository(db),
        ai_service=LiteraryDNAAIService(get_active_provider(), get_prompt_registry()),
        embeddings=get_embedding_service(),
        diary_ai_service=DiaryAnalysisAIService(get_active_provider(), get_prompt_registry()),
    )


DiarySvcDep = Annotated[DiaryService, Depends(_make_diary_svc)]
DNASvcDep = Annotated[LiteraryDNABusinessService, Depends(_make_dna_svc)]


# ---------------------------------------------------------------------------
# 7.1 — CRUD
# ---------------------------------------------------------------------------


@router.post(
    "",
    response_model=DiaryEntryOut,
    status_code=status.HTTP_201_CREATED,
    summary="7.1 — Create diary entry",
)
async def create_entry(
    body: DiaryEntryCreate,
    user: ActiveUser,
    svc: DiarySvcDep,
) -> DiaryEntryOut:
    try:
        entry = await svc.create_entry(
            user.id,
            content=body.content,
            book_id=body.book_id,
            mood=body.mood,
            emotion_tags=body.emotion_tags,
            quotes=body.quotes,
            is_private=body.is_private,
        )
    except EntityNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return entry  # type: ignore[return-value]


@router.get(
    "",
    response_model=DiaryListResponse,
    summary="7.1 — List current user's diary entries",
)
async def list_entries(
    user: ActiveUser,
    svc: DiarySvcDep,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
) -> DiaryListResponse:
    entries, total = await svc.list_entries(user.id, offset=offset, limit=limit)
    return DiaryListResponse(items=entries, total=total, offset=offset, limit=limit)  # type: ignore[arg-type]


@router.get(
    "/by-book/{book_id}",
    response_model=list[DiaryEntryOut],
    summary="7.1 — Diary entries for a specific book",
)
async def list_entries_by_book(
    book_id: uuid.UUID,
    user: ActiveUser,
    svc: DiarySvcDep,
) -> list[DiaryEntryOut]:
    return await svc.list_by_book(user.id, book_id)  # type: ignore[return-value]


@router.get(
    "/{entry_id}",
    response_model=DiaryEntryOut,
    summary="7.1 — Get single diary entry",
)
async def get_entry(
    entry_id: uuid.UUID,
    user: ActiveUser,
    svc: DiarySvcDep,
) -> DiaryEntryOut:
    try:
        return await svc.get_entry(entry_id, user.id)  # type: ignore[return-value]
    except EntityNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Diary entry not found")


@router.patch(
    "/{entry_id}",
    response_model=DiaryEntryOut,
    summary="7.1 — Update diary entry",
)
async def update_entry(
    entry_id: uuid.UUID,
    body: DiaryEntryUpdate,
    user: ActiveUser,
    svc: DiarySvcDep,
) -> DiaryEntryOut:
    updates = body.model_dump(exclude_none=True)
    try:
        return await svc.update_entry(entry_id, user.id, updates)  # type: ignore[return-value]
    except EntityNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Diary entry not found")


@router.delete(
    "/{entry_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="7.1 — Delete diary entry",
)
async def delete_entry(
    entry_id: uuid.UUID,
    user: ActiveUser,
    svc: DiarySvcDep,
) -> None:
    try:
        await svc.delete_entry(entry_id, user.id)
    except EntityNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Diary entry not found")


# ---------------------------------------------------------------------------
# 7.2 — AI analysis → DNA update
# ---------------------------------------------------------------------------


@router.post(
    "/{entry_id}/analyze",
    response_model=DiaryAnalyzeResponse,
    summary="7.2 — AI-analyze diary entry and update Literary DNA",
)
async def analyze_entry(
    entry_id: uuid.UUID,
    user: ActiveUser,
    diary_svc: DiarySvcDep,
    dna_svc: DNASvcDep,
) -> DiaryAnalyzeResponse:
    try:
        entry = await diary_svc.get_entry(entry_id, user.id)
    except EntityNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Diary entry not found")

    # Resolve book title for richer analysis context
    book_title: str | None = None
    if entry.book_id is not None and entry.book is not None:
        book_title = getattr(entry.book, "title", None)

    _dna, analysis = await dna_svc.update_from_diary_entry(entry, book_title=book_title)
    dna_updated = bool(analysis and analysis.get("confidence", 0) >= 0.4 and analysis.get("dna_updates"))

    # Refresh entry from DB (dna_impact_applied now True)
    updated_entry = await diary_svc.get_entry(entry_id, user.id)

    return DiaryAnalyzeResponse(entry=updated_entry, dna_updated=dna_updated)  # type: ignore[arg-type]
