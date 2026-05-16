from __future__ import annotations

import logging
import uuid

from app.ai.tasks.social import SocialAIService
from app.models.enums import BookStatus, FriendshipStatus
from app.models.friendships import Friendship
from app.models.users import User
from app.repositories.friendships import FriendshipRepository
from app.repositories.literary_dna import LiteraryDNARepository
from app.repositories.user_books import UserBookRepository
from app.repositories.users import UserRepository
from app.schemas.social import (
    CompatibilityResult,
    FriendOut,
    FriendWithCompatibility,
    JourneyStep,
    ReadingJourneyResponse,
    SharedBookRecommendation,
    SharedRecommendationsResponse,
)

logger = logging.getLogger(__name__)


class SocialService:
    def __init__(
        self,
        friendship_repo: FriendshipRepository,
        user_repo: UserRepository,
        dna_repo: LiteraryDNARepository,
        user_book_repo: UserBookRepository,
        ai: SocialAIService,
    ) -> None:
        self._friendships = friendship_repo
        self._users = user_repo
        self._dna = dna_repo
        self._user_books = user_book_repo
        self._ai = ai

    # ------------------------------------------------------------------
    # 8.1 — Friend system
    # ------------------------------------------------------------------

    async def send_friend_request(
        self, requester_id: uuid.UUID, addressee_id: uuid.UUID
    ) -> Friendship | None:
        if requester_id == addressee_id:
            return None

        addressee = await self._users.get(addressee_id)
        if addressee is None:
            return None

        existing = await self._friendships.get_pair(requester_id, addressee_id)
        if existing is not None:
            return existing

        return await self._friendships.create(
            {"requester_id": requester_id, "addressee_id": addressee_id, "status": FriendshipStatus.PENDING}
        )

    async def accept_friend_request(
        self, friendship_id: uuid.UUID, current_user_id: uuid.UUID
    ) -> Friendship | None:
        friendship = await self._friendships.get(friendship_id)
        if friendship is None or friendship.addressee_id != current_user_id:
            return None
        if friendship.status != FriendshipStatus.PENDING:
            return friendship
        return await self._friendships.update(friendship, {"status": FriendshipStatus.ACCEPTED})

    async def decline_or_cancel(
        self, friendship_id: uuid.UUID, current_user_id: uuid.UUID
    ) -> bool:
        friendship = await self._friendships.get(friendship_id)
        if friendship is None:
            return False
        is_party = friendship.requester_id == current_user_id or friendship.addressee_id == current_user_id
        if not is_party:
            return False
        await self._friendships.delete(friendship_id)
        return True

    async def get_friends(self, user_id: uuid.UUID) -> list[FriendWithCompatibility]:
        friends: list[User] = await self._friendships.get_friends(user_id)
        all_fs = await self._friendships.get_all_for_user(user_id)

        fs_by_peer: dict[uuid.UUID, Friendship] = {}
        for fs in all_fs:
            if fs.status == FriendshipStatus.ACCEPTED:
                peer = fs.addressee_id if fs.requester_id == user_id else fs.requester_id
                fs_by_peer[peer] = fs

        result: list[FriendWithCompatibility] = []
        for friend in friends:
            fs = fs_by_peer.get(friend.id)
            result.append(
                FriendWithCompatibility(
                    friend=FriendOut.model_validate(friend),
                    friendship_id=fs.id if fs else uuid.uuid4(),
                    compatibility_score=fs.literary_compatibility_score if fs else None,
                    friendship_since=fs.created_at if fs else friend.created_at,
                )
            )
        return result

    async def get_pending_requests(self, user_id: uuid.UUID) -> list[Friendship]:
        return await self._friendships.get_pending_received(user_id)

    # ------------------------------------------------------------------
    # 8.2 — Literary Compatibility
    # ------------------------------------------------------------------

    async def compute_literary_compatibility(
        self, user_id: uuid.UUID, friend_id: uuid.UUID
    ) -> CompatibilityResult | None:
        friendship = await self._friendships.get_pair(user_id, friend_id)
        if friendship is None or friendship.status != FriendshipStatus.ACCEPTED:
            return None

        dna_a = await self._dna.get_by_user_id(user_id)
        dna_b = await self._dna.get_by_user_id(friend_id)

        books_a = await self._user_books.get_recently_finished(user_id, limit=20)
        books_b = await self._user_books.get_recently_finished(friend_id, limit=20)

        dna_a_metrics = dna_a.metrics if dna_a else {}
        dna_b_metrics = dna_b.metrics if dna_b else {}
        books_a_data = [
            {"title": ub.book.title if ub.book else "", "author": ub.book.author if ub.book else "", "rating": ub.rating}
            for ub in books_a
        ]
        books_b_data = [
            {"title": ub.book.title if ub.book else "", "author": ub.book.author if ub.book else "", "rating": ub.rating}
            for ub in books_b
        ]

        ai_result = await self._ai.compute_compatibility(dna_a_metrics, books_a_data, dna_b_metrics, books_b_data)

        score = float(ai_result.get("score", 0.5))
        score = max(0.0, min(1.0, score))

        await self._friendships.update(friendship, {"literary_compatibility_score": score})

        return CompatibilityResult(
            score=score,
            label=ai_result.get("label", ""),
            shared_dimensions=ai_result.get("shared_dimensions", []),
            connection_narrative=ai_result.get("connection_narrative", ""),
            recommended_exchange=ai_result.get("recommended_exchange", ""),
        )

    # ------------------------------------------------------------------
    # 8.3 — Shared recommendations
    # ------------------------------------------------------------------

    async def get_shared_recommendations(
        self, user_id: uuid.UUID, friend_id: uuid.UUID, count: int = 10
    ) -> SharedRecommendationsResponse | None:
        friendship = await self._friendships.get_pair(user_id, friend_id)
        if friendship is None or friendship.status != FriendshipStatus.ACCEPTED:
            return None

        my_books = await self._user_books.get_user_library(user_id, limit=1000)
        my_book_ids = {ub.book_id for ub in my_books}

        friend_read = await self._user_books.get_user_library(
            friend_id, status=BookStatus.READ, limit=200
        )

        # Filter out books user already has, sort by friend rating desc
        candidates = [
            ub for ub in friend_read
            if ub.book_id not in my_book_ids and not ub.is_private
        ]
        candidates.sort(key=lambda ub: (ub.rating or 0), reverse=True)
        candidates = candidates[:count]

        compat_score = friendship.literary_compatibility_score

        items: list[SharedBookRecommendation] = []
        for ub in candidates:
            rating_norm = (float(ub.rating) / 10.0) if ub.rating else 0.5
            score = rating_norm * (compat_score if compat_score is not None else 0.7)
            items.append(
                SharedBookRecommendation(
                    title=ub.book.title if ub.book else "",
                    author=ub.book.author if ub.book else "",
                    book_id=ub.book_id,
                    friend_rating=ub.rating,
                    friend_review=ub.review if not ub.is_private else None,
                    score=round(min(1.0, score), 4),
                )
            )

        return SharedRecommendationsResponse(
            friend_id=friend_id,
            compatibility_score=compat_score,
            items=items,
        )

    # ------------------------------------------------------------------
    # 8.4 — Reading Journey
    # ------------------------------------------------------------------

    async def build_reading_journey(
        self, user_id: uuid.UUID, goal: str, count: int = 7
    ) -> ReadingJourneyResponse:
        dna = await self._dna.get_by_user_id(user_id)
        literary_dna = dna.metrics if dna else {}

        finished = await self._user_books.get_recently_finished(user_id, limit=30)
        read_books = [
            {"title": ub.book.title if ub.book else "", "author": ub.book.author if ub.book else ""}
            for ub in finished
        ]

        raw = await self._ai.build_reading_journey(literary_dna, read_books, goal, count=count)

        steps: list[JourneyStep] = []
        for step in raw.get("steps", []):
            steps.append(
                JourneyStep(
                    position=step.get("position", len(steps) + 1),
                    title=step.get("title", ""),
                    author=step.get("author", ""),
                    why_now=step.get("why_now", ""),
                    emotional_transition=step.get("emotional_transition", ""),
                    dominant_emotion=step.get("dominant_emotion", ""),
                    atmosphere=step.get("atmosphere", ""),
                )
            )

        return ReadingJourneyResponse(
            journey_title=raw.get("journey_title", ""),
            journey_narrative=raw.get("journey_narrative", ""),
            steps=steps,
        )
