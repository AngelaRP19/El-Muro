from abc import ABC, abstractmethod

from src.application.dtos import CareerCreateDTO, CareerUpdateDTO
from src.domain.models import Career


class CareerManagementInputPort(ABC):
    @abstractmethod
    def create_career(self, career_data: CareerCreateDTO) -> Career:
        raise NotImplementedError

    @abstractmethod
    def get_career_by_id(self, career_id: int) -> dict:
        raise NotImplementedError

    @abstractmethod
    def list_careers(self, skip: int = 0, limit: int = 100) -> list[Career]:
        raise NotImplementedError

    @abstractmethod
    def update_career(self, career_id: int, career_data: CareerUpdateDTO) -> Career:
        raise NotImplementedError

    @abstractmethod
    def delete_career(self, career_id: int) -> dict:
        raise NotImplementedError

    @abstractmethod
    def career_exists(self, career_id: int) -> bool:
        raise NotImplementedError

    @abstractmethod
    def get_career_count(self) -> int:
        raise NotImplementedError
