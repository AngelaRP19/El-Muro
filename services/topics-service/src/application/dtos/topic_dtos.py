from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class CreateTopicDTO(BaseModel):
    name: str = Field(..., min_length=3, max_length=150)
    description: Optional[str] = None
    materia_id: int = Field(..., gt=0)


class UpdateTopicDTO(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=150)
    description: Optional[str] = None
    materia_id: Optional[int] = Field(None, gt=0)


class TopicResponseDTO(BaseModel):
    id: UUID
    name: str
    slug: str
    description: Optional[str]
    materia_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PaginatedTopicsDTO(BaseModel):
    data: list[TopicResponseDTO]
    total: int
    page: int
    size: int
    pages: int
