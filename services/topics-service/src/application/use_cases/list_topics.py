from __future__ import annotations

import math

from src.application.dtos.topic_dtos import PaginatedTopicsDTO, TopicResponseDTO
from src.domain.entities.topic import Topic
from src.domain.repositories.topic_repository import TopicRepository


class ListTopicsUseCase:
    def __init__(self, repository: TopicRepository) -> None:
        self._repository = repository

    async def execute(self, page: int, size: int) -> PaginatedTopicsDTO:
        topics, total = await self._repository.find_all(page=page, size=size)
        pages = math.ceil(total / size) if total > 0 else 0
        return PaginatedTopicsDTO(
            data=[_to_dto(t) for t in topics],
            total=total,
            page=page,
            size=size,
            pages=pages,
        )


def _to_dto(topic: Topic) -> TopicResponseDTO:
    return TopicResponseDTO(
        id=topic.id.value,
        name=topic.name.value,
        slug=topic.slug.value,
        description=topic.description,
        materia_id=topic.materia_id,
        is_active=topic.is_active,
        created_at=topic.created_at,
        updated_at=topic.updated_at,
    )
