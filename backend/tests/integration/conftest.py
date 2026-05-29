from __future__ import annotations

import os
import socket
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fakeredis.aioredis import FakeRedis
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.pool import NullPool
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

TEST_DB_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://bookshelf:changeme@localhost:5432/bookshelf_test",
)


def _db_reachable() -> bool:
    try:
        # Parse host:port from the URL
        netloc = TEST_DB_URL.split("@")[-1].split("/")[0]
        host, _, port_str = netloc.partition(":")
        port = int(port_str) if port_str else 5432
        with socket.create_connection((host, port), timeout=2):
            return True
    except OSError:
        return False


def pytest_collection_modifyitems(config, items):
    if not _db_reachable():
        skip = pytest.mark.skip(reason=f"Test DB not reachable at {TEST_DB_URL}")
        for item in items:
            if "integration" in str(item.fspath):
                item.add_marker(skip)

_TELEGRAM_MOCKS = {
    "app.telegram.bot.init_telegram": AsyncMock,
    "app.telegram.bot.shutdown_telegram": AsyncMock,
    "app.telegram.scheduler.start_scheduler": MagicMock,
    "app.telegram.scheduler.stop_scheduler": MagicMock,
}


@pytest.fixture(scope="session")
async def test_engine():
    from app.models import Base  # registers all ORM models

    engine = create_async_engine(TEST_DB_URL, echo=False, poolclass=NullPool)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture(scope="session")
def session_factory(test_engine):
    return async_sessionmaker(test_engine, expire_on_commit=False, autoflush=False)


@pytest.fixture(autouse=True)
async def clean_tables(test_engine):
    from app.core.limiter import limiter
    from app.models import Base

    yield
    async with test_engine.begin() as conn:
        tables = ", ".join(t.name for t in reversed(Base.metadata.sorted_tables))
        if tables:
            await conn.execute(text(f"TRUNCATE TABLE {tables} RESTART IDENTITY CASCADE"))
    limiter.reset()


@pytest.fixture
async def db(session_factory) -> AsyncSession:
    async with session_factory() as session:
        yield session
        await session.rollback()


@pytest.fixture
def fake_redis() -> FakeRedis:
    return FakeRedis(decode_responses=True)


def _start_patches():
    patches = []
    for target, mock_cls in _TELEGRAM_MOCKS.items():
        p = patch(target, new_callable=mock_cls)
        p.start()
        patches.append(p)
    return patches


@pytest.fixture
async def client(session_factory, fake_redis):
    from app.core.database import get_db
    from app.core.redis import get_redis
    from app.main import app

    async def _get_db():
        async with session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    async def _get_redis():
        yield fake_redis

    app.dependency_overrides[get_db] = _get_db
    app.dependency_overrides[get_redis] = _get_redis

    patches = _start_patches()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    for p in patches:
        p.stop()
    app.dependency_overrides.clear()


_REGISTER_PAYLOAD = {
    "email": "test@example.com",
    "username": "testuser",
    "password": "StrongPass123!",
    "display_name": "Test User",
}


@pytest.fixture
async def test_user(client) -> dict:
    resp = await client.post("/api/v1/auth/register", json=_REGISTER_PAYLOAD)
    assert resp.status_code == 201, resp.text
    return resp.json()


@pytest.fixture
def auth_headers(test_user) -> dict:
    return {"Authorization": f"Bearer {test_user['access_token']}"}
