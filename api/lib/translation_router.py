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

try:
    from .math_protect import protect_with_placeholders, restore_from_placeholders
except ImportError:
    pass


__all__ = [
    "translate_with_groq",
    "translate_with_nllb",
    "translate_with_openrouter",
    "translate_with_azure",
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


def translate_with_azure(text: str, source_lang: str, target_lang: str, dict_terms: list[dict] | None = None) -> str:
    """Azure Translator (NMT) — 2M caractere/lună/cheie GRATUIT (×2 chei = 4M/lună).

    Cel mai mare tier gratuit de traducere pe care-l deține Roland — adăugat 2026-08-20
    ca să nu se mai epuizeze DeepL (500K/cheie). Protejează inline LaTeX/SVG cu
    placeholdere `__MATH_N__` (NMT pur, fără prompt). Failover AZURE_TRANSLATOR_KEY →
    _2 pe eroare de autentificare. Regiunea resursei via AZURE_TRANSLATOR_REGION
    (default 'global' — resursele Translator globale; pt o resursă regională setează
    ex. 'westeurope'). Limită Azure: 50.000 caractere/cerere.

    NECESITĂ în env Vercel (traduceri-api): AZURE_TRANSLATOR_KEY [+ _2] [+ _REGION].
    Fără cheie → RuntimeError (prins de lanț, trece la următorul provider).
    """
    key1 = os.environ.get("AZURE_TRANSLATOR_KEY", "").strip()
    key2 = os.environ.get("AZURE_TRANSLATOR_KEY_2", "").strip()
    if not key1 and not key2:
        raise RuntimeError("AZURE_TRANSLATOR_KEY not set — Azure translation unavailable")
    region = os.environ.get("AZURE_TRANSLATOR_REGION", "global").strip() or "global"

    lang_map = {"ro": "ro", "sk": "sk", "en": "en", "de": "de"}
    src = lang_map.get(source_lang, source_lang)
    tgt = lang_map.get(target_lang, target_lang)

    # Protecție inline-math (Azure e NMT pur — fără promptul care ține LaTeX-ul intact).
    protected, mapping = protect_with_placeholders(text)
    if len(protected) > 50000:
        raise RuntimeError(f"Azure: text prea lung ({len(protected)} > 50000 chars) — trece la fallback")

    url = (
        "https://api.cognitive.microsofttranslator.com/translate"
        f"?api-version=3.0&from={src}&to={tgt}"
    )
    body = json.dumps([{"Text": protected}]).encode("utf-8")

    print(f"[TRANSLATE] Azure: {src} -> {tgt}, {len(text)} chars, region={region}", file=sys.stderr)

    def _call(k: str):
        req = urllib.request.Request(
            url,
            data=body,
            headers={
                "Ocp-Apim-Subscription-Key": k,
                "Ocp-Apim-Subscription-Region": region,
                "Content-Type": "application/json; charset=UTF-8",
            },
        )
        # timeout < maxDuration 60s; Azure e rapid (<3s tipic).
        with urllib.request.urlopen(req, timeout=25) as resp:
            return json.loads(resp.read().decode("utf-8"))

    last_err: Exception | None = None
    for kn, key in [("KEY1", key1), ("KEY2", key2)]:
        if not key:
            continue
        try:
            data = retry_with_backoff(lambda k=key: _call(k), max_retries=1, base_delay=2.0)
            translated = data[0]["translations"][0]["text"]
            return restore_from_placeholders(translated, mapping)
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="replace")[:200]
            if e.code in (401, 403):
                print(f"[AZURE] {kn} auth error {e.code}, trying next key", file=sys.stderr)
                last_err = RuntimeError(f"Azure auth {e.code}")
                continue
            print(f"[AZURE] {kn} error {e.code}: {err_body}", file=sys.stderr)
            raise RuntimeError(f"Azure API error {e.code}: {err_body}")
        except Exception as e:
            last_err = e
            print(f"[AZURE] {kn} error: {e}", file=sys.stderr)
            continue
    raise last_err or RuntimeError("Azure translation failed (all keys)")


# NLLB language codes. `de` was MISSING here until 2026-09-08: a German request fell
# through to a "slk_Latn" default and came back in SLOVAK, status 200, no error
# anywhere — a confident wrong answer, the worst kind of failure. Found by the
# requirements auditor while checking Roland's decision 2c (SK + EN + DE).
NLLB_LANG_MAP = {
    "ro": "ron_Latn",
    "sk": "slk_Latn",
    "en": "eng_Latn",
    "de": "deu_Latn",
}


def nllb_codes(source_lang: str, target_lang: str) -> tuple[str, str]:
    """Map a language pair to NLLB codes. NO silent defaults.

    An unsupported language must raise, so the provider chain falls through to the
    next translator instead of returning fluent text in the wrong language.
    """
    if source_lang not in NLLB_LANG_MAP or target_lang not in NLLB_LANG_MAP:
        raise RuntimeError(
            f"NLLB: unsupported language pair {source_lang}->{target_lang} "
            f"(supported: {', '.join(sorted(NLLB_LANG_MAP))})"
        )
    return NLLB_LANG_MAP[source_lang], NLLB_LANG_MAP[target_lang]


def translate_with_nllb(text: str, source_lang: str, target_lang: str, dict_terms: list[dict] | None = None) -> str:
    """G3 — Translate using NLLB-200 via HuggingFace Inference API.

    Direct ro->sk without English pivot. 1000 req/day free.
    Note: cold start 30-60s if model is not loaded; subsequent calls are fast.
    """
    hf_token = os.environ.get("HF_TOKEN", "").strip()
    if not hf_token:
        raise RuntimeError("HF_TOKEN not set — NLLB translation unavailable")

    src_code, tgt_code = nllb_codes(source_lang, target_lang)

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
    """G4 — Translate via OpenRouter (explicit free model, R-COST).

    M2 (audit 2026-08-10): era `openrouter/auto`, care alege dintre TOATE
    modelele disponibile pe cont (nu doar cele gratuite) — fara cost-cap,
    contrazicea R-COST. Model explicit, acelasi din whitelist-ul deja folosit
    de `frontend/src/app/api/proxy/route.ts` (`MODEL_ALLOW.openrouter`).
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
        "model": "meta-llama/llama-3.3-70b-instruct:free",
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
