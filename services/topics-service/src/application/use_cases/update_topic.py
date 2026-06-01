from __future__ import annotations

from uuid import UUID

from src.application.dtos.topic_dtos import TopicResponseDTO, UpdateTopicDTO
from src.domain.entities.topic import Topic
from src.domain.exceptions.topic_exceptions import (
    DuplicateTopicNameError,
    TopicNotFoundError,
)
from src.domain.repositories.topic_repository import TopicRepository
from src.domain.services.slug_service import SlugUniquenessService


class UpdateTopicUseCase:
    def __init__(
        self,
        repository: TopicRepository,
        slug_service: SlugUniquenessService,
    ) -> None:
        self._repository = repository
        self._slug_service = slug_service

    async def execute(self, topic_id: UUID, dto: UpdateTopicDTO) -> TopicResponseDTO:
        topic = await self._repository.find_by_id(topic_id)
        if topic is None:
            raise TopicNotFoundError(topic_id)

        if dto.name is not None and dto.name != topic.name.value:
            existing = await self._repository.find_by_name(dto.name)
            if existing is not None and existing.id.value != topic_id:
                raise DuplicateTopicNameError(dto.name)

        topic.update(name=dto.name, description=dto.description)

        if dto.name is not None:
            unique_slug = await self._slug_service.ensure_unique(
                topic.slug, exclude_id=topic.id.value
            )
            if unique_slug.value != topic.slug.value:
                topic._slug = unique_slug  # noqa: SLF001

        await self._repository.save(topic)
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
