# topics-service

Microservicio REST para la gestión de **temas** (Topics) en la plataforma **El Muro**. Un tópico representa una categoría temática general (por ejemplo, *Arquitectura de Software*, *Bases de Datos*, *Inteligencia Artificial*) bajo la cual se organizan temas más específicos, publicaciones y contenido de la comunidad.

`topics-service` gestiona el catálogo de temas de El Muro. Sus responsabilidades son:

- **Crear** temas con nombre único y slug autogenerado (slugificación Unicode).
- **Listar** temas activos de forma paginada.
- **Consultar** un tópico individual por UUID o por slug.
- **Actualizar** nombre y/o descripción de un tópico.
- **Eliminar** temas de forma lógica (*soft-delete* `is_active = false`).

Las operaciones de escritura (crear, actualizar, eliminar) requieren un token JWT válido emitido por el `auth-service`. Las operaciones de lectura son públicas.


## 2. Arquitectura

El servicio sigue **Arquitectura Hexagonal** (también conocida como Puertos y Adaptadores / Clean Architecture). Las dependencias apuntan siempre hacia adentro: la capa de infraestructura depende de la aplicación, y la aplicación depende del dominio. El dominio no conoce nada de FastAPI, SQLAlchemy ni HTTP.

```
┌─────────────────────────────────────────────────────────────────┐
│                        INFRASTRUCTURE                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  HTTP (API)  │  │  PostgreSQL  │  │  JWT / Middleware     │  │
│  │  FastAPI     │  │  SQLAlchemy  │  │  Correlation IDs     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────┘  │
│         │                 │                                      │
│  ┌──────▼─────────────────▼──────────────────────────────────┐  │
│  │                    APPLICATION                             │  │
│  │  CreateTopic · ListTopics · GetTopic · GetTopicBySlug      │  │
│  │  UpdateTopic · DeleteTopic                                 │  │
│  │  DTOs (request / response)                                 │  │
│  └──────────────────────────┬────────────────────────────────┘  │
│                             │                                    │
│  ┌──────────────────────────▼────────────────────────────────┐  │
│  │                       DOMAIN                               │  │
│  │  Topic (entity)  ·  TopicId / TopicName / TopicSlug (VO)  │  │
│  │  TopicRepository (port ABC)  ·  SlugUniquenessService      │  │
│  │  Domain Exceptions                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

| Capa | Directorio | Responsabilidad |
|---|---|---|
| Domain | `src/domain/` | Entidad `Topic`, Value Objects, interfaz del repositorio, excepciones de negocio |
| Application | `src/application/` | Casos de uso, DTOs de entrada y salida |
| Infrastructure | `src/infrastructure/` | FastAPI, SQLAlchemy, JWT, configuración, migraciones |

## 3. Tecnologías

| Tecnología | Versión | Rol |
|---|---|---|
| Python | 3.12 | Lenguaje principal |
| FastAPI | ≥ 0.111 | Framework HTTP async |
| SQLAlchemy | ≥ 2.0 (async) | ORM con soporte async |
| asyncpg | ≥ 0.29 | Driver PostgreSQL async |
| psycopg2-binary | ≥ 2.9 | Driver PostgreSQL síncrono (Alembic) |
| PostgreSQL | 16 | Base de datos relacional |
| Alembic | ≥ 1.13 | Migraciones de esquema |
| Pydantic v2 + pydantic-settings | ≥ 2.7 / ≥ 2.3 | Validación de datos y settings |
| python-jose[cryptography] | ≥ 3.3 | Decodificación/validación JWT |
| uvicorn[standard] | ≥ 0.30 | Servidor ASGI |
| pytest + pytest-asyncio | ≥ 8.2 / ≥ 0.23 | Suite de pruebas |
| pytest-cov | ≥ 5.0 | Cobertura de código (mínimo 80 %) |
| httpx | ≥ 0.27 | Cliente HTTP en tests |
| aiosqlite | ≥ 0.20 | SQLite en memoria para tests de integración |
| factory-boy | ≥ 3.3 | Factories para fixtures de tests |
| ruff | ≥ 0.4 | Linter y formateador |
| mypy | ≥ 1.10 | Type checking estático |
| Docker | — | Contenedorización multi-stage |


## 4. Configuración y variables de entorno

Copia `.env.example` a un `.env` y ajusta los valores:

```bash
cp .env.example .env
```

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `SERVICE_NAME` | `topics-service` | Nombre del servicio (aparece en logs y /health) |
| `SERVICE_VERSION` | `1.0.0` | Versión del servicio |
| `DEBUG` | `false` | `true` habilita `/docs`, `/redoc`, `/openapi.json` |
| `ENVIRONMENT` | `production` | Entorno (`development`, `production`) |
| `HOST` | `0.0.0.0` | Interfaz de escucha |
| `PORT` | `8000` | Puerto interno del contenedor |
| `WORKERS` | `2` | Número de workers uvicorn |
| `REQUEST_TIMEOUT` | `30` | Timeout por request en segundos |
| `GRACEFUL_SHUTDOWN_TIMEOUT` | `10` | Tiempo de espera para shutdown graceful |
| `POSTGRES_HOST` | `postgres` | Host de PostgreSQL |
| `POSTGRES_PORT` | `5432` | Puerto de PostgreSQL |
| `POSTGRES_DB` | `topics_db` | Nombre de la base de datos |
| `POSTGRES_USER` | `topics_user` | Usuario de PostgreSQL |
| `POSTGRES_PASSWORD` | — | **Requerido.** Contraseña de PostgreSQL |
| `DB_POOL_SIZE` | `10` | Tamaño del pool de conexiones |
| `DB_MAX_OVERFLOW` | `20` | Conexiones extra sobre el pool |
| `DB_ECHO` | `false` | Log SQL al stdout (`true` para depuración) |
| `JWT_SECRET_KEY` | — | **Requerido.** Clave compartida con `auth-service` |
| `JWT_ALGORITHM` | `HS256` | Algoritmo de firma del JWT |
| `JWT_AUDIENCE` | — | Audience esperada (opcional) |
| `JWT_ISSUER` | — | Issuer esperado (opcional) |
| `CORS_ORIGINS` | `["*"]` | Orígenes permitidos (JSON array) |

---

## 6. Cómo ejecutarlo

### Con Docker Compose (recomendado)

Desde la **raíz del repositorio**:

```bash
# Levantar PostgreSQL + el servicio
docker-compose up -d postgres-topics topics-service

