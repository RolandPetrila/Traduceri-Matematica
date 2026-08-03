"""Tests for the professional-output fixes:
- figure_crop content-aware snap: locks a rough/bad bbox onto the actual drawing,
  dropping adjacent text lines (formula/caption) — works for any figure shape.
- html_builder list rendering: keeps the OCR's literal number, never <ol>
  (which double-numbered or reset every single-item section to "1.").
Deterministic, no network.
"""

import base64
import io

from PIL import Image

from lib.figure_crop import _snap_to_content, crop_figure
from lib.html_builder import build_html_structured


def _region_line_then_block():
    """Grayscale region: a thin text-like line near the top, a big gap, then a
    tall figure-like block. Mirrors 'formula line above a triangle'."""
    img = Image.new("L", (200, 300), 255)
    px = img.load()
    for x in range(30, 170):           # thin line (text / formula), rows 10-13
        for y in range(10, 14):
            px[x, y] = 0
    for x in range(40, 160):           # tall hollow block (figure), rows 80-259
        for y in range(80, 260):
            if x in (40, 159) or y in (80, 259):
                px[x, y] = 0
    return img


def test_snap_picks_tallest_block_not_text_line():
    box = _snap_to_content(_region_line_then_block())
    assert box is not None
    x0, y0, x1, y1 = box
    assert y0 >= 70, f"snapped onto the text line (y0={y0})"
    assert y1 <= 266
    assert (y1 - y0) > 150  # the tall figure block, not the thin line


def test_snap_returns_none_on_blank():
    assert _snap_to_content(Image.new("L", (200, 200), 255)) is None


def test_r8_4_tight_bbox_does_not_grab_text_block_above():
    # R8.4: expansiune redusă 0.35→0.15 + cap. Un bbox STRÂNS pe figură (cazul
    # paginilor de construcție) NU trebuie să înghită un bloc de text din amonte.
    page = Image.new("RGB", (400, 1000), "white")
    px = page.load()
    for x in range(60, 340):            # bloc de text/formulă sus (y 200-300)
        for y in range(200, 300):
            if (y % 12) < 6:            # câteva "linii" de text
                px[x, y] = (0, 0, 0)
    for x in range(80, 320):            # figura (triunghi-ish), y 520-760
        for y in range(520, 760):
            if x in (80, 319) or y in (520, 759):
                px[x, y] = (0, 0, 0)
    buf = io.BytesIO()
    page.save(buf, format="PNG")
    # bbox STRÂNS pe figură (fără să atingă textul de sus).
    tight = {"x": 0.20, "y": 0.52, "w": 0.60, "h": 0.24}
    b64 = crop_figure(buf.getvalue(), tight)
    crop = Image.open(io.BytesIO(base64.b64decode(b64))).convert("L")
    cw, ch = crop.size
    # Invariantul R8.4: crop-ul rămâne pe figură, textul din amonte nu intră.
    # (Onest: cazul real de duplicare — text CONTIGUU cu figura — e o atenuare,
    # nu o eliminare; verificarea perceptuală pe pagini de construcție = eyeball.)
    top_strip = list(crop.crop((0, 0, cw, 8)).getdata())
    assert min(top_strip) > 200, "textul din amonte a intrat în crop (R8.4)"
    # Crop-ul recuperează figura (~240px) fără să se extindă (cap) la tot amonte-le.
    assert 150 < ch < 340, f"crop nemărginit / prea scurt: {ch}"


def test_crop_figure_snaps_and_excludes_text_line():
    # Full page: text line at top, figure block lower. A deliberately BAD bbox
    # (starts on the text line, too short) must still yield the figure only.
    page = Image.new("RGB", (400, 800), "white")
    px = page.load()
    for x in range(60, 340):           # text line at y~120
        for y in range(120, 126):
            px[x, y] = (0, 0, 0)
    for x in range(80, 320):           # big triangle-ish block y~300-620
        for y in range(300, 620):
            if x in (80, 319) or y in (300, 619):
                px[x, y] = (0, 0, 0)
    buf = io.BytesIO()
    page.save(buf, format="PNG")
    # Realistically imprecise bbox: starts on the text line (too high) and covers
    # most of the figure — the kind of error Gemini actually makes.
    bad_bbox = {"x": 0.15, "y": 0.14, "w": 0.65, "h": 0.60}
    b64 = crop_figure(buf.getvalue(), bad_bbox)
    crop = Image.open(io.BytesIO(base64.b64decode(b64))).convert("L")
    cw, ch = crop.size
    # The crop should be roughly the figure block (~320px tall), not the whole
    # bad-bbox span, and its top rows must be white (text line excluded).
    assert ch > 250, f"crop too short ({ch}) — did not recover the full figure"
    top_strip = list(crop.crop((0, 0, cw, 8)).getdata())
    assert min(top_strip) > 200, "text line leaked into the top of the crop"


def test_list_no_double_numbering():
    pages = [{
        "title": "Titlu",
        "sections": [
            {"type": "list", "content": "1. primul punct"},
            {"type": "list", "content": "2. al doilea punct"},
        ],
    }]
    html = build_html_structured(pages, [], "sk")
    assert "<ol>" not in html and "<li>" not in html   # no auto-numbered list
    assert "1. primul punct" in html                   # literal number kept
    assert "2. al doilea punct" in html                # NOT reset to "1."
    assert "1. 1." not in html                         # no double number
