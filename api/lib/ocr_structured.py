"""Structured OCR using Gemini 2.5 Flash JSON mode.

Extracts text + bounding boxes for figures from math textbook images.
Returns structured JSON with text sections and figure bbox coordinates.
Figures are cropped from the original image (not AI-generated SVG).
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
    Figure sections have "bbox" field with normalized coordinates (0.0-1.0).
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
        '{{"type":"figure","bbox":{{"x":0.1,"y":0.3,"w":0.4,"h":0.3}},"caption":"optional caption"}},'
        '{{"type":"observation","content":"observation text"}}'
        ']}}\n\n'
        "CRITICAL RULES:\n"
        "1. ALL math notation as LaTeX: $\\triangle ABC$, $\\angle A$, $AB = 4 \\text{{ cm}}$\n"
        "2. Steps labeled P1, P2 etc as type 'step'\n"
        "3. For EVERY geometric figure/diagram/drawing in the image:\n"
        "   - Return type 'figure' with a 'bbox' field\n"
        "   - bbox has x, y, w, h as FRACTIONS of image size (0.0 to 1.0)\n"
        "   - x = left edge, y = top edge, w = width, h = height\n"
        "   - Be PRECISE with coordinates — the bbox will be used to crop the figure\n"
        "   - Include a small margin around the figure (add ~0.02 padding)\n"
        "   - If two figures are side by side (e.g. P1 and P2), return TWO separate figure sections\n"
        "   - Do NOT generate SVG — just provide the bounding box coordinates\n"
        "4. 'caption' field is optional — use it for labels like 'Figura 1' or 'P1'\n"
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

        # Validate and clean bbox values
        for section in result.get("sections", []):
            if section.get("type") == "figure" and section.get("bbox"):
                bbox = section["bbox"]
                if not _validate_bbox(bbox):
                    print(f"[OCR-STRUCT] Invalid bbox removed: {bbox}", file=sys.stderr)
                    section.pop("bbox", None)

        figure_count = sum(1 for s in result.get("sections", []) if s.get("type") == "figure")
        bbox_count = sum(1 for s in result.get("sections", []) if s.get("type") == "figure" and s.get("bbox"))
        total = len(result.get("sections", []))
        print(f"[OCR-STRUCT] OK: {total} sections, {figure_count} figures ({bbox_count} with valid bbox)", file=sys.stderr)
        return result

    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")[:300]
        print(f"[OCR-STRUCT] HTTP {e.code}: {error_body}", file=sys.stderr)
        raise
    except Exception as e:
        print(f"[OCR-STRUCT] Error: {e}", file=sys.stderr)
        raise


def _validate_bbox(bbox: dict) -> bool:
    """Validate bbox coordinates are within reasonable bounds (SC1).

    Returns True if bbox is valid for cropping, False otherwise.
    """
    try:
        x = float(bbox.get("x", -1))
        y = float(bbox.get("y", -1))
        w = float(bbox.get("w", 0))
        h = float(bbox.get("h", 0))
    except (TypeError, ValueError):
        return False

    # All values must be 0.0-1.0
    if not (0.0 <= x <= 1.0 and 0.0 <= y <= 1.0):
        return False
    if not (0.0 < w <= 1.0 and 0.0 < h <= 1.0):
        return False
    # Box must not extend beyond image
    if x + w > 1.05 or y + h > 1.05:  # 5% tolerance
        return False
    # Box must have minimum size (at least 2% of image)
    if w < 0.02 or h < 0.02:
        return False
    return True
