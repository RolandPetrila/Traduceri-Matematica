"""Translation providers: Gemini, DeepL, Groq, Mistral, Claude. OCR + translation routing."""
from __future__ import annotations

import json
import base64
import os
import re
import sys
import urllib.request
import urllib.error

try:
    from .retry import retry_with_backoff
except ImportError:
    from lib.retry import retry_with_backoff


__all__ = [
    "extract_text_from_docx",
    "format_and_translate_docx",
    "claude_ocr_and_translate",
    "claude_translate_text",
    "gemini_request",
    "ocr_with_gemini",
    "ocr_with_mistral",
    "translate_with_gemini",
    "translate_with_groq",
]


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

    def _call():
        with urllib.request.urlopen(req, timeout=55) as resp:
            return json.loads(resp.read().decode("utf-8"))

    try:
        data = retry_with_backoff(_call, max_retries=2, base_delay=1.0)
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
        raise RuntimeError("GOOGLE_AI_API_KEY not set — configureaza variabila in Render dashboard")

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

    def _call():
        with urllib.request.urlopen(req, timeout=55) as resp:
            return json.loads(resp.read().decode("utf-8"))

    try:
        data = retry_with_backoff(_call, max_retries=2, base_delay=1.0)
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


def claude_ocr_and_translate(image_bytes: bytes, mime_type: str, source_lang: str, target_lang: str) -> str:
    """OCR + format + translate in one Claude pass. Produces Exemplu_BUN quality."""
    api_key = os.environ.get("CLAUDE_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("CLAUDE_API_KEY not set")

    image_b64 = base64.b64encode(image_bytes).decode("utf-8")
    lang_names = {"ro": "Romanian", "sk": "Slovak", "en": "English"}
    src = lang_names.get(source_lang, source_lang)
    tgt = lang_names.get(target_lang, target_lang)

    print(f"[CLAUDE] OCR+Translate: {source_lang} -> {target_lang}, {len(image_bytes)} bytes", file=sys.stderr)

    prompt = (
        f"Extract ALL content from this {src} math textbook page and TRANSLATE to {tgt}.\n"
        "Output professional Markdown with LaTeX and inline SVG figures.\n\n"
        "STRUCTURE:\n"
        "- # for chapter titles only, ## for section headings\n"
        "- Construction steps $P_1$:, $P_2$: etc. are PARAGRAPHS, never headings\n"
        "- **Bold** for key terms: **Example.**, **Observations**\n"
        "- Ordered lists as 1. 2. with blank line after bold label\n"
        "- Letter options a) b) c) d) on separate lines\n\n"
        "MATH — ALL math as LaTeX:\n"
        "- $\\triangle ABC$, $\\angle MON$, $m(\\angle A) = 60°$\n"
        "- $[AB]$, $AB = 4 \\text{ cm}$, $\\perp$, $\\parallel$\n\n"
        "SVG FIGURES — reproduce EVERY geometric figure from the page:\n"
        "- Wrap in: <div style=\"display:flex;gap:16px;justify-content:center;margin:6px 0\">\n"
        "- PAIR construction steps side-by-side: $P_1$+$P_2$ share ONE <div> with TWO <svg> elements\n"
        "- SVG attributes: xmlns, viewBox, width=\"255\" height=\"170\", style=\"font-family:Cambria,serif\"\n"
        "- Step label: <text x=\"center\" y=\"12\" font-size=\"11\" fill=\"#444\" text-anchor=\"middle\" font-weight=\"bold\">P&#x2081;</text>\n"
        "- Vertices: <circle r=\"2.5\" fill=\"#333\"/>, labeled italic <text font-style=\"italic\">\n"
        "- Measurements: fill=\"#666\" font-size=\"10\"\n"
        "- Angles: arcs stroke=\"#c44\" (red) or stroke=\"#1a7\" (green), fill=\"none\"\n"
        "- Construction arcs (compass): stroke-dasharray=\"6,3\", colored #c44 or #1a7\n"
        "- Dashed helper lines: stroke-dasharray=\"5,3\" stroke=\"#aaa\"\n"
        "- Solid constructed segments: stroke=\"#333\" stroke-width=\"1.8\"\n"
        "- Final step: <polygon fill=\"#e8f0fe\" stroke=\"#333\" stroke-width=\"1.8\" stroke-linejoin=\"round\"/>\n"
        "- Right angle marker: small <rect> at the corner\n\n"
        "TRANSLATION:\n"
        f"- Translate ALL natural language to {tgt} with correct mathematical terminology\n"
        "- Use proper diacritics for the target language\n"
        "- Keep LaTeX and SVG code untouched (translate text labels inside SVG if needed)\n\n"
        "Output ONLY the Markdown. No code fences, no explanations."
    )

    payload = json.dumps({
        "model": "claude-sonnet-4-6",
        "max_tokens": 16384,
        "messages": [{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": mime_type,
                        "data": image_b64,
                    },
                },
                {"type": "text", "text": prompt},
            ],
        }],
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        result = data["content"][0]["text"]
        # Strip code fences if present
        result = re.sub(r"^```(?:markdown|html)?\s*\n?", "", result, flags=re.MULTILINE)
        result = re.sub(r"\n?```\s*$", "", result, flags=re.MULTILINE)
        return result
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        print(f"[CLAUDE ERROR] Status {e.code}: {_sanitize_error(error_body[:500])}", file=sys.stderr)
        raise RuntimeError(f"Claude API error {e.code}")


def claude_translate_text(text: str, source_lang: str, target_lang: str) -> str:
    """Translate text with Claude (for DOCX pipeline)."""
    api_key = os.environ.get("CLAUDE_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("CLAUDE_API_KEY not set")

    lang_names = {"ro": "Romanian", "sk": "Slovak", "en": "English"}
    src = lang_names.get(source_lang, source_lang)
    tgt = lang_names.get(target_lang, target_lang)

    print(f"[CLAUDE] Translate text: {source_lang} -> {target_lang}, {len(text)} chars", file=sys.stderr)

    prompt = (
        f"Format this {src} math textbook text as professional Markdown and translate to {tgt}.\n\n"
        "RULES:\n"
        "- # for titles, ## for sections. Construction steps $P_1$: are paragraphs, NOT headings.\n"
        "- ALL math as LaTeX. **Bold** for key terms.\n"
        "- SVG figures for any geometric construction described (same conventions as a math textbook).\n"
        "- Pair construction steps side-by-side: $P_1$+$P_2$ in one <div> with 2 <svg> elements.\n"
        "- SVG width=\"255\", vertices italic, angles #c44/#1a7, final polygon fill=\"#e8f0fe\".\n"
        f"- Translate ALL text to {tgt} with correct mathematical terminology and diacritics.\n\n"
        "Output ONLY the Markdown. No code fences.\n\n"
        f"TEXT:\n{text}"
    )

    payload = json.dumps({
        "model": "claude-sonnet-4-6",
        "max_tokens": 16384,
        "messages": [{"role": "user", "content": prompt}],
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        result = data["content"][0]["text"]
        result = re.sub(r"^```(?:markdown|html)?\s*\n?", "", result, flags=re.MULTILINE)
        result = re.sub(r"\n?```\s*$", "", result, flags=re.MULTILINE)
        return result
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        print(f"[CLAUDE ERROR] Status {e.code}: {_sanitize_error(error_body[:500])}", file=sys.stderr)
        raise RuntimeError(f"Claude API error {e.code}")


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
