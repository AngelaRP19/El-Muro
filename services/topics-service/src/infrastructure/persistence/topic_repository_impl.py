from __future__ import annotations

from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.topic import Topic
from src.domain.repositories.topic_repository import TopicRepository
from src.domain.value_objects.topic_id import TopicId
from src.domain.value_objects.topic_name import TopicName
from src.domain.value_objects.topic_slug import TopicSlug
from src.infrastructure.persistence.models import TopicModel


class SQLAlchemyTopicRepository(TopicRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def save(self, topic: Topic) -> None:
        result = await self._session.get(TopicModel, topic.id.value)
        if result is None:
            model = TopicModel(
                id=topic.id.value,
                name=topic.name.value,
                slug=topic.slug.value,
                description=topic.description,
                materia_id=topic.materia_id,
                is_active=topic.is_active,
                created_at=topic.created_at,
                updated_at=topic.updated_at,
            )
            self._session.add(model)
        else:
            result.name = topic.name.value
            result.slug = topic.slug.value
            result.description = topic.description
            result.materia_id = topic.materia_id
            result.is_active = topic.is_active
            result.updated_at = topic.updated_at

    async def find_by_id(self, topic_id: UUID) -> Optional[Topic]:
        model = await self._session.get(TopicModel, topic_id)
        if model is None:
            return None
        return _to_domain(model)

    async def find_by_slug(self, slug: str) -> Optional[Topic]:
        stmt = select(TopicModel).where(TopicModel.slug == slug)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        return _to_domain(model) if model else None

    async def find_by_name(self, name: str) -> Optional[Topic]:
        stmt = select(TopicModel).where(TopicModel.name == name)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        return _to_domain(model) if model else None

    async def find_all(
        self,
        page: int,
        size: int,
        active_only: bool = True,
    ) -> tuple[list[Topic], int]:
        base_stmt = select(TopicModel)
        count_stmt = select(func.count()).select_from(TopicModel)
        if active_only:
            base_stmt = base_stmt.where(TopicModel.is_active.is_(True))
            count_stmt = count_stmt.where(TopicModel.is_active.is_(True))

        count_result = await self._session.execute(count_stmt)
        total: int = count_result.scalar_one()

        offset = (page - 1) * size
        stmt = base_stmt.order_by(TopicModel.created_at.desc()).offset(offset).limit(size)
        result = await self._session.execute(stmt)
        models = result.scalars().all()
        return [_to_domain(m) for m in models], total

    async def delete(self, topic: Topic) -> None:
        model = await self._session.get(TopicModel, topic.id.value)
        if model is not None:
            await self._session.delete(model)


def _to_domain(model: TopicModel) -> Topic:
    return Topic.reconstitute(
        id=TopicId(value=model.id),
        name=TopicName(value=model.name),
        slug=TopicSlug(value=model.slug),
        description=model.description,
        materia_id=model.materia_id,
        is_active=model.is_active,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )
