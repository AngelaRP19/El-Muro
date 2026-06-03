from __future__ import annotations

from uuid import UUID

from src.domain.exceptions.topic_exceptions import TopicNotFoundError
from src.domain.repositories.topic_repository import TopicRepository


class DeleteTopicUseCase:
    def __init__(self, repository: TopicRepository) -> None:
        self._repository = repository

    async def execute(self, topic_id: UUID) -> None:
        topic = await self._repository.find_by_id(topic_id)
        if topic is None:
            raise TopicNotFoundError(topic_id)
        topic.delete()
        await self._repository.save(topic)
