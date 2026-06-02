from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.application.dtos.topic_dtos import (
    CreateTopicDTO,
    PaginatedTopicsDTO,
    TopicResponseDTO,
    UpdateTopicDTO,
)
from src.application.use_cases.create_topic import CreateTopicUseCase
from src.application.use_cases.delete_topic import DeleteTopicUseCase
from src.application.use_cases.get_topic import GetTopicUseCase
from src.application.use_cases.get_topic_by_slug import GetTopicBySlugUseCase
from src.application.use_cases.list_topics import ListTopicsUseCase
from src.application.use_cases.update_topic import UpdateTopicUseCase
from src.domain.services.slug_service import SlugUniquenessService
from src.infrastructure.persistence.database import get_db_session
from src.infrastructure.persistence.topic_repository_impl import SQLAlchemyTopicRepository
from src.infrastructure.security.jwt_validator import get_current_user

router = APIRouter(prefix="/api/v1/topics", tags=["topics"])


def _repo(session: AsyncSession) -> SQLAlchemyTopicRepository:
    return SQLAlchemyTopicRepository(session)


def _slug_svc(session: AsyncSession) -> SlugUniquenessService:
    return SlugUniquenessService(_repo(session))


@router.post("", response_model=TopicResponseDTO, status_code=status.HTTP_201_CREATED)
async def create_topic(
    dto: CreateTopicDTO,
    session: AsyncSession = Depends(get_db_session),
    _user: dict[str, Any] = Depends(get_current_user),
) -> TopicResponseDTO:
    use_case = CreateTopicUseCase(_repo(session), _slug_svc(session))
    return await use_case.execute(dto)


@router.get("", response_model=PaginatedTopicsDTO)
async def list_topics(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    session: AsyncSession = Depends(get_db_session),
) -> PaginatedTopicsDTO:
    use_case = ListTopicsUseCase(_repo(session))
    return await use_case.execute(page=page, size=size)


@router.get("/slug/{slug}", response_model=TopicResponseDTO)
async def get_topic_by_slug(
    slug: str,
    session: AsyncSession = Depends(get_db_session),
) -> TopicResponseDTO:
    use_case = GetTopicBySlugUseCase(_repo(session))
    return await use_case.execute(slug)


@router.get("/{topic_id}", response_model=TopicResponseDTO)
async def get_topic(
    topic_id: UUID,
    session: AsyncSession = Depends(get_db_session),
) -> TopicResponseDTO:
    use_case = GetTopicUseCase(_repo(session))
    return await use_case.execute(topic_id)


@router.put("/{topic_id}", response_model=TopicResponseDTO)
async def update_topic(
    topic_id: UUID,
    dto: UpdateTopicDTO,
    session: AsyncSession = Depends(get_db_session),
    _user: dict[str, Any] = Depends(get_current_user),
) -> TopicResponseDTO:
    use_case = UpdateTopicUseCase(_repo(session), _slug_svc(session))
    return await use_case.execute(topic_id, dto)


@router.delete("/{topic_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_topic(
    topic_id: UUID,
    session: AsyncSession = Depends(get_db_session),
    _user: dict[str, Any] = Depends(get_current_user),
) -> None:
    use_case = DeleteTopicUseCase(_repo(session))
    await use_case.execute(topic_id)
