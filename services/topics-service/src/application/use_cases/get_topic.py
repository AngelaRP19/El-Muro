from __future__ import annotations

from uuid import UUID

from src.application.dtos.topic_dtos import TopicResponseDTO
from src.domain.entities.topic import Topic
from src.domain.exceptions.topic_exceptions import TopicNotFoundError
from src.domain.repositories.topic_repository import TopicRepository


class GetTopicUseCase:
    def __init__(self, repository: TopicRepository) -> None:
        self._repository = repository

    async def execute(self, topic_id: UUID) -> TopicResponseDTO:
        topic = await self._repository.find_by_id(topic_id)
        if topic is None:
            raise TopicNotFoundError(topic_id)
        return _to_dto(topic)


def _to_dto(topic: Topic) -> TopicResponseDTO:
    return TopicResponseDTO(
        id=topic.id.value,
        name=topic.name.value,
        slug=topic.slug.value,
        description=topic.description,
        is_active=topic.is_active,
        created_at=topic.created_at,
        updated_at=topic.updated_at,
    )