# Ver logs en tiempo real
docker-compose logs -f topics-service

# Detener
docker-compose down
```

El servicio queda disponible en `http://localhost:8004`.

### Solo el contenedor del servicio (DB externa)

```bash
cd services/topics-service

docker build -t topics-service .

docker run -d \
  --name topics-service \
  -p 8004:8000 \
  --env-file .env \
  -e POSTGRES_HOST=host.docker.internal \
  topics-service
```

## 7. Base de datos y migraciones

El `entrypoint.sh` del contenedor ejecuta `alembic upgrade head` automáticamente al arrancar, por lo que en Docker Compose no es necesario correr las migraciones manualmente.

### Esquema de la tabla `topics`

```sql
CREATE TABLE topics (
    id          UUID PRIMARY KEY,
    name        VARCHAR(150) NOT NULL UNIQUE,
    slug        VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    materia_id  INTEGER NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_topics_name       ON topics (name);
CREATE INDEX ix_topics_slug       ON topics (slug);
CREATE INDEX ix_topics_is_active  ON topics (is_active);
CREATE INDEX ix_topics_materia_id ON topics (materia_id);
```

> El borrado es **lógico**: `DELETE /api/v1/topics/{id}` no elimina el registro, sino que pone `is_active = false`. Los listados solo devuelven temas activos.

### Comandos Alembic útiles

```bash
# Dentro del contenedor
docker-compose exec topics-service alembic upgrade head
docker-compose exec topics-service alembic downgrade -1
docker-compose exec topics-service alembic history

# En local
alembic upgrade head
alembic revision --autogenerate -m "descripcion"
```

---

## 8. API — Documentacion completa de endpoints

**Base URL (Docker Compose):** `http://localhost:8004`  
**Base URL (producción):** según configuración del API Gateway

