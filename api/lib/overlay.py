"""Overlay translation extraction for TEXT PDFs (pixel-perfect, layout-preserving).

For a text-based PDF, PyMuPDF gives EXACT text positions (no OCR imprecision).
We extract each visual line (text + bbox + size + bold/italic + color), render two
page backgrounds (original + one with the text redacted white), and hand these to
the frontend, which overlays the translated text at the original positions and
toggles original/translated.

Lines that sit on top of a logo/stamp image are dropped (the image stays intact in
the background; overlaying garbled stamp text would look wrong).

Per-page (one page per call) to respect the 60s serverless limit.
"""
from __future__ import annotations

import base64

import fitz  # PyMuPDF

_DPI = 150  # background raster resolution; 1 PDF pt -> _DPI/72 px


def is_text_pdf(pdf_bytes: bytes, min_spans: int = 15) -> bool:
    """True if the PDF carries a real text layer (vs a scanned image)."""
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception:
        return False
    try:
        spans = 0
        for page in doc:
            for b in page.get_text("dict").get("blocks", []):
                for l in b.get("lines", []):
                    spans += len(l.get("spans", []))
            if spans >= min_spans:
                return True
        return spans >= min_spans
    finally:
        doc.close()


def _clean(s: str) -> str:
    return s.replace("­", "").replace("\xa0", " ")


def is_gibberish(text: str) -> bool:
    """Symbol-dominated fragment (stamp/seal glyphs extracted as junk), not content.
    Keeps normal text, numbers, codes and phone numbers (alnum-heavy)."""
    t = text.strip()
    if len(t) < 2:
        return True
    non_space = [c for c in t if not c.isspace()]
    if not non_space:
        return True
    alnum = sum(1 for c in non_space if c.isalnum())
    return (alnum / len(non_space)) < 0.5


def _png_b64(page) -> str:
    pix = page.get_pixmap(matrix=fitz.Matrix(_DPI / 72, _DPI / 72), alpha=False)
    return base64.b64encode(pix.tobytes("png")).decode("ascii")


def overlay_page(pdf_bytes: bytes, page_idx: int = 0) -> dict:
    """Extract one page for overlay translation.

    Returns:
        {
          "page_count": int, "page": int,
          "width": float, "height": float,   # PDF points
          "bg_original": b64 png, "bg_redacted": b64 png,
          "lines": [{"id","text","bbox":[x0,y0,x1,y1],"size","bold","italic","color"}]
        }
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    try:
        page_count = doc.page_count
        if page_idx < 0 or page_idx >= page_count:
            raise ValueError(f"page {page_idx} out of range (0..{page_count - 1})")
        page = doc[page_idx]

        lines = []
        d = page.get_text("dict")
        for b in d.get("blocks", []):
            if b.get("type") != 0:  # text blocks only
                continue
            for l in b.get("lines", []):
                spans = l.get("spans", [])
                text = _clean("".join(s.get("text", "") for s in spans)).strip()
                if not text or is_gibberish(text):
                    continue
                bbox = [round(v, 2) for v in l["bbox"]]
                size = round(max(s.get("size", 10) for s in spans), 2)
                bold = any(int(s.get("flags", 0)) & 16 for s in spans)
                italic = any(int(s.get("flags", 0)) & 2 for s in spans)
                color = int(spans[0].get("color", 0))
                lines.append({
                    "id": f"p{page_idx}_l{len(lines)}",
                    "text": text, "bbox": bbox, "size": size,
                    "bold": bold, "italic": italic, "color": color,
                })

        # Background 1: original page (render BEFORE redacting).
        bg_original = _png_b64(page)
        # Background 2: same page with every overlaid line whited out.
        for ln in lines:
            page.add_redact_annot(fitz.Rect(ln["bbox"]) + (-0.5, -0.5, 0.5, 0.5), fill=(1, 1, 1))
        if lines:
            page.apply_redactions()
        bg_redacted = _png_b64(page)

        return {
            "page_count": page_count,
            "page": page_idx,
            "width": round(page.rect.width, 2),
            "height": round(page.rect.height, 2),
            "bg_original": bg_original,
            "bg_redacted": bg_redacted,
            "lines": lines,
        }
    finally:
        doc.close()
