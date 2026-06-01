from __future__ import annotations

from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from src.application.dtos.topic_dtos import UpdateTopicDTO
from src.application.use_cases.update_topic import UpdateTopicUseCase
from src.domain.entities.topic import Topic
from src.domain.exceptions.topic_exceptions import DuplicateTopicNameError, TopicNotFoundError
from src.domain.services.slug_service import SlugUniquenessService


@pytest.fixture
def existing_topic():
    return Topic.create(name="Original Name")


@pytest.fixture
def mock_repo(existing_topic):
    repo = AsyncMock()
    repo.find_by_id.return_value = existing_topic
    repo.find_by_name.return_value = None
    repo.save.return_value = None
    return repo


@pytest.fixture
def mock_slug_service():
    svc = AsyncMock(spec=SlugUniquenessService)
    svc.ensure_unique.side_effect = lambda slug, **_: slug
    return svc


@pytest.mark.asyncio
async def test_update_topic_name(mock_repo, mock_slug_service):
    use_case = UpdateTopicUseCase(mock_repo, mock_slug_service)
    dto = UpdateTopicDTO(name="New Name")
    result = await use_case.execute(uuid4(), dto)
    assert result.name == "New Name"
    assert result.slug == "new-name"


@pytest.mark.asyncio
async def test_update_not_found_raises(mock_repo, mock_slug_service):
    mock_repo.find_by_id.return_value = None
    use_case = UpdateTopicUseCase(mock_repo, mock_slug_service)
    with pytest.raises(TopicNotFoundError):
        await use_case.execute(uuid4(), UpdateTopicDTO(name="X" * 10))


@pytest.mark.asyncio
async def test_update_duplicate_name_raises(mock_repo, mock_slug_service, existing_topic):
    other = Topic.create(name="Taken Name")
    mock_repo.find_by_name.return_value = other
    use_case = UpdateTopicUseCase(mock_repo, mock_slug_service)
    with pytest.raises(DuplicateTopicNameError):
        await use_case.execute(uuid4(), UpdateTopicDTO(name="Taken Name"))
