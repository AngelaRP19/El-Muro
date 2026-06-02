from __future__ import annotations

import logging
import signal

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.infrastructure.api.exception_handlers import register_exception_handlers
from src.infrastructure.api.middleware import CorrelationMiddleware
from src.infrastructure.api.routers.health_router import router as health_router
from src.infrastructure.api.routers.topics_router import router as topics_router
from src.infrastructure.config.settings import get_settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="Topics Service",
        version=settings.SERVICE_VERSION,
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        openapi_url="/openapi.json" if settings.DEBUG else None,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(CorrelationMiddleware)

    register_exception_handlers(app)

    app.include_router(health_router)
    app.include_router(topics_router)

    @app.on_event("startup")
    async def on_startup() -> None:
        logger.info("Starting %s v%s", settings.SERVICE_NAME, settings.SERVICE_VERSION)

    @app.on_event("shutdown")
    async def on_shutdown() -> None:
        logger.info("Shutting down %s", settings.SERVICE_NAME)

    return app


app = create_app()


if __name__ == "__main__":
    settings = get_settings()

    def _handle_sigterm(signum, frame):  # noqa: ANN001
        raise SystemExit(0)

    signal.signal(signal.SIGTERM, _handle_sigterm)

    uvicorn.run(
        "src.infrastructure.api.app:app",
        host=settings.HOST,
        port=settings.PORT,
        workers=settings.WORKERS,
        timeout_graceful_shutdown=settings.GRACEFUL_SHUTDOWN_TIMEOUT,
        log_level="info",
    )
