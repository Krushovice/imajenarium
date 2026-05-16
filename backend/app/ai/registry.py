from __future__ import annotations

import logging
from functools import lru_cache

from app.ai.base import BaseAIProvider

logger = logging.getLogger(__name__)


def _build_provider(name: str) -> BaseAIProvider:
    from app.core.config import settings

    match name:
        case "openai":
            from app.ai.providers.openai_provider import OpenAIProvider

            return OpenAIProvider(
                api_key=settings.openai_api_key,
                model=settings.openai_model,
                embedding_model=settings.openai_embedding_model,
            )
        case "anthropic":
            from app.ai.providers.anthropic_provider import AnthropicProvider

            return AnthropicProvider(api_key=settings.anthropic_api_key, model=settings.anthropic_model)
        case "openrouter":
            from app.ai.providers.openrouter_provider import OpenRouterProvider

            return OpenRouterProvider(api_key=settings.openrouter_api_key, model=settings.openrouter_model)
        case "mistral":
            from app.ai.providers.mistral_provider import MistralProvider

            return MistralProvider(api_key=settings.mistral_api_key, model=settings.mistral_model)
        case "gemini":
            from app.ai.providers.gemini_provider import GeminiProvider

            return GeminiProvider(api_key=settings.google_api_key, model=settings.gemini_model)
        case "ollama":
            from app.ai.providers.ollama_provider import OllamaProvider

            return OllamaProvider(base_url=settings.ollama_url, model=settings.ollama_model)
        case _:
            raise ValueError(f"Unknown AI provider: {name!r}")


@lru_cache(maxsize=1)
def get_active_provider() -> BaseAIProvider:
    """Build provider chain based on AI_PROVIDER + fallback settings."""
    from app.ai.failover import FailoverAIProvider
    from app.core.config import settings

    # Primary first, then fallback chain (deduplicated, preserving order)
    seen: set[str] = set()
    priority: list[str] = []
    for name in [settings.ai_provider, *settings.ai_fallback_chain]:
        if name not in seen:
            seen.add(name)
            priority.append(name)

    providers: list[BaseAIProvider] = []
    for name in priority:
        try:
            providers.append(_build_provider(name))
            logger.info("AI provider ready: %s", name)
        except Exception as exc:
            logger.warning("Skipping AI provider %s: %s", name, exc)

    if not providers:
        raise RuntimeError(
            "No AI providers could be initialized. Set at least one API key "
            "(OPENAI_API_KEY, ANTHROPIC_API_KEY, OPENROUTER_API_KEY, etc.) or configure OLLAMA_URL."
        )

    return providers[0] if len(providers) == 1 else FailoverAIProvider(providers)
