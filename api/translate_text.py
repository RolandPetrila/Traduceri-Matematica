"""Translate text-only endpoint for live language switching.

POST /api/translate-text
Body: JSON {text_sections: [...], source_lang, target_lang, translate_engine}
Returns: JSON {translated_sections: [...]}

No OCR — translates pre-extracted text sections while preserving figures/SVG.
"""

from __future__ import annotations

from http.server import BaseHTTPRequestHandler
import json
import os
import sys
import time

_api_dir = os.path.dirname(os.path.abspath(__file__))
if _api_dir not in sys.path:
    sys.path.insert(0, _api_dir)

try:
    from lib.deepl_client import translate_text as _deepl_translate
    from lib.math_protect import protect_for_deepl, restore_from_deepl
    _HAS_DEEPL = True
except ImportError:
    _HAS_DEEPL = False

try:
    from lib.translation_router import (
        translate_with_nllb,
        translate_with_openrouter,
        translate_with_groq,
        translate_with_azure,
    )
    _HAS_EXTRA_PROVIDERS = True
except ImportError:
    _HAS_EXTRA_PROVIDERS = False


def _collect_texts_recursive(sections: list) -> list:
    """Recursively collect translatable texts from sections (including two_column sub-sections)."""
    texts = []
    for s in sections:
        if s.get("type") == "figure":
            pass  # figures have no translatable text
        elif s.get("type") == "two_column":
            texts.extend(_collect_texts_recursive(s.get("left", [])))
            texts.extend(_collect_texts_recursive(s.get("right", [])))
        else:
            texts.append(s.get("content", ""))
    return texts


def _run_translation_chain(batch: str, source_lang: str, target_lang: str, engine: str):
    """Lanț de traducere ordonat. Întoarce (translated, provider_name); ridică ultima
    eroare dacă toți providerii cad.

    engine 'deepl' (default F8): DeepL → Azure → NLLB → OpenRouter → Gemini.
    altfel:                      Gemini → Azure → NLLB.

    Azure Translator (2026-08-20) adaugă 4M caractere/lună gratuit → plafonul DeepL de
    1M nu mai e gâtuire. Fiecare provider se auto-protejează pe cheie lipsă (ridică →
    trece la următorul). Refactor dintr-un if/else imbricat de 60 de linii (mai ușor de
    întreținut + testabil — vezi api/tests/test_translate_chain.py). Groq scos din lanț
    (mort 404, verificat live 2026-08-20)."""
    def _deepl():
        protected = protect_for_deepl(batch)
        return restore_from_deepl(_deepl_translate(protected, target_lang, source_lang))

    def _env(name: str) -> bool:
        return bool(os.environ.get(name, "").strip())

    deepl_ok = _HAS_DEEPL and (_env("DEEPL_API_KEY") or _env("DEEPL_API_KEY_2"))
    azure_ok = _HAS_EXTRA_PROVIDERS and (_env("AZURE_TRANSLATOR_KEY") or _env("AZURE_TRANSLATOR_KEY_2"))
    hf_ok = _HAS_EXTRA_PROVIDERS and _env("HF_TOKEN")
    or_ok = _HAS_EXTRA_PROVIDERS and _env("OPENROUTER_API_KEY")

    azure = ("Azure Translator", azure_ok, lambda: translate_with_azure(batch, source_lang, target_lang))
    nllb = ("NLLB", hf_ok, lambda: translate_with_nllb(batch, source_lang, target_lang))
    gemini = ("Gemini", True, lambda: _gemini_translate(batch, source_lang, target_lang))

    if engine == "deepl":
        candidates = [
            ("DeepL", deepl_ok, _deepl),
            azure,
            nllb,
            ("OpenRouter", or_ok, lambda: translate_with_openrouter(batch, source_lang, target_lang)),
            ("Gemini (fallback)", True, lambda: _gemini_translate(batch, source_lang, target_lang)),
        ]
    else:
        candidates = [gemini, azure, nllb]

    last_err: Exception | None = None
    for name, ok, fn in candidates:
        if not ok:
            continue
        try:
            return fn(), name
        except Exception as e:  # noqa: BLE001 — colectăm + trecem la următorul provider
            last_err = e
            print(f"[TRANSLATE-TEXT] {name} failed: {e}", file=sys.stderr)
            continue
    raise last_err or RuntimeError("Niciun provider de traducere disponibil")


