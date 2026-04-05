"""Crop geometric figures from page images with background removal.

Extracts figure regions using bounding boxes from OCR,
removes background color, and returns clean PNGs on white background.
"""

from __future__ import annotations

import base64
import io
import sys
from PIL import Image


PLACEHOLDER_B64 = None  # Lazy-generated placeholder for invalid crops


def _generate_placeholder() -> str:
    """Generate a small placeholder image with 'Figure unavailable' text."""
    img = Image.new("RGB", (200, 60), (245, 245, 245))
    try:
        from PIL import ImageDraw
        draw = ImageDraw.Draw(img)
        draw.text((10, 20), "[ Figura indisponibila ]", fill=(180, 180, 180))
    except ImportError:
        pass
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")


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
        Base64-encoded PNG string (without data: prefix), or placeholder on failure.
    """
    global PLACEHOLDER_B64

    try:
        img = Image.open(io.BytesIO(image_bytes))
    except Exception as e:
        print(f"[CROP] Cannot open image: {e}", file=sys.stderr)
        if PLACEHOLDER_B64 is None:
            PLACEHOLDER_B64 = _generate_placeholder()
        return PLACEHOLDER_B64

    w, h = img.size

    # Clamp bbox to valid range
    x = max(0.0, min(1.0, float(bbox.get("x", 0))))
    y = max(0.0, min(1.0, float(bbox.get("y", 0))))
    bw = max(0.0, min(1.0, float(bbox.get("w", 0))))
    bh = max(0.0, min(1.0, float(bbox.get("h", 0))))

    # Convert fractions to pixels with padding
    pad = 8
    x1 = max(0, int(x * w) - pad)
    y1 = max(0, int(y * h) - pad)
    x2 = min(w, int((x + bw) * w) + pad)
    y2 = min(h, int((y + bh) * h) + pad)

    if x2 <= x1 or y2 <= y1 or (x2 - x1) < 10 or (y2 - y1) < 10:
        print(f"[CROP] Bbox too small: {bbox} -> ({x1},{y1},{x2},{y2})", file=sys.stderr)
        if PLACEHOLDER_B64 is None:
            PLACEHOLDER_B64 = _generate_placeholder()
        return PLACEHOLDER_B64

    # Crop region
    cropped = img.crop((x1, y1, x2, y2)).convert("RGBA")

    # Detect background color from corners
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
        bg_r, bg_g, bg_b = 245, 245, 245

    # Replace background with white
    px = cropped.load()
    for py_ in range(ch):
        for px_ in range(cw):
            r, g, b, a = px[px_, py_]
            if (abs(r - bg_r) < tolerance and
                abs(g - bg_g) < tolerance and
                abs(b - bg_b) < tolerance):
                px[px_, py_] = (*target_bg, 255)

    # Encode as PNG base64
    final = cropped.convert("RGB")
    buf = io.BytesIO()
    final.save(buf, format="PNG", optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

    print(f"[CROP] Figure: bbox=({x:.2f},{y:.2f},{bw:.2f},{bh:.2f}) -> {cw}x{ch}px, {len(b64)} b64 chars", file=sys.stderr)
    return b64


def embed_crops_in_sections(image_bytes: bytes, sections: list[dict]) -> list[dict]:
    """Recursively embed cropped figure images into sections.

    For every 'figure' section with a 'bbox' field, crops the region from
    image_bytes and stores base64 PNG in 'img_b64'. Handles two_column nesting.

    Args:
        image_bytes: Original page image bytes
        sections: List of OCR structured sections

    Returns:
        New list of sections with 'img_b64' added to figure sections.
    """
    result = []
    for section in sections:
        s = dict(section)
        if s.get("type") == "figure":
            bbox = s.get("bbox")
            if bbox and isinstance(bbox, dict):
                b64 = crop_figure(image_bytes, bbox)
                s["img_b64"] = b64
                s.pop("bbox", None)
            else:
                # No bbox — use placeholder
                global PLACEHOLDER_B64
                if PLACEHOLDER_B64 is None:
                    PLACEHOLDER_B64 = _generate_placeholder()
                s["img_b64"] = PLACEHOLDER_B64
                s.pop("bbox", None)
                print("[CROP] Figure has no bbox, using placeholder", file=sys.stderr)
        elif s.get("type") == "two_column":
            s["left"] = embed_crops_in_sections(image_bytes, s.get("left", []))
            s["right"] = embed_crops_in_sections(image_bytes, s.get("right", []))
        result.append(s)
    return result


def crop_all_figures(image_bytes: bytes, sections: list[dict]) -> dict[int, str]:
    """Crop all figures from sections list.

    Args:
        image_bytes: Original page image
        sections: OCR structured sections (with "type": "figure" entries)

    Returns:
        {section_index: base64_png} for each figure section with bbox.
        Figures without bbox get a placeholder.
    """
    result = {}
    for i, section in enumerate(sections):
        if section.get("type") != "figure":
            continue
        if section.get("bbox"):
            b64 = crop_figure(image_bytes, section["bbox"])
            if b64:
                result[i] = b64
        else:
            # Figure without bbox — use placeholder (SC1)
            global PLACEHOLDER_B64
            if PLACEHOLDER_B64 is None:
                PLACEHOLDER_B64 = _generate_placeholder()
            result[i] = PLACEHOLDER_B64
            print(f"[CROP] Figure {i} has no bbox, using placeholder", file=sys.stderr)
    return result
