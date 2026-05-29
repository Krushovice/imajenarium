from __future__ import annotations

import pytest

_REGISTER = {
    "email": "alice@example.com",
    "username": "alice",
    "password": "StrongPass123!",
    "display_name": "Alice",
}


class TestRegister:
    async def test_success_returns_201_with_tokens(self, client):
        resp = await client.post("/api/v1/auth/register", json=_REGISTER)
        assert resp.status_code == 201
        body = resp.json()
        assert body["access_token"]
        assert body["user"]["email"] == "alice@example.com"
        assert body["user"]["username"] == "alice"

    async def test_duplicate_email_returns_409(self, client):
        await client.post("/api/v1/auth/register", json=_REGISTER)
        resp = await client.post("/api/v1/auth/register", json=_REGISTER)
        assert resp.status_code == 409

    async def test_duplicate_username_different_email_returns_409(self, client):
        await client.post("/api/v1/auth/register", json=_REGISTER)
        resp = await client.post(
            "/api/v1/auth/register",
            json={**_REGISTER, "email": "other@example.com"},
        )
        assert resp.status_code == 409

    async def test_invalid_email_returns_422(self, client):
        resp = await client.post(
            "/api/v1/auth/register",
            json={**_REGISTER, "email": "not-an-email"},
        )
        assert resp.status_code == 422

    async def test_short_password_returns_422(self, client):
        resp = await client.post(
            "/api/v1/auth/register",
            json={**_REGISTER, "password": "short"},
        )
        assert resp.status_code == 422

    async def test_sets_refresh_cookie(self, client):
        resp = await client.post("/api/v1/auth/register", json=_REGISTER)
        assert "refresh_token" in resp.cookies


class TestLogin:
    async def test_success(self, client):
        await client.post("/api/v1/auth/register", json=_REGISTER)
        resp = await client.post(
            "/api/v1/auth/login",
            json={"email": _REGISTER["email"], "password": _REGISTER["password"]},
        )
        assert resp.status_code == 200
        assert resp.json()["access_token"]

    async def test_wrong_password_returns_401(self, client):
        await client.post("/api/v1/auth/register", json=_REGISTER)
        resp = await client.post(
            "/api/v1/auth/login",
            json={"email": _REGISTER["email"], "password": "WrongPass!"},
        )
        assert resp.status_code == 401

    async def test_unknown_email_returns_401(self, client):
        resp = await client.post(
            "/api/v1/auth/login",
            json={"email": "ghost@example.com", "password": "Whatever1!"},
        )
        assert resp.status_code == 401


class TestRefresh:
    async def test_success_returns_new_access_token(self, client):
        reg = await client.post("/api/v1/auth/register", json=_REGISTER)
        refresh_cookie = reg.cookies.get("refresh_token")
        assert refresh_cookie

        resp = await client.post(
            "/api/v1/auth/refresh",
            cookies={"refresh_token": refresh_cookie},
        )
        assert resp.status_code == 200
        assert resp.json()["access_token"]

    async def test_missing_cookie_returns_401(self, client):
        resp = await client.post("/api/v1/auth/refresh")
        assert resp.status_code == 401

    async def test_invalid_token_returns_401(self, client):
        resp = await client.post(
            "/api/v1/auth/refresh",
            cookies={"refresh_token": "garbage"},
        )
        assert resp.status_code == 401


class TestLogout:
    async def test_success_clears_cookie(self, client):
        reg = await client.post("/api/v1/auth/register", json=_REGISTER)
        refresh_cookie = reg.cookies.get("refresh_token")

        resp = await client.post(
            "/api/v1/auth/logout",
            cookies={"refresh_token": refresh_cookie},
        )
        assert resp.status_code == 200

    async def test_logout_invalidates_refresh_token(self, client):
        reg = await client.post("/api/v1/auth/register", json=_REGISTER)
        refresh_cookie = reg.cookies.get("refresh_token")

        await client.post(
            "/api/v1/auth/logout",
            cookies={"refresh_token": refresh_cookie},
        )
        resp = await client.post(
            "/api/v1/auth/refresh",
            cookies={"refresh_token": refresh_cookie},
        )
        assert resp.status_code == 401


class TestMe:
    async def test_returns_current_user(self, client, test_user, auth_headers):
        resp = await client.get("/api/v1/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        body = resp.json()
        assert body["email"] == test_user["user"]["email"]

    async def test_no_token_returns_401(self, client):
        resp = await client.get("/api/v1/auth/me")
        assert resp.status_code == 401


class TestGuestMode:
    async def test_creates_guest_user(self, client):
        resp = await client.post("/api/v1/auth/guest")
        assert resp.status_code == 201
        body = resp.json()
        assert body["user"]["is_guest"] is True
        assert body["access_token"]
