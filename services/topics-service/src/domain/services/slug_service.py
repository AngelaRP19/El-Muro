from __future__ import annotations

from src.domain.repositories.topic_repository import TopicRepository
from src.domain.value_objects.topic_slug import TopicSlug


class SlugUniquenessService:
    """Verifies slug uniqueness across the repository, appending a numeric suffix when needed."""

    def __init__(self, repository: TopicRepository) -> None:
        self._repository = repository

    async def ensure_unique(self, base_slug: TopicSlug, exclude_id=None) -> TopicSlug:
        candidate = base_slug
        counter = 1
        while True:
            existing = await self._repository.find_by_slug(candidate.value)
            if existing is None:
                return candidate
            if exclude_id is not None and str(existing.id) == str(exclude_id):
                return candidate
            candidate = TopicSlug.create(f"{base_slug.value}-{counter}")
            counter += 1
