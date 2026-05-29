from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.schemas.auth import LoginRequest, RegisterRequest
from app.services.auth import AuthError, AuthService


def _make_service(fake_redis, users_repo=None):
    if users_repo is None:
        users_repo = AsyncMock()
    return AuthService(users_repo, fake_redis)


def _mock_user(
    *,
    email: str = "alice@example.com",
    username: str = "alice",
    password_hash: str | None = None,
    is_active: bool = True,
) -> MagicMock:
    from app.core.security import hash_password

    user = MagicMock()
    user.id = uuid.uuid4()
    user.email = email
    user.username = username
    user.hashed_password = password_hash or hash_password("StrongPass1!")
    user.is_active = is_active
    return user


class TestRegister:
    async def test_success(self, fake_redis):
        repo = AsyncMock()
        repo.email_exists.return_value = False
        repo.username_exists.return_value = False
        repo.create.return_value = _mock_user()

        svc = _make_service(fake_redis, repo)
        user, access, refresh = await svc.register(
            RegisterRequest(
                email="alice@example.com",
                username="alice",
                password="StrongPass1!",
            )
        )
        assert user is not None
        assert access
        assert refresh

    async def test_duplicate_email_raises(self, fake_redis):
        repo = AsyncMock()
        repo.email_exists.return_value = True
        svc = _make_service(fake_redis, repo)

        with pytest.raises(AuthError) as exc_info:
            await svc.register(
                RegisterRequest(email="dup@example.com", username="newuser", password="Pass123!")
            )
        assert exc_info.value.status_code == 409

    async def test_duplicate_username_raises(self, fake_redis):
        repo = AsyncMock()
        repo.email_exists.return_value = False
        repo.username_exists.return_value = True
        svc = _make_service(fake_redis, repo)

        with pytest.raises(AuthError) as exc_info:
            await svc.register(
                RegisterRequest(email="new@example.com", username="taken", password="Pass123!")
            )
        assert exc_info.value.status_code == 409


class TestLogin:
    async def test_success(self, fake_redis):
        user = _mock_user()
        repo = AsyncMock()
        repo.get_by_email.return_value = user
        svc = _make_service(fake_redis, repo)

        result_user, access, refresh = await svc.login(
            LoginRequest(email="alice@example.com", password="StrongPass1!")
        )
        assert result_user is user
        assert access

    async def test_wrong_password_raises(self, fake_redis):
        user = _mock_user()
        repo = AsyncMock()
        repo.get_by_email.return_value = user
        svc = _make_service(fake_redis, repo)

        with pytest.raises(AuthError) as exc_info:
            await svc.login(LoginRequest(email="alice@example.com", password="WrongPass!"))
        assert exc_info.value.status_code == 401

    async def test_unknown_email_raises(self, fake_redis):
        repo = AsyncMock()
        repo.get_by_email.return_value = None
        svc = _make_service(fake_redis, repo)

        with pytest.raises(AuthError) as exc_info:
            await svc.login(LoginRequest(email="ghost@example.com", password="Pass123!"))
        assert exc_info.value.status_code == 401

    async def test_inactive_user_raises(self, fake_redis):
        user = _mock_user(is_active=False)
        repo = AsyncMock()
        repo.get_by_email.return_value = user
        svc = _make_service(fake_redis, repo)

        with pytest.raises(AuthError) as exc_info:
            await svc.login(LoginRequest(email="alice@example.com", password="StrongPass1!"))
        assert exc_info.value.status_code == 403


class TestRefreshToken:
    async def test_success(self, fake_redis):
        from app.core.security import create_refresh_token, new_token_id

        user = _mock_user()
        repo = AsyncMock()
        repo.get.return_value = user

        svc = _make_service(fake_redis, repo)
        token_id = new_token_id()
        refresh = create_refresh_token(str(user.id), jti=token_id)
        await fake_redis.set(f"refresh:{token_id}", str(user.id), ex=86400)

        new_user, new_access, new_refresh = await svc.refresh(refresh)
        assert new_user is user
        assert new_access

    async def test_revoked_token_raises(self, fake_redis):
        from app.core.security import create_refresh_token, new_token_id

        svc = _make_service(fake_redis)
        token_id = new_token_id()
        refresh = create_refresh_token("user-id", jti=token_id)
        # NOT stored in redis → revoked

        with pytest.raises(AuthError) as exc_info:
            await svc.refresh(refresh)
        assert exc_info.value.status_code == 401

    async def test_invalid_token_raises(self, fake_redis):
        svc = _make_service(fake_redis)

        with pytest.raises(AuthError) as exc_info:
            await svc.refresh("garbage.token.here")
        assert exc_info.value.status_code == 401


class TestGuestMode:
    async def test_guest_email_domain(self, fake_redis):
        user = _mock_user(email="guest_abc@guest.internal")
        repo = AsyncMock()
        repo.create.return_value = user
        svc = _make_service(fake_redis, repo)

        result, _, _ = await svc.create_guest()
        assert AuthService.is_guest(result) is True

    async def test_non_guest_user(self):
        user = _mock_user(email="real@example.com")
        assert AuthService.is_guest(user) is False
