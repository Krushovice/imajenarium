from __future__ import annotations

import urllib.parse
from typing import Annotated

import redis.asyncio as aioredis
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm

from app.api.deps import ActiveUser, DBSession
from app.core.config import settings
from app.core.limiter import limiter
from app.core.redis import get_redis
from app.repositories.users import UserRepository
from app.schemas.auth import (
    AuthResponse,
    GoogleCallbackRequest,
    LoginRequest,
    RegisterRequest,
    TelegramAuthRequest,
    TokenResponse,
    UserOut,
)
from app.services.auth import AuthError, AuthService

router = APIRouter(prefix="/auth", tags=["auth"])

_COOKIE_NAME = "refresh_token"
_COOKIE_MAX_AGE = settings.refresh_token_expire_days * 86400


def _make_service(
    db: DBSession,
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
) -> AuthService:
    return AuthService(UserRepository(db), redis)


ServiceDep = Annotated[AuthService, Depends(_make_service)]


def _set_refresh_cookie(response: Response, token: str, max_age: int = _COOKIE_MAX_AGE) -> None:
    response.set_cookie(
        key=_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.environment != "development",
        samesite="lax",
        max_age=max_age,
        path="/api/v1/auth",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(_COOKIE_NAME, path="/api/v1/auth")


def _http(e: AuthError) -> HTTPException:
    return HTTPException(status_code=e.status_code, detail=e.message)


# ------------------------------------------------------------------
# 2.2 Register / Login
# ------------------------------------------------------------------

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(
    request: Request,
    body: RegisterRequest,
    response: Response,
    svc: ServiceDep,
) -> AuthResponse:
    try:
        user, access, refresh = await svc.register(body)
    except AuthError as e:
        raise _http(e)
    _set_refresh_cookie(response, refresh)
    return AuthResponse(
        user=UserOut.model_validate(user),
        access_token=access,
        expires_in=settings.access_token_expire_minutes * 60,
    )


@router.post("/login", response_model=AuthResponse)
@limiter.limit("10/minute")
async def login(
    request: Request,
    body: LoginRequest,
    response: Response,
    svc: ServiceDep,
) -> AuthResponse:
    try:
        user, access, refresh = await svc.login(body)
    except AuthError as e:
        raise _http(e)
    _set_refresh_cookie(response, refresh)
    return AuthResponse(
        user=UserOut.model_validate(user),
        access_token=access,
        expires_in=settings.access_token_expire_minutes * 60,
    )


@router.post("/token", response_model=TokenResponse)
@limiter.limit("10/minute")
async def oauth2_token(
    request: Request,
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
    response: Response,
    svc: ServiceDep,
) -> TokenResponse:
    """OAuth2 password grant — used by Swagger UI."""
    try:
        _, access, refresh = await svc.login(LoginRequest(email=form.username, password=form.password))
    except AuthError as e:
        raise _http(e)
    _set_refresh_cookie(response, refresh)
    return TokenResponse(access_token=access, expires_in=settings.access_token_expire_minutes * 60)


# ------------------------------------------------------------------
# 2.1 Refresh + Logout
# ------------------------------------------------------------------

@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("30/minute")
async def refresh_token(
    request: Request,
    response: Response,
    svc: ServiceDep,
    refresh_cookie: Annotated[str | None, Cookie(alias=_COOKIE_NAME)] = None,
) -> TokenResponse:
    if not refresh_cookie:
        raise HTTPException(status_code=401, detail="Refresh token missing")
    try:
        _, access, new_refresh = await svc.refresh(refresh_cookie)
    except AuthError as e:
        _clear_refresh_cookie(response)
        raise _http(e)
    _set_refresh_cookie(response, new_refresh)
    return TokenResponse(access_token=access, expires_in=settings.access_token_expire_minutes * 60)


@router.post("/logout")
async def logout(
    response: Response,
    svc: ServiceDep,
    refresh_cookie: Annotated[str | None, Cookie(alias=_COOKIE_NAME)] = None,
) -> dict:
    if refresh_cookie:
        await svc.logout(refresh_cookie)
    _clear_refresh_cookie(response)
    return {"detail": "Logged out"}


# ------------------------------------------------------------------
# 2.3 Telegram
# ------------------------------------------------------------------

@router.post("/telegram", response_model=AuthResponse)
@limiter.limit("10/minute")
async def telegram_auth(
    request: Request,
    body: TelegramAuthRequest,
    response: Response,
    svc: ServiceDep,
) -> AuthResponse:
    try:
        user, access, refresh = await svc.telegram_auth(body)
    except AuthError as e:
        raise _http(e)
    _set_refresh_cookie(response, refresh)
    return AuthResponse(
        user=UserOut.model_validate(user),
        access_token=access,
        expires_in=settings.access_token_expire_minutes * 60,
    )


# ------------------------------------------------------------------
# 2.4 Google OAuth
# ------------------------------------------------------------------

@router.get("/google")
async def google_redirect(redirect_uri: str) -> dict:
    """Return Google OAuth2 authorization URL for the client to redirect to."""
    if not settings.google_client_id:
        raise HTTPException(status_code=503, detail="Google OAuth not configured")
    params = urllib.parse.urlencode(
        {
            "client_id": settings.google_client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
        }
    )
    return {"url": f"https://accounts.google.com/o/oauth2/v2/auth?{params}"}


@router.post("/google/callback", response_model=AuthResponse)
@limiter.limit("10/minute")
async def google_callback(
    request: Request,
    body: GoogleCallbackRequest,
    response: Response,
    svc: ServiceDep,
) -> AuthResponse:
    try:
        user, access, refresh = await svc.google_callback(body.code, body.redirect_uri)
    except AuthError as e:
        raise _http(e)
    _set_refresh_cookie(response, refresh)
    return AuthResponse(
        user=UserOut.model_validate(user),
        access_token=access,
        expires_in=settings.access_token_expire_minutes * 60,
    )


# ------------------------------------------------------------------
# 2.5 Guest mode
# ------------------------------------------------------------------

@router.post("/guest", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
async def create_guest(
    request: Request,
    response: Response,
    svc: ServiceDep,
) -> AuthResponse:
    user, access, refresh = await svc.create_guest()
    _set_refresh_cookie(response, refresh, max_age=86400)
    return AuthResponse(
        user=UserOut.model_validate(user),
        access_token=access,
        expires_in=settings.access_token_expire_minutes * 60,
    )


# ------------------------------------------------------------------
# Current user
# ------------------------------------------------------------------

@router.get("/me", response_model=UserOut)
async def me(current_user: ActiveUser) -> UserOut:
    return UserOut.model_validate(current_user)
