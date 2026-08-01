"""Azure Document Intelligence `prebuilt-layout` — OCR for BUSINESS documents (R7.5).

Routed here for PDF pages that need OCR (business/structured docs like the Mösslein
lab reports). Azure reconstructs TABLES, FIGURES (logos/seals/signatures) and natural
READING ORDER — the three things the Gemini math-OCR path and the raw-text path lose.

Math stays on Gemini (10/10): the Azure `formulas` add-on IS able to return LaTeX
(confirmed at source) but is a PAID add-on not covered by the free F0 tier, so we use
ONLY the free base layout (tables + figures + reading order) and keep Gemini for math.
See memory finding_azure_layout_r7_2026_07_31.

Returns the SAME structured schema as `ocr_structured` (`{title, sections}`) so the rest
of the pipeline (figure crop, html_builder, ocr-map → TipTap nodes) is reused unchanged.
Adds one section type: `table` ({rows, headerRows}). Figures carry a fractional `bbox`
(from Azure's polygon) → cropped by `figure_crop.embed_crops_in_sections` downstream.

Free F0 limits (confirmed at source): 2 pages/doc, 4 MB/request, ~500 pages/month, 1 TPS.
We rasterize ONE page/request upstream, so the 2-page cap is moot.
"""

from __future__ import annotations

import base64
import json
import os
import sys
import time
import urllib.request
import urllib.error

# v4.0 GA REST API (2024-11-30) — base layout, NO paid add-on features.
_API_VERSION = "2024-11-30"
_ANALYZE_TIMEOUT = 20       # POST submit (revine în ~1-2s; 20 = ceiling generos)
_POLL_TIMEOUT = 15          # each GET poll
_POLL_INTERVAL = 1.2        # seconds between polls
_TOTAL_DEADLINE = 35        # hard cap < 60s ȘI lasă buget pt fallback-ul Gemini (§2 S4)
                            # Azure real ~6s pe Filtrasan → 35 = 5.8× headroom


