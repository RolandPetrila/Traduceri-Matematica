"""Structured OCR using Gemini 2.5 Flash JSON mode.

Extracts text + figure bounding boxes from images/PDFs.
Returns structured JSON instead of raw markdown.
"""

from __future__ import annotations

import base64
import json
import os
import sys
import urllib.request


def ocr_structured(image_bytes: bytes, mime_type: str, source_lang: str = "ro") -> dict:
    """Extract structured content from an image using Gemini JSON mode.

    Returns:
        {
            "title": "...",
            "sections": [
                {
                    "heading": "...",
                    "content": "paragraph text...",
                    "type": "heading|paragraph|step|observation"
                },
                {
                    "type": "figure",
                    "bbox": {"x": 0.1, "y": 0.3, "w": 0.4, "h": 0.25},
                    "description": "triangle ABC with sides 4,3,5"
                }
            ]
        }
    """
    api_key = os.environ.get("GOOGLE_AI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GOOGLE_AI_API_KEY not set")

    image_b64 = base64.b64encode(image_bytes).decode("utf-8")
    lang_names = {"ro": "Romanian", "sk": "Slovak", "en": "English"}
    src = lang_names.get(source_lang, source_lang)

    print(f"[OCR-STRUCT] Processing: {len(image_bytes)} bytes, {mime_type}, {source_lang}", file=sys.stderr)

    prompt = (
        f"Analyze this {src} math textbook page. Return a JSON object with the page structure.\n\n"
        "Return ONLY valid JSON with this exact structure:\n"
        "{\n"
        '  "title": "page title or empty string",\n'
        '  "sections": [\n'
        "    {\n"
        '      "type": "heading|paragraph|step|observation|list",\n'
        '      "content": "the text content",\n'
        '      "level": 1 or 2 (for headings only)\n'
        "    },\n"
        "    {\n"
        '      "type": "figure",\n'
        '      "bbox": {"x": 0.0, "y": 0.0, "w": 1.0, "h": 0.5},\n'
        '      "description": "what the figure shows"\n'
        "    }\n"
        "  ]\n"
        "}\n\n"
        "RULES:\n"
        "- bbox coordinates are FRACTIONS of page size (0.0 to 1.0)\n"
        "- x,y = top-left corner of the figure region\n"
        "- ALL math must be LaTeX: $\\triangle ABC$, $\\angle MON$, $AB = 4 \\text{ cm}$\n"
        "- Construction steps P₁, P₂ etc. have type 'step'\n"
        "- Identify EVERY figure/diagram region with its bounding box\n"
        "- Include ALL text content, nothing skipped\n"
        "- Observations/notes have type 'observation'"
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
        result = json.loads(raw)
        figure_count = sum(1 for s in result.get("sections", []) if s.get("type") == "figure")
        print(f"[OCR-STRUCT] OK: {len(result.get('sections', []))} sections, {figure_count} figures", file=sys.stderr)
        return result
    except json.JSONDecodeError as e:
        print(f"[OCR-STRUCT] JSON parse error: {e}", file=sys.stderr)
        # Fallback: return raw text as single section
        raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
        return {"title": "", "sections": [{"type": "paragraph", "content": raw_text}]}
    except Exception as e:
        print(f"[OCR-STRUCT] Error: {e}", file=sys.stderr)
        raise
