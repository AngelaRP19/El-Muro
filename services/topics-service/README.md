# topics-service

Microservicio REST para gestión de temas (Topics) — parte del proyecto **El Muro**.

Stack: Python 3.12 · FastAPI · SQLAlchemy 2 async · PostgreSQL · Alembic · python-jose

## Setup rápido

```bash
cd services/topics-service

# 1. Copiar variables de entorno
cp .env.example .env
# Editar .env: POSTGRES_PASSWORD y JWT_SECRET_KEY obligatorios

# 2. Instalar dependencias (dev)
pip install -e ".[dev]"
```

## Levantar solo este servicio

```bash
# Desde la raíz del proyecto
docker-compose up -d postgres-topics topics-service

# Ver logs en tiempo real
docker-compose logs -f topics-service
```

## Correr migraciones de Alembic

```bash
# Dentro del contenedor
docker-compose exec topics-service alembic upgrade head

# O localmente (requiere PostgreSQL accesible y .env configurado)
cd services/topics-service
alembic upgrade head
```

## Ejecutar tests

```bash
cd services/topics-service

# Todos los tests con cobertura
pytest

# Solo unit tests
pytest tests/unit/

# Solo integration tests
pytest tests/integration/

# Con reporte HTML
pytest --cov-report=html
```

## Verificar /health

```bash
curl http://localhost:8004/health
# {"status":"ok","service":"topics-service","version":"1.0.0"}

curl http://localhost:8004/ready
# {"status":"ready","database":"ok"}

curl http://localhost:8004/metrics
# formato Prometheus text
```

## API Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/v1/topics` | JWT | Crear tema |
| `GET` | `/api/v1/topics` | — | Listar (paginado) |
| `GET` | `/api/v1/topics/{id}` | — | Obtener por ID |
| `GET` | `/api/v1/topics/slug/{slug}` | — | Obtener por slug |
| `PUT` | `/api/v1/topics/{id}` | JWT | Actualizar |
| `DELETE` | `/api/v1/topics/{id}` | JWT | Soft-delete |

Documentación interactiva disponible en `http://localhost:8004/docs` cuando `DEBUG=true`.

## Variables de entorno requeridas

| Variable | Descripción |
|----------|-------------|
| `POSTGRES_PASSWORD` | Contraseña de la base de datos |
| `JWT_SECRET_KEY` | Clave compartida con auth-service para firmar/verificar JWT |

Ver `.env.example` para la lista completa.
