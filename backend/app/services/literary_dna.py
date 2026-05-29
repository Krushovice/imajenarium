from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from app.ai.embeddings import LocalEmbeddingService
from app.ai.tasks.diary_analysis import DiaryAnalysisAIService
from app.ai.tasks.literary_dna import LiteraryDNAService as LiteraryDNAAIService
from app.models.literary_dna import DEFAULT_METRICS, LiteraryDNA
from app.models.reading_diary import DiaryEntry
from app.repositories.literary_dna import LiteraryDNARepository
from app.repositories.reading_diary import DiaryRepository
from app.repositories.user_books import UserBookRepository

logger = logging.getLogger(__name__)

ONBOARDING_QUESTIONS: list[dict] = [
    {
        "id": "atmosphere",
        "question": "Какая атмосфера книги привлекает тебя больше всего?",
        "options": [
            "Уютная и тёплая",
            "Мрачная и меланхоличная",
            "Захватывающая и напряжённая",
            "Медитативная и медленная",
        ],
        "multi_select": True,
    },
    {
        "id": "emotions",
        "question": "Какие эмоции ты хочешь переживать во время чтения?",
        "options": [
            "Грусть и ностальгия",
            "Восторг и удивление",
            "Тревогу и напряжение",
            "Покой и умиротворение",
            "Смех и лёгкость",
        ],
        "multi_select": True,
    },
    {
        "id": "themes",
        "question": "Какие темы резонируют с тобой сильнее всего?",
        "options": [
            "Идентичность и самопознание",
            "Любовь и потеря",
            "Социальная несправедливость",
            "Философия и смысл жизни",
            "Приключения и свобода",
        ],
        "multi_select": True,
    },
    {
        "id": "pace",
        "question": "Какой темп повествования тебе ближе?",
        "options": [
            "Медленное, созерцательное",
            "Среднее, сбалансированное",
            "Быстрое, динамичное",
        ],
        "multi_select": False,
    },
    {
        "id": "darkness",
        "question": "Как ты относишься к тёмным, тяжёлым темам в книгах?",
        "options": [
            "Избегаю",
            "Принимаю если есть смысл",
            "Люблю глубокие тёмные истории",
            "Чем темнее — тем интереснее",
        ],
        "multi_select": False,
    },
]

_EMOTION_TO_AXIS: dict[str, str] = {
    "melancholy": "darkness", "sadness": "darkness", "grief": "darkness",
    "depression": "darkness", "despair": "darkness",
    "tension": "tension", "anxiety": "tension", "fear": "tension",
    "suspense": "tension", "dread": "tension",
    "love": "romanticism", "romance": "romanticism", "warmth": "romanticism",
    "tenderness": "romanticism", "longing": "romanticism",
    "philosophy": "philosophy", "reflection": "philosophy", "wisdom": "philosophy",
    "contemplation": "philosophy", "existential": "philosophy",
    "humor": "humor", "joy": "humor", "laughter": "humor",
    "lightness": "humor", "playfulness": "humor",
    "adventure": "adventure", "excitement": "adventure", "thrill": "adventure",
    "curiosity": "adventure", "wonder": "adventure",
}

_PACE_MAP: dict[str, float] = {"slow": 0.15, "medium": 0.5, "fast": 0.85}


def _metric_level(v: float) -> str:
    if v < 0.25:
        return "very low"
    if v < 0.45:
        return "low"
    if v < 0.55:
        return "medium"
    if v < 0.75:
        return "high"
    return "very high"


