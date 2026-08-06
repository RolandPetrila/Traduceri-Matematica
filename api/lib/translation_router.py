"""Fallback translation providers: NLLB (HuggingFace), OpenRouter, Groq.

Folosite de `api/translate_text.py` ca lanț de rezervă după DeepL/Gemini
(vezi `lib/deepl_client.py` pt DeepL, apelul Gemini inline din `translate_text.py`
pt calea principală). Restul funcțiilor din acest modul (Gemini OCR/traducere
directă, Mistral Pixtral OCR, integrare Claude/Anthropic, extragere DOCX) au
fost ȘTERSE 2026-08-07 (curățenie /improve #9) — erau cod mort rămas din
pipeline-ul vechi `api/translate.py` (șters, commit `d2749d7`), fără niciun
apelant în handler-ele curente. Recuperabile din git la commit `28e3031`
dacă e nevoie vreodată de integrarea Claude sau de calea Gemini/Mistral OCR
directă din acest modul (nu confundă cu `ocr_structured.py`, care e activ).
"""
from __future__ import annotations

import json
import os
import sys
import urllib.request
import urllib.error

try:
    from .retry import retry_with_backoff
except ImportError:
    from lib.retry import retry_with_backoff


__all__ = [
    "translate_with_groq",
    "translate_with_nllb",
    "translate_with_openrouter",
]


def _format_dict_terms(terms: list[dict]) -> str:
    """Format dictionary terms as a glossary block for the translation prompt."""
    if not terms:
        return ""
    lines = [f"  {t['source']} → {t['target']}" for t in terms if t.get("source") and t.get("target")]
    if not lines:
        return ""
    return (
        "\n\nMANDATORY TERMINOLOGY — use these exact translations:\n"
        + "\n".join(lines)
        + "\n"
    )


def translate_with_groq(text: str, source_lang: str, target_lang: str, dict_terms: list[dict] | None = None) -> str:
    """Call Groq REST API (OpenAI-compatible) directly."""
    api_key = os.environ.get("GROQ_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GROQ_API_KEY not set")

    lang_names = {"ro": "Romanian", "sk": "Slovak", "en": "English"}
    src = lang_names.get(source_lang, source_lang)
    tgt = lang_names.get(target_lang, target_lang)

    glossary = _format_dict_terms(dict_terms or [])
    print(f"[TRANSLATE] Groq fallback: {source_lang} -> {target_lang}", file=sys.stderr)
    url = "https://api.groq.com/openai/v1/chat/completions"
    system_prompt = (
        f"You are a math textbook translator from {src} to {tgt}.\n"
        "RULES:\n"
        "- Preserve ALL LaTeX ($...$, $$...$$), HTML/SVG blocks, Markdown formatting EXACTLY\n"
        "- Preserve placeholders like __MATH_N__ without modification\n"
        "- Translate ONLY natural language text\n"
        f"- Use correct {tgt} mathematical terminology with proper diacritics\n"
        "- Keep paragraph structure and line breaks identical\n"
        "- Output ONLY the translated text, no explanations"
        f"{glossary}"
    )
    payload = json.dumps({
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text},
        ],
        "temperature": 0.1,
        "max_tokens": 4096,
    }).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    })

    def _call():
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))

    try:
        data = retry_with_backoff(_call, max_retries=2, base_delay=1.0)
        return data["choices"][0]["message"]["content"]
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        print(f"[GROQ ERROR] Status {e.code}: {error_body[:500]}", file=sys.stderr)
        raise RuntimeError(f"Groq API error {e.code}: {error_body[:200]}")


