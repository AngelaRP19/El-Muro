from __future__ import annotations

from unittest.mock import AsyncMock

import pytest

from src.application.use_cases.list_topics import ListTopicsUseCase
from src.domain.entities.topic import Topic


@pytest.fixture
def mock_repo():
    return AsyncMock()


@pytest.mark.asyncio
async def test_list_topics_returns_paginated(mock_repo):
    topics = [Topic.create(name=f"Topic {i}") for i in range(3)]
    mock_repo.find_all.return_value = (topics, 3)
    use_case = ListTopicsUseCase(mock_repo)
    result = await use_case.execute(page=1, size=20)
    assert result.total == 3
    assert result.pages == 1
    assert len(result.data) == 3


@pytest.mark.asyncio
async def test_list_topics_empty(mock_repo):
    mock_repo.find_all.return_value = ([], 0)
    use_case = ListTopicsUseCase(mock_repo)
    result = await use_case.execute(page=1, size=20)
    assert result.total == 0
    assert result.pages == 0
    assert result.data == []


@pytest.mark.asyncio
async def test_list_topics_pagination_math(mock_repo):
    topics = [Topic.create(name=f"Topic {i}") for i in range(5)]
    mock_repo.find_all.return_value = (topics, 25)
    use_case = ListTopicsUseCase(mock_repo)
    result = await use_case.execute(page=2, size=5)
    assert result.pages == 5
    assert result.page == 2
