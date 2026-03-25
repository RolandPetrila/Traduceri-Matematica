"""Structured OCR using Gemini 2.5 Flash JSON mode.

Extracts text + generates SVG figures from math textbook images.
Returns structured JSON with text sections and inline SVG.
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
    Section types: heading, paragraph, step, observation, list, figure.
    Figure sections have "svg" field with inline SVG markup.
    """
    api_key = os.environ.get("GOOGLE_AI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GOOGLE_AI_API_KEY not set")

    image_b64 = base64.b64encode(image_bytes).decode("utf-8")
    lang_names = {"ro": "Romanian", "sk": "Slovak", "en": "English"}
    src = lang_names.get(source_lang, source_lang)

    print(f"[OCR-STRUCT] Processing: {len(image_bytes)} bytes, {mime_type}, {source_lang}", file=sys.stderr)

    prompt = (
        f"Analyze this {src} math textbook page. Return JSON with this structure:\n"
        '{{"title":"page title","sections":['
        '{{"type":"heading","content":"text","level":1}},'
        '{{"type":"paragraph","content":"text with $LaTeX$ formulas"}},'
        '{{"type":"step","content":"$P_1$: construction step text"}},'
        '{{"type":"figure","svg":"<svg>...</svg>","caption":"optional caption"}},'
        '{{"type":"observation","content":"observation text"}}'
        ']}}\n\n'
        "CRITICAL RULES:\n"
        "1. ALL math notation as LaTeX: $\\triangle ABC$, $\\angle A$, $AB = 4 \\text{{ cm}}$\n"
        "2. Steps labeled P1, P2 etc as type 'step'\n"
        "3. For EVERY geometric figure/diagram in the image, generate an INLINE SVG that reproduces it:\n"
        "   - Use <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 135' width='255' height='172' "
        "style='font-family:Cambria,serif'>\n"
        "   - Draw lines, circles, arcs, polygons with proper coordinates\n"
        "   - Label vertices (A, B, C...) with <text> elements in italic\n"
        "   - Show angles with <path> arcs, label with degrees\n"
        "   - Show measurements (4 cm, 5 cm) as <text> near the sides\n"
        "   - Use colors: #333 for lines, #c44 for angles, #888 for labels, #e8f0fe for fills\n"
        "   - If multiple construction steps shown side by side, create separate SVGs\n"
        "   - Put step label (P1, P2...) as bold text at top center of each SVG\n"
        "4. Group related SVGs: if figure shows P1 and P2 side by side, return TWO svg strings "
        "in a single figure section as array: {\"type\":\"figure\",\"svg\":[\"<svg>P1</svg>\",\"<svg>P2</svg>\"]}\n"
        "5. Preserve the EXACT text content — do not summarize or skip any text\n"
        "6. Bold terms: wrap in **bold** markers\n"
        "7. Return valid JSON only, no explanation"
    )

    contents = [{"parts": [
        {"text": prompt},
        {"inline_data": {"mime_type": mime_type, "data": image_b64}},
    ]}]

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

    payload = json.dumps({
        "contents": contents,
        "generationConfig": {
            "responseMimeType": "application/json",
        },
    }).encode("utf-8")

    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})

    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        raw = data["candidates"][0]["content"]["parts"][0]["text"]

        try:
            result = json.loads(raw)
        except json.JSONDecodeError:
            fixed = re.sub(r'(?<!\\)\\(?!["\\/bfnrtu\\])', r'\\\\', raw)
            try:
                result = json.loads(fixed)
            except json.JSONDecodeError as e2:
                print(f"[OCR-STRUCT] JSON parse failed even after fix: {e2}", file=sys.stderr)
                print(f"[OCR-STRUCT] Raw (first 500): {raw[:500]}", file=sys.stderr)
                return {"title": "", "sections": [{"type": "paragraph", "content": raw}]}

        if not isinstance(result, dict):
            result = {"title": "", "sections": [{"type": "paragraph", "content": str(result)}]}
        if "sections" not in result:
            result["sections"] = []

        figure_count = sum(1 for s in result.get("sections", []) if s.get("type") == "figure")
        svg_count = sum(1 for s in result.get("sections", []) if s.get("type") == "figure" and s.get("svg"))
        total = len(result.get("sections", []))
        print(f"[OCR-STRUCT] OK: {total} sections, {figure_count} figures ({svg_count} with SVG)", file=sys.stderr)
        return result

    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")[:300]
        print(f"[OCR-STRUCT] HTTP {e.code}: {error_body}", file=sys.stderr)
        raise
    except Exception as e:
        print(f"[OCR-STRUCT] Error: {e}", file=sys.stderr)
        raise
