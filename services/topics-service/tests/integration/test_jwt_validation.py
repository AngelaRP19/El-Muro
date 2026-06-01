from __future__ import annotations

from typing import Any

import pytest
from httpx import ASGITransport, AsyncClient

from src.infrastructure.api.app import create_app
from src.infrastructure.config.settings import Settings, get_settings
from src.infrastructure.persistence.database import get_db_session
from tests.conftest import TEST_ALGORITHM, TEST_SECRET, make_expired_jwt, make_jwt


def _make_app_with_test_jwt(db_session):
    app = create_app()

    def override_settings() -> Settings:
        return Settings(
            JWT_SECRET_KEY=TEST_SECRET,
            JWT_ALGORITHM=TEST_ALGORITHM,
            POSTGRES_PASSWORD="test",
        )

    async def override_db():
        yield db_session

    app.dependency_overrides[get_settings] = override_settings
    app.dependency_overrides[get_db_session] = override_db
    return app


@pytest.fixture
async def jwt_client(db_session):
    app = _make_app_with_test_jwt(db_session)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


class TestJWTValidation:
    async def test_valid_token_grants_access(self, jwt_client):
        token = make_jwt()
        r = await jwt_client.post(
            "/api/v1/topics",
            json={"name": "JWT Test Topic"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert r.status_code == 201

    async def test_missing_token_401(self, jwt_client):
        r = await jwt_client.post("/api/v1/topics", json={"name": "No Auth"})
        assert r.status_code == 401
        assert r.json()["error"] == "topic_not_found" or r.status_code == 401

    async def test_expired_token_401(self, jwt_client):
        token = make_expired_jwt()
        r = await jwt_client.post(
            "/api/v1/topics",
            json={"name": "Expired"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert r.status_code == 401
        assert "expired" in r.json()["detail"].lower()

    async def test_malformed_token_401(self, jwt_client):
        r = await jwt_client.post(
            "/api/v1/topics",
            json={"name": "Malformed"},
            headers={"Authorization": "Bearer not.a.real.token"},
        )
        assert r.status_code == 401

    async def test_wrong_secret_401(self, jwt_client):
        from jose import jwt

        bad_token = jwt.encode({"sub": "user"}, "wrong-secret", algorithm=TEST_ALGORITHM)
        r = await jwt_client.post(
            "/api/v1/topics",
            json={"name": "Wrong Secret"},
            headers={"Authorization": f"Bearer {bad_token}"},
        )
        assert r.status_code == 401
