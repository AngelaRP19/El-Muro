from __future__ import annotations

from src.application.dtos.topic_dtos import CreateTopicDTO, TopicResponseDTO
from src.domain.entities.topic import Topic
from src.domain.exceptions.topic_exceptions import DuplicateTopicNameError
from src.domain.repositories.topic_repository import TopicRepository
from src.domain.services.slug_service import SlugUniquenessService
from src.domain.value_objects.topic_slug import TopicSlug


class CreateTopicUseCase:
    def __init__(
        self,
        repository: TopicRepository,
        slug_service: SlugUniquenessService,
    ) -> None:
        self._repository = repository
        self._slug_service = slug_service

    async def execute(self, dto: CreateTopicDTO) -> TopicResponseDTO:
        existing = await self._repository.find_by_name(dto.name)
        if existing is not None:
            raise DuplicateTopicNameError(dto.name)

        topic = Topic.create(name=dto.name, description=dto.description)

        unique_slug = await self._slug_service.ensure_unique(topic.slug)
        if unique_slug.value != topic.slug.value:
            # Replace slug without mutating domain invariants
            from src.domain.value_objects.topic_slug import TopicSlug  # noqa: PLC0415
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
