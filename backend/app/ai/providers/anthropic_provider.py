from __future__ import annotations

from app.ai.base import BaseAIProvider, ChatMessage, ChatResponse

try:
    import anthropic as _anthropic

    _available = True
except ImportError:
    _available = False


class AnthropicProvider(BaseAIProvider):
    provider_name = "anthropic"

    def __init__(self, api_key: str | None, model: str = "claude-sonnet-4-6") -> None:
        if not _available:
            raise ImportError("anthropic package not installed. Run: pip install anthropic")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY is required")
        self._client = _anthropic.AsyncAnthropic(api_key=api_key)
        self._model = model

    async def chat(
        self,
        messages: list[ChatMessage],
        *,
        system: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> ChatResponse:
        # Anthropic keeps system separate; strip system-role messages from list
        sys_prompt = system or next(
            (m.content for m in messages if m.role == "system"), None
        )
        non_system = [m for m in messages if m.role != "system"]
        anthropic_msgs = [{"role": m.role, "content": m.content} for m in non_system]

        kwargs: dict = dict(
            model=self._model,
            messages=anthropic_msgs,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        if sys_prompt:
            kwargs["system"] = sys_prompt

        resp = await self._client.messages.create(**kwargs)
        return ChatResponse(
            content=resp.content[0].text,
            model=resp.model,
            provider=self.provider_name,
            usage={"prompt": resp.usage.input_tokens, "completion": resp.usage.output_tokens},
        )
