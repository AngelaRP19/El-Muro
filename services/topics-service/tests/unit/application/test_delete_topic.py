from __future__ import annotations

from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from src.application.use_cases.delete_topic import DeleteTopicUseCase
from src.domain.entities.topic import Topic
from src.domain.exceptions.topic_exceptions import TopicNotFoundError


@pytest.fixture
def mock_repo():
    repo = AsyncMock()
    repo.find_by_id.return_value = Topic.create(name="Topic to delete")
    repo.save.return_value = None
    return repo


@pytest.mark.asyncio
async def test_delete_topic_success(mock_repo):
    use_case = DeleteTopicUseCase(mock_repo)
    await use_case.execute(uuid4())
    saved: Topic = mock_repo.save.call_args[0][0]
    assert saved.is_active is False


@pytest.mark.asyncio
async def test_delete_not_found_raises(mock_repo):
    mock_repo.find_by_id.return_value = None
    use_case = DeleteTopicUseCase(mock_repo)
    with pytest.raises(TopicNotFoundError):
        await use_case.execute(uuid4())
