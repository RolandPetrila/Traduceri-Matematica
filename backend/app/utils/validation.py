"""Translation validation utilities."""

import re
import unicodedata

LANGUAGE_HINTS: dict[str, set[str]] = {
    "ro": {"este", "sunt", "care", "prin", "pentru", "acest", "unei", "cele", "mai", "fost"},
    "sk": {"ktory", "tento", "jeho", "alebo", "potom", "podla", "takze", "preto", "tiez", "vsak"},
    "en": {"the", "and", "that", "with", "this", "from", "which", "have", "been", "their"},
}

DRAFT_MARKERS = {"TODO", "FIXME", "DRAFT", "PLACEHOLDER", "[TBD]"}


def normalize_text(text: str) -> str:
    """Strip diacritics for comparison."""
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c)).lower()


def detect_language(text: str) -> str:
    """Heuristic language detection using word lists."""
    words = set(re.findall(r"[a-zA-Z\u00C0-\u017F]+", normalize_text(text)))
    scores = {}
    for lang, hints in LANGUAGE_HINTS.items():
        scores[lang] = len(words & hints)
    return max(scores, key=lambda k: scores[k])


def has_draft_markers(text: str) -> bool:
    """Check for forbidden draft markers."""
    upper = text.upper()
    return any(marker in upper for marker in DRAFT_MARKERS)


def validate_translation(text: str, expected_lang: str) -> dict:
    """Validate a translation result."""
    detected = detect_language(text)
    has_drafts = has_draft_markers(text)

    return {
        "detected_language": detected,
        "expected_language": expected_lang,
        "language_match": detected == expected_lang,
        "has_draft_markers": has_drafts,
        "valid": detected == expected_lang and not has_drafts,
    }
