from __future__ import annotations

import logging
from functools import lru_cache
from pathlib import Path

from app.ai.utils import render_template

logger = logging.getLogger(__name__)

# prompts/ lives at project root, two levels above backend/app/ai/
_PROMPTS_ROOT = Path(__file__).parent.parent.parent.parent / "prompts"


class PromptRegistry:
    def __init__(self, prompts_dir: Path = _PROMPTS_ROOT) -> None:
        self._dir = prompts_dir
        self._cache: dict[str, str] = {}

    def get(self, *path_parts: str, **kwargs: str) -> str:
        key = "/".join(path_parts)
        if key not in self._cache:
            path = self._dir.joinpath(*path_parts)
            if not path.suffix:
                path = path.with_suffix(".md")
            if not path.exists():
                raise FileNotFoundError(f"Prompt not found: {path}")
            self._cache[key] = path.read_text(encoding="utf-8")
            logger.debug("Loaded prompt: %s", key)

        template = self._cache[key]
        return render_template(template, **kwargs) if kwargs else template

    def reload(self) -> None:
        self._cache.clear()


@lru_cache(maxsize=1)
def get_prompt_registry() -> PromptRegistry:
    return PromptRegistry()
