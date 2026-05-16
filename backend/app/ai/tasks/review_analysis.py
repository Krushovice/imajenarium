from __future__ import annotations

import json
import logging

from app.ai.base import BaseAIProvider, ChatMessage, EmotionAnalysis
from app.ai.prompt_registry import PromptRegistry
from app.ai.utils import extract_json

logger = logging.getLogger(__name__)


class ReviewAnalysisService:
    def __init__(self, provider: BaseAIProvider, prompts: PromptRegistry) -> None:
        self._provider = provider
        self._prompts = prompts

    async def analyze_emotions(self, review_text: str) -> EmotionAnalysis:
        return await self._provider.analyze_emotions(review_text)

    async def extract_themes(self, review_text: str) -> list[str]:
        prompt = self._prompts.get("review_analysis", "extract_themes", review=review_text)
        resp = await self._provider.chat(
            [ChatMessage(role="user", content=prompt)], temperature=0.2, max_tokens=256
        )
        try:
            return json.loads(extract_json(resp.content)).get("themes", [])
        except Exception as exc:
            logger.error("extract_themes parse failed: %s", exc)
            return []

    async def full_analysis(self, review_text: str) -> dict:
        prompt = self._prompts.get("review_analysis", "analyze_emotions", review=review_text)
        resp = await self._provider.chat(
            [ChatMessage(role="user", content=prompt)], temperature=0.2, max_tokens=512
        )
        try:
            return json.loads(extract_json(resp.content))
        except Exception as exc:
            logger.error("full_analysis parse failed: %s", exc)
            return {}
