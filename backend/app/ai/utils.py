from __future__ import annotations

import re


def extract_json(text: str) -> str:
    """Strip markdown code fences and return raw JSON string."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        end = len(lines) - 1 if lines[-1].strip() == "```" else len(lines)
        text = "\n".join(lines[1:end])
    return text.strip()


def render_template(template: str, **kwargs: str) -> str:
    """Replace {{variable}} placeholders in template."""
    def replace(m: re.Match) -> str:
        key = m.group(1).strip()
        return kwargs.get(key, m.group(0))

    return re.sub(r"\{\{(\w+)\}\}", replace, template)