def _reattach_boundary_whitespace(original: str, translated: str) -> str:
    """Restaureaza spatiul de la marginea sectiunii EXACT din sursa, indiferent ce
    a facut providerul cu el (DeepL, la traducerea batch-ului unit cu SEP, nu
    pastreaza sistematic spatiul de margine al fiecarui fragment).

    Sectiunile trimise la traducere sunt fragmente dintr-o SINGURA propozitie,
    rupte la fiecare granita de marcaj (bold/italic) de `segmentInline`
    (editor-translate.ts) — spatiul de la margine e SINGURUL lucru care le leaga
    de vecini ("Triunghiul este " + "dreptunghic" trebuie sa redea "Triunghiul
    este dreptunghic", nu "...estedreptunghic"). Un `.strip()` necondiționat pe
    rezultatul providerului distrugea exact acel spatiu (P3, Faza 4.5b — vezi
    docs/PLAN_FAZA4.5B_TRADUCERE_F8_2026-09-10.md).

    Spatiul nu are nevoie de traducere — e identic in orice limba. Deci: extrage
    lead/trail din SURSA, ia doar miezul tradus (strip pe orice a scurs de la
    provider, inclusiv reziduuri de separator), reataseaza spatiul original.
    O sectiune formata DOAR din spatiu (sau goala) nu are ce sa traduca — trece
    neschimbata, byte-exact (acopera si spatiul insecabil U+00A0, care e tratat
    ca whitespace de `str.strip()`).
    """
    core_src = original.strip()
    if not core_src:
        return original
    lead = original[: len(original) - len(original.lstrip())]
    trail = original[len(original.rstrip()):]
    return lead + translated.strip() + trail


def _apply_translations_recursive(sections: list, parts_iter) -> list:
    """Recursively apply translated texts back to sections in order."""
    result = []
    for s in sections:
        if s.get("type") == "figure":
            result.append(s)
        elif s.get("type") == "two_column":
            new_s = dict(s)
            new_s["left"] = _apply_translations_recursive(s.get("left", []), parts_iter)
            new_s["right"] = _apply_translations_recursive(s.get("right", []), parts_iter)
            result.append(new_s)
        else:
            new_s = dict(s)
            original = s.get("content", "") or ""
            translated_text = next(parts_iter, None)
            if translated_text is not None:
                new_s["content"] = _reattach_boundary_whitespace(original, translated_text)
            result.append(new_s)
    return result


