from __future__ import annotations

from typing import Any

import pytest
from httpx import AsyncClient

from src.infrastructure.config.settings import get_settings
from src.infrastructure.security.jwt_validator import get_current_user
from tests.conftest import TEST_ALGORITHM, TEST_SECRET, make_expired_jwt, make_jwt


def _auth_headers(token: str | None = None) -> dict[str, str]:
    t = token or make_jwt()
    return {"Authorization": f"Bearer {t}"}


@pytest.fixture(autouse=True)
def override_jwt(client):
    """Replace JWT validator so tests use TEST_SECRET instead of env var."""
    from src.infrastructure.api.app import create_app
    pass


@pytest.fixture
async def authenticated_client(db_session):
    from httpx import ASGITransport, AsyncClient

    from src.infrastructure.api.app import create_app
    from src.infrastructure.persistence.database import get_db_session

    app = create_app()

    async def override_db():
        yield db_session

    async def override_jwt() -> dict[str, Any]:
        return {"sub": "test-user"}

    app.dependency_overrides[get_db_session] = override_db
    app.dependency_overrides[get_current_user] = override_jwt

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def public_client(db_session):
    from httpx import ASGITransport, AsyncClient

    from src.infrastructure.api.app import create_app
    from src.infrastructure.persistence.database import get_db_session

    app = create_app()

    async def override_db():
        yield db_session

    app.dependency_overrides[get_db_session] = override_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


class TestHealthEndpoints:
    async def test_health_ok(self, public_client):
        r = await public_client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    async def test_metrics_returns_text(self, public_client):
        r = await public_client.get("/metrics")
        assert r.status_code == 200
        assert "uptime" in r.text


class TestCreateTopic:
    async def test_create_topic_201(self, authenticated_client):
        r = await authenticated_client.post(
            "/api/v1/topics", json={"name": "Integration Test Topic"}
        )
        assert r.status_code == 201
        data = r.json()
        assert data["name"] == "Integration Test Topic"
        assert data["slug"] == "integration-test-topic"
        assert data["is_active"] is True

    async def test_create_topic_requires_auth(self, public_client):
        r = await public_client.post("/api/v1/topics", json={"name": "Unauthorized"})
        assert r.status_code == 401

    async def test_create_topic_duplicate_409(self, authenticated_client):
        await authenticated_client.post("/api/v1/topics", json={"name": "Dup Topic"})
        r = await authenticated_client.post("/api/v1/topics", json={"name": "Dup Topic"})
        assert r.status_code == 409

    async def test_create_topic_too_short_422(self, authenticated_client):
        r = await authenticated_client.post("/api/v1/topics", json={"name": "ab"})
        assert r.status_code == 422


class TestListTopics:
    async def test_list_topics_public(self, public_client, authenticated_client):
        await authenticated_client.post("/api/v1/topics", json={"name": "List Topic A"})
        r = await public_client.get("/api/v1/topics")
        assert r.status_code == 200
        body = r.json()
        assert "data" in body
        assert "total" in body
        assert "pages" in body

    async def test_list_pagination_params(self, public_client):
        r = await public_client.get("/api/v1/topics?page=1&size=5")
        assert r.status_code == 200
        assert r.json()["size"] == 5

    async def test_list_size_over_max_422(self, public_client):
        r = await public_client.get("/api/v1/topics?size=200")
        assert r.status_code == 422


class TestGetTopic:
    async def test_get_by_id(self, public_client, authenticated_client):
        create_r = await authenticated_client.post(
            "/api/v1/topics", json={"name": "Get By ID Topic"}
        )
        topic_id = create_r.json()["id"]
        r = await public_client.get(f"/api/v1/topics/{topic_id}")
        assert r.status_code == 200
        assert r.json()["id"] == topic_id

    async def test_get_by_slug(self, public_client, authenticated_client):
        await authenticated_client.post("/api/v1/topics", json={"name": "Slug Lookup Topic"})
        r = await public_client.get("/api/v1/topics/slug/slug-lookup-topic")
        assert r.status_code == 200

    async def test_get_not_found_404(self, public_client):
        r = await public_client.get("/api/v1/topics/00000000-0000-0000-0000-000000000000")
        assert r.status_code == 404
        assert "request_id" in r.json()


class TestUpdateTopic:
    async def test_update_topic(self, authenticated_client):
        create_r = await authenticated_client.post(
            "/api/v1/topics", json={"name": "Original Topic"}
        )
        topic_id = create_r.json()["id"]
        r = await authenticated_client.put(
            f"/api/v1/topics/{topic_id}", json={"name": "Updated Topic"}
        )
        assert r.status_code == 200
        assert r.json()["name"] == "Updated Topic"


class TestDeleteTopic:
    async def test_delete_topic(self, authenticated_client, public_client):
        create_r = await authenticated_client.post(
            "/api/v1/topics", json={"name": "Topic To Delete"}
        )
        topic_id = create_r.json()["id"]
        del_r = await authenticated_client.delete(f"/api/v1/topics/{topic_id}")
        assert del_r.status_code == 204
        # Should not appear in public listing (active_only=True)
        list_r = await public_client.get("/api/v1/topics")
        ids = [t["id"] for t in list_r.json()["data"]]
        assert topic_id not in ids
