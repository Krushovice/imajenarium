from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.core.security import decode_token
from app.models.users import User
from app.repositories import (
    BookRepository,
    DiaryRepository,
    FriendshipRepository,
    LiteraryDNARepository,
    RecommendationRepository,
    UserBookRepository,
    UserRepository,
)

# ---------------------------------------------------------------------------
# Base deps
# ---------------------------------------------------------------------------

SettingsDep = Annotated[Settings, Depends(get_settings)]
DBSession = Annotated[AsyncSession, Depends(get_db)]

# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

_oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/token",
    auto_error=False,  # allows None so optional auth works
)

_credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_current_user(
    token: Annotated[str | None, Depends(_oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    if token is None:
        raise _credentials_exception
    try:
        payload = decode_token(token)
        raw_id: str | None = payload.get("sub")
        if raw_id is None or payload.get("type") != "access":
            raise _credentials_exception
    except JWTError:
        raise _credentials_exception
    user = await UserRepository(db).get(uuid.UUID(raw_id))
    if user is None:
        raise _credentials_exception
    return user


async def get_current_active_user(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")
    return user


async def get_optional_current_user(
    token: Annotated[str | None, Depends(_oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User | None:
    if token is None:
        return None
    try:
        payload = decode_token(token)
        raw_id: str | None = payload.get("sub")
        if raw_id is None or payload.get("type") != "access":
            return None
    except JWTError:
        return None
    return await UserRepository(db).get(uuid.UUID(raw_id))


CurrentUser = Annotated[User, Depends(get_current_user)]
ActiveUser = Annotated[User, Depends(get_current_active_user)]
OptionalCurrentUser = Annotated[User | None, Depends(get_optional_current_user)]

# ---------------------------------------------------------------------------
# Per-repository factory deps
# ---------------------------------------------------------------------------


def get_user_repo(db: DBSession) -> UserRepository:
    return UserRepository(db)


def get_book_repo(db: DBSession) -> BookRepository:
    return BookRepository(db)


def get_dna_repo(db: DBSession) -> LiteraryDNARepository:
    return LiteraryDNARepository(db)


def get_user_book_repo(db: DBSession) -> UserBookRepository:
    return UserBookRepository(db)


def get_diary_repo(db: DBSession) -> DiaryRepository:
    return DiaryRepository(db)


def get_friendship_repo(db: DBSession) -> FriendshipRepository:
    return FriendshipRepository(db)


def get_recommendation_repo(db: DBSession) -> RecommendationRepository:
    return RecommendationRepository(db)


UserRepoDep = Annotated[UserRepository, Depends(get_user_repo)]
BookRepoDep = Annotated[BookRepository, Depends(get_book_repo)]
DNARepoDep = Annotated[LiteraryDNARepository, Depends(get_dna_repo)]
UserBookRepoDep = Annotated[UserBookRepository, Depends(get_user_book_repo)]
DiaryRepoDep = Annotated[DiaryRepository, Depends(get_diary_repo)]
FriendshipRepoDep = Annotated[FriendshipRepository, Depends(get_friendship_repo)]
RecommendationRepoDep = Annotated[RecommendationRepository, Depends(get_recommendation_repo)]

# ---------------------------------------------------------------------------
# Service locator — all repositories in one injectable container
# ---------------------------------------------------------------------------


@dataclass(slots=True)
class Repos:
    users: UserRepository
    books: BookRepository
    literary_dna: LiteraryDNARepository
    user_books: UserBookRepository
    diary: DiaryRepository
    friendships: FriendshipRepository
    recommendations: RecommendationRepository


def get_repos(db: DBSession) -> Repos:
    return Repos(
        users=UserRepository(db),
        books=BookRepository(db),
        literary_dna=LiteraryDNARepository(db),
        user_books=UserBookRepository(db),
        diary=DiaryRepository(db),
        friendships=FriendshipRepository(db),
        recommendations=RecommendationRepository(db),
    )


ReposDep = Annotated[Repos, Depends(get_repos)]

# ---------------------------------------------------------------------------
# AI service deps
# ---------------------------------------------------------------------------


def get_recommendation_ai() -> "RecommendationAIService":
    from app.ai import get_active_provider, get_prompt_registry
    from app.ai.tasks.recommendation import RecommendationAIService

    return RecommendationAIService(get_active_provider(), get_prompt_registry())


def get_literary_dna_ai() -> "LiteraryDNAService":
    from app.ai import get_active_provider, get_prompt_registry
    from app.ai.tasks.literary_dna import LiteraryDNAService

    return LiteraryDNAService(get_active_provider(), get_prompt_registry())


def get_review_analysis_ai() -> "ReviewAnalysisService":
    from app.ai import get_active_provider, get_prompt_registry
    from app.ai.tasks.review_analysis import ReviewAnalysisService

    return ReviewAnalysisService(get_active_provider(), get_prompt_registry())
