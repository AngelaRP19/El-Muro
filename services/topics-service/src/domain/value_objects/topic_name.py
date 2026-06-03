from __future__ import annotations

from dataclasses import dataclass

from src.domain.exceptions.topic_exceptions import InvalidTopicNameError

_MIN_LENGTH = 3
_MAX_LENGTH = 150


@dataclass(frozen=True)
class TopicName:
    value: str

    def __post_init__(self) -> None:
        stripped = self.value.strip() if self.value else ""
        if len(stripped) < _MIN_LENGTH:
            raise InvalidTopicNameError(
                f"must be at least {_MIN_LENGTH} characters (got {len(stripped)})"
            )
        if len(stripped) > _MAX_LENGTH:
            raise InvalidTopicNameError(
                f"must be at most {_MAX_LENGTH} characters (got {len(stripped)})"
            )
        object.__setattr__(self, "value", stripped)

    @classmethod
    def create(cls, raw: str) -> TopicName:
        return cls(value=raw)

    def __str__(self) -> str:
        return self.value
