from __future__ import annotations

import json
import logging

from app.ai.base import BaseAIProvider, ChatMessage
from app.ai.prompt_registry import PromptRegistry
from app.ai.utils import extract_json

logger = logging.getLogger(__name__)


class RecommendationAIService:
    def __init__(self, provider: BaseAIProvider, prompts: PromptRegistry) -> None:
        self._provider = provider
        self._prompts = prompts

    async def recommend_by_dna(self, literary_dna: dict, count: int = 5) -> list[dict]:
        prompt = self._prompts.get(
            "recommendations", "by_dna",
            literary_dna=json.dumps(literary_dna, ensure_ascii=False, indent=2),
            count=str(count),
        )
        resp = await self._provider.chat(
            [ChatMessage(role="user", content=prompt)], temperature=0.8
        )
        try:
            return json.loads(extract_json(resp.content)).get("recommendations", [])
        except Exception as exc:
            logger.error("recommend_by_dna parse failed: %s | raw: %s", exc, resp.content[:200])
            return []

    async def recommend_by_mood(self, mood: str, context: str = "", count: int = 5) -> list[dict]:
        prompt = self._prompts.get(
            "recommendations", "by_mood",
            mood=mood,
            context=context,
            count=str(count),
        )
        resp = await self._provider.chat(
            [ChatMessage(role="user", content=prompt)], temperature=0.8
        )
        try:
            return json.loads(extract_json(resp.content)).get("recommendations", [])
        except Exception as exc:
            logger.error("recommend_by_mood parse failed: %s", exc)
            return []

    async def explain_recommendation(
        self, book_title: str, book_author: str, literary_dna: dict
    ) -> str:
        prompt = self._prompts.get(
            "recommendations", "explanation",
            book_title=book_title,
            book_author=book_author,
            literary_dna=json.dumps(literary_dna, ensure_ascii=False, indent=2),
        )
        resp = await self._provider.chat(
            [ChatMessage(role="user", content=prompt)], temperature=0.7, max_tokens=512
        )
        return resp.content
