from __future__ import annotations

import json
import logging

from app.ai.base import BaseAIProvider, ChatMessage
from app.ai.prompt_registry import PromptRegistry
from app.ai.utils import extract_json

logger = logging.getLogger(__name__)


class DiaryAnalysisAIService:
    def __init__(self, provider: BaseAIProvider, prompts: PromptRegistry) -> None:
        self._provider = provider
        self._prompts = prompts

    async def analyze_entry(
        self,
        entry_text: str,
        current_dna: dict,
        book_title: str | None = None,
    ) -> dict:
        book_context = f' (about "{book_title}")' if book_title else ""
        prompt = self._prompts.get(
            "reading_diary", "analyze_entry",
            entry_text=entry_text,
            current_dna=json.dumps(current_dna, ensure_ascii=False, indent=2),
            book_context=book_context,
        )
        resp = await self._provider.chat(
            [ChatMessage(role="user", content=prompt)],
            temperature=0.2,
            max_tokens=1024,
        )
        try:
            return json.loads(extract_json(resp.content))
        except Exception as exc:
            logger.error("diary analyze_entry parse failed: %s | raw: %.200s", exc, resp.content)
            return {}
