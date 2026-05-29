from __future__ import annotations

import time

import pytest
from jose import JWTError

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    new_token_id,
    verify_password,
)


class TestPasswordHashing:
    def test_hash_returns_bcrypt_string(self):
        h = hash_password("secret")
        assert h.startswith("$2b$")

    def test_verify_correct_password(self):
        h = hash_password("correct")
        assert verify_password("correct", h) is True

    def test_verify_wrong_password(self):
        h = hash_password("correct")
        assert verify_password("wrong", h) is False

    def test_unique_hashes_for_same_input(self):
        h1 = hash_password("same")
        h2 = hash_password("same")
        assert h1 != h2  # different salts


class TestAccessToken:
    def test_encode_decode_roundtrip(self):
        token = create_access_token("user-123")
        payload = decode_token(token)
        assert payload["sub"] == "user-123"
        assert payload["type"] == "access"

    def test_invalid_token_raises(self):
        with pytest.raises(JWTError):
            decode_token("not.a.token")

    def test_expired_token_raises(self):
        from datetime import timedelta

        token = create_access_token("user-123", expires_delta=timedelta(seconds=-1))
        with pytest.raises(JWTError):
            decode_token(token)


class TestRefreshToken:
    def test_encode_decode_roundtrip(self):
        token = create_refresh_token("user-456", jti="tid-1")
        payload = decode_token(token)
        assert payload["sub"] == "user-456"
        assert payload["type"] == "refresh"
        assert payload["jti"] == "tid-1"

    def test_without_jti(self):
        token = create_refresh_token("user-456")
        payload = decode_token(token)
        assert "jti" not in payload


class TestNewTokenId:
    def test_returns_uuid_string(self):
        import uuid

        tid = new_token_id()
        uuid.UUID(tid)  # raises if not valid UUID

    def test_unique_per_call(self):
        assert new_token_id() != new_token_id()
