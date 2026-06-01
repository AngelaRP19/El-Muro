from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from src.domain.exceptions.topic_exceptions import TopicAlreadyDeletedError
from src.domain.value_objects.topic_id import TopicId
from src.domain.value_objects.topic_name import TopicName
from src.domain.value_objects.topic_slug import TopicSlug


class Topic:
    def __init__(
        self,
        id: TopicId,
        name: TopicName,
        slug: TopicSlug,
        description: Optional[str],
        is_active: bool,
        created_at: datetime,
        updated_at: datetime,
    ) -> None:
        self._id = id
        self._name = name
        self._slug = slug
        self._description = description
        self._is_active = is_active
        self._created_at = created_at
        self._updated_at = updated_at

    # ── Factory ──────────────────────────────────────────────────────────────

    @classmethod
    def create(
        cls,
        name: str,
        description: Optional[str] = None,
    ) -> Topic:
        now = datetime.now(timezone.utc)
        topic_name = TopicName.create(name)
        topic_slug = TopicSlug.from_name(name)
        return cls(
            id=TopicId.generate(),
            name=topic_name,
            slug=topic_slug,
            description=description,
            is_active=True,
            created_at=now,
            updated_at=now,
        )

    @classmethod
    def reconstitute(
        cls,
        id: TopicId,
        name: TopicName,
        slug: TopicSlug,
        description: Optional[str],
        is_active: bool,
        created_at: datetime,
        updated_at: datetime,
    ) -> Topic:
        return cls(
            id=id,
            name=name,
            slug=slug,
            description=description,
            is_active=is_active,
            created_at=created_at,
            updated_at=updated_at,
        )

    # ── Properties ───────────────────────────────────────────────────────────

    @property
    def id(self) -> TopicId:
        return self._id

    @property
    def name(self) -> TopicName:
        return self._name

    @property
    def slug(self) -> TopicSlug:
        return self._slug

    @property
    def description(self) -> Optional[str]:
        return self._description

    @property
    def is_active(self) -> bool:
        return self._is_active

    @property
    def created_at(self) -> datetime:
        return self._created_at

    @property
    def updated_at(self) -> datetime:
        return self._updated_at

    # ── Business operations ───────────────────────────────────────────────────

    def update(
        self,
        name: Optional[str] = None,
        description: Optional[str] = None,
    ) -> None:
        if not self._is_active:
            raise TopicAlreadyDeletedError(self._id.value)
        if name is not None:
            new_name = TopicName.create(name)
            new_slug = TopicSlug.from_name(name)
            self._name = new_name
            self._slug = new_slug
        if description is not None:
            self._description = description
        self._updated_at = datetime.now(timezone.utc)

    def delete(self) -> None:
        if not self._is_active:
            raise TopicAlreadyDeletedError(self._id.value)
        self._is_active = False
        self._updated_at = datetime.now(timezone.utc)
