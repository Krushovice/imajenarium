from __future__ import annotations

from app.ai.base import BaseAIProvider, ChatMessage, ChatResponse

try:
    import google.generativeai as genai

    _available = True
except ImportError:
    _available = False


class GeminiProvider(BaseAIProvider):
    provider_name = "gemini"

    def __init__(self, api_key: str | None, model: str = "gemini-1.5-flash") -> None:
        if not _available:
            raise ImportError("google-generativeai not installed. Run: pip install google-generativeai")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY is required")
        genai.configure(api_key=api_key)
        self._model_name = model

    async def chat(
        self,
        messages: list[ChatMessage],
        *,
        system: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> ChatResponse:
        gen_config = {"temperature": temperature, "max_output_tokens": max_tokens}
        model_kwargs: dict = {"generation_config": gen_config}

        sys_prompt = system or next((m.content for m in messages if m.role == "system"), None)
        if sys_prompt:
            model_kwargs["system_instruction"] = sys_prompt

        model = genai.GenerativeModel(self._model_name, **model_kwargs)

        # Build history from all but the last user message
        non_system = [m for m in messages if m.role != "system"]
        history = [
            {"role": "user" if m.role == "user" else "model", "parts": [m.content]}
            for m in non_system[:-1]
        ]
        last_content = non_system[-1].content if non_system else ""

        chat = model.start_chat(history=history)
        resp = await chat.send_message_async(last_content)

        return ChatResponse(
            content=resp.text,
            model=self._model_name,
            provider=self.provider_name,
        )