def dna_to_embedding_text(metrics: dict) -> str:
    """Canonical text representation of DNA for sentence-transformers embedding."""
    parts: list[str] = []

    axis_labels = ", ".join(
        f"{k}={_metric_level(float(v))}"
        for k, v in metrics.items()
        if k in DEFAULT_METRICS and isinstance(v, (int, float))
    )
    if axis_labels:
        parts.append(f"Literary DNA: {axis_labels}")

    if isinstance(metrics.get("dominant_emotions"), dict):
        top = sorted(metrics["dominant_emotions"].items(), key=lambda x: x[1], reverse=True)[:4]
        parts.append(f"Emotions: {', '.join(e for e, _ in top)}")

    if isinstance(metrics.get("atmosphere_preferences"), list):
        atm = metrics["atmosphere_preferences"][:4]
        parts.append(f"Atmosphere: {', '.join(str(a) for a in atm)}")

    if isinstance(metrics.get("thematic_preferences"), list):
        themes = metrics["thematic_preferences"][:5]
        parts.append(f"Themes: {', '.join(str(t) for t in themes)}")

    if metrics.get("literary_archetype") and metrics.get("archetype_description"):
        parts.append(
            f"Archetype: {metrics['literary_archetype']} — {metrics['archetype_description']}"
        )

    return ". ".join(parts) if parts else "Literary DNA profile"


def _merge_ai_profile_into_metrics(
    base: dict, ai_profile: dict, *, ai_weight: float = 0.7
) -> dict:
    """Merge numeric axes from ai_profile into base metrics with weighting."""
    merged = dict(base)

    # Numeric axes
    for key in DEFAULT_METRICS:
        ai_val = ai_profile.get(key)
        if isinstance(ai_val, (int, float)):
            cur = float(merged.get(key, 0.5))
            merged[key] = cur * (1 - ai_weight) + float(ai_val) * ai_weight

    # Map dominant_emotions to numeric axes
    if isinstance(ai_profile.get("dominant_emotions"), dict):
        for emotion, intensity in ai_profile["dominant_emotions"].items():
            axis = _EMOTION_TO_AXIS.get(emotion.lower())
            if axis and isinstance(intensity, (int, float)):
                cur = float(merged.get(axis, 0.5))
                merged[axis] = min(1.0, cur * 0.5 + float(intensity) * 0.5)

    # Pace
    if ai_profile.get("reading_pace"):
        merged["pacing"] = _PACE_MAP.get(ai_profile["reading_pace"], 0.5)

    # Rich profile fields (non-numeric)
    for key in ("dominant_emotions", "atmosphere_preferences", "thematic_preferences",
                "literary_archetype", "archetype_description", "reading_pace"):
        if key in ai_profile:
            merged[key] = ai_profile[key]

    return merged


