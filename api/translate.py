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


# --- Local debug logging ---


def _log_to_file(message: str) -> None:
    """Append log entry to data/logs/local_debug.log (local dev only)."""
    log_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "logs"
    )
    if not os.path.isdir(log_dir):
        return
    log_file = os.path.join(log_dir, "local_debug.log")
    try:
        from datetime import datetime

        ts = datetime.now().strftime("%H:%M:%S")
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"[{ts}] {message}\n")
    except Exception:
        pass


def _count_output_stats(markdown: str) -> dict:
    """Count LaTeX formulas, SVG figures, headings in output."""
    return {
        "latex": len(re.findall(r"\$[^\$\n]+?\$", markdown))
        + len(re.findall(r"\$\$[\s\S]+?\$\$", markdown)),
        "svg": len(re.findall(r"<svg", markdown, re.IGNORECASE)),
        "headings": len(re.findall(r"^#{1,6}\s", markdown, re.MULTILINE)),
        "chars": len(markdown),
    }


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


# --- DOCX text extraction (structured) ---

def extract_text_from_docx(data: bytes) -> str:
    """Extract text from DOCX preserving structure: headings, bold, lists."""
    import io
    from docx import Document

    doc = Document(io.BytesIO(data))
    lines: list[str] = []
    for p in doc.paragraphs:
        text = p.text.strip()
        if not text:
            continue
        style_name = (p.style.name if p.style else "").lower()

        # Detect heading styles
        if "heading 1" in style_name or "title" in style_name:
            lines.append(f"# {text}")
        elif "heading 2" in style_name:
            lines.append(f"## {text}")
        elif "heading 3" in style_name:
            lines.append(f"### {text}")
        elif "list" in style_name:
            lines.append(f"- {text}")
        else:
            # Reconstruct with bold/italic markers from runs
            parts: list[str] = []
            for run in p.runs:
                t = run.text
                if not t:
                    continue
                if run.bold and t.strip():
                    parts.append(f"**{t}**")
                elif run.italic and t.strip():
                    parts.append(f"*{t}*")
                else:
                    parts.append(t)
            lines.append("".join(parts) if parts else text)
    return "\n\n".join(lines)


def format_and_translate_docx(text: str, source_lang: str, target_lang: str) -> str:
    """Use Gemini to format extracted DOCX text as Markdown+LaTeX+SVG AND translate.

    This produces output identical in quality to the image OCR pipeline.
    """
    api_key = os.environ.get("GOOGLE_AI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GOOGLE_AI_API_KEY not set")

    lang_names = {"ro": "Romanian", "sk": "Slovak", "en": "English"}
    src = lang_names.get(source_lang, source_lang)
    tgt = lang_names.get(target_lang, target_lang)

    print(f"[DOCX] Format+Translate: {source_lang} -> {target_lang}, {len(text)} chars", file=sys.stderr)
    prompt = (
        f"You are processing text extracted from a {src} math textbook.\n"
        f"FORMAT it as professional Markdown AND TRANSLATE to {tgt} in one step.\n\n"
        "CRITICAL RULES (violating these is an error):\n"
        "1. Construction steps P₁, P₂, P₃, P₄ are PARAGRAPHS, NEVER headings.\n"
        "   CORRECT: $P_1$: Zostrojíme uhol...\n"
        "   WRONG:   # P₁: Zostrojíme uhol...\n"
        "2. Use # ONLY for real titles (chapter name), ## for sections\n"
        "3. ALL math MUST be LaTeX: $\\triangle ABC$, $\\angle MON$, $AB = 4 \\text{ cm}$\n"
        "4. Use **bold** for key terms: **Example.**, **Observations**\n"
        "5. Bold label + ordered list = separate blocks (empty line between):\n"
        "   **Observations**\n"
        "   \\n\n"
        "   1. First item...\n"
        "   2. Second item...\n\n"
        "FORMATTING:\n"
        "- Numbered items: 1. 2. 3. format\n"
        "- Letter options: a) b) c) d) on separate lines\n\n"
        "SVG FIGURES — for ANY geometric construction or figure described:\n"
        "- Wrap in: <div style=\"display:flex;gap:16px;justify-content:center;margin:6px 0\">\n"
        "- PAIR construction steps: P₁+P₂ in ONE <div> (2 SVGs side-by-side), P₃+P₄ in next <div>\n"
        "- SVG sizing: width=\"255\" height=\"170\"\n"
        "- Step label: <text> at top center, font-weight=\"bold\", fill=\"#444\" (P₁, P₂, etc.)\n"
        "- Vertices: italic labels, points as <circle r=\"2.5\" fill=\"#333\"/>\n"
        "- Measurements: fill=\"#666\", angles: stroke=\"#c44\" (red) or stroke=\"#1a7\" (green)\n"
        "- Dashed lines: stroke-dasharray=\"5,3\" stroke=\"#aaa\"\n"
        "- Final step polygon: fill=\"#e8f0fe\" stroke=\"#333\" stroke-linejoin=\"round\"\n\n"
        "TRANSLATION:\n"
        f"- Translate ALL natural language text to {tgt}\n"
        "- Use correct mathematical terminology with proper diacritics\n"
        "- Keep LaTeX and SVG code untouched (only translate text labels inside SVG if needed)\n\n"
        "Output ONLY the formatted translated Markdown. No code fences, no explanations.\n\n"
        f"TEXT TO PROCESS:\n{text}"
    )
    contents = [{"parts": [{"text": prompt}]}]
    result = gemini_request(contents, api_key)
    # Strip code fences if Gemini wraps output
    result = re.sub(r"^```(?:markdown|html)?\s*\n?", "", result, flags=re.MULTILINE)
    result = re.sub(r"\n?```\s*$", "", result, flags=re.MULTILINE)
    return result


