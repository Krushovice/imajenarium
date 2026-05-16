from __future__ import annotations

import json
import logging

from app.ai.base import BaseAIProvider, ChatMessage
from app.ai.prompt_registry import PromptRegistry
from app.ai.utils import extract_json

logger = logging.getLogger(__name__)

_FALLBACK = {
    "summary": "",
    "emotional_tags": [],
    "mood": None,
    "atmosphere": None,
}


class NewsFeedAIService:
    def __init__(self, provider: BaseAIProvider, prompts: PromptRegistry) -> None:
        self._provider = provider
        self._prompts = prompts

    async def summarize_and_tag(self, title: str, excerpt: str) -> dict:
        prompt = self._prompts.get(
            "news", "summarize_tag",
            title=title,
            excerpt=excerpt[:3000],
        )
        resp = await self._provider.chat(
            [ChatMessage(role="user", content=prompt)], temperature=0.6
        )
        try:
            return json.loads(extract_json(resp.content))
        except Exception as exc:
            logger.error(
                "summarize_and_tag parse failed: %s | raw: %s", exc, resp.content[:200]
            )
            return _FALLBACK.copy()
