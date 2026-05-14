from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum, Float, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.enums import FriendshipStatus

if TYPE_CHECKING:
    from app.models.users import User


class Friendship(BaseModel):
    __tablename__ = "friendships"
    __table_args__ = (
        UniqueConstraint("requester_id", "addressee_id", name="uq_friendships_pair"),
    )

    requester_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    addressee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[FriendshipStatus] = mapped_column(
        Enum(FriendshipStatus, name="friendshipstatus"),
        nullable=False,
        server_default=FriendshipStatus.PENDING.value,
    )
    literary_compatibility_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    requester: Mapped[User] = relationship(
        "User", foreign_keys=[requester_id], back_populates="sent_friendships"
    )
    addressee: Mapped[User] = relationship(
        "User", foreign_keys=[addressee_id], back_populates="received_friendships"
    )