def translate_with_nllb(text: str, source_lang: str, target_lang: str, dict_terms: list[dict] | None = None) -> str:
    """G3 — Translate using NLLB-200 via HuggingFace Inference API.

    Direct ro->sk without English pivot. 1000 req/day free.
    Note: cold start 30-60s if model is not loaded; subsequent calls are fast.
    """
    hf_token = os.environ.get("HF_TOKEN", "").strip()
    if not hf_token:
        raise RuntimeError("HF_TOKEN not set — NLLB translation unavailable")

    # NLLB language codes
    lang_map = {"ro": "ron_Latn", "sk": "slk_Latn", "en": "eng_Latn"}
    src_code = lang_map.get(source_lang, "ron_Latn")
    tgt_code = lang_map.get(target_lang, "slk_Latn")

    print(f"[TRANSLATE] NLLB HF: {source_lang}({src_code}) -> {target_lang}({tgt_code}), {len(text)} chars", file=sys.stderr)

    # Truncate to NLLB max input (512 tokens ~ 400 words)
    # For longer texts the caller should split into paragraphs
    payload = json.dumps({
        "inputs": text[:1800],
        "parameters": {
            "src_lang": src_code,
            "tgt_lang": tgt_code,
            "max_length": 512,
        },
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api-inference.huggingface.co/models/facebook/nllb-200-distilled-1.3B",
        data=payload,
        headers={
            "Authorization": f"Bearer {hf_token}",
            "Content-Type": "application/json",
        },
    )

    def _call():
        # S4: timeout < maxDuration 60s. NLLB warm = <10s; 503 (cold-start) revine
        # imediat (nu prin timeout) → o singură reîncercare prinde modelul cald.
        # 25 + 3 (backoff) + 25 = 53s < 60s (era 90×3 + backoff → mult peste 60).
        with urllib.request.urlopen(req, timeout=25) as resp:
            return json.loads(resp.read().decode("utf-8"))

    try:
        data = retry_with_backoff(_call, max_retries=1, base_delay=3.0)
        if isinstance(data, list) and data:
            return data[0].get("translation_text", "")
        raise RuntimeError(f"NLLB unexpected response format: {str(data)[:200]}")
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        # 503 = model loading (cold start) — surface as retriable
        if e.code == 503:
            raise RuntimeError(f"NLLB model loading (cold start), retry in 30s: {error_body[:100]}")
        print(f"[NLLB ERROR] Status {e.code}: {error_body[:300]}", file=sys.stderr)
        raise RuntimeError(f"NLLB API error {e.code}: {error_body[:200]}")


def translate_with_openrouter(text: str, source_lang: str, target_lang: str, dict_terms: list[dict] | None = None) -> str:
    """G4 — Translate via OpenRouter with automatic free model fallback.

    Uses openrouter/auto which selects the best available free model.
    Fallback chain: Llama 3.3 70B -> DeepSeek V3 -> Gemma 3 27B.
    50 req/day free (no balance), 1000 req/day with $10 balance.
    """
    api_key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY not set — OpenRouter translation unavailable")

    lang_names = {"ro": "Romanian", "sk": "Slovak", "en": "English"}
    src = lang_names.get(source_lang, source_lang)
    tgt = lang_names.get(target_lang, target_lang)

    glossary = _format_dict_terms(dict_terms or [])
    print(f"[TRANSLATE] OpenRouter auto: {source_lang} -> {target_lang}, {len(text)} chars", file=sys.stderr)

    system_prompt = (
        f"You are a math textbook translator from {src} to {tgt}.\n"
        "RULES:\n"
        "- Preserve ALL LaTeX ($...$, $$...$$), HTML/SVG blocks, Markdown formatting EXACTLY\n"
        "- Preserve placeholders like __MATH_N__ without modification\n"
        "- Translate ONLY natural language text\n"
        f"- Use correct {tgt} mathematical terminology with proper diacritics\n"
        "- Keep paragraph structure and line breaks identical\n"
        "- Output ONLY the translated text, no explanations"
        f"{glossary}"
    )

    payload = json.dumps({
        "model": "openrouter/auto",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text},
        ],
        "temperature": 0.1,
        "max_tokens": 4096,
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
            "X-OR-Fallback": "meta-llama/llama-3.3-70b:free,deepseek/deepseek-v3:free,google/gemma-3-27b:free",
            "HTTP-Referer": os.environ.get("APP_PUBLIC_URL", "https://traduceri-matematica.vercel.app"),
        },
    )

    def _call():
        with urllib.request.urlopen(req, timeout=45) as resp:
            return json.loads(resp.read().decode("utf-8"))

    try:
        data = retry_with_backoff(_call, max_retries=2, base_delay=2.0)
        return data["choices"][0]["message"]["content"]
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        print(f"[OPENROUTER ERROR] Status {e.code}: {error_body[:300]}", file=sys.stderr)
        raise RuntimeError(f"OpenRouter API error {e.code}: {error_body[:200]}")
