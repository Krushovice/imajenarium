from __future__ import annotations

import uuid
from typing import Any, Generic, TypeVar

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import BaseModel
from app.repositories.exceptions import EntityNotFoundError

ModelT = TypeVar("ModelT", bound=BaseModel)


class BaseRepository(Generic[ModelT]):
    model: type[ModelT]

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    async def get(self, id: uuid.UUID) -> ModelT | None:
        return await self.session.get(self.model, id)

    async def get_or_raise(self, id: uuid.UUID) -> ModelT:
        obj = await self.get(id)
        if obj is None:
            raise EntityNotFoundError(self.model.__name__, id)
        return obj

    async def list(self, *, offset: int = 0, limit: int = 100) -> list[ModelT]:
        result = await self.session.execute(
            select(self.model).offset(offset).limit(limit)
        )
        return list(result.scalars().all())

    async def count(self) -> int:
        result = await self.session.execute(
            select(func.count()).select_from(self.model)
        )
        return result.scalar_one()

    async def exists(self, id: uuid.UUID) -> bool:
        result = await self.session.execute(
            select(func.count()).select_from(self.model).where(self.model.id == id)
        )
        return result.scalar_one() > 0

    # ------------------------------------------------------------------
    # Write  (callers commit via the session — see core/database.py get_db)
    # ------------------------------------------------------------------

    async def create(self, data: dict[str, Any]) -> ModelT:
        obj = self.model(**data)
        self.session.add(obj)
        await self.session.flush()
        await self.session.refresh(obj)
        return obj

    async def update(self, obj: ModelT, data: dict[str, Any]) -> ModelT:
        for key, value in data.items():
            setattr(obj, key, value)
        self.session.add(obj)
        await self.session.flush()
        await self.session.refresh(obj)
        return obj

    async def delete(self, obj: ModelT) -> None:
        await self.session.delete(obj)
        await self.session.flush()
