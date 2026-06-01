from __future__ import annotations

from src.application.dtos.topic_dtos import TopicResponseDTO
from src.domain.entities.topic import Topic
from src.domain.exceptions.topic_exceptions import TopicNotFoundBySlugError
from src.domain.repositories.topic_repository import TopicRepository


class GetTopicBySlugUseCase:
    def __init__(self, repository: TopicRepository) -> None:
        self._repository = repository

    async def execute(self, slug: str) -> TopicResponseDTO:
        topic = await self._repository.find_by_slug(slug)
        if topic is None:
            raise TopicNotFoundBySlugError(slug)
        return _to_dto(topic)


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