> La documentación interactiva Swagger está disponible en `http://localhost:8004/docs` cuando `DEBUG=true`.

Todos los endpoints de escritura requieren el header:
```
Authorization: Bearer <token_jwt>
```

Los errores siguen el formato:
```json
{
  "error": "codigo_de_error",
  "detail": "Descripción legible del error",
  "request_id": "uuid-de-correlacion"
}
```

Códigos de error posibles:

| `error` | HTTP | Situación |
|---|---|---|
| `topic_not_found` | 404 | Tópico no encontrado por ID o slug |
| `conflict` | 409 | Nombre o slug duplicado |
| `domain_error` | 422 | Regla de dominio violada (nombre inválido, ya eliminado…) |
| `internal_server_error` | 500 | Error inesperado del servidor |

---

### POST `/api/v1/topics` — Crear tópico

Crea un nuevo tópico. El slug se genera automáticamente a partir del nombre (caracteres Unicode normalizados a ASCII, espacios a guiones). Si el slug ya existe se añade un sufijo numérico (`-1`, `-2`, …).

**Auth:** JWT requerido  
**Status codes:** `201 Created` · `401 Unauthorized` · `409 Conflict` · `422 Unprocessable Entity`

**Request body**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `name` | string | Sí | Nombre del tópico (3–150 caracteres) |
| `description` | string | No | Descripción libre |
| `materia_id` | integer | Sí | ID de la materia a la que pertenece el tópico (> 0) |

**curl**
```bash
curl -X POST http://localhost:8004/api/v1/topics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "name": "Arquitectura de Software",
    "description": "Principios y patrones de diseño para sistemas escalables",
    "materia_id": 4
  }'
```

**Respuesta 201**
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "Arquitectura de Software",
  "slug": "arquitectura-de-software",
  "description": "Principios y patrones de diseño para sistemas escalables",
  "materia_id": 4,
  "is_active": true,
  "created_at": "2026-06-01T10:00:00.000Z",
  "updated_at": "2026-06-01T10:00:00.000Z"
}
```

**Respuesta 409 — nombre duplicado**
```json
{
  "error": "conflict",
  "detail": "A topic with name 'Arquitectura de Software' already exists",
  "request_id": "abc123"
}
```

**Postman**
- Method: `POST`
- URL: `{{base_url}}/api/v1/topics`
- Headers: `Authorization: Bearer {{token}}`, `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "name": "Arquitectura de Software",
  "description": "Principios y patrones de diseño para sistemas escalables",
  "materia_id": 4
}
```

---

### GET `/api/v1/topics` — Listar temas (paginado)

Devuelve todos los temas activos, ordenados por `created_at` descendente.

**Auth:** No requerido  
**Status codes:** `200 OK` · `422 Unprocessable Entity`

**Query params**

| Parámetro | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | integer | `1` | Número de página (mínimo 1) |
| `size` | integer | `20` | Elementos por página (1–100) |

**curl**
```bash
# Primera página con 10 elementos
curl "http://localhost:8004/api/v1/topics?page=1&size=10"

# Segunda página
curl "http://localhost:8004/api/v1/topics?page=2&size=10"
```

**Respuesta 200**
```json
{
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Arquitectura de Software",
      "slug": "arquitectura-de-software",
      "description": "Principios y patrones de diseño para sistemas escalables",
      "materia_id": 4,
      "is_active": true,
      "created_at": "2026-06-01T10:00:00.000Z",
      "updated_at": "2026-06-01T10:00:00.000Z"
    },
    {
      "id": "7cb95g75-6828-5673-c4gd-3d074g77bgb7",
      "name": "Bases de Datos",
      "slug": "bases-de-datos",
      "description": null,
      "materia_id": 2,
      "is_active": true,
      "created_at": "2026-05-30T08:30:00.000Z",
      "updated_at": "2026-05-30T08:30:00.000Z"
    }
  ],
  "total": 42,
  "page": 1,
  "size": 10,
  "pages": 5
}
```

**Postman**
- Method: `GET`
- URL: `{{base_url}}/api/v1/topics`
- Params: `page=1`, `size=10`

---

### GET `/api/v1/topics/{id}` — Obtener tópico por ID

**Auth:** No requerido  
**Status codes:** `200 OK` · `404 Not Found`

**Path params**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Identificador único del tópico |

**curl**
```bash
curl http://localhost:8004/api/v1/topics/3fa85f64-5717-4562-b3fc-2c963f66afa6
```

**Respuesta 200**
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "Arquitectura de Software",
  "slug": "arquitectura-de-software",
  "description": "Principios y patrones de diseño para sistemas escalables",
  "materia_id": 4,
  "is_active": true,
  "created_at": "2026-06-01T10:00:00.000Z",
  "updated_at": "2026-06-01T10:00:00.000Z"
}
```

