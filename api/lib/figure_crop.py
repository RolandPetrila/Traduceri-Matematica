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

_INK_THRESHOLD = 110  # grayscale value below which a pixel counts as "ink"


def _snap_to_content(gray_region):
    """Tighten a rough figure region to the actual drawing.

    Gemini's bbox is spatially imprecise — it often catches an adjacent formula
    line above the figure and/or clips the figure's base. Given a (generously
    expanded) grayscale search region, this finds the TALLEST contiguous block of
    ink rows — the figure — and returns its tight box, dropping short adjacent
    text lines (a formula, a caption, the next numbered step). Works for any
    figure shape (triangle, circle, graph, construction) because it keys off ink
    density, not the figure type. Fast: uses PIL resize to build a 1-px-wide row
    profile instead of a Python per-pixel scan.

    Returns (x0, y0, x1, y1) in region coordinates, or None to fall back.
    """
    w, h = gray_region.size
    if w < 10 or h < 10:
        return None
    # Ink mask: dark pixels -> 255, background -> 0.
    mask = gray_region.point(lambda p: 255 if p < _INK_THRESHOLD else 0)
    # Rows that contain ANY ink. Using presence (not a row average) keeps thin
    # strokes on wide pages from being averaged below a threshold and lost.
    data = list(mask.getdata())
    ink_rows = [y for y in range(h) if any(data[y * w:(y + 1) * w])]
    if not ink_rows:
        return None
    # Group ink rows into contiguous runs, tolerating small blank gaps inside a
    # figure (between a shape and its vertex labels). Kept small on purpose: the
    # search box is only moderately expanded, so a further-away formula line or
    # next step stays a separate run and loses to the (taller) figure run.
    gap = max(14, h // 18)
    runs = []
    start = prev = ink_rows[0]
    for r in ink_rows[1:]:
        if r - prev > gap:
            runs.append((start, prev))
            start = r
        prev = r
    runs.append((start, prev))
    y0, y1 = max(runs, key=lambda ab: ab[1] - ab[0])  # tallest run = the figure
    # Horizontal extent of ink within that vertical slice.
    bb = mask.crop((0, y0, w, y1 + 1)).getbbox()
    if not bb:
        return None
    x0, _, x1, _ = bb
    if (x1 - x0) < 8 or (y1 - y0) < 8:
        return None
    return x0, y0, x1, y1 + 1


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
    snap: bool = True,
) -> str:
    """Crop a figure from an image and return as base64 PNG.

    Args:
        image_bytes: Original page image bytes
        bbox: {"x": float, "y": float, "w": float, "h": float} — fractions 0.0-1.0
        target_bg: Target background color (default white)
        tolerance: Color tolerance for background detection
        snap: content-aware snap onto the drawing (for Gemini's IMPRECISE math bboxes).
              Disable for Azure — its boundingRegions already cover only the core
              content, and the "tallest ink run" snap would clip logos/seals (R7.4).

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

    # Content-aware snap: expand the box (Gemini frequently clips the figure or
    # captures an adjacent formula/caption) then lock onto the actual drawing so
    # the crop is tight and complete for ANY figure. Falls back to Gemini's box.
    # Skipped for Azure (snap=False): its boundingRegions are already tight, and the
    # "tallest ink run" heuristic would clip a logo/seal to just its densest strip.
    if snap:
        bw_px, bh_px = x2 - x1, y2 - y1
        ox1, oy1, ox2, oy2 = x1, y1, x2, y2  # bbox-ul Gemini (referință pt cap R8.4)
        # R8.4: expansiune verticală redusă 0.35→0.15. Pe pagini de construcție,
        # bbox-ul mic al Gemini + expansiunea de 0.35 înghițea textul tipărit
        # adiacent (care e ȘI transcris) → duplicare poză+text. 0.15 recuperează
        # încă baza clipată a figurii (dovedit de fixture-ul F9) fără a prinde o
        # linie întreagă de text.
        sx1 = max(0, int(x1 - 0.15 * bw_px))
        sy1 = max(0, int(y1 - 0.15 * bh_px))
        sx2 = min(w, int(x2 + 0.15 * bw_px))
        sy2 = min(h, int(y2 + 0.15 * bh_px))
        try:
            snapped = _snap_to_content(img.convert("L").crop((sx1, sy1, sx2, sy2)))
        except Exception as snap_err:
            print(f"[CROP] snap failed, using raw bbox: {snap_err}", file=sys.stderr)
            snapped = None
        if snapped:
            rx0, ry0, rx1, ry1 = snapped
            p = 12  # breathing room around the drawing
            # R8.4 cap: crop-ul final NU depășește bbox-ul Gemini cu mai mult de o
            # marjă modestă (recuperare a bazei clipate, DAR nu o linie de text
            # întreagă). `max`/`min` păstrează tightening-ul snap-ului când e mai
            # strâns decât bbox-ul; clamp doar când snap-ul s-a extins în text.
            grow_x = int(0.12 * bw_px) + p
            grow_y = int(0.12 * bh_px) + p
            x1 = max(0, max(sx1 + rx0 - p, ox1 - grow_x))
            y1 = max(0, max(sy1 + ry0 - p, oy1 - grow_y))
            x2 = min(w, min(sx1 + rx1 + p, ox2 + grow_x))
            y2 = min(h, min(sy1 + ry1 + p, oy2 + grow_y))

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


def embed_crops_in_sections(
    image_bytes: bytes, sections: list[dict], snap: bool = True
) -> list[dict]:
    """Recursively embed cropped figure images into sections.

    For every 'figure' section with a 'bbox' field, crops the region from
    image_bytes and stores base64 PNG in 'img_b64'. Handles two_column nesting.

    Args:
        image_bytes: Original page image bytes
        sections: List of OCR structured sections
        snap: content-aware snap (True for Gemini's imprecise bboxes; False for
              Azure's tight boundingRegions — see crop_figure).

    Returns:
        New list of sections with 'img_b64' added to figure sections.
    """
    result = []
    for section in sections:
        s = dict(section)
        if s.get("type") == "figure":
            bbox = s.get("bbox")
            if bbox and isinstance(bbox, dict):
                b64 = crop_figure(image_bytes, bbox, snap=snap)
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
            s["left"] = embed_crops_in_sections(image_bytes, s.get("left", []), snap)
            s["right"] = embed_crops_in_sections(image_bytes, s.get("right", []), snap)
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
