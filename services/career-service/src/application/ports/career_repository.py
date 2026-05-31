from abc import ABC, abstractmethod
from typing import Optional

from src.domain.models import Career


class CareerRepository(ABC):
    @abstractmethod
    def create(self, career: Career) -> Career:
        raise NotImplementedError

    @abstractmethod
    def find_by_id(self, career_id: int) -> Optional[Career]:
        raise NotImplementedError

    @abstractmethod
    def find_by_name_case_insensitive(self, nombre: str) -> Optional[Career]:
        raise NotImplementedError

    @abstractmethod
    def list(self, skip: int = 0, limit: int = 100) -> list[Career]:
        raise NotImplementedError

    @abstractmethod
    def update(self, career: Career) -> Career:
        raise NotImplementedError

    @abstractmethod
    def delete(self, career: Career) -> None:
        raise NotImplementedError

    @abstractmethod
    def count(self) -> int:
        raise NotImplementedError

