"""Protect and restore LaTeX/math content during translation.

Wraps LaTeX formulas in <keep>...</keep> XML tags so DeepL's
tag_handling='xml' + ignore_tags='keep' preserves them untouched.
Also protects SVG/HTML blocks.
"""

from __future__ import annotations

import re

# LaTeX patterns to protect (order matters — most specific first)
LATEX_PATTERNS = [
    r"\$\$[\s\S]+?\$\$",           # Display math $$...$$
    r"\$[^\$\n]+?\$",              # Inline math $...$
    r"\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}",  # LaTeX environments
    r"\\[a-zA-Z]+\{[^}]*\}",      # Commands like \text{cm}
    r"\\[a-zA-Z]+",               # Simple commands like \triangle
]

SVG_PATTERN = r"<div[^>]*>[\s\S]*?<svg[\s\S]*?</svg>[\s\S]*?</div>"
HTML_BLOCK_PATTERN = r"<(?:div|svg|table)[^>]*>[\s\S]*?</(?:div|svg|table)>"


def protect_for_deepl(text: str) -> str:
    """Wrap LaTeX and HTML blocks in <keep> tags for DeepL XML mode.

    DeepL with tag_handling='xml' and ignore_tags='keep' will not translate
    content inside <keep>...</keep> tags.
    """
    # Protect SVG/HTML blocks first (largest patterns)
    text = re.sub(SVG_PATTERN, lambda m: f"<keep>{m.group(0)}</keep>", text)
    text = re.sub(HTML_BLOCK_PATTERN, lambda m: f"<keep>{m.group(0)}</keep>", text)

    # Protect LaTeX patterns
    for pattern in LATEX_PATTERNS:
        text = re.sub(pattern, lambda m: f"<keep>{m.group(0)}</keep>", text)

    # Collapse nested <keep><keep>...</keep></keep>
    while "<keep><keep>" in text:
        text = text.replace("<keep><keep>", "<keep>").replace("</keep></keep>", "</keep>")

    return text


def restore_from_deepl(text: str) -> str:
    """Remove <keep> wrapper tags after DeepL translation."""
    text = text.replace("<keep>", "").replace("</keep>", "")
    return text


def protect_with_placeholders(text: str) -> tuple[str, dict[str, str]]:
    """Legacy placeholder protection for Gemini/Groq (non-XML translators).

    Replaces LaTeX/SVG with __MATH_N__ placeholders.
    Returns (protected_text, {placeholder: original}).
    """
    placeholders: dict[str, str] = {}
    counter = [0]

    def _replace(match: re.Match) -> str:
        key = f"__MATH_{counter[0]}__"
        placeholders[key] = match.group(0)
        counter[0] += 1
        return key

    for pattern in [SVG_PATTERN] + LATEX_PATTERNS + [HTML_BLOCK_PATTERN]:
        text = re.sub(pattern, _replace, text)
    return text, placeholders


def restore_from_placeholders(text: str, placeholders: dict[str, str]) -> str:
    """Restore LaTeX/SVG from __MATH_N__ placeholders."""
    for key, value in placeholders.items():
        text = text.replace(key, value)
    return text
