from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class CreateTopicDTO(BaseModel):
    name: str = Field(..., min_length=3, max_length=150)
    description: Optional[str] = None


class UpdateTopicDTO(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=150)
    description: Optional[str] = None


class TopicResponseDTO(BaseModel):
    id: UUID
    name: str
    slug: str
    description: Optional[str]
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
