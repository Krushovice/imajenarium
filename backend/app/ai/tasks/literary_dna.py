from __future__ import annotations

import json
import logging

from app.ai.base import BaseAIProvider, ChatMessage
from app.ai.prompt_registry import PromptRegistry
from app.ai.utils import extract_json

logger = logging.getLogger(__name__)


class LiteraryDNAService:
    def __init__(self, provider: BaseAIProvider, prompts: PromptRegistry) -> None:
        self._provider = provider
        self._prompts = prompts

    async def build_profile(self, onboarding_answers: dict) -> dict:
        prompt = self._prompts.get(
            "literary_dna", "build_profile",
            answers=json.dumps(onboarding_answers, ensure_ascii=False, indent=2),
        )
        resp = await self._provider.chat(
            [ChatMessage(role="user", content=prompt)], temperature=0.3, max_tokens=1024
        )
        try:
            return json.loads(extract_json(resp.content))
        except Exception as exc:
            logger.error("build_profile parse failed: %s | raw: %s", exc, resp.content[:200])
            return {}

    async def generate_next_question(self, answers_so_far: dict) -> dict | None:
        prompt = self._prompts.get(
            "literary_dna", "next_onboarding_question",
            answers_so_far=json.dumps(answers_so_far, ensure_ascii=False, indent=2),
            count_so_far=str(len(answers_so_far)),
        )
        resp = await self._provider.chat(
            [ChatMessage(role="user", content=prompt)], temperature=0.5, max_tokens=512
        )
        try:
            data = json.loads(extract_json(resp.content))
            if data.get("done"):
                return None
            return data.get("question")
        except Exception as exc:
            logger.error("generate_next_question parse failed: %s | raw: %s", exc, resp.content[:200])
            return None

    async def update_from_review(
        self, current_dna: dict, book_title: str, review_text: str
    ) -> dict:
        prompt = self._prompts.get(
            "literary_dna", "update_from_review",
            current_dna=json.dumps(current_dna, ensure_ascii=False, indent=2),
            book_title=book_title,
            review=review_text,
        )
        resp = await self._provider.chat(
            [ChatMessage(role="user", content=prompt)], temperature=0.3, max_tokens=1024
        )
        try:
            return json.loads(extract_json(resp.content))
        except Exception as exc:
            logger.error("update_from_review parse failed: %s", exc)
            return current_dna