# --- REST API calls (no SDK dependencies) ---

def _sanitize_error(msg: str) -> str:
    """Remove API keys/tokens from error messages."""
    import re as _re
    # Strip anything that looks like an API key (long alphanumeric strings)
    sanitized = _re.sub(r'(Bearer\s+)\S+', r'\1[REDACTED]', msg)
    sanitized = _re.sub(r'(key=)\S+', r'\1[REDACTED]', sanitized)
    sanitized = _re.sub(r'gsk_\S+', '[REDACTED_GROQ_KEY]', sanitized)
    sanitized = _re.sub(r'AIza\S+', '[REDACTED_GOOGLE_KEY]', sanitized)
    return sanitized


def gemini_request(contents: list, api_key: str) -> str:
    """Call Google Gemini REST API directly."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
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
    api_key = os.environ.get("GOOGLE_AI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GOOGLE_AI_API_KEY not set — configureaza variabila in Vercel dashboard")

    image_b64 = base64.b64encode(image_bytes).decode("utf-8")
    print(f"[OCR] Processing image: {len(image_bytes)} bytes, mime={mime_type}, lang={source_lang}", file=sys.stderr)
    lang_names = {"ro": "Romanian", "sk": "Slovak", "en": "English"}
    src = lang_names.get(source_lang, source_lang)

    ocr_prompt = (
        f"Extract ALL content from this {src} math textbook page as professional Markdown.\n\n"
        "CRITICAL RULES (violating these is an error):\n"
        "1. Construction steps P₁, P₂, P₃, P₄ are PARAGRAPHS, NEVER headings.\n"
        "   CORRECT: $P_1$: Zostrojíme uhol...\n"
        "   WRONG:   # P₁: Zostrojíme uhol...\n"
        "   WRONG:   ### P₁: Zostrojíme uhol...\n"
        "2. Use # ONLY for real titles (e.g. chapter name), ## for sections, ### for subsections\n"
        "3. ALL math MUST be LaTeX: $\\triangle ABC$, $\\angle MON$, $m(\\angle A) = 60°$,\n"
        "   $[AB]$, $AB = 4 \\text{ cm}$, $\\perp$, $\\parallel$. NEVER plain text math.\n"
        "4. Use **bold** for key terms: **Example.**, **Observation.**, **Observations**\n"
        "5. Ordered lists: start a NEW line for each item. Bold label + list = separate blocks:\n"
        "   CORRECT:\n"
        "   **Observations**\n"
        "   \\n\n"
        "   1. First observation...\n"
        "   2. Second observation...\n\n"
        "STRUCTURE RULES:\n"
        "- Numbered items: 1. 2. 3. format\n"
        "- Letter options: a) b) c) d) on separate lines\n"
        "- Preserve the EXACT order and layout of the original page\n\n"
        "SVG FIGURES — for ANY geometric figure, construction, or diagram:\n"
        "- Wrap SVGs in: <div style=\"display:flex;gap:16px;justify-content:center;margin:6px 0\">\n"
        "- PAIR construction steps side-by-side: P₁+P₂ in ONE <div>, P₃+P₄ in ONE <div>\n"
        "  Each <div> contains TWO <svg> elements next to each other.\n"
        "- SVG sizing: width=\"255\" height=\"170\" (or similar proportional size)\n"
        "- SVG attributes: xmlns, viewBox, style=\"font-family:Cambria,serif\"\n"
        "- Step label: <text x=\"center\" y=\"12\" font-size=\"11\" fill=\"#444\" text-anchor=\"middle\" font-weight=\"bold\">P₁</text>\n"
        "- Vertices: labeled italic (font-style:italic), points as <circle r=\"2.5\" fill=\"#333\"/>\n"
        "- Measurements: fill=\"#666\", font-size=\"10\"\n"
        "- Angles: arcs with fill=\"none\" stroke=\"#c44\" (red) or stroke=\"#1a7\" (green)\n"
        "- Dashed helper lines: stroke-dasharray=\"5,3\" stroke=\"#aaa\"\n"
        "- Final step polygon: fill=\"#e8f0fe\", stroke=\"#333\", stroke-linejoin=\"round\"\n"
        "- Solid constructed segments: stroke=\"#333\" stroke-width=\"1.8\"\n\n"
        "Output ONLY the Markdown content. No code fences, no explanations."
    )
    contents = [{
        "parts": [
            {"text": ocr_prompt},
            {"inline_data": {"mime_type": mime_type, "data": image_b64}},
        ]
    }]
    result = gemini_request(contents, api_key)
    return result


def ocr_with_mistral(image_bytes: bytes, mime_type: str, source_lang: str) -> str:
    """Fallback OCR using Mistral Pixtral vision model."""
    api_key = os.environ.get("MISTRAL_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("MISTRAL_API_KEY not set — fallback OCR indisponibil")

    image_b64 = base64.b64encode(image_bytes).decode("utf-8")
    lang_names = {"ro": "Romanian", "sk": "Slovak", "en": "English"}
    src = lang_names.get(source_lang, source_lang)

    print(f"[OCR] Mistral fallback: {len(image_bytes)} bytes, lang={source_lang}", file=sys.stderr)
    ocr_prompt = (
        f"Extract ALL content from this {src} math textbook page as Markdown.\n"
        "Use LaTeX for all math ($...$, $$...$$). Use # ## ### for headings.\n"
        "Use **bold** for key terms. Numbered items as 1. 2. 3.\n"
        "Output ONLY the Markdown. No code fences, no explanations."
    )
    payload = json.dumps({
        "model": "pixtral-12b-2409",
        "messages": [{
            "role": "user",
            "content": [
                {"type": "text", "text": ocr_prompt},
                {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{image_b64}"}},
            ],
        }],
        "max_tokens": 4096,
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://api.mistral.ai/v1/chat/completions",
        data=payload,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
    )
    try:
        with urllib.request.urlopen(req, timeout=55) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        return data["choices"][0]["message"]["content"]
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        print(f"[MISTRAL ERROR] Status {e.code}: {error_body[:500]}", file=sys.stderr)
        raise RuntimeError(f"Mistral API error {e.code}: {error_body[:200]}")


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


def translate_with_gemini(text: str, source_lang: str, target_lang: str, dict_terms: list[dict] | None = None) -> str:
    api_key = os.environ.get("GOOGLE_AI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GOOGLE_AI_API_KEY not set")

    lang_names = {"ro": "Romanian", "sk": "Slovak", "en": "English"}
    src = lang_names.get(source_lang, source_lang)
    tgt = lang_names.get(target_lang, target_lang)

    glossary = _format_dict_terms(dict_terms or [])
    print(f"[TRANSLATE] Gemini: {source_lang} -> {target_lang}, {len(text)} chars", file=sys.stderr)
    translate_prompt = (
        f"Translate this math textbook content from {src} to {tgt}.\n\n"
        "CRITICAL RULES — violating ANY of these is an error:\n"
        "1. PRESERVE EXACTLY as-is (do NOT modify):\n"
        "   - All LaTeX: $...$, $$...$$, \\begin...\\end blocks\n"
        "   - All HTML/SVG blocks: <div>, <svg>, <table>, etc.\n"
        "   - All Markdown formatting: #, ##, **, *, -, 1. 2. 3.\n"
        "   - Placeholders like __MATH_N__\n\n"
        "2. TRANSLATE only natural language text:\n"
        f"   - Use correct {tgt} mathematical terminology\n"
        "   - Use proper diacritics for the target language\n"
        "   - Keep the same paragraph structure and line breaks\n\n"
        "3. MATH TERMINOLOGY — translate these correctly:\n"
        "   - triangle, angle, segment, perpendicular, parallel\n"
        "   - bisector, median, altitude, circumscribed, inscribed\n"
        "   - congruent, similar, adjacent, supplementary, complementary\n"
        f"{glossary}\n"
        "Output ONLY the translated text. No code fences, no explanations.\n\n"
        f"{text}"
    )
    contents = [{"parts": [{"text": translate_prompt}]}]
    return gemini_request(contents, api_key)


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
        "model": "llama-3.1-70b-versatile",
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
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        return data["choices"][0]["message"]["content"]
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        print(f"[GROQ ERROR] Status {e.code}: {error_body[:500]}", file=sys.stderr)
        raise RuntimeError(f"Groq API error {e.code}: {error_body[:200]}")


# --- HTML Builder (professional A4 template) ---

def _md_to_html_body(md: str) -> str:
    """Convert markdown to HTML body content. Preserves SVG/div/LaTeX as-is."""
    # Step 0: Safety net — demote construction step headings to paragraphs
    # Gemini sometimes makes P₁/P₂/P₃/P₄ into headings despite prompt instructions
    md = re.sub(
        r"^#{1,6}\s*((?:\$?P[_₁₂₃₄₅₆]\$?|P[₁₂₃₄₅₆]):?\s*.+)$",
        r"\1",
        md,
        flags=re.MULTILINE,
    )

    # Step 1: Protect SVG and HTML div blocks from paragraph wrapping
    svg_blocks: dict[str, str] = {}
    svg_counter = [0]

    def _protect_svg(m: re.Match) -> str:
        key = f"__SVG_BLOCK_{svg_counter[0]}__"
        svg_blocks[key] = m.group(0)
        svg_counter[0] += 1
        return f"\n{key}\n"

    html = re.sub(r"<div[^>]*>[\s\S]*?</div>", _protect_svg, md)
    html = re.sub(r"<svg[\s\S]*?</svg>", _protect_svg, html)

    # Step 2: Headings
    for i in range(6, 0, -1):
        html = re.sub(rf"^{'#' * i}\s+(.+)$", rf"<h{i}>\1</h{i}>", html, flags=re.MULTILINE)

    # Step 3: Inline formatting
    html = re.sub(r"\*\*\*(.+?)\*\*\*", r"<strong><em>\1</em></strong>", html)
    html = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", html)
    html = re.sub(r"(?<![\\])\*(.+?)\*", r"<em>\1</em>", html)

    # Step 4: Horizontal rules
    html = re.sub(r"^---+$", r"<hr>", html, flags=re.MULTILINE)

    # Step 5: Unordered lists (- item)
    html = re.sub(r"^- (.+)$", r"<li>\1</li>", html, flags=re.MULTILINE)
    html = re.sub(r"((?:<li>.*</li>\n?)+)", lambda m: "<ul>" + m.group(1) + "</ul>", html)

    # Step 6: Ordered lists (1. item) — wrap in <ol>
    html = re.sub(r"^\d+\.\s+(.+)$", r"<oli>\1</oli>", html, flags=re.MULTILINE)
    html = re.sub(r"((?:<oli>.*</oli>\n?)+)", lambda m: "<ol>" + m.group(1).replace("<oli>", "<li>").replace("</oli>", "</li>") + "</ol>", html)

    # Step 7: Letter options (a) b) c) d)) — keep as lines with break
    html = re.sub(r"^([a-z]\))\s+(.+)$", r"\1 \2<br>", html, flags=re.MULTILINE)

    # Step 8: Wrap remaining text in paragraphs (skip blocks)
    lines = html.split("\n\n")
    result_parts = []
    block_tags = ("<h", "<ul", "<ol", "<li", "<hr", "<div", "<svg", "<table", "__SVG_BLOCK_")
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if any(stripped.startswith(tag) for tag in block_tags):
            result_parts.append(stripped)
        else:
            result_parts.append(f"<p>{stripped}</p>")
    html = "\n".join(result_parts)

    # Step 9: Clean up
    html = html.replace("<p></p>", "")
    html = re.sub(r"\n{3,}", "\n\n", html)

    # Step 10: Restore SVG blocks
    for key, block in svg_blocks.items():
        html = html.replace(key, block)
        html = html.replace(f"<p>{key}</p>", block)

    # Step 11: Fix invalid nesting — extract <ol>/<ul> from inside <p> tags
    html = re.sub(r"<p>(.*?)<ol>", r"<p>\1</p>\n<ol>", html)
    html = re.sub(r"</ol></p>", r"</ol>", html)
    html = re.sub(r"<p>(.*?)<ul>", r"<p>\1</p>\n<ul>", html)
    html = re.sub(r"</ul></p>", r"</ul>", html)
    html = html.replace("<p></p>", "")

    return html


def build_html(pages: list[str], target_lang: str) -> str:
    """Build professional A4 HTML document matching Exemplu_BUN.html quality."""
    page_sections = []
    for i, md in enumerate(pages):
        body = _md_to_html_body(md)
        page_sections.append(
            f'<section class="paper"><div class="paper-content">'
            f'<div class="source-file">Pagina {i + 1}</div>'
            f'{body}'
            f'</div></section>'
        )
    pages_html = "\n".join(page_sections)
    n = len(pages)

    return f'''<!doctype html>
<html lang="{target_lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Traducere Matematica</title>
  <style>
    :root {{
      --text-color: #1b1b1b;
      --paper-bg: #ffffff;
      --font-size: 12pt;
      --line-height: 1.45;
      --page-width: 210mm;
      --page-height: 297mm;
      --page-padding-x: 12mm;
      --page-padding-y: 12mm;
    }}
    @page {{ size: A4; margin: 0; }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0; padding: 0;
      color: var(--text-color);
      background: #f2f2f2;
      font-family: "Cambria", "Times New Roman", serif;
      font-size: var(--font-size);
      line-height: var(--line-height);
    }}
    .toolbar {{
      position: sticky; top: 0; z-index: 100;
      display: flex; gap: 12px; align-items: center; justify-content: space-between;
      padding: 10px 14px; background: #192031; color: #fff;
      font-family: "Segoe UI", Arial, sans-serif; font-size: 13px;
    }}
    .toolbar button {{
      border: 0; border-radius: 6px; padding: 8px 12px;
      background: #dce8ff; color: #121212; cursor: pointer; font-weight: 600;
    }}
    main {{
      max-width: calc(var(--page-width) + 24px);
      margin: 18px auto; padding: 0 12px 24px;
    }}
    .paper {{
      --fit-scale: 1;
      width: var(--page-width); height: var(--page-height);
      margin: 0 auto 16px;
      padding: var(--page-padding-y) var(--page-padding-x);
      background: var(--paper-bg);
      box-shadow: 0 2px 14px rgba(0,0,0,.12);
      overflow: hidden;
    }}
    .paper-content {{
      width: calc((var(--page-width) - 2 * var(--page-padding-x)) / var(--fit-scale));
      transform: scale(var(--fit-scale));
      transform-origin: top left;
      overflow-wrap: break-word;
    }}
    .source-file {{
      margin: 0 0 14px; color: #4a4a4a;
      font-family: "Segoe UI", Arial, sans-serif;
      font-size: 10.5pt; font-weight: 600;
    }}
    h1,h2,h3,h4 {{ margin-top:1.1em; margin-bottom:.42em; line-height:1.22; page-break-after:avoid; }}
    p,li {{ page-break-inside:avoid; }}
    hr {{ border:none; border-top:1px solid #cfcfcf; margin:1em 0; }}
    ul, ol {{ margin-top: 0.45em; margin-bottom: 0.6em; }}
    li {{ margin-bottom: 0.2em; }}
    svg {{ max-width: 100%; height: auto; display: block; margin: 0.8em auto; }}
    .MathJax {{ font-size: 1em !important; }}
    @media print {{
      body {{ background: #fff; }}
      .toolbar {{ display: none !important; }}
      main {{ max-width: none; margin: 0; padding: 0; }}
      .paper {{ margin: 0; box-shadow: none; break-after: page; page-break-after: always; }}
      .paper:last-child {{ break-after: auto; page-break-after: auto; }}
    }}
  </style>
  <script>
    window.MathJax = {{
      tex: {{ inlineMath: [['$','$'],['\\\\(','\\\\)']], displayMath: [['$$','$$'],['\\\\[','\\\\]']] }},
      svg: {{ fontCache: 'global' }}
    }};
  </script>
  <script defer src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"></script>
  <script>
    function fitPaperSections() {{
      document.querySelectorAll('.paper').forEach(function(page) {{
        var c = page.querySelector('.paper-content');
        if (!c) return;
        page.style.setProperty('--fit-scale', '1');
        var s = window.getComputedStyle(page);
        var avail = page.clientHeight - parseFloat(s.paddingTop) - parseFloat(s.paddingBottom);
        var need = c.scrollHeight;
        var scale = need > 0 ? Math.min(1, avail / need) : 1;
        page.style.setProperty('--fit-scale', scale.toFixed(4));
      }});
    }}
    window.addEventListener('load', function() {{
      var p = window.MathJax && window.MathJax.startup ? window.MathJax.startup.promise : Promise.resolve();
      p.then(function() {{ fitPaperSections(); setTimeout(fitPaperSections, 150); }})
       .catch(function() {{ fitPaperSections(); }});
    }});
    window.addEventListener('resize', fitPaperSections);
    window.addEventListener('beforeprint', fitPaperSections);
  </script>
</head>
<body>
  <div class="toolbar">
    <div>Traducere matematica — {n} pagina(e) | Print: Scale 100%, Margins None</div>
    <button onclick="window.print()">Tipareste</button>
  </div>
  <main>
{pages_html}
  </main>
</body>
</html>'''


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

            # Parse dictionary terms if provided
            dict_terms = []
            dict_raw = parts.get("dictionary", "")
            if dict_raw:
                try:
                    dict_terms = json.loads(dict_raw)
                except (json.JSONDecodeError, TypeError):
                    pass

            if not files:
                self._send_json(400, {"error": "Nu au fost trimise fisiere", "status": "error"})
                return

            file_types = [f.get("mime_type", "?").split("/")[-1] for f in files]
            _log_to_file(
                f"ACTION  | Traducere initiata | {len(files)} fisier(e) | "
                f"{source_lang} -> {target_lang} | Tipuri: {', '.join(file_types)}"
            )

            all_markdowns = []
            results = []
            import time
            t0 = time.time()

            for idx, file_info in enumerate(files):
                file_data = file_info["data"]
                mime_type = file_info.get("mime_type", "image/jpeg")
                filename = file_info.get("filename", "")

                # DOCX: extract text directly (no OCR needed)
                is_docx = (
                    "wordprocessingml" in mime_type
                    or "application/zip" in mime_type
                    or filename.lower().endswith(".docx")
                )

                if is_docx:
                    # DOCX: extract structured text, then Gemini formats + translates in one pass
                    _log_to_file(f"INFO    | Fisier {idx+1}/{len(files)}: DOCX | {len(file_data)} bytes")
                    t_docx = time.time()
                    extracted = extract_text_from_docx(file_data)
                    final_markdown = format_and_translate_docx(extracted, source_lang, target_lang)
                    _log_to_file(f"OK      | DOCX procesat | Durata: {time.time()-t_docx:.1f}s | Chars: {len(final_markdown)}")
                else:
                    # Image: OCR with Gemini Vision (fallback: Mistral Pixtral)
                    _log_to_file(f"INFO    | Fisier {idx+1}/{len(files)}: {mime_type} | {len(file_data)} bytes")
                    t_ocr = time.time()
                    ocr_provider = "Gemini"
                    try:
                        extracted = ocr_with_gemini(file_data, mime_type, source_lang)
                    except Exception as ocr_err:
                        print(f"[OCR] Gemini OCR failed, trying Mistral: {ocr_err}", file=sys.stderr)
                        _log_to_file(f"WARN    | OCR Gemini esuat: {ocr_err} | Fallback: Mistral")
                        ocr_provider = "Mistral"
                        extracted = ocr_with_mistral(file_data, mime_type, source_lang)
                    ocr_dur = time.time() - t_ocr
                    _log_to_file(f"OK      | OCR complet | Provider: {ocr_provider} | Durata: {ocr_dur:.1f}s | Chars: {len(extracted)}")

                    protected, placeholders = protect_math(extracted)
                    _log_to_file(f"INFO    | Math protejat: {len(placeholders)} placeholders")

                    t_tr = time.time()
                    tr_provider = "Gemini"
                    try:
                        translated = translate_with_gemini(protected, source_lang, target_lang, dict_terms)
                    except Exception as e:
                        print(f"[TRANSLATE] Gemini translation failed, trying Groq: {e}", file=sys.stderr)
                        _log_to_file(f"WARN    | Traducere Gemini esuata: {e} | Fallback: Groq")
                        tr_provider = "Groq"
                        translated = translate_with_groq(protected, source_lang, target_lang, dict_terms)
                    tr_dur = time.time() - t_tr
                    _log_to_file(f"OK      | Traducere completa | Provider: {tr_provider} | Durata: {tr_dur:.1f}s")

                    final_markdown = restore_math(translated, placeholders)
                all_markdowns.append(final_markdown)

                results.append({
                    "markdown": final_markdown,
                    "source_lang": source_lang,
                    "target_lang": target_lang,
                    "status": "success",
                })

            # Build ONE unified HTML document with all pages
            unified_html = build_html(all_markdowns, target_lang)
            duration_ms = int((time.time() - t0) * 1000)

            # Log output statistics per page
            for i, md in enumerate(all_markdowns):
                stats = _count_output_stats(md)
                _log_to_file(
                    f"INFO    | Pagina {i+1} output: LaTeX={stats['latex']} | "
                    f"SVG={stats['svg']} | Headings={stats['headings']} | Chars={stats['chars']}"
                )
            _log_to_file(f"OK      | SUCCES TOTAL | {len(results)} pagini | Durata: {duration_ms}ms")
            _log_to_file("")

            print(f"[TRANSLATE] Success: {len(results)} pages in {duration_ms}ms", file=sys.stderr)
            self._send_json(200, {
                "results": results,
                "html": unified_html,
                "pages": len(results),
                "duration_ms": duration_ms,
                "status": "success",
            })

        except Exception as e:
            error_msg = _sanitize_error(f"{type(e).__name__}: {str(e)}")
            _log_to_file(f"ERROR   | Traducere esuata | {error_msg}")
            _log_to_file("")
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

            if name in ("source_lang", "target_lang", "dictionary"):
                parts_data[name] = content.decode("utf-8").strip()
            elif name == "files" or "filename" in header:
                ct_match = re.search(r"Content-Type:\s*(\S+)", header)
                mime = ct_match.group(1) if ct_match else "image/jpeg"
                fname_match = re.search(r'filename="([^"]*)"', header)
                fname = fname_match.group(1) if fname_match else ""
                parts_data["files"].append({"mime_type": mime, "data": content, "filename": fname})

        return parts_data

    def _send_json(self, status: int, data: dict):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
