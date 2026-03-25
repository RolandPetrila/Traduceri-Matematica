"""DeepL REST API client — 2 keys with auto-fallback, usage tracking.

Uses the free API endpoint (api-free.deepl.com).
Protects LaTeX/math by wrapping in XML <keep> tags with tag_handling='xml' + ignore_tags='keep'.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.request
import urllib.parse
import urllib.error


DEEPL_FREE_URL = "https://api-free.deepl.com/v2/translate"
DEEPL_USAGE_URL = "https://api-free.deepl.com/v2/usage"

# DeepL language codes
LANG_MAP = {
    "ro": "RO",
    "sk": "SK",
    "en": "EN",
}


def _deepl_request(url: str, api_key: str, data: dict | None = None) -> dict:
    """Make a request to DeepL API."""
    headers = {
        "Authorization": f"DeepL-Auth-Key {api_key}",
        "Content-Type": "application/json",
    }
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def get_usage(api_key: str) -> dict:
    """Get DeepL usage stats for a key.

    Returns: {character_count, character_limit, remaining, percent}
    """
    try:
        data = _deepl_request(DEEPL_USAGE_URL, api_key)
        count = data.get("character_count", 0)
        limit = data.get("character_limit", 500000)
        return {
            "character_count": count,
            "character_limit": limit,
            "remaining": limit - count,
            "percent": round((count / limit) * 100, 1) if limit else 0,
        }
    except Exception as e:
        print(f"[DEEPL] Usage check failed: {e}", file=sys.stderr)
        return {"character_count": 0, "character_limit": 0, "remaining": 0, "percent": 0}


def translate_text(
    text: str,
    target_lang: str,
    source_lang: str = "RO",
) -> str:
    """Translate text using DeepL with automatic key fallback.

    Tries DEEPL_API_KEY first, falls back to DEEPL_API_KEY2 on quota error.
    Uses XML tag handling to protect <keep>...</keep> wrapped content.

    Args:
        text: Text to translate (LaTeX already wrapped in <keep> tags)
        target_lang: Target language code (ro, sk, en)
        source_lang: Source language code

    Returns:
        Translated text with <keep> content preserved
    """
    if not text or not text.strip():
        return text

    key1 = os.environ.get("DEEPL_API_KEY", "").strip()
    key2 = os.environ.get("DEEPL_API_KEY2", "").strip()

    if not key1 and not key2:
        raise RuntimeError("No DEEPL_API_KEY set")

    tgt = LANG_MAP.get(target_lang, target_lang.upper())
    src = LANG_MAP.get(source_lang, source_lang.upper())

    payload = {
        "text": [text],
        "target_lang": tgt,
        "source_lang": src,
        "tag_handling": "xml",
        "ignore_tags": ["keep"],
    }

    # Try key1 first
    for key_name, key in [("KEY1", key1), ("KEY2", key2)]:
        if not key:
            continue
        try:
            result = _deepl_request(DEEPL_FREE_URL, key, payload)
            translated = result["translations"][0]["text"]
            print(f"[DEEPL] OK ({key_name}): {len(text)} → {len(translated)} chars, {src}→{tgt}", file=sys.stderr)
            return translated
        except urllib.error.HTTPError as e:
            if e.code == 456:  # Quota exceeded
                print(f"[DEEPL] {key_name} quota exceeded, trying next key", file=sys.stderr)
                continue
            elif e.code == 403:  # Forbidden (invalid key)
                print(f"[DEEPL] {key_name} forbidden (invalid key), trying next", file=sys.stderr)
                continue
            else:
                error_body = e.read().decode("utf-8", errors="replace")[:200]
                print(f"[DEEPL] {key_name} error {e.code}: {error_body}", file=sys.stderr)
                raise RuntimeError(f"DeepL API error {e.code}: {error_body}")
        except Exception as e:
            print(f"[DEEPL] {key_name} error: {e}", file=sys.stderr)
            if key_name == "KEY2":
                raise
            continue

    raise RuntimeError("Both DeepL API keys exhausted or invalid")
