from __future__ import annotations

import logging

from app.ai.base import BaseAIProvider, ChatMessage, ChatResponse

logger = logging.getLogger(__name__)


class FailoverAIProvider(BaseAIProvider):
    """Tries providers in order; falls through on any exception."""

    provider_name = "failover"

    def __init__(self, providers: list[BaseAIProvider]) -> None:
        if not providers:
            raise ValueError("FailoverAIProvider requires at least one provider")
        self._providers = providers

    async def chat(
        self,
        messages: list[ChatMessage],
        *,
        system: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> ChatResponse:
        last_exc: Exception | None = None
        for provider in self._providers:
            try:
                return await provider.chat(
                    messages, system=system, temperature=temperature, max_tokens=max_tokens
                )
            except Exception as exc:
                logger.warning("Provider %s chat failed: %s", provider.provider_name, exc)
                last_exc = exc
        raise RuntimeError(f"All AI providers failed. Last error: {last_exc}") from last_exc

    async def embeddings(self, texts: list[str]) -> list[list[float]]:
        last_exc: Exception | None = None
        for provider in self._providers:
            try:
                return await provider.embeddings(texts)
            except NotImplementedError:
                continue
            except Exception as exc:
                logger.warning("Provider %s embeddings failed: %s", provider.provider_name, exc)
                last_exc = exc
        raise RuntimeError(f"All embedding providers failed. Last error: {last_exc}") from last_exc
