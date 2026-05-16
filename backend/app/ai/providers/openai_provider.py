from __future__ import annotations

from app.ai.base import BaseAIProvider, ChatMessage, ChatResponse

try:
    from openai import AsyncOpenAI

    _available = True
except ImportError:
    _available = False


class OpenAIProvider(BaseAIProvider):
    provider_name = "openai"

    def __init__(
        self,
        api_key: str | None,
        model: str = "gpt-4o-mini",
        embedding_model: str = "text-embedding-3-small",
    ) -> None:
        if not _available:
            raise ImportError("openai package not installed. Run: pip install openai")
        if not api_key:
            raise ValueError("OPENAI_API_KEY is required")
        self._client = AsyncOpenAI(api_key=api_key)
        self._model = model
        self._embedding_model = embedding_model

    async def chat(
        self,
        messages: list[ChatMessage],
        *,
        system: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> ChatResponse:
        oai_msgs: list[dict] = []
        if system:
            oai_msgs.append({"role": "system", "content": system})
        oai_msgs.extend({"role": m.role, "content": m.content} for m in messages)

        resp = await self._client.chat.completions.create(
            model=self._model,
            messages=oai_msgs,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        usage = {}
        if resp.usage:
            usage = {"prompt": resp.usage.prompt_tokens, "completion": resp.usage.completion_tokens}
        return ChatResponse(
            content=resp.choices[0].message.content or "",
            model=resp.model,
            provider=self.provider_name,
            usage=usage,
        )

    async def embeddings(self, texts: list[str]) -> list[list[float]]:
        resp = await self._client.embeddings.create(model=self._embedding_model, input=texts)
        return [item.embedding for item in resp.data]