**Respuesta 404**
```json
{
  "error": "topic_not_found",
  "detail": "Topic '3fa85f64-5717-4562-b3fc-2c963f66afa6' not found",
  "request_id": "abc123"
}
```

**Postman**
- Method: `GET`
- URL: `{{base_url}}/api/v1/topics/{{topic_id}}`

---

### GET `/api/v1/topics/slug/{slug}` — Obtener tópico por slug

Útil para rutas amigables en el frontend (ej: `/topics/arquitectura-de-software`).

**Auth:** No requerido  
**Status codes:** `200 OK` · `404 Not Found`

**Path params**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `slug` | string | Slug del tópico (ej: `arquitectura-de-software`) |

**curl**
```bash
curl http://localhost:8004/api/v1/topics/slug/arquitectura-de-software
```

**Respuesta 200** — misma estructura que GET por ID

**Respuesta 404**
```json
{
  "error": "topic_not_found",
  "detail": "Topic with slug 'slug-inexistente' not found",
  "request_id": "abc123"
}
```

**Postman**
- Method: `GET`
- URL: `{{base_url}}/api/v1/topics/slug/{{topic_slug}}`

---

### PUT `/api/v1/topics/{id}` — Actualizar tópico

Actualiza el nombre y/o la descripción de un tópico existente. Si se cambia el nombre, el slug se regenera automáticamente. Al menos uno de los dos campos debe estar presente en el body.

**Auth:** JWT requerido  
**Status codes:** `200 OK` · `401 Unauthorized` · `404 Not Found` · `409 Conflict` · `422 Unprocessable Entity`

**Path params**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Identificador único del tópico |

**Request body** (todos los campos son opcionales, pero debe enviarse al menos uno)

| Campo | Tipo | Descripción |
|---|---|---|
| `name` | string | Nuevo nombre (3–150 caracteres) |
| `description` | string\|null | Nueva descripción (null la elimina) |
| `materia_id` | integer | Nuevo ID de materia (> 0) |

**curl — actualizar solo descripción**
```bash
curl -X PUT http://localhost:8004/api/v1/topics/3fa85f64-5717-4562-b3fc-2c963f66afa6 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "description": "Patrones, principios SOLID y estilos arquitectónicos modernos"
  }'
```

**curl — actualizar nombre, descripción y materia**
```bash
curl -X PUT http://localhost:8004/api/v1/topics/3fa85f64-5717-4562-b3fc-2c963f66afa6 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "name": "Arquitectura y Diseño de Software",
    "description": "Patrones, principios SOLID y estilos arquitectónicos modernos",
    "materia_id": 5
  }'
```

**Respuesta 200**
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "Arquitectura y Diseño de Software",
  "slug": "arquitectura-y-diseno-de-software",
  "description": "Patrones, principios SOLID y estilos arquitectónicos modernos",
  "materia_id": 5,
  "is_active": true,
  "created_at": "2026-06-01T10:00:00.000Z",
  "updated_at": "2026-06-01T10:15:00.000Z"
}
```

**Postman**
- Method: `PUT`
- URL: `{{base_url}}/api/v1/topics/{{topic_id}}`
- Headers: `Authorization: Bearer {{token}}`, `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "name": "Arquitectura y Diseño de Software",
  "description": "Patrones, principios SOLID y estilos arquitectónicos modernos",
  "materia_id": 5
}
```

---

### DELETE `/api/v1/topics/{id}` — Eliminar tópico (soft-delete)

Marca el tópico como inactivo (`is_active = false`). El registro permanece en la base de datos. Los temas eliminados no aparecen en los listados.

**Auth:** JWT requerido  
**Status codes:** `204 No Content` · `401 Unauthorized` · `404 Not Found`

**Path params**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Identificador único del tópico |

**curl**
```bash
curl -X DELETE http://localhost:8004/api/v1/topics/3fa85f64-5717-4562-b3fc-2c963f66afa6 \
  -H "Authorization: Bearer <TOKEN>"
