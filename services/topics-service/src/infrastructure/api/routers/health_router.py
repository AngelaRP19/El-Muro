from __future__ import annotations

import time

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.infrastructure.config.settings import Settings, get_settings
from src.infrastructure.persistence.database import get_db_session

router = APIRouter(tags=["observability"])

_START_TIME = time.time()
_REQUEST_COUNT: dict[str, int] = {}
_ERROR_COUNT: dict[str, int] = {}


def record_request(path: str) -> None:
    _REQUEST_COUNT[path] = _REQUEST_COUNT.get(path, 0) + 1


def record_error(path: str) -> None:
    _ERROR_COUNT[path] = _ERROR_COUNT.get(path, 0) + 1


@router.get("/health", include_in_schema=False)
async def health(settings: Settings = Depends(get_settings)) -> dict:
    return {
        "status": "ok",
        "service": settings.SERVICE_NAME,
        "version": settings.SERVICE_VERSION,
    }


@router.get("/ready", include_in_schema=False)
async def ready(session: AsyncSession = Depends(get_db_session)) -> dict:
    try:
        await session.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception:
        db_status = "unavailable"

    if db_status != "ok":
        from fastapi.responses import JSONResponse  # noqa: PLC0415

        return JSONResponse(
            status_code=503,
            content={"status": "not_ready", "database": db_status},
        )
    return {"status": "ready", "database": db_status}


@router.get("/metrics", include_in_schema=False)
async def metrics(settings: Settings = Depends(get_settings)) -> str:
    from fastapi.responses import PlainTextResponse  # noqa: PLC0415

    uptime = time.time() - _START_TIME
    lines = [
        f'# HELP topics_service_uptime_seconds Uptime of the topics service',
        f'# TYPE topics_service_uptime_seconds gauge',
        f'topics_service_uptime_seconds{{service="{settings.SERVICE_NAME}"}} {uptime:.2f}',
        "",
    ]
    for path, count in _REQUEST_COUNT.items():
        safe = path.replace("/", "_").replace("{", "").replace("}", "")
        lines += [
            f'# TYPE topics_http_requests_total counter',
            f'topics_http_requests_total{{path="{path}"}} {count}',
        ]
    for path, count in _ERROR_COUNT.items():
        lines += [
            f'# TYPE topics_http_errors_total counter',
            f'topics_http_errors_total{{path="{path}"}} {count}',
        ]

    return PlainTextResponse("\n".join(lines) + "\n", media_type="text/plain; version=0.0.4")
