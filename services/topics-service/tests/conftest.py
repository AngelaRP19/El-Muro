from __future__ import annotations

import asyncio
from collections.abc import AsyncGenerator
from typing import Any

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.infrastructure.api.app import create_app
from src.infrastructure.persistence.database import Base, get_db_session

DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def engine():
    eng = create_async_engine(DATABASE_URL, echo=False)
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await eng.dispose()


@pytest_asyncio.fixture
async def db_session(engine) -> AsyncGenerator[AsyncSession, None]:
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    app = create_app()

    async def override_db():
        yield db_session

    app.dependency_overrides[get_db_session] = override_db

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


# ── JWT helpers ────────────────────────────────────────────────────────────────

TEST_SECRET = "test-secret-key-for-testing-only"
TEST_ALGORITHM = "HS256"


def make_jwt(payload: dict[str, Any] | None = None) -> str:
    from datetime import datetime, timedelta, timezone

    from jose import jwt

    data = {
        "sub": "user-123",
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }
    if payload:
        data.update(payload)
    return jwt.encode(data, TEST_SECRET, algorithm=TEST_ALGORITHM)


def make_expired_jwt() -> str:
    from datetime import datetime, timedelta, timezone

    from jose import jwt

    data = {
        "sub": "user-123",
        "exp": datetime.now(timezone.utc) - timedelta(hours=1),
    }
    return jwt.encode(data, TEST_SECRET, algorithm=TEST_ALGORITHM)