class LiteraryDNABusinessService:
    def __init__(
        self,
        dna_repo: LiteraryDNARepository,
        user_book_repo: UserBookRepository,
        diary_repo: DiaryRepository,
        ai_service: LiteraryDNAAIService,
        embeddings: LocalEmbeddingService,
        diary_ai_service: DiaryAnalysisAIService | None = None,
    ) -> None:
        self._dna = dna_repo
        self._books = user_book_repo
        self._diary = diary_repo
        self._ai = ai_service
        self._embed = embeddings
        self._diary_ai = diary_ai_service

    async def get_or_create(self, user_id: uuid.UUID) -> LiteraryDNA:
        record = await self._dna.get_by_user_id(user_id)
        if record is None:
            record = await self._dna.create({
                "user_id": user_id,
                "metrics": dict(DEFAULT_METRICS),
                "version": 1,
            })
        return record

    async def _refresh_embedding(self, record: LiteraryDNA) -> LiteraryDNA:
        text = dna_to_embedding_text(record.metrics)
        try:
            vectors = await self._embed.embed_async([text])
            return await self._dna.update(record, {
                "embedding": vectors[0],
                "last_computed_at": datetime.now(tz=timezone.utc),
            })
        except Exception as exc:
            logger.warning("DNA embedding skipped: %s", exc)
            return await self._dna.update(record, {
                "last_computed_at": datetime.now(tz=timezone.utc),
            })

    async def initialize_from_onboarding(
        self, user_id: uuid.UUID, answers: dict
    ) -> LiteraryDNA:
        """4.4 — build initial DNA from emotional onboarding answers via AI."""
        record = await self.get_or_create(user_id)
        ai_profile = await self._ai.build_profile(answers)
        merged = _merge_ai_profile_into_metrics(dict(DEFAULT_METRICS), ai_profile, ai_weight=0.9)
        record = await self._dna.update(record, {
            "metrics": merged,
            "version": record.version + 1,
        })
        return await self._refresh_embedding(record)

    async def update_from_review(
        self, user_id: uuid.UUID, book_title: str, review_text: str
    ) -> LiteraryDNA:
        """4.3 — evolve DNA from a single book review."""
        record = await self.get_or_create(user_id)
        updated_profile = await self._ai.update_from_review(record.metrics, book_title, review_text)
        if not updated_profile:
            return record

        # Clamp all numeric values to [0, 1]
        clamped = {
            k: max(0.0, min(1.0, float(v))) if isinstance(v, (int, float)) else v
            for k, v in updated_profile.items()
        }
        record = await self._dna.update(record, {
            "metrics": clamped,
            "version": record.version + 1,
        })
        return await self._refresh_embedding(record)

    async def recompute(self, user_id: uuid.UUID) -> LiteraryDNA:
        """4.1 — recompute DNA from all available user data (reviews + diary)."""
        record = await self.get_or_create(user_id)

        finished_books = await self._books.get_recently_finished(user_id, limit=20)
        reviews = [
            {
                "title": getattr(ub.book, "title", "Unknown") if ub.book else "Unknown",
                "review": ub.review,
                "rating": ub.rating,
            }
            for ub in finished_books
            if ub.review
        ]

        diary_entries = await self._diary.get_by_user(user_id, limit=20)
        diary_texts = [e.content for e in diary_entries[:10]]

        if not reviews and not diary_texts:
            return await self._refresh_embedding(record)

        aggregated = {
            "reviews": reviews,
            "diary_entries": diary_texts,
            "current_profile": {
                k: v for k, v in record.metrics.items() if k in DEFAULT_METRICS
            },
        }

        ai_profile = await self._ai.build_profile(aggregated)
        if not ai_profile:
            return await self._refresh_embedding(record)

        merged = _merge_ai_profile_into_metrics(record.metrics, ai_profile, ai_weight=0.5)
        record = await self._dna.update(record, {
            "metrics": merged,
            "version": record.version + 1,
        })
        return await self._refresh_embedding(record)

    async def generate_next_onboarding_question(self, answers_so_far: dict) -> dict | None:
        """Returns next question dict or None when onboarding is complete (7+ answers)."""
        if len(answers_so_far) >= 7:
            return None
        return await self._ai.generate_next_question(answers_so_far)

    async def patch_metrics(self, user_id: uuid.UUID, updates: dict[str, float]) -> LiteraryDNA:
        """4.2 — manual partial update of numeric metric axes."""
        record = await self.get_or_create(user_id)
        merged = dict(record.metrics)
        for key, val in updates.items():
            if key in DEFAULT_METRICS:
                merged[key] = max(0.0, min(1.0, float(val)))
        record = await self._dna.update(record, {
            "metrics": merged,
            "version": record.version + 1,
        })
        return await self._refresh_embedding(record)

    async def update_from_diary_entry(
        self,
        entry: DiaryEntry,
        book_title: str | None = None,
    ) -> tuple[LiteraryDNA, dict]:
        """7.2 — evolve DNA from a diary entry; marks entry as processed."""
        if self._diary_ai is None:
            raise RuntimeError("DiaryAnalysisAIService not configured")

        record = await self.get_or_create(entry.user_id)
        analysis = await self._diary_ai.analyze_entry(
            entry_text=entry.content,
            current_dna=record.metrics,
            book_title=book_title,
        )

        dna_updated = False
        if analysis and analysis.get("confidence", 0) >= 0.4:
            dna_updates = analysis.get("dna_updates", {})
            if dna_updates:
                merged = _merge_ai_profile_into_metrics(record.metrics, dna_updates, ai_weight=0.3)
                # Clamp all numeric values
                clamped = {
                    k: max(0.0, min(1.0, float(v))) if isinstance(v, (int, float)) else v
                    for k, v in merged.items()
                }
                record = await self._dna.update(record, {
                    "metrics": clamped,
                    "version": record.version + 1,
                })
                record = await self._refresh_embedding(record)
                dna_updated = True

        # Store AI analysis on the entry and mark as processed
        await self._diary.update(entry, {
            "ai_emotional_analysis": analysis.get("emotional_analysis") or analysis,
            "dna_impact_applied": True,
        })

        return record, analysis
