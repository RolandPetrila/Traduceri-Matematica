"""Vercel Python Serverless Function for OCR + Translation.

Uses direct REST API calls (no heavy SDKs) to stay under 250MB limit.
Handles POST /api/translate — image files -> AI OCR -> translate -> HTML.
"""

from __future__ import annotations

from http.server import BaseHTTPRequestHandler
import json
import base64
import os
import re
import sys
import traceback
import urllib.request
import urllib.parse


# --- Math protection ---

LATEX_PATTERNS = [
    r"\$\$[\s\S]+?\$\$",
    r"\$[^\$\n]+?\$",
    r"\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}",
    r"\\[a-zA-Z]+\{[^}]*\}",
    r"\\[a-zA-Z]+",
]

SVG_PATTERN = r"<div[^>]*>[\s\S]*?<svg[\s\S]*?</svg>[\s\S]*?</div>"
HTML_PATTERN = r"<[^>]+>"


def protect_math(text: str) -> tuple[str, dict[str, str]]:
    placeholders = {}
    counter = [0]

    def _replace(match: re.Match) -> str:
        key = f"__MATH_{counter[0]}__"
        placeholders[key] = match.group(0)
        counter[0] += 1
        return key

    for pattern in [SVG_PATTERN] + LATEX_PATTERNS + [HTML_PATTERN]:
        text = re.sub(pattern, _replace, text)
    return text, placeholders


def restore_math(text: str, placeholders: dict[str, str]) -> str:
    for key, value in placeholders.items():
        text = text.replace(key, value)
    return text


# --- REST API calls (no SDK dependencies) ---

def gemini_request(contents: list, api_key: str) -> str:
    """Call Google Gemini REST API directly."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    payload = json.dumps({"contents": contents}).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=55) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        print(f"[GEMINI ERROR] Status {e.code}: {error_body[:500]}", file=sys.stderr)
        raise RuntimeError(f"Gemini API error {e.code}: {error_body[:200]}")
    except Exception as e:
        print(f"[GEMINI ERROR] {type(e).__name__}: {e}", file=sys.stderr)
        raise


def ocr_with_gemini(image_bytes: bytes, mime_type: str, source_lang: str) -> str:
    api_key = os.environ.get("GOOGLE_AI_API_KEY", "")
    if not api_key:
        raise RuntimeError("GOOGLE_AI_API_KEY not set — configureaza variabila in Vercel dashboard")

    image_b64 = base64.b64encode(image_bytes).decode("utf-8")
    print(f"[OCR] Processing image: {len(image_bytes)} bytes, mime={mime_type}, lang={source_lang}", file=sys.stderr)
    contents = [{
        "parts": [
            {"text": (
                f"Extract ALL content from this math textbook image ({source_lang}). "
                "Output as Markdown with LaTeX ($...$, $$...$$). "
                "For geometric figures, create inline SVG wrapped in <div>. "
                "Preserve all symbols, formulas, measurements, layout order."
            )},
            {"inline_data": {"mime_type": mime_type, "data": image_b64}},
        ]
    }]
    result = gemini_request(contents, api_key)
    print(f"[OCR] Extracted {len(result)} chars", file=sys.stderr)
    return result


def translate_with_gemini(text: str, source_lang: str, target_lang: str) -> str:
    api_key = os.environ.get("GOOGLE_AI_API_KEY", "")
    if not api_key:
        raise RuntimeError("GOOGLE_AI_API_KEY not set")

    print(f"[TRANSLATE] Gemini: {source_lang} -> {target_lang}, {len(text)} chars", file=sys.stderr)
    contents = [{
        "parts": [{"text": (
            f"Translate this math textbook text from {source_lang} to {target_lang}.\n"
            "CRITICAL: Preserve ALL LaTeX ($...$), HTML/SVG blocks, markdown formatting.\n"
            "Only translate natural language. Use correct math terminology with diacritics.\n\n"
            f"{text}"
        )}]
    }]
    return gemini_request(contents, api_key)


def translate_with_groq(text: str, source_lang: str, target_lang: str) -> str:
    """Call Groq REST API (OpenAI-compatible) directly."""
    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY not set")

    print(f"[TRANSLATE] Groq fallback: {source_lang} -> {target_lang}", file=sys.stderr)
    url = "https://api.groq.com/openai/v1/chat/completions"
    payload = json.dumps({
        "model": "llama-3.1-70b-versatile",
        "messages": [
            {"role": "system", "content": (
                f"Translate from {source_lang} to {target_lang}. "
                "Preserve ALL LaTeX, HTML/SVG, markdown. Only translate natural language."
            )},
            {"role": "user", "content": text},
        ],
        "temperature": 0.1,
        "max_tokens": 4096,
    }).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        return data["choices"][0]["message"]["content"]
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        print(f"[GROQ ERROR] Status {e.code}: {error_body[:500]}", file=sys.stderr)
        raise RuntimeError(f"Groq API error {e.code}: {error_body[:200]}")


# --- HTML Builder ---

def build_html(markdown_text: str, target_lang: str) -> str:
    html_body = markdown_text
    # Convert headers
    for i in range(6, 0, -1):
        html_body = re.sub(rf"^{'#' * i}\s+(.+)$", rf"<h{i}>\1</h{i}>", html_body, flags=re.MULTILINE)
    # Bold / italic
    html_body = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", html_body)
    html_body = re.sub(r"\*(.+?)\*", r"<em>\1</em>", html_body)
    # Line breaks
    html_body = html_body.replace("\n\n", "</p><p>")
    html_body = f"<p>{html_body}</p>"

    return f"""<!DOCTYPE html>
