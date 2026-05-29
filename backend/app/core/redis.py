from __future__ import annotations

from collections.abc import AsyncGenerator
from typing import Annotated

import redis.asyncio as aioredis
from fastapi import Depends

from app.core.config import settings

_pool: aioredis.ConnectionPool | None = None


def _get_pool() -> aioredis.ConnectionPool:
    global _pool
    if _pool is None:
        _pool = aioredis.ConnectionPool.from_url(
            settings.get_redis_url(),
            decode_responses=True,
            max_connections=20,
        )
    return _pool


async def get_redis() -> AsyncGenerator[aioredis.Redis, None]:
    async with aioredis.Redis(connection_pool=_get_pool()) as client:
        yield client


def get_redis_client() -> aioredis.Redis:
    """Return a Redis client bound to the shared pool (not a context manager)."""
    return aioredis.Redis(connection_pool=_get_pool())


async def close_redis() -> None:
    global _pool
    if _pool:
        await _pool.aclose()
        _pool = None


RedisDep = Annotated[aioredis.Redis, Depends(get_redis)]
