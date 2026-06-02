from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CareerBaseDTO(BaseModel):
    nombre: str = Field(..., min_length=3, max_length=255, examples=["Ingenieria de Sistemas"])
    descripcion: Optional[str] = Field(None, max_length=1000, examples=["Descripcion de la carrera"])


class CareerCreateDTO(CareerBaseDTO):
    pass


class CareerUpdateDTO(BaseModel):
    nombre: Optional[str] = Field(None, min_length=3, max_length=255)
    descripcion: Optional[str] = Field(None, max_length=1000)


class CareerResponseDTO(CareerBaseDTO):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SubjectResponseDTO(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None
    semestre: int
    carrera_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class CareerDetailResponseDTO(CareerResponseDTO):
    materias: list[SubjectResponseDTO] = []


class CareerDeleteResponseDTO(BaseModel):
    message: str
    deleted_carrera_id: int

