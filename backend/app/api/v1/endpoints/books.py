from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.ai import get_embedding_service
from app.api.deps import ActiveUser, DBSession
from app.models.enums import BookStatus
from app.repositories.books import BookRepository
from app.repositories.user_books import UserBookRepository
from app.schemas.books import (
    BookOut,
    BookSearchResult,
    SemanticSearchRequest,
    UserBookCreate,
    UserBookOut,
    UserBookUpdate,
    UserLibraryResponse,
)
from app.services.books import BookService, UserBookService

router = APIRouter(prefix="/books", tags=["books"])


# ---------------------------------------------------------------------------
# Dependency factories
# ---------------------------------------------------------------------------


def _make_book_svc(db: DBSession) -> BookService:
    return BookService(BookRepository(db), get_embedding_service())


def _make_user_book_svc(db: DBSession) -> UserBookService:
    book_repo = BookRepository(db)
    book_svc = BookService(book_repo, get_embedding_service())
    return UserBookService(UserBookRepository(db), book_repo, book_svc)


BookSvcDep = Annotated[BookService, Depends(_make_book_svc)]
UserBookSvcDep = Annotated[UserBookService, Depends(_make_user_book_svc)]


# ---------------------------------------------------------------------------
# Catalog
# ---------------------------------------------------------------------------


@router.get(
    "",
    response_model=list[BookSearchResult],
    summary="List book catalog (paginated)",
)
async def list_books(
    svc: BookSvcDep,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
) -> list[BookSearchResult]:
    books = await svc.get_catalog(offset=offset, limit=limit)
    return books  # type: ignore[return-value]


# ---------------------------------------------------------------------------
# 5.3 — Search — MUST come before /{book_id} to avoid route shadowing
# ---------------------------------------------------------------------------


@router.get(
    "/search/text",
    response_model=list[BookSearchResult],
    summary="Full-text search by title/author (pg_trgm)",
)
async def text_search(
    svc: BookSvcDep,
    q: str = Query(min_length=1, max_length=500),
    limit: int = Query(default=20, ge=1, le=100),
) -> list[BookSearchResult]:
    return await svc.text_search(q, limit=limit)  # type: ignore[return-value]


@router.post(
    "/search/semantic",
    response_model=list[BookSearchResult],
    summary="5.3 — Semantic search via pgvector cosine similarity",
)
async def semantic_search(
    body: SemanticSearchRequest,
    svc: BookSvcDep,
) -> list[BookSearchResult]:
    return await svc.semantic_search(body.text, limit=body.limit, threshold=body.threshold)  # type: ignore[return-value]


# ---------------------------------------------------------------------------
# 5.4 — User shelf — static /shelf/me BEFORE /{book_id}
# ---------------------------------------------------------------------------


@router.get(
    "/shelf/me",
    response_model=UserLibraryResponse,
    summary="5.4 — Get current user's book shelf",
)
async def get_my_shelf(
    user: ActiveUser,
    svc: UserBookSvcDep,
    status_filter: BookStatus | None = Query(default=None, alias="status"),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
) -> UserLibraryResponse:
    items, total = await svc.get_library(
        user.id, status=status_filter, offset=offset, limit=limit
    )
    return UserLibraryResponse(items=items, total=total, offset=offset, limit=limit)  # type: ignore[arg-type]


# ---------------------------------------------------------------------------
# 5.2 — Admin: trigger embedding generation
# ---------------------------------------------------------------------------


@router.post(
    "/admin/generate-embeddings",
    summary="5.2 — Generate mood_embedding for all books without one",
)
async def generate_embeddings(svc: BookSvcDep) -> dict:
    count = await svc.generate_embeddings_for_all()
    return {"embedded": count}


# ---------------------------------------------------------------------------
# Parameterized routes last — /{book_id}
# ---------------------------------------------------------------------------


@router.get(
    "/{book_id}",
    response_model=BookOut,
    summary="Get book detail",
)
async def get_book(book_id: uuid.UUID, svc: BookSvcDep) -> BookOut:
    from app.repositories.exceptions import EntityNotFoundError

    try:
        return await svc.get_book(book_id)  # type: ignore[return-value]
    except EntityNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")


@router.post(
    "/{book_id}/shelf",
    response_model=UserBookOut,
    status_code=status.HTTP_201_CREATED,
    summary="5.4 — Add book to personal shelf",
)
async def add_to_shelf(
    book_id: uuid.UUID,
    body: UserBookCreate,
    user: ActiveUser,
    svc: UserBookSvcDep,
) -> UserBookOut:
    return await svc.add_to_shelf(  # type: ignore[return-value]
        user.id,
        book_id,
        status=body.status,
        rating=body.rating,
        review=body.review,
        quotes=body.quotes,
        started_at=body.started_at,
        finished_at=body.finished_at,
        is_private=body.is_private,
    )


@router.get(
    "/{book_id}/shelf",
    response_model=UserBookOut,
    summary="5.4 — Get shelf entry for a specific book",
)
async def get_shelf_entry(
    book_id: uuid.UUID,
    user: ActiveUser,
    svc: UserBookSvcDep,
) -> UserBookOut:
    return await svc.get_shelf_entry(user.id, book_id)  # type: ignore[return-value]


@router.patch(
    "/{book_id}/shelf",
    response_model=UserBookOut,
    summary="5.4 — Update shelf entry (status, rating, review, quotes)",
)
async def update_shelf_entry(
    book_id: uuid.UUID,
    body: UserBookUpdate,
    user: ActiveUser,
    svc: UserBookSvcDep,
) -> UserBookOut:
    updates = body.model_dump(exclude_none=True)
    return await svc.update_shelf_entry(user.id, book_id, updates)  # type: ignore[return-value]


@router.delete(
    "/{book_id}/shelf",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="5.4 — Remove book from shelf",
)
async def remove_from_shelf(
    book_id: uuid.UUID,
    user: ActiveUser,
    svc: UserBookSvcDep,
) -> None:
    await svc.remove_from_shelf(user.id, book_id)
