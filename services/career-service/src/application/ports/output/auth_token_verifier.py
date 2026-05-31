from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass(frozen=True)
class AuthenticatedUser:
    user_id: str
    role: str


class AuthTokenVerifier(ABC):
    @abstractmethod
    def verify(self, token: str) -> AuthenticatedUser:
        raise NotImplementedError
