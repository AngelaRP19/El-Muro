from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, Index, Integer, String, Text

from src.infrastructure.config.database import Base


def utc_now() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class CareerSqlAlchemyModel(Base):
    __tablename__ = "carreras"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), unique=True, nullable=False, index=True)
    descripcion = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    __table_args__ = (Index("idx_carrera_nombre", "nombre"),)
