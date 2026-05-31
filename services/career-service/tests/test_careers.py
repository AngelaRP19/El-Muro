import os

os.environ["DATABASE_URL"] = "sqlite:///./test_career_service.db"
os.environ["EUREKA_ENABLED"] = "false"

import pytest
from fastapi.testclient import TestClient

from src.infrastructure.config.database import Base, engine
from src.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


class TestCareers:
    def test_health_check(self):
        response = client.get("/health")

        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

    def test_crear_carrera(self):
        response = client.post(
            "/api/carreras/crear",
            headers={"x-role": "ADMIN"},
            json={
                "nombre": "Ingenieria de Sistemas",
                "descripcion": "Test carrera",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["nombre"] == "Ingenieria de Sistemas"
        assert data["id"] is not None

    def test_obtener_carreras(self):
        client.post(
            "/api/carreras/crear",
            headers={"x-role": "ADMIN"},
            json={
                "nombre": "Test Carrera",
                "descripcion": "Test",
            },
        )

        response = client.get("/api/carreras/", headers={"x-role": "ESTUDIANTE"})

        assert response.status_code == 200
        assert len(response.json()) > 0

    def test_obtener_carrera_by_id(self):
        create_response = client.post(
            "/api/carreras/crear",
            headers={"x-role": "ADMIN"},
            json={"nombre": "Test Carrera", "descripcion": "Test"},
        )
        carrera_id = create_response.json()["id"]

        response = client.get(
            f"/api/carreras/{carrera_id}",
            headers={"x-role": "ESTUDIANTE"},
        )

        assert response.status_code == 200
        assert response.json()["id"] == carrera_id
        assert response.json()["materias"] == []

    def test_actualizar_carrera(self):
        create_response = client.post(
            "/api/carreras/crear",
            headers={"x-role": "ADMIN"},
            json={"nombre": "Test Carrera", "descripcion": "Test"},
        )
        carrera_id = create_response.json()["id"]

        response = client.put(
            f"/api/carreras/{carrera_id}",
            headers={"x-role": "ADMIN"},
            json={"nombre": "Test Actualizado"},
        )

        assert response.status_code == 200
        assert response.json()["nombre"] == "Test Actualizado"

    def test_eliminar_carrera(self):
        create_response = client.post(
            "/api/carreras/crear",
            headers={"x-role": "ADMIN"},
            json={"nombre": "Test Carrera", "descripcion": "Test"},
        )
        carrera_id = create_response.json()["id"]

        response = client.delete(
            f"/api/carreras/{carrera_id}",
            headers={"x-role": "ADMIN"},
        )
        assert response.status_code == 200

        get_response = client.get(
            f"/api/carreras/{carrera_id}",
            headers={"x-role": "ESTUDIANTE"},
        )
        assert get_response.status_code == 404

    def test_exists_endpoint(self):
        create_response = client.post(
            "/api/carreras/crear",
            headers={"x-role": "ADMIN"},
            json={"nombre": "Test Carrera", "descripcion": "Test"},
        )
        carrera_id = create_response.json()["id"]

        response = client.get(f"/api/carreras/_exists/{carrera_id}")

        assert response.status_code == 200
        assert response.json() == {"exists": True}

    def test_no_permission_without_role(self):
        response = client.post(
            "/api/carreras/crear",
            json={"nombre": "Test", "descripcion": "Test"},
        )

        assert response.status_code == 401

    def test_estudiante_cannot_create(self):
        response = client.post(
            "/api/carreras/crear",
            headers={"x-role": "ESTUDIANTE"},
            json={"nombre": "Test", "descripcion": "Test"},
        )

        assert response.status_code == 403

