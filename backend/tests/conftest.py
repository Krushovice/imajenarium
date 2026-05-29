from __future__ import annotations

import pytest
from fakeredis.aioredis import FakeRedis


@pytest.fixture
def fake_redis() -> FakeRedis:
    return FakeRedis(decode_responses=True)
