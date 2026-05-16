from __future__ import annotations

import httpx

from app.ai.base import BaseAIProvider, ChatMessage, ChatResponse


class OllamaProvider(BaseAIProvider):
    """Ollama local LLM via REST — no extra packages required."""

    provider_name = "ollama"

    def __init__(self, base_url: str = "http://localhost:11434", model: str = "llama3.2") -> None:
        self._base_url = base_url.rstrip("/")
        self._model = model

    async def chat(
        self,
        messages: list[ChatMessage],
        *,
        system: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> ChatResponse:
        ollama_msgs: list[dict] = []
        if system:
            ollama_msgs.append({"role": "system", "content": system})
        ollama_msgs.extend({"role": m.role, "content": m.content} for m in messages)

        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                f"{self._base_url}/api/chat",
                json={
                    "model": self._model,
                    "messages": ollama_msgs,
                    "stream": False,
                    "options": {"temperature": temperature, "num_predict": max_tokens},
                },
            )
            resp.raise_for_status()
            data = resp.json()

        return ChatResponse(
            content=data["message"]["content"],
            model=self._model,
            provider=self.provider_name,
        )

    async def embeddings(self, texts: list[str]) -> list[list[float]]:
        async with httpx.AsyncClient(timeout=60.0) as client:
            results: list[list[float]] = []
            for text in texts:
                resp = await client.post(
                    f"{self._base_url}/api/embeddings",
                    json={"model": self._model, "prompt": text},
                )
                resp.raise_for_status()
                results.append(resp.json()["embedding"])
        return results
