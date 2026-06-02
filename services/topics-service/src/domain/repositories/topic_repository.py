from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID


class TopicRepository(ABC):
    @abstractmethod
    async def save(self, topic) -> None: ...

    @abstractmethod
    async def find_by_id(self, topic_id: UUID): ...

    @abstractmethod
    async def find_by_slug(self, slug: str): ...

    @abstractmethod
    async def find_by_name(self, name: str): ...

    @abstractmethod
    async def find_all(
        self,
        page: int,
        size: int,
        active_only: bool = True,
    ) -> tuple[list, int]: ...

    @abstractmethod
    async def delete(self, topic) -> None: ...