def _gemini_translate(text: str, source_lang: str, target_lang: str) -> str:
    """Translate text using Gemini API.

    LaTeX/SVG spans are swapped for __MATH_N__ placeholders before the call and
    restored after (same approach as translate.py). An LLM may ignore a "preserve
    LaTeX" instruction and mangle a formula; opaque placeholders make that
    impossible on the primary text. R-MATH: losing a math element = critical bug.
    """
    api_key = os.environ.get("GOOGLE_AI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GOOGLE_AI_API_KEY not set")

    from lib.math_protect import protect_with_placeholders, restore_from_placeholders
    protected, placeholders = protect_with_placeholders(text)

    import urllib.request
    lang_names = {"ro": "Romanian", "sk": "Slovak", "en": "English", "de": "German"}
    src = lang_names.get(source_lang, source_lang)
    tgt = lang_names.get(target_lang, target_lang)

    prompt = (
        f"Translate the following {src} math text to {tgt}. "
        "Keep every __MATH_N__ token EXACTLY as written (do not translate, space out, "
        "renumber, or remove them). Preserve ALL markdown formatting. "
        "Translate ONLY the natural language text. Return ONLY the translation.\n\n"
        f"{protected}"
    )

    # gemini-3.6-flash: upgrade de la gemini-2.5-flash (2026-08-08, cercetare
    # de upgrade) — confirmat empiric gratuit + mai rapid la calitate egala/mai
    # buna (vezi .claude-outputs/research/). translation_router.py incearca
    # deja alti provideri (NLLB/OpenRouter/Groq) daca acest apel esueaza.
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent"
    payload = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
    }).encode("utf-8")

    req = urllib.request.Request(url, data=payload, headers={
        "Content-Type": "application/json",
        "x-goog-api-key": api_key,
    })
    try:
        with urllib.request.urlopen(req, timeout=55) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        raise RuntimeError(f"Gemini translation timeout/error: {e}")
    translated = data["candidates"][0]["content"]["parts"][0]["text"]
    return restore_from_placeholders(translated, placeholders)


def _translate_each(texts: list, source_lang: str, target_lang: str, engine: str) -> list:
    """Translate texts ONE BY ONE — alignment-safe fallback for when the batch
    separator gets mangled by the provider.

    The normal path joins all texts with |||SEP||| and splits the result. If the
    provider drops/alters a separator, ``len(parts) != len(texts)`` and the
    batch can no longer be mapped 1:1 onto the source sections — text would land
    on the WRONG section (R-MATH/correctness). This makes N calls (slower) but
    guarantees each translation stays on its own section. Rare path only.

    On a per-text failure, keeps the original text rather than dropping or
    misaligning it. Preserves math protection (DeepL placeholders / Gemini
    __MATH_N__) exactly like the batch path.

    CAVEAT (serverless timeout): this makes N *sequential* calls. On the Gemini
    path each call carries timeout=55, so a page with many sections could exceed
    the 60s function limit → 500. DeepL is sub-second/call so it's safe there.
    Acceptable because this path is rare (only on separator mangling) and failing
    loud beats silent misalignment; revisit (batch-retry or bounded concurrency)
    if it ever fires in practice.
    """
    use_deepl = bool(
        engine == "deepl"
        and _HAS_DEEPL
        and os.environ.get("DEEPL_API_KEY", "").strip()
    )
    out = []
    for t in texts:
        if not t or not t.strip():
            out.append(t)
            continue
        try:
            if use_deepl:
                protected = protect_for_deepl(t)
                translated = _deepl_translate(protected, target_lang, source_lang)
                out.append(restore_from_deepl(translated))
            else:
                out.append(_gemini_translate(t, source_lang, target_lang))
        except Exception as each_err:
            print(f"[TRANSLATE-TEXT] per-section translate failed: {each_err}", file=sys.stderr)
            out.append(t)  # keep original — never misalign or drop
    return out


