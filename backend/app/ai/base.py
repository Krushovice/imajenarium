from __future__ import annotations

import json
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Literal


@dataclass
class ChatMessage:
    role: Literal["system", "user", "assistant"]
    content: str


@dataclass
class ChatResponse:
    content: str
    model: str
    provider: str
    usage: dict[str, int] = field(default_factory=dict)


@dataclass
class EmotionAnalysis:
    emotions: dict[str, float]
    mood: str
    themes: list[str]
    atmosphere: str


class BaseAIProvider(ABC):
    provider_name: str = "base"

    @abstractmethod
    async def chat(
        self,
        messages: list[ChatMessage],
        *,
        system: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> ChatResponse: ...

    async def embeddings(self, texts: list[str]) -> list[list[float]]:
        raise NotImplementedError(f"{self.provider_name} does not support native embeddings")

    async def summarize(self, text: str, *, max_length: int = 200) -> str:
        messages = [
            ChatMessage(
                role="user",
                content=f"Summarize the following text in {max_length} words or fewer:\n\n{text}",
            )
        ]
        response = await self.chat(messages, temperature=0.3, max_tokens=max_length * 2)
        return response.content

    async def analyze_emotions(self, text: str) -> EmotionAnalysis:
        prompt = (
            "Analyze the emotional content of the following text. "
            'Respond ONLY with valid JSON: {"emotions": {"name": 0.0}, "mood": "string", "themes": ["string"], "atmosphere": "string"}\n\n'
            f"Text:\n{text}"
        )
        response = await self.chat(
            [ChatMessage(role="user", content=prompt)],
            temperature=0.2,
            max_tokens=512,
        )
        from app.ai.utils import extract_json

        data = json.loads(extract_json(response.content))
        return EmotionAnalysis(
            emotions=data["emotions"],
            mood=data["mood"],
            themes=data["themes"],
            atmosphere=data["atmosphere"],
        )
