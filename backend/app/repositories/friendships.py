from __future__ import annotations

import uuid

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import FriendshipStatus
from app.models.friendships import Friendship
from app.models.users import User
from app.repositories.base import BaseRepository


class FriendshipRepository(BaseRepository[Friendship]):
    model = Friendship

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_pair(
        self, user_a: uuid.UUID, user_b: uuid.UUID
    ) -> Friendship | None:
        """Finds friendship regardless of direction."""
        result = await self.session.execute(
            select(Friendship).where(
                or_(
                    (Friendship.requester_id == user_a) & (Friendship.addressee_id == user_b),
                    (Friendship.requester_id == user_b) & (Friendship.addressee_id == user_a),
                )
            )
        )
        return result.scalar_one_or_none()

    async def get_friends(self, user_id: uuid.UUID) -> list[User]:
        """Returns User objects for all accepted friends."""
        sent = await self.session.execute(
            select(User)
            .join(Friendship, Friendship.addressee_id == User.id)
            .where(
                Friendship.requester_id == user_id,
                Friendship.status == FriendshipStatus.ACCEPTED,
            )
        )
        received = await self.session.execute(
            select(User)
            .join(Friendship, Friendship.requester_id == User.id)
            .where(
                Friendship.addressee_id == user_id,
                Friendship.status == FriendshipStatus.ACCEPTED,
            )
        )
        return list(sent.scalars().all()) + list(received.scalars().all())

    async def get_pending_received(self, user_id: uuid.UUID) -> list[Friendship]:
        result = await self.session.execute(
            select(Friendship)
            .where(
                Friendship.addressee_id == user_id,
                Friendship.status == FriendshipStatus.PENDING,
            )
            .options(selectinload(Friendship.requester))
            .order_by(Friendship.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_all_for_user(self, user_id: uuid.UUID) -> list[Friendship]:
        result = await self.session.execute(
            select(Friendship).where(
                or_(
                    Friendship.requester_id == user_id,
                    Friendship.addressee_id == user_id,
                )
            )
        )
        return list(result.scalars().all())
