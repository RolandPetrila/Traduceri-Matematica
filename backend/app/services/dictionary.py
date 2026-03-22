import json
from pathlib import Path

from app.config import DICTIONARY_DIR


def _dict_path(source: str, target: str) -> Path:
    return DICTIONARY_DIR / f"math_terms_{source}_{target}.json"


def load_dictionary(source_lang: str, target_lang: str) -> dict[str, str]:
    """Load terminological dictionary for a language pair."""
    path = _dict_path(source_lang, target_lang)
    if path.exists():
        data = json.loads(path.read_text(encoding="utf-8"))
        return {entry["source"]: entry["target"] for entry in data}
    return {}


def save_dictionary(source_lang: str, target_lang: str, entries: dict[str, str]) -> None:
    """Save terminological dictionary."""
    DICTIONARY_DIR.mkdir(parents=True, exist_ok=True)
    data = [{"source": k, "target": v, "domain": "math"} for k, v in entries.items()]
    _dict_path(source_lang, target_lang).write_text(
        json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def apply_dictionary(text: str, source_lang: str, target_lang: str) -> str:
    """Apply terminological dictionary replacements to translated text."""
    terms = load_dictionary(source_lang, target_lang)
    for source_term, target_term in terms.items():
        text = text.replace(source_term, target_term)
    return text
