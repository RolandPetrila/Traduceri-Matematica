"""Crop geometric figures from page images with background removal.

Extracts figure regions using bounding boxes from OCR,
removes background color, and returns clean PNGs on white background.
"""

from __future__ import annotations

import base64
import io
import sys
from PIL import Image


def crop_figure(
    image_bytes: bytes,
    bbox: dict,
    target_bg: tuple[int, int, int] = (255, 255, 255),
    tolerance: int = 40,
) -> str:
    """Crop a figure from an image and return as base64 PNG.

    Args:
        image_bytes: Original page image bytes
        bbox: {"x": float, "y": float, "w": float, "h": float} — fractions 0.0-1.0
        target_bg: Target background color (default white)
        tolerance: Color tolerance for background detection

    Returns:
        Base64-encoded PNG string (without data: prefix)
    """
    img = Image.open(io.BytesIO(image_bytes))
    w, h = img.size

    # Convert bbox fractions to pixels with small padding
    pad = 5
    x1 = max(0, int(bbox["x"] * w) - pad)
    y1 = max(0, int(bbox["y"] * h) - pad)
    x2 = min(w, int((bbox["x"] + bbox["w"]) * w) + pad)
    y2 = min(h, int((bbox["y"] + bbox["h"]) * h) + pad)

    if x2 <= x1 or y2 <= y1:
        print(f"[CROP] Invalid bbox: {bbox} → ({x1},{y1},{x2},{y2})", file=sys.stderr)
        return ""

    # Crop region
    cropped = img.crop((x1, y1, x2, y2)).convert("RGBA")

    # Detect background color from corners (average of 4 corner 5x5 regions)
    cw, ch = cropped.size
    corners = []
    for cx, cy in [(0, 0), (cw - 5, 0), (0, ch - 5), (cw - 5, ch - 5)]:
        region = cropped.crop((max(0, cx), max(0, cy), min(cw, cx + 5), min(ch, cy + 5)))
        pixels = list(region.getdata())
        if pixels:
            avg_r = sum(p[0] for p in pixels) // len(pixels)
            avg_g = sum(p[1] for p in pixels) // len(pixels)
            avg_b = sum(p[2] for p in pixels) // len(pixels)
            corners.append((avg_r, avg_g, avg_b))

    if corners:
        bg_r = sum(c[0] for c in corners) // len(corners)
        bg_g = sum(c[1] for c in corners) // len(corners)
        bg_b = sum(c[2] for c in corners) // len(corners)
    else:
        bg_r, bg_g, bg_b = 245, 245, 245  # Assume light gray

    # Replace background with target color (white)
    pixels = cropped.load()
    for py in range(ch):
        for px in range(cw):
            r, g, b, a = pixels[px, py]
            if (abs(r - bg_r) < tolerance and
                abs(g - bg_g) < tolerance and
                abs(b - bg_b) < tolerance):
                pixels[px, py] = (*target_bg, 255)

    # Convert to RGB (drop alpha) and encode as PNG base64
    final = cropped.convert("RGB")
    buf = io.BytesIO()
    final.save(buf, format="PNG", optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

    print(f"[CROP] Figure: bbox={bbox} → {cw}x{ch}px, {len(b64)} b64 chars", file=sys.stderr)
    return b64


def crop_all_figures(image_bytes: bytes, sections: list[dict]) -> dict[int, str]:
    """Crop all figures from sections list.

    Args:
        image_bytes: Original page image
        sections: OCR structured sections (with "type": "figure" entries)

    Returns:
        {section_index: base64_png} for each figure section
    """
    result = {}
    for i, section in enumerate(sections):
        if section.get("type") == "figure" and section.get("bbox"):
            b64 = crop_figure(image_bytes, section["bbox"])
            if b64:
                result[i] = b64
    return result