def azure_layout(image_bytes: bytes, mime_type: str, source_lang: str = "ro") -> dict:
    """Analyze a (rasterized) page with Azure prebuilt-layout → structured dict.

    Raises RuntimeError on missing config / API error / timeout; the caller
    (api/ocr.py) falls back to Gemini so a page is never lost (R-MATH).
    """
    endpoint = os.environ.get("AZURE_DOC_INTEL_ENDPOINT", "").strip().rstrip("/")
    key = os.environ.get("AZURE_DOC_INTEL_KEY", "").strip()
    if not endpoint or not key:
        raise RuntimeError("AZURE_DOC_INTEL_ENDPOINT / AZURE_DOC_INTEL_KEY not set")

    b64 = base64.b64encode(image_bytes).decode("utf-8")
    url = (
        f"{endpoint}/documentintelligence/documentModels/"
        f"prebuilt-layout:analyze?api-version={_API_VERSION}"
    )
    body = json.dumps({"base64Source": b64}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Content-Type": "application/json",
            "Ocp-Apim-Subscription-Key": key,
        },
    )

    print(f"[AZURE] Analyze: {len(image_bytes)} bytes, {mime_type}", file=sys.stderr)
    try:
        with urllib.request.urlopen(req, timeout=_ANALYZE_TIMEOUT) as resp:
            op_location = resp.headers.get("Operation-Location")
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")[:300]
        raise RuntimeError(f"Azure analyze HTTP {e.code}: {detail}")

    if not op_location:
        raise RuntimeError("Azure analyze: missing Operation-Location header")

    # Poll the async operation until succeeded, within a hard deadline.
    deadline = time.time() + _TOTAL_DEADLINE
    data = None
    poll_req = urllib.request.Request(
        op_location, headers={"Ocp-Apim-Subscription-Key": key}
    )
    while time.time() < deadline:
        time.sleep(_POLL_INTERVAL)
        try:
            with urllib.request.urlopen(poll_req, timeout=_POLL_TIMEOUT) as presp:
                data = json.loads(presp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", errors="replace")[:200]
            raise RuntimeError(f"Azure poll HTTP {e.code}: {detail}")
        status = (data or {}).get("status")
        if status == "succeeded":
            break
        if status == "failed":
            err = (data.get("error") or {}).get("message", "unknown")
            raise RuntimeError(f"Azure analyze failed: {err}")
        # status in {"notStarted","running"} → keep polling
    else:
        raise RuntimeError(f"Azure layout timeout after {_TOTAL_DEADLINE}s")

    result = (data or {}).get("analyzeResult") or {}
    sections = _result_to_sections(result)
    n_tables = sum(1 for s in sections if s.get("type") == "table")
    n_figs = sum(1 for s in sections if s.get("type") == "figure")
    print(
        f"[AZURE] OK: {len(sections)} sections, {n_tables} tables, {n_figs} figures",
        file=sys.stderr,
    )
    return {"title": "", "sections": sections, "source": "azure-layout"}


def _poly_to_bbox(polygon: list, page: dict) -> dict | None:
    """Azure polygon [x1,y1,x2,y2,...] + page dims → fractional bbox {x,y,w,h}.

    Polygon and page width/height share the same unit (pixel for images), so the
    ratio is unit-independent. Returns None if it can't be computed.
    """
    try:
        xs = [float(polygon[i]) for i in range(0, len(polygon), 2)]
        ys = [float(polygon[i]) for i in range(1, len(polygon), 2)]
        pw = float(page.get("width") or 0)
        ph = float(page.get("height") or 0)
        if not xs or not ys or pw <= 0 or ph <= 0:
            return None
        x0, x1 = min(xs), max(xs)
        y0, y1 = min(ys), max(ys)
        return {
            "x": max(0.0, min(1.0, x0 / pw)),
            "y": max(0.0, min(1.0, y0 / ph)),
            "w": max(0.0, min(1.0, (x1 - x0) / pw)),
            "h": max(0.0, min(1.0, (y1 - y0) / ph)),
        }
    except (ValueError, TypeError, ZeroDivisionError, IndexError):
        return None


def _span_start(obj: dict) -> int:
    """Reading-order key = offset of the object's first span into `content`."""
    spans = obj.get("spans") or []
    if spans and isinstance(spans[0], dict):
        return int(spans[0].get("offset", 0))
    return 0


def _in_any_range(offset: int, ranges: list[tuple[int, int]]) -> bool:
    return any(a <= offset < b for a, b in ranges)


def _table_to_section(table: dict) -> dict:
    """Azure table → {type:'table', rows:[[str]], headerRows:int} (rectangular grid)."""
    rows = int(table.get("rowCount", 0) or 0)
    cols = int(table.get("columnCount", 0) or 0)
    grid = [["" for _ in range(cols)] for _ in range(rows)]
    header_row_flags = [True] * rows  # a row is header if ALL its cells are columnHeader
    row_has_cell = [False] * rows
    for cell in table.get("cells", []) or []:
        r = int(cell.get("rowIndex", 0) or 0)
        c = int(cell.get("columnIndex", 0) or 0)
        if 0 <= r < rows and 0 <= c < cols:
            # Place content at the origin cell; spanned cells stay empty (MVP).
            grid[r][c] = (cell.get("content") or "").strip()
            row_has_cell[r] = True
            if cell.get("kind") != "columnHeader":
                header_row_flags[r] = False
    # Leading header rows = contiguous top rows that have cells and are all columnHeader.
    header_rows = 0
    for r in range(rows):
        if row_has_cell[r] and header_row_flags[r]:
            header_rows += 1
        else:
            break
    return {"type": "table", "rows": grid, "headerRows": header_rows}


def _result_to_sections(result: dict) -> list[dict]:
    """Reconstruct ordered sections from an Azure analyzeResult (reading order via spans)."""
    pages = result.get("pages") or []
    page_by_num = {}
    for p in pages:
        page_by_num[int(p.get("pageNumber", 1) or 1)] = p
    first_page = pages[0] if pages else {}

    # Table span ranges → so we don't ALSO emit their cell text as paragraphs.
    tables = result.get("tables") or []
    table_ranges: list[tuple[int, int]] = []
    for t in tables:
        for sp in t.get("spans") or []:
            off = int(sp.get("offset", 0))
            table_ranges.append((off, off + int(sp.get("length", 0))))

    elements: list[tuple[int, dict]] = []

    # Tables
    for t in tables:
        elements.append((_span_start(t), _table_to_section(t)))

    # Figures (bbox for downstream crop). Placed by span offset.
    for fig in result.get("figures") or []:
        regions = fig.get("boundingRegions") or []
        bbox = None
        if regions:
            pg = page_by_num.get(int(regions[0].get("pageNumber", 1) or 1), first_page)
            bbox = _poly_to_bbox(regions[0].get("polygon") or [], pg)
        section = {"type": "figure"}
        if bbox:
            section["bbox"] = bbox
        cap = (fig.get("caption") or {}).get("content") if isinstance(fig.get("caption"), dict) else None
        if cap:
            section["caption"] = cap
        elements.append((_span_start(fig), section))

    # Paragraphs (skip those inside a table span — their text is the table cells).
    for para in result.get("paragraphs") or []:
        off = _span_start(para)
        if _in_any_range(off, table_ranges):
            continue
        content = (para.get("content") or "").strip()
        if not content:
            continue
        role = para.get("role")
        if role in ("title", "sectionHeading"):
            level = 1 if role == "title" else 2
            elements.append((off, {"type": "heading", "content": content, "level": level}))
        elif role in ("pageNumber",):
            continue  # drop page numbers (parity with Gemini prompt rule 7)
        else:
            # pageHeader/pageFooter/footnote/None → plain paragraph (keep, don't lose text).
            elements.append((off, {"type": "paragraph", "content": content}))

    # Fallback: no paragraphs/tables/figures but there is content → one paragraph.
    if not elements:
        content = (result.get("content") or "").strip()
        if content:
            return [{"type": "paragraph", "content": content}]
        return []

    elements.sort(key=lambda e: e[0])
    return [sec for _, sec in elements]
