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
    from lib.translation_router import translate_with_nllb, translate_with_openrouter, translate_with_groq
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
            translated_text = next(parts_iter, None)
            if translated_text is not None:
                new_s["content"] = translated_text.strip()
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

    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
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
                self._send_json(413, {"error": "Request too large"}, origin)
                return

            body = self.rfile.read(content_length)
            data = json.loads(body.decode("utf-8"))

            sections = data.get("text_sections", [])
            source_lang = data.get("source_lang", "ro")
            target_lang = data.get("target_lang", "sk")
            engine = data.get("translate_engine", "gemini")

            if not sections:
                self._send_json(400, {"error": "No text_sections provided"}, origin)
                return

            t0 = time.time()

            # Collect all translatable text (recursive — includes two_column sub-sections)
            SEP = "\n|||SEP|||\n"
            texts = _collect_texts_recursive(sections)
            batch = SEP.join(texts)

            # Translate — chain: DeepL → NLLB → OpenRouter → Gemini → Groq
            prov = "unknown"
            try:
                if engine == "deepl" and _HAS_DEEPL and os.environ.get("DEEPL_API_KEY", "").strip():
                    try:
                        protected = protect_for_deepl(batch)
                        translated = _deepl_translate(protected, target_lang, source_lang)
                        translated = restore_from_deepl(translated)
                        prov = "DeepL"
                    except Exception as deepl_err:
                        print(f"[TRANSLATE-TEXT] DeepL failed: {deepl_err}, trying NLLB", file=sys.stderr)
                        if _HAS_EXTRA_PROVIDERS and os.environ.get("HF_TOKEN", "").strip():
                            try:
                                translated = translate_with_nllb(batch, source_lang, target_lang)
                                prov = "NLLB"
                            except Exception as nllb_err:
                                print(f"[TRANSLATE-TEXT] NLLB failed: {nllb_err}, trying OpenRouter", file=sys.stderr)
                                if os.environ.get("OPENROUTER_API_KEY", "").strip():
                                    try:
                                        translated = translate_with_openrouter(batch, source_lang, target_lang)
                                        prov = "OpenRouter"
                                    except Exception as or_err:
                                        print(f"[TRANSLATE-TEXT] OpenRouter failed: {or_err}, using Gemini", file=sys.stderr)
                                        translated = _gemini_translate(batch, source_lang, target_lang)
                                        prov = "Gemini (fallback)"
                                else:
                                    translated = _gemini_translate(batch, source_lang, target_lang)
                                    prov = "Gemini (fallback)"
                        else:
                            translated = _gemini_translate(batch, source_lang, target_lang)
                            prov = "Gemini (fallback)"
                else:
                    try:
                        translated = _gemini_translate(batch, source_lang, target_lang)
                        prov = "Gemini"
                    except Exception as gem_err:
                        print(f"[TRANSLATE-TEXT] Gemini failed: {gem_err}, trying NLLB", file=sys.stderr)
                        if _HAS_EXTRA_PROVIDERS and os.environ.get("HF_TOKEN", "").strip():
                            try:
                                translated = translate_with_nllb(batch, source_lang, target_lang)
                                prov = "NLLB"
                            except Exception:
                                if _HAS_EXTRA_PROVIDERS:
                                    translated = translate_with_groq(batch, source_lang, target_lang)
                                    prov = "Groq (fallback)"
                                else:
                                    raise
                        elif _HAS_EXTRA_PROVIDERS:
                            translated = translate_with_groq(batch, source_lang, target_lang)
                            prov = "Groq (fallback)"
                        else:
                            raise
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
            self._send_json(400, {"error": "Invalid JSON"}, origin)
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
