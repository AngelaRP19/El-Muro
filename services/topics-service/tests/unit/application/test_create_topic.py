from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest

from src.application.dtos.topic_dtos import CreateTopicDTO
from src.application.use_cases.create_topic import CreateTopicUseCase
from src.domain.exceptions.topic_exceptions import DuplicateTopicNameError
from src.domain.services.slug_service import SlugUniquenessService
from src.domain.value_objects.topic_slug import TopicSlug


@pytest.fixture
def mock_repo():
    repo = AsyncMock()
    repo.find_by_name.return_value = None
    repo.find_by_slug.return_value = None
    repo.save.return_value = None
    return repo


@pytest.fixture
def mock_slug_service(mock_repo):
    svc = AsyncMock(spec=SlugUniquenessService)
    svc.ensure_unique.side_effect = lambda slug, **_: slug
    return svc


@pytest.mark.asyncio
async def test_create_topic_success(mock_repo, mock_slug_service):
    use_case = CreateTopicUseCase(mock_repo, mock_slug_service)
    dto = CreateTopicDTO(name="Python", description="A language")
    result = await use_case.execute(dto)
    assert result.name == "Python"
    assert result.slug == "python"
    assert result.is_active is True
    mock_repo.save.assert_awaited_once()


@pytest.mark.asyncio
async def test_create_topic_duplicate_name_raises(mock_repo, mock_slug_service):
    from src.domain.entities.topic import Topic
    mock_repo.find_by_name.return_value = Topic.create(name="Python")
    use_case = CreateTopicUseCase(mock_repo, mock_slug_service)
    dto = CreateTopicDTO(name="Python")
    with pytest.raises(DuplicateTopicNameError):
        await use_case.execute(dto)
    mock_repo.save.assert_not_awaited()
