from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://usuario:password@127.0.0.1:5434/carreras_db"

    service_name: str = "career-service"
    service_port: int = 8001
    environment: str = "development"

    eureka_enabled: bool = True
    eureka_server: str = "http://127.0.0.1:8761/eureka/"

    jwt_secret: str = "default-secret"
    secret_key: Optional[str] = None
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    allowed_origins: str = "http://localhost:3000,http://localhost:5173"
    materias_service_url: str = "http://materias-service:8002"

    def __init__(self, **data):
        super().__init__(**data)
        if not self.secret_key:
            self.secret_key = self.jwt_secret

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    model_config = {
        "env_file": ".env",
        "case_sensitive": False,
        "extra": "ignore",
    }


@lru_cache()
def get_settings() -> Settings:
    return Settings()
