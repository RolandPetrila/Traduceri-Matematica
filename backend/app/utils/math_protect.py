"""LaTeX math protection utilities for markdown processing."""

import re

MATH_PATTERN = re.compile(
    r"(\$\$[\s\S]*?\$\$"       # display math $$...$$
    r"|\$[^\$\n]+?\$"          # inline math $...$
    r"|\\[a-zA-Z]+\{[^}]*\})" # LaTeX commands \cmd{...}
)


def protect_math(text: str) -> tuple[str, dict[str, str]]:
    """Replace LaTeX with unique placeholders."""
    placeholders: dict[str, str] = {}

    def _replace(match: re.Match) -> str:
        key = f"@@MATH_TOKEN_{len(placeholders)}@@"
        placeholders[key] = match.group(0)
        return key

    return MATH_PATTERN.sub(_replace, text), placeholders


def restore_math(text: str, placeholders: dict[str, str]) -> str:
    """Restore LaTeX from placeholders."""
    for key, value in placeholders.items():
        text = text.replace(key, value)
    return text
