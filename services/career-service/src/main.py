from contextlib import asynccontextmanager
import logging

import py_eureka_client.eureka_client as eureka_client
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.infrastructure.adapters.http import career_router
from src.infrastructure.adapters.persistence import CareerSqlAlchemyModel
from src.infrastructure.config import get_settings
from src.infrastructure.config.database import Base, engine

settings = get_settings()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.eureka_enabled:
        try:
            eureka_client.init(
                eureka_server=settings.eureka_server,
                app_name=settings.service_name,
                instance_port=settings.service_port,
            )
        except Exception as exc:
            logger.warning("No fue posible registrar el servicio en Eureka: %s", str(exc))

    Base.metadata.create_all(bind=engine)
    logger.info("Base de datos inicializada")
    yield

    if settings.eureka_enabled:
        try:
            eureka_client.stop()
        except Exception as exc:
            logger.warning("No fue posible detener el cliente Eureka: %s", str(exc))


app = FastAPI(
    title="Career Service",
    description="Microservicio de gestion de carreras para El Muro",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(career_router.router)


@app.get("/")
def root():
    return {
        "service": settings.service_name,
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/health")
def health_check():
    return {
        "service": settings.service_name,
        "status": "healthy",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=settings.service_port)

