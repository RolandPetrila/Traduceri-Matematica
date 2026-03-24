"""Structured OCR using Gemini 2.5 Flash JSON mode.

Extracts text + figure bounding boxes from images/PDFs.
Returns structured JSON instead of raw markdown.
"""

from __future__ import annotations

import base64
import json
import os
import re
import sys
import urllib.request


def ocr_structured(image_bytes: bytes, mime_type: str, source_lang: str = "ro") -> dict:
    """Extract structured content from an image using Gemini JSON mode.

    Returns dict with "title" and "sections" list.
    Each section has "type" (heading/paragraph/step/observation/list/figure),
    "content" (text), and optionally "bbox" (for figures).
    """
    api_key = os.environ.get("GOOGLE_AI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GOOGLE_AI_API_KEY not set")

    image_b64 = base64.b64encode(image_bytes).decode("utf-8")
    lang_names = {"ro": "Romanian", "sk": "Slovak", "en": "English"}
    src = lang_names.get(source_lang, source_lang)

    print(f"[OCR-STRUCT] Processing: {len(image_bytes)} bytes, {mime_type}, {source_lang}", file=sys.stderr)

    # Short, focused prompt — Gemini JSON mode works better with concise instructions
    prompt = (
        f"Analyze this {src} math textbook page. Return JSON with structure:\n"
        '{{"title":"...","sections":[{{"type":"heading|paragraph|step|observation|list|figure",'
        '"content":"text here","level":1,"bbox":{{"x":0.1,"y":0.2,"w":0.3,"h":0.2}}}}]}}\n'
        "Rules: math as LaTeX, steps P1-P4 as type step, figures with bbox (fractions 0-1)."
    )

    contents = [{
        "parts": [
            {"text": prompt},
            {"inline_data": {"mime_type": mime_type, "data": image_b64}},
        ]
    }]

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

    payload = json.dumps({
        "contents": contents,
        "generationConfig": {
            "responseMimeType": "application/json",
        },
    }).encode("utf-8")

    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})

    try:
        with urllib.request.urlopen(req, timeout=55) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        raw = data["candidates"][0]["content"]["parts"][0]["text"]

        # Parse JSON — Gemini with responseMimeType should return valid JSON
        # but sometimes LaTeX backslashes cause issues
        try:
            result = json.loads(raw)
        except json.JSONDecodeError:
            # Fix unescaped LaTeX backslashes: \angle → \\angle etc.
            fixed = re.sub(r'(?<!\\)\\(?!["\\/bfnrtu\\])', r'\\\\', raw)
            try:
                result = json.loads(fixed)
            except json.JSONDecodeError as e2:
                print(f"[OCR-STRUCT] JSON parse failed even after fix: {e2}", file=sys.stderr)
                print(f"[OCR-STRUCT] Raw (first 300): {raw[:300]}", file=sys.stderr)
                return {"title": "", "sections": [{"type": "paragraph", "content": raw}]}

        # Ensure structure
        if not isinstance(result, dict):
            result = {"title": "", "sections": [{"type": "paragraph", "content": str(result)}]}
        if "sections" not in result:
            result["sections"] = []

        figure_count = sum(1 for s in result.get("sections", []) if s.get("type") == "figure")
        total = len(result.get("sections", []))
        print(f"[OCR-STRUCT] OK: {total} sections, {figure_count} figures", file=sys.stderr)
        return result

    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")[:300]
        print(f"[OCR-STRUCT] HTTP {e.code}: {error_body}", file=sys.stderr)
        raise
    except Exception as e:
        print(f"[OCR-STRUCT] Error: {e}", file=sys.stderr)
        raise
