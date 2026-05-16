from __future__ import annotations

import json
import logging

from app.ai.base import BaseAIProvider, ChatMessage
from app.ai.prompt_registry import PromptRegistry
from app.ai.utils import extract_json

logger = logging.getLogger(__name__)


class SocialAIService:
    def __init__(self, provider: BaseAIProvider, prompts: PromptRegistry) -> None:
        self._provider = provider
        self._prompts = prompts

    async def compute_compatibility(
        self,
        dna_a: dict,
        books_a: list[dict],
        dna_b: dict,
        books_b: list[dict],
    ) -> dict:
        prompt = self._prompts.get(
            "social", "compatibility",
            dna_a=json.dumps(dna_a, ensure_ascii=False, indent=2),
            books_a=json.dumps(books_a, ensure_ascii=False, indent=2),
            dna_b=json.dumps(dna_b, ensure_ascii=False, indent=2),
            books_b=json.dumps(books_b, ensure_ascii=False, indent=2),
        )
        resp = await self._provider.chat(
            [ChatMessage(role="user", content=prompt)], temperature=0.7
        )
        try:
            return json.loads(extract_json(resp.content))
        except Exception as exc:
            logger.error("compute_compatibility parse failed: %s | raw: %s", exc, resp.content[:200])
            return {"score": 0.5, "label": "Unknown", "shared_dimensions": [], "connection_narrative": "", "recommended_exchange": ""}

    async def build_reading_journey(
        self,
        literary_dna: dict,
        read_books: list[dict],
        goal: str,
        count: int = 7,
    ) -> dict:
        prompt = self._prompts.get(
            "social", "reading_journey",
            literary_dna=json.dumps(literary_dna, ensure_ascii=False, indent=2),
            read_books=json.dumps(read_books, ensure_ascii=False, indent=2),
            goal=goal,
            count=str(count),
        )
        resp = await self._provider.chat(
            [ChatMessage(role="user", content=prompt)], temperature=0.85
        )
        try:
            return json.loads(extract_json(resp.content))
        except Exception as exc:
            logger.error("build_reading_journey parse failed: %s | raw: %s", exc, resp.content[:200])
            return {"journey_title": "", "journey_narrative": "", "steps": []}