```

**Respuesta 204** — body vacío

**Respuesta 404**
```json
{
  "error": "topic_not_found",
  "detail": "Topic '3fa85f64-5717-4562-b3fc-2c963f66afa6' not found",
  "request_id": "abc123"
}
```

**Postman**
- Method: `DELETE`
- URL: `{{base_url}}/api/v1/topics/{{topic_id}}`
- Headers: `Authorization: Bearer {{token}}`

---

### Resumen de endpoints

| Método | Ruta | Auth | Status exitoso | Descripción |
|---|---|---|---|---|
| `POST` | `/api/v1/topics` | JWT | `201` | Crear tópico |
| `GET` | `/api/v1/topics` | — | `200` | Listar temas (paginado) |
| `GET` | `/api/v1/topics/{id}` | — | `200` | Obtener por UUID |
| `GET` | `/api/v1/topics/slug/{slug}` | — | `200` | Obtener por slug |
| `PUT` | `/api/v1/topics/{id}` | JWT | `200` | Actualizar |
| `DELETE` | `/api/v1/topics/{id}` | JWT | `204` | Soft-delete |
| `GET` | `/health` | — | `200` | Liveness probe |
| `GET` | `/ready` | — | `200` | Readiness probe |
| `GET` | `/metrics` | — | `200` | Métricas Prometheus |

---

## 9. Integración con otros microservicios

### Variables de entorno compartidas

El único secreto compartido entre servicios es `JWT_SECRET_KEY`. Todos los microservicios que validen tokens JWT deben usar la misma clave.

### Flujo de autenticación

```
Cliente (frontend/mobile)
  │
  ├─ POST /auth/login  ─────────────────► auth-service
  │                                            │
  │                                     genera JWT firmado
  │                                     con JWT_SECRET_KEY
  │ ◄────────────────── { token: "eyJ..." } ──┘
  │
  ├─ POST /api/v1/topics                ─────► topics-service
  │   Authorization: Bearer eyJ...               │
  │                                       valida JWT con
  │                                       la misma JWT_SECRET_KEY
  │ ◄────────────── 201 { topic } ──────────────┘
```

## 10. Testing

Se definio un archivo token-gen.py que usa la KEY de JWT para crear tokens con los que podemos probar todos los endpoints del microservicio
## 11. Health checks y observabilidad

### GET `/health` — Liveness probe

Indica que el proceso está vivo. Kubernetes lo usa para reiniciar el pod si falla.

```bash
curl http://localhost:8004/health
```
```json
{
  "status": "ok",
  "service": "topics-service",
  "version": "1.0.0"
}
```

### GET `/ready` — Readiness probe

Indica que el servicio está listo para recibir tráfico (verifica la conexión a la base de datos). Kubernetes lo usa para enrutar tráfico al pod.

```bash
curl http://localhost:8004/ready
```
```json
{
  "status": "ready",
  "database": "ok"
}
```

En caso de que la DB no esté disponible:
```json
{
  "status": "not_ready",
  "database": "unavailable"
}
```

### GET `/metrics` — Métricas Prometheus

Expone métricas en formato texto Prometheus: tiempo de uptime, conteo de requests y conteo de errores.

```bash
curl http://localhost:8004/metrics
```
```
# HELP topics_service_uptime_seconds Uptime of the topics service
# TYPE topics_service_uptime_seconds gauge
topics_service_uptime_seconds{service="topics-service"} 3612.40

# TYPE topics_http_requests_total counter
topics_http_requests_total{path="/api/v1/topics"} 1024

# TYPE topics_http_errors_total counter
topics_http_errors_total{path="/api/v1/topics"} 3
```

Las métricas de requests y errores se desglosan por `path`. Si no ha habido tráfico aún, solo aparecerá la línea de uptime.
