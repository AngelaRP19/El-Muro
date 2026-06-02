from abc import ABC, abstractmethod
from typing import Any


class SubjectClient(ABC):
    @abstractmethod
    def get_subjects_by_career(self, career_id: int) -> list[Any]:
        raise NotImplementedError

    @abstractmethod
    def delete_subjects_by_career(self, career_id: int) -> bool:
        raise NotImplementedError