<html lang="{target_lang}">
<head>
<meta charset="UTF-8">
<title>Traducere Matematica</title>
<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js" async></script>
<style>
@page {{ size: A4; margin: 2cm; }}
body {{ font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; max-width: 21cm; margin: 0 auto; padding: 2cm; }}
h1, h2, h3 {{ color: #333; }}
svg {{ max-width: 100%; height: auto; }}
@media print {{ body {{ padding: 0; }} }}
</style>
</head>
<body>
{html_body}
</body>
</html>"""


# --- Multipart boundary parser ---

def parse_boundary(content_type: str) -> str:
    """Extract boundary from Content-Type, handling quotes and extra params."""
    for part in content_type.split(";"):
        part = part.strip()
        if part.startswith("boundary="):
            boundary = part[len("boundary="):]
            return boundary.strip('"').strip("'")
    raise ValueError(f"No boundary found in Content-Type: {content_type}")


# --- Main Handler ---

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        try:
            content_type = self.headers.get("Content-Type", "")
            content_length = int(self.headers.get("Content-Length", 0))

            print(f"[TRANSLATE] Request: content_type={content_type[:80]}, size={content_length}", file=sys.stderr)

            body = self.rfile.read(content_length)

            if "multipart/form-data" in content_type:
                boundary = parse_boundary(content_type)
                parts = self._parse_multipart(body, boundary)
            else:
                parts = json.loads(body)

            source_lang = parts.get("source_lang", "ro")
            target_lang = parts.get("target_lang", "sk")
            files = parts.get("files", [])

            print(f"[TRANSLATE] Parsed: {len(files)} files, {source_lang} -> {target_lang}", file=sys.stderr)

            if not files:
                self._send_json(400, {"error": "Nu au fost trimise fisiere", "status": "error"})
                return

            results = []
            for idx, file_info in enumerate(files):
                image_bytes = file_info["data"]
                mime_type = file_info.get("mime_type", "image/jpeg")

                print(f"[TRANSLATE] File {idx + 1}/{len(files)}: {mime_type}, {len(image_bytes)} bytes", file=sys.stderr)

                extracted = ocr_with_gemini(image_bytes, mime_type, source_lang)
                protected, placeholders = protect_math(extracted)

                try:
                    translated = translate_with_gemini(protected, source_lang, target_lang)
                except Exception as e:
                    print(f"[TRANSLATE] Gemini translation failed, trying Groq: {e}", file=sys.stderr)
                    translated = translate_with_groq(protected, source_lang, target_lang)

                final_markdown = restore_math(translated, placeholders)
                html = build_html(final_markdown, target_lang)

                results.append({
                    "markdown": final_markdown,
                    "html": html,
                    "source_lang": source_lang,
                    "target_lang": target_lang,
                    "status": "success",
                })

            print(f"[TRANSLATE] Success: {len(results)} pages processed", file=sys.stderr)
            self._send_json(200, {"results": results, "pages": len(results), "status": "success"})

        except Exception as e:
            error_msg = f"{type(e).__name__}: {str(e)}"
            print(f"[TRANSLATE ERROR] {error_msg}", file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
            self._send_json(500, {"error": error_msg, "status": "error"})

    def _parse_multipart(self, body: bytes, boundary: str) -> dict:
        parts_data = {"files": [], "source_lang": "ro", "target_lang": "sk"}
        boundary_bytes = f"--{boundary}".encode()
        sections = body.split(boundary_bytes)

        for section in sections[1:]:
            if section.strip() in (b"--", b"", b"--\r\n"):
                continue
            header_end = section.find(b"\r\n\r\n")
            if header_end == -1:
                continue
            header = section[:header_end].decode("utf-8", errors="replace")
            content = section[header_end + 4:]
            if content.endswith(b"\r\n"):
                content = content[:-2]

            name_match = re.search(r'name="([^"]+)"', header)
            if not name_match:
                continue
            name = name_match.group(1)

            if name in ("source_lang", "target_lang"):
                parts_data[name] = content.decode("utf-8").strip()
            elif name == "files" or "filename" in header:
                ct_match = re.search(r"Content-Type:\s*(\S+)", header)
                mime = ct_match.group(1) if ct_match else "image/jpeg"
                parts_data["files"].append({"mime_type": mime, "data": content})
                print(f"[MULTIPART] File found: name={name}, mime={mime}, size={len(content)}", file=sys.stderr)

        print(f"[MULTIPART] Total parsed: {len(parts_data['files'])} files", file=sys.stderr)
        return parts_data

    def _send_json(self, status: int, data: dict):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
