from __future__ import annotations

import hashlib
import json
import logging
import uuid
from datetime import datetime, timedelta, timezone

import redis.asyncio as aioredis

from app.ai.embeddings import LocalEmbeddingService
from app.ai.tasks.recommendation import RecommendationAIService
from app.models.enums import RecommendationSource
from app.models.recommendations import Recommendation
from app.repositories.books import BookRepository
from app.repositories.literary_dna import LiteraryDNARepository
from app.repositories.recommendations import RecommendationRepository
from app.repositories.user_books import UserBookRepository

logger = logging.getLogger(__name__)

_REC_TTL_DAYS = 7
_EPHEMERAL_CACHE_TTL = 1800  # 30 min


def _expires() -> datetime:
    return datetime.now(tz=timezone.utc) + timedelta(days=_REC_TTL_DAYS)


class RecommendationService:
    def __init__(
        self,
        rec_repo: RecommendationRepository,
        book_repo: BookRepository,
        dna_repo: LiteraryDNARepository,
        user_book_repo: UserBookRepository,
        ai: RecommendationAIService,
        embeddings: LocalEmbeddingService,
        redis: aioredis.Redis | None = None,
    ) -> None:
        self._rec = rec_repo
        self._books = book_repo
        self._dna = dna_repo
        self._user_books = user_book_repo
        self._ai = ai
        self._embed = embeddings
        self._redis = redis

    # ------------------------------------------------------------------
    # 6.1 — DNA semantic similarity via pgvector
    # ------------------------------------------------------------------

    async def refresh_dna_recommendations(
        self, user_id: uuid.UUID, count: int = 20
    ) -> list[Recommendation]:
        dna = await self._dna.get_by_user_id(user_id)
        if dna is None or dna.embedding is None:
            logger.warning("refresh_dna_recommendations: no DNA embedding for user %s", user_id)
            return []

        shelf_ids = await self._get_shelf_book_ids(user_id)

        candidates = await self._books.find_similar_by_embedding(
            dna.embedding, limit=count * 3, threshold=0.3
        )
        candidates = [b for b in candidates if b.id not in shelf_ids][:count]

        await self._rec.delete_by_source(user_id, RecommendationSource.DNA_SIMILARITY)

        results: list[Recommendation] = []
        for book in candidates:
            if book.mood_embedding is None:
                score = 0.5
            else:
                score = float(
                    1.0 - _cosine_distance(dna.embedding, book.mood_embedding)
                )
            rec = await self._rec.create({
                "user_id": user_id,
                "book_id": book.id,
                "score": round(score, 4),
                "source": RecommendationSource.DNA_SIMILARITY,
                "expires_at": _expires(),
            })
            results.append(rec)

        return results

    # ------------------------------------------------------------------
    # 6.2 — Mood / emotion based (ephemeral AI)
    # ------------------------------------------------------------------

    async def recommend_by_mood(
        self,
        user_id: uuid.UUID,
        mood: str,
        context: str = "",
        count: int = 5,
    ) -> list[dict]:
        dna = await self._dna.get_by_user_id(user_id)
        literary_dna = dna.metrics if dna else {}
        cache_key = f"rec:mood:{user_id}:{hashlib.md5(f'{mood}:{context}:{count}'.encode()).hexdigest()}"

        if self._redis is not None:
            cached = await self._redis.get(cache_key)
            if cached:
                return json.loads(cached)

        suggestions = await self._ai.recommend_by_mood(
            mood, context=context, count=count, literary_dna=literary_dna
        )
        result = await self._enrich_suggestions(suggestions)

        if self._redis is not None and result:
            await self._redis.set(cache_key, json.dumps(result, default=str), ex=_EPHEMERAL_CACHE_TTL)

        return result

    # ------------------------------------------------------------------
    # 6.3 — Collaborative filtering by similar DNA
    # ------------------------------------------------------------------

    async def refresh_collaborative_recommendations(
        self, user_id: uuid.UUID, count: int = 20
    ) -> list[Recommendation]:
        dna = await self._dna.get_by_user_id(user_id)
        if dna is None or dna.embedding is None:
            return []

        similar_dnas = await self._dna.find_similar_users(
            dna.embedding,
            exclude_user_id=user_id,
            limit=15,
            threshold=0.6,
        )
        if not similar_dnas:
            return []

        shelf_ids = await self._get_shelf_book_ids(user_id)

        # Tally book scores: books read by similar users weighted by DNA similarity
        book_scores: dict[uuid.UUID, float] = {}
        for sim_dna in similar_dnas:
            sim_score = float(
                1.0 - _cosine_distance(dna.embedding, sim_dna.embedding)
            )
            finished = await self._user_books.get_recently_finished(sim_dna.user_id, limit=30)
            for ub in finished:
                if ub.book_id in shelf_ids:
                    continue
                rating_bonus = (float(ub.rating) / 10.0) if ub.rating else 0.5
                book_scores[ub.book_id] = book_scores.get(ub.book_id, 0.0) + sim_score * rating_bonus

        top_book_ids = sorted(book_scores, key=book_scores.__getitem__, reverse=True)[:count]
        if not top_book_ids:
            return []

        await self._rec.delete_by_source(user_id, RecommendationSource.COLLABORATIVE)

        results: list[Recommendation] = []
        for book_id in top_book_ids:
            raw_score = book_scores[book_id]
            # Normalize to 0..1 range (cap at 1.0)
            score = min(1.0, raw_score)
            rec = await self._rec.create({
                "user_id": user_id,
                "book_id": book_id,
                "score": round(score, 4),
                "source": RecommendationSource.COLLABORATIVE,
                "expires_at": _expires(),
            })
            results.append(rec)

        return results

    # ------------------------------------------------------------------
    # 6.4 — AI analysis of emotional reviews → recommendations (ephemeral)
    # ------------------------------------------------------------------

    async def recommend_from_reviews(
        self, user_id: uuid.UUID, count: int = 5
    ) -> list[dict]:
        finished = await self._user_books.get_recently_finished(user_id, limit=20)
        reviews = [
            {
                "title": ub.book.title if ub.book else "Unknown",
                "author": ub.book.author if ub.book else "",
                "review": ub.review,
                "rating": ub.rating,
            }
            for ub in finished
            if ub.review
        ]
        if not reviews:
            return []

        suggestions = await self._ai.recommend_from_reviews(reviews, count=count)
        return await self._enrich_suggestions(suggestions)

    # ------------------------------------------------------------------
    # 6.5 — Free-text AI prompt ("like X+Y but darker")
    # ------------------------------------------------------------------

    async def recommend_from_prompt(
        self, user_id: uuid.UUID, user_prompt: str, count: int = 5
    ) -> list[dict]:
        if self._redis is not None:
            cache_key = f"rec:prompt:{user_id}:{hashlib.md5(f'{user_prompt}:{count}'.encode()).hexdigest()}"
            cached = await self._redis.get(cache_key)
            if cached:
                return json.loads(cached)

        dna = await self._dna.get_by_user_id(user_id)
        literary_dna = dna.metrics if dna else {}
        suggestions = await self._ai.recommend_from_prompt(user_prompt, literary_dna, count=count)
        result = await self._enrich_suggestions(suggestions)

        if self._redis is not None and result:
            await self._redis.set(cache_key, json.dumps(result, default=str), ex=_EPHEMERAL_CACHE_TTL)

        return result

    # ------------------------------------------------------------------
    # 6.6 — AI explanation for a stored recommendation
    # ------------------------------------------------------------------

    async def explain_recommendation(
        self, recommendation_id: uuid.UUID, user_id: uuid.UUID
    ) -> Recommendation | None:
        rec = await self._rec.get(recommendation_id)
        if rec is None or rec.user_id != user_id:
            return None

        if rec.ai_explanation:
            return rec

        dna = await self._dna.get_by_user_id(user_id)
        literary_dna = dna.metrics if dna else {}

        from app.repositories.exceptions import EntityNotFoundError
        book = await self._books.get(rec.book_id)
        if book is None:
            return rec

        explanation = await self._ai.explain_recommendation(
            book.title, book.author, literary_dna
        )
        return await self._rec.update(rec, {"ai_explanation": explanation})

    # ------------------------------------------------------------------
    # Read / interaction
    # ------------------------------------------------------------------

    async def get_recommendations(
        self,
        user_id: uuid.UUID,
        *,
        source: RecommendationSource | None = None,
        limit: int = 20,
    ) -> list[Recommendation]:
        return await self._rec.get_active(user_id, source=source, limit=limit)

    async def mark_seen(self, ids: list[uuid.UUID]) -> None:
        await self._rec.mark_seen(ids)

    async def dismiss(
        self, recommendation_id: uuid.UUID, user_id: uuid.UUID
    ) -> bool:
        rec = await self._rec.get(recommendation_id)
        if rec is None or rec.user_id != user_id:
            return False
        await self._rec.dismiss(recommendation_id)
        return True

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    async def _get_shelf_book_ids(self, user_id: uuid.UUID) -> set[uuid.UUID]:
        library = await self._user_books.get_user_library(user_id, limit=1000)
        return {ub.book_id for ub in library}

    async def _enrich_suggestions(self, suggestions: list[dict]) -> list[dict]:
        """Try to match AI suggestions to catalog books and attach book data."""
        enriched: list[dict] = []
        for s in suggestions:
            title = s.get("title", "")
            author = s.get("author", "")
            matched = await self._books.search_by_title(title, limit=3)
            # Pick closest match: title contains author substring or vice versa
            book = None
            for candidate in matched:
                if author.lower() in candidate.author.lower() or candidate.author.lower() in author.lower():
                    book = candidate
                    break
            if book is None and matched:
                book = matched[0]

            enriched.append({
                "title": title,
                "author": author,
                "book_id": str(book.id) if book else None,
                "book": book,
                "explanation": s.get("explanation", ""),
                "dominant_emotion": s.get("dominant_emotion"),
                "atmosphere": s.get("atmosphere"),
                "score": 1.0,
            })
        return enriched


def _cosine_distance(a: list[float], b: list[float]) -> float:
    """Pure-Python cosine distance fallback (vectors already normalized by sentence-transformers)."""
    dot = sum(x * y for x, y in zip(a, b))
    return 1.0 - max(-1.0, min(1.0, dot))
