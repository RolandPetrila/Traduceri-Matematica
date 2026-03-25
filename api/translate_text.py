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


def _gemini_translate(text: str, source_lang: str, target_lang: str) -> str:
    """Translate text using Gemini API."""
    api_key = os.environ.get("GOOGLE_AI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GOOGLE_AI_API_KEY not set")

    import urllib.request
    lang_names = {"ro": "Romanian", "sk": "Slovak", "en": "English"}
    src = lang_names.get(source_lang, source_lang)
    tgt = lang_names.get(target_lang, target_lang)

    prompt = (
        f"Translate the following {src} math text to {tgt}. "
        "Preserve ALL LaTeX formulas exactly. Preserve ALL markdown formatting. "
        "Translate ONLY the natural language text. Return ONLY the translation.\n\n"
        f"{text}"
    )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    payload = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
    }).encode("utf-8")

    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return data["candidates"][0]["content"]["parts"][0]["text"]


class handler(BaseHTTPRequestHandler):
    """Translate text sections only — no OCR, no file upload."""

    def do_OPTIONS(self):
        origin = os.environ.get("ALLOWED_ORIGIN", "https://traduceri-matematica-7sh7.onrender.com")
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Max-Age", "86400")
        self.end_headers()

    def do_POST(self):
        origin = os.environ.get("ALLOWED_ORIGIN", "https://traduceri-matematica-7sh7.onrender.com")
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            if content_length > 1_000_000:  # 1MB max for text-only
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

            # Collect all translatable text
            SEP = "\n|||SEP|||\n"
            texts = [s.get("content", "") for s in sections if s.get("type") != "figure"]
            batch = SEP.join(texts)

            # Translate
            try:
                if engine == "deepl" and _HAS_DEEPL and os.environ.get("DEEPL_API_KEY", "").strip():
                    try:
                        protected = protect_for_deepl(batch)
                        translated = _deepl_translate(protected, target_lang, source_lang)
                        translated = restore_from_deepl(translated)
                        prov = "DeepL"
                    except Exception:
                        translated = _gemini_translate(batch, source_lang, target_lang)
                        prov = "Gemini (fallback)"
                else:
                    translated = _gemini_translate(batch, source_lang, target_lang)
                    prov = "Gemini"
            except Exception as e:
                self._send_json(500, {"error": f"Translation failed: {e}"}, origin)
                return

            # Split back and rebuild sections
            parts = translated.split("|||SEP|||")
            result_sections = []
            text_idx = 0
            for s in sections:
                if s.get("type") == "figure":
                    result_sections.append(s)  # figures unchanged
                else:
                    new_s = dict(s)
                    if text_idx < len(parts):
                        new_s["content"] = parts[text_idx].strip()
                    text_idx += 1
                    result_sections.append(new_s)

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
            self._send_json(500, {"error": str(e)}, origin)

    def _send_json(self, status: int, data: dict, origin: str = "*"):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", origin)
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))