class handler(BaseHTTPRequestHandler):
    """Translate text sections only — no OCR, no file upload."""

    def do_OPTIONS(self):
        # 200, NOT 204: on Vercel's Python runtime a 204 No-Content OPTIONS drops the
        # subsequently-set CORS headers (Allow-Methods/Allow-Headers survive only on a
        # 200), which fails the browser preflight for this JSON POST endpoint → every
        # in-browser translation call errored with "Failed to fetch" while curl (no
        # preflight) still passed. Every other endpoint here uses 200; match them.
        origin = os.environ.get("ALLOWED_ORIGIN", "*")
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Max-Age", "86400")
        self.end_headers()

    def do_POST(self):
        origin = os.environ.get("ALLOWED_ORIGIN", "*")
        try:
            from lib.rate_limiter import reject_if_limited
            if reject_if_limited(self, "/api/translate-text"):
                return

            content_length = int(self.headers.get("Content-Length", 0))
            # Vercel rejects any request body over ~4.5MB at the platform edge
            # (413 FUNCTION_PAYLOAD_TOO_LARGE) BEFORE this handler runs, so the app
            # check must sit below that to return a clean JSON error instead of an
            # opaque platform 413. The client currently echoes figure crops (img_b64)
            # through this text endpoint, inflating the body; a page whose crops push
            # it past ~4MB will 413. Proper fix (follow-up): strip img_b64 client-side
            # before POST (translation needs no image data) and re-attach after.
            if content_length > 4_000_000:  # 4MB — under Vercel's ~4.5MB body cap
                from lib.exceptions import RequestTooLarge
                raise RequestTooLarge("Request too large")

            body = self.rfile.read(content_length)
            data = json.loads(body.decode("utf-8"))

            sections = data.get("text_sections", [])
            source_lang = data.get("source_lang", "ro")
            target_lang = data.get("target_lang", "sk")
            engine = data.get("translate_engine", "gemini")

            if not sections:
                self._send_json(400, {"error": "No text_sections provided", "error_code": "E-APP-001", "status": "error"}, origin)
                return

            t0 = time.time()

            # Collect all translatable text (recursive — includes two_column sub-sections)
            SEP = "\n|||SEP|||\n"
            texts = _collect_texts_recursive(sections)
            batch = SEP.join(texts)

            # Translate — lanț ordonat (vezi _run_translation_chain):
            # engine 'deepl': DeepL → Azure → NLLB → OpenRouter → Gemini.
            prov = "unknown"
            try:
                translated, prov = _run_translation_chain(
                    batch, source_lang, target_lang, engine
                )
            except Exception as e:
                try:
                    from lib import supabase_client
                    supabase_client.log_error("E-TRANS-003", str(e), source="translate-text")
                except Exception:
                    pass
                self._send_json(500, {"error": f"Translation failed: {e}", "error_code": "E-TRANS-003"}, origin)
                return

            # Split back and rebuild sections (recursive — two_column sub-sections included)
            parts = translated.split("|||SEP|||")
            if len(parts) != len(texts):
                # The provider altered the |||SEP||| separator → parts no longer
                # map 1:1 onto the source sections. Applying them as-is would land
                # text on the WRONG section (R-MATH/correctness). Recover by
                # re-translating per-section (aligned), and log for diagnostics.
                print(
                    f"[TRANSLATE-TEXT] SEP mismatch: {len(parts)} parts vs {len(texts)} texts "
                    f"— per-section fallback",
                    file=sys.stderr,
                )
                try:
                    from lib import supabase_client
                    supabase_client.log_error(
                        "E-TRANS-004",
                        f"SEP mismatch {len(parts)}!={len(texts)} (prov={prov})",
                        source="translate-text",
                    )
                except Exception:
                    pass
                parts = _translate_each(texts, source_lang, target_lang, engine)

            parts_iter = iter(parts)
            result_sections = _apply_translations_recursive(sections, parts_iter)

            duration_ms = int((time.time() - t0) * 1000)
            print(f"[TRANSLATE-TEXT] {prov}: {len(texts)} sections in {duration_ms}ms", file=sys.stderr)

            self._send_json(200, {
                "translated_sections": result_sections,
                "provider": prov,
                "duration_ms": duration_ms,
                "target_lang": target_lang,
            }, origin)

        except json.JSONDecodeError:
            self._send_json(400, {"error": "Invalid JSON", "error_code": "E-APP-001", "status": "error"}, origin)
        except Exception as e:
            print(f"[TRANSLATE-TEXT] Error: {e}", file=sys.stderr)
            from lib.exceptions import error_response
            status, body = error_response(e, default_code="E-TRANS-001")
            try:
                from lib import supabase_client
                supabase_client.log_error(body["error_code"], str(e), source="translate-text")
            except Exception:
                pass
            self._send_json(status, body, origin)

    def _send_json(self, status: int, data: dict, origin: str = "*"):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", origin)
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))
