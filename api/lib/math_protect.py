"""Protect and restore LaTeX/math content during translation.

Wraps LaTeX formulas in <keep>...</keep> XML tags so DeepL's
tag_handling='xml' + ignore_tags='keep' preserves them untouched.
Also protects SVG/HTML blocks.
"""

from __future__ import annotations

import re

# LaTeX / math / HTML spans to protect (order = priority; most specific first).
# SVG before generic HTML so a <div><svg>…</svg></div> figure matches as one span.
_PROTECT_PATTERNS = [
    r"\$\$[\s\S]+?\$\$",                                      # Display math $$...$$
    r"\$[^\$\n]+?\$",                                         # Inline math $...$
    r"\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}",               # LaTeX environments
    r"\\[a-zA-Z]+\{[^}]*\}",                                  # Commands like \text{cm}
    r"\\[a-zA-Z]+",                                           # Simple commands like \triangle
    r"<div[^>]*>[\s\S]*?<svg[\s\S]*?</svg>[\s\S]*?</div>",    # SVG figure wrappers
    r"<(?:div|svg|table)[^>]*>[\s\S]*?</(?:div|svg|table)>",  # Generic HTML blocks
]
_PROTECT_RE = re.compile("|".join("(?:" + p + ")" for p in _PROTECT_PATTERNS))

# Backwards-compatible names for any external importers.
LATEX_PATTERNS = _PROTECT_PATTERNS[:5]
SVG_PATTERN = _PROTECT_PATTERNS[5]
HTML_BLOCK_PATTERN = _PROTECT_PATTERNS[6]


def _xml_escape(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _xml_unescape(s: str) -> str:
    # Reverse of _xml_escape, plus the apostrophe/quote numeric entities DeepL's
    # XML output can emit (&#39;/&apos;, &#34;/&quot;). &amp; is decoded LAST so an
    # escaped literal like &amp;lt; is not double-decoded.
    s = s.replace("&lt;", "<").replace("&gt;", ">")
    s = re.sub(r"&(?:#0*39|apos);", "'", s)
    s = re.sub(r"&(?:#0*34|quot);", '"', s)
    return s.replace("&amp;", "&")


def protect_for_deepl(text: str) -> str:
    """Wrap LaTeX/HTML spans in <keep> tags for DeepL XML mode (single pass).

    DeepL with tag_handling='xml' + ignore_tags='keep' leaves <keep>...</keep>
    content untranslated. This runs in ONE pass so a protected span is never
    re-scanned by a later pattern (the old sequential re.sub produced nested,
    mismatched <keep> tags → DeepL "Tag handling parsing failed"). All text is
    XML-escaped too, so math containing <, >, & (e.g. an inequality $a < b$)
    can't break DeepL's XML parser. restore_from_deepl() reverses both steps.
    """
    out = []
    last = 0
    for m in _PROTECT_RE.finditer(text):
        between = text[last:m.start()]
        # Move a single space that sits right before the formula INSIDE the <keep>
        # tag. DeepL's XML tag handling trims whitespace between a word and an
        # inline tag ("je <keep>$60$</keep>" → "je<keep>...") which restored as
        # "je$60$" — a missing space before every formula. Keeping the space
        # inside the ignored region makes DeepL preserve it verbatim.
        lead = ""
        if between.endswith(" "):
            lead, between = " ", between[:-1]
        out.append(_xml_escape(between))
        out.append("<keep>" + lead + _xml_escape(m.group(0)) + "</keep>")
        last = m.end()
    out.append(_xml_escape(text[last:]))
    return "".join(out)


def restore_from_deepl(text: str) -> str:
    """Strip <keep> wrappers and undo XML escaping after DeepL translation."""
    text = text.replace("<keep>", "").replace("</keep>", "")
    return _xml_unescape(text)


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
