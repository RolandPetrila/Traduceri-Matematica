"""Vercel Python Serverless Function for OCR + Translation.

Handles POST /api/translate — receives image files, runs AI vision OCR,
then translates the extracted text while preserving LaTeX/SVG.
"""

from http.server import BaseHTTPRequestHandler
import json
import base64
import os
import re
import cgi
import tempfile


# --- Math protection (inline, from backend/app/utils/math_protect.py) ---

LATEX_PATTERNS = [
    r"\$\$[\s\S]+?\$\$",       # display math
    r"\$[^\$\n]+?\$",           # inline math
    r"\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}",  # environments
    r"\\[a-zA-Z]+\{[^}]*\}",   # commands with args
    r"\\[a-zA-Z]+",            # bare commands
]

SVG_PATTERN = r"<div[^>]*>[\s\S]*?<svg[\s\S]*?</svg>[\s\S]*?</div>"
HTML_PATTERN = r"<[^>]+>"


def protect_math(text: str) -> tuple[str, dict[str, str]]:
    """Replace LaTeX/SVG/HTML with placeholders before translation."""
    placeholders = {}
    counter = [0]

    def _replace(match: re.Match) -> str:
        key = f"__MATH_PLACEHOLDER_{counter[0]}__"
        placeholders[key] = match.group(0)
        counter[0] += 1
        return key

    # Protect SVG blocks first (largest), then LaTeX, then HTML
    for pattern in [SVG_PATTERN] + LATEX_PATTERNS + [HTML_PATTERN]:
        text = re.sub(pattern, _replace, text)

    return text, placeholders


def restore_math(text: str, placeholders: dict[str, str]) -> str:
    """Restore placeholders back to original LaTeX/SVG/HTML."""
    for key, value in placeholders.items():
        text = text.replace(key, value)
    return text


# --- AI Providers ---

def ocr_with_gemini(image_bytes: bytes, mime_type: str, source_lang: str) -> str:
    """Extract text from image using Google Gemini."""
    import google.generativeai as genai

    api_key = os.environ.get("GOOGLE_AI_API_KEY")
    if not api_key:
        raise RuntimeError("GOOGLE_AI_API_KEY not set")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt = (
        f"Extract ALL content from this math textbook image ({source_lang}). "
        "Output as Markdown with LaTeX ($...$, $$...$$). "
        "For geometric figures, create inline SVG wrapped in <div>. "
        "Preserve all symbols, formulas, measurements, layout order."
    )

    image_data = base64.b64encode(image_bytes).decode("utf-8")
    response = model.generate_content([
        prompt,
        {"mime_type": mime_type, "data": image_data},
    ])
    return response.text


def translate_with_gemini(text: str, source_lang: str, target_lang: str) -> str:
    """Translate text using Google Gemini."""
    import google.generativeai as genai

    api_key = os.environ.get("GOOGLE_AI_API_KEY")
    if not api_key:
        raise RuntimeError("GOOGLE_AI_API_KEY not set")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt = (
        f"Translate this math textbook text from {source_lang} to {target_lang}.\n"
        "CRITICAL: Preserve ALL LaTeX ($...$), HTML/SVG blocks, and markdown formatting.\n"
        "Only translate natural language. Use correct math terminology with diacritics.\n\n"
        f"{text}"
    )
    response = model.generate_content(prompt)
    return response.text


def translate_with_groq(text: str, source_lang: str, target_lang: str) -> str:
    """Translate text using Groq (fallback)."""
    from groq import Groq

    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY not set")

    client = Groq(api_key=api_key)
    response = client.chat.completions.create(
        model="llama-3.1-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": (
                    f"Translate from {source_lang} to {target_lang}. "
                    "Preserve ALL LaTeX, HTML/SVG, markdown. Only translate natural language."
                ),
            },
            {"role": "user", "content": text},
        ],
        temperature=0.1,
        max_tokens=4096,
    )
    return response.choices[0].message.content or ""


# --- HTML Builder (simplified for serverless) ---

def build_html(markdown_text: str, target_lang: str) -> str:
    """Build printable A4 HTML from translated markdown."""
    import markdown as md

    html_body = md.markdown(markdown_text, extensions=["extra", "codehilite"])

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
.page-number {{ text-align: center; font-size: 10pt; color: #666; margin-top: 2cm; }}
@media print {{ body {{ padding: 0; }} }}
</style>
</head>
<body>
{html_body}
</body>
</html>"""


# --- Main Handler ---

def parse_multipart(environ):
    """Parse multipart form data from the request."""
    form = cgi.FieldStorage(fp=environ["wsgi.input"], environ=environ, keep_blank_values=True)
    return form


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
            body = self.rfile.read(content_length)

            # Parse multipart form data
            if "multipart/form-data" in content_type:
                boundary = content_type.split("boundary=")[1]
                parts = self._parse_multipart(body, boundary)
            else:
                # JSON body fallback
                data = json.loads(body)
                parts = data

            source_lang = parts.get("source_lang", "ro")
            target_lang = parts.get("target_lang", "sk")
            files = parts.get("files", [])

            if not files:
                self._send_json(400, {"error": "No files provided"})
                return

            results = []
            for file_info in files:
                image_bytes = file_info["data"]
                mime_type = file_info.get("mime_type", "image/jpeg")

                # Step 1: OCR
                extracted = ocr_with_gemini(image_bytes, mime_type, source_lang)

                # Step 2: Protect math
                protected, placeholders = protect_math(extracted)

                # Step 3: Translate (try Gemini, fallback to Groq)
                try:
                    translated = translate_with_gemini(protected, source_lang, target_lang)
                except Exception:
                    translated = translate_with_groq(protected, source_lang, target_lang)

                # Step 4: Restore math
                final_markdown = restore_math(translated, placeholders)

                # Step 5: Build HTML
                html = build_html(final_markdown, target_lang)

                results.append({
                    "markdown": final_markdown,
                    "html": html,
                    "source_lang": source_lang,
                    "target_lang": target_lang,
                    "status": "success",
                })

            self._send_json(200, {"results": results, "pages": len(results), "status": "success"})

        except Exception as e:
            self._send_json(500, {"error": str(e), "status": "error"})

    def _parse_multipart(self, body: bytes, boundary: str) -> dict:
        """Simple multipart parser for Vercel serverless."""
        parts_data = {"files": [], "source_lang": "ro", "target_lang": "sk"}

        boundary_bytes = f"--{boundary}".encode()
        sections = body.split(boundary_bytes)

        for section in sections[1:]:
            if section.strip() == b"--" or section.strip() == b"":
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
                filename_match = re.search(r'filename="([^"]+)"', header)
                ct_match = re.search(r"Content-Type:\s*(\S+)", header)
                mime = ct_match.group(1) if ct_match else "image/jpeg"

                parts_data["files"].append({
                    "filename": filename_match.group(1) if filename_match else "file",
                    "mime_type": mime,
                    "data": content,
                })

        return parts_data

    def _send_json(self, status: int, data: dict):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
