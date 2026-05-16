from __future__ import annotations

from app.ai.base import BaseAIProvider, ChatMessage, ChatResponse

try:
    from mistralai import Mistral

    _available = True
except ImportError:
    _available = False


class MistralProvider(BaseAIProvider):
    provider_name = "mistral"

    def __init__(self, api_key: str | None, model: str = "mistral-small-latest") -> None:
        if not _available:
            raise ImportError("mistralai package not installed. Run: pip install mistralai")
        if not api_key:
            raise ValueError("MISTRAL_API_KEY is required")
        self._client = Mistral(api_key=api_key)
        self._model = model

    async def chat(
        self,
        messages: list[ChatMessage],
        *,
        system: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> ChatResponse:
        mistral_msgs: list[dict] = []
        if system:
            mistral_msgs.append({"role": "system", "content": system})
        mistral_msgs.extend({"role": m.role, "content": m.content} for m in messages)

        resp = await self._client.chat.complete_async(
            model=self._model,
            messages=mistral_msgs,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        usage = {}
        if resp.usage:
            usage = {"prompt": resp.usage.prompt_tokens, "completion": resp.usage.completion_tokens}
        return ChatResponse(
            content=resp.choices[0].message.content or "",
            model=self._model,
            provider=self.provider_name,
            usage=usage,
        )
