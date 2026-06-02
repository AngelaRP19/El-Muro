from __future__ import annotations

import uuid
from dataclasses import dataclass


@dataclass(frozen=True)
class TopicId:
    value: uuid.UUID

    def __post_init__(self) -> None:
        if not isinstance(self.value, uuid.UUID):
            raise TypeError("TopicId value must be a UUID instance")

    @classmethod
    def generate(cls) -> TopicId:
        return cls(value=uuid.uuid4())

    @classmethod
    def from_string(cls, raw: str) -> TopicId:
        try:
            return cls(value=uuid.UUID(raw))
        except ValueError as exc:
            raise ValueError(f"Invalid UUID for TopicId: '{raw}'") from exc

    def __str__(self) -> str:
        return str(self.value)
