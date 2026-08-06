"""OCR-only endpoint — extracts text + SVG figures without translation.

POST /api/ocr
Accepts: multipart/form-data with image/PDF files + source_lang
Returns: JSON {html, structured_pages, pages, duration_ms, status, source_lang}

This is the first step of the 3-step method (D23):
  Step 1: Original (uploaded image, read-only)
  Step 2: HTML RO (this endpoint — OCR result, editable)
  Step 3: HTML translated (via /api/translate-text, on-demand)
"""

from __future__ import annotations

from http.server import BaseHTTPRequestHandler
import json
import os
import sys
import time
import traceback

_api_dir = os.path.dirname(os.path.abspath(__file__))
if _api_dir not in sys.path:
    sys.path.insert(0, _api_dir)

from lib.html_builder import build_html_structured
from lib.ocr_structured import ocr_structured
from lib.azure_layout import azure_layout
from lib.figure_crop import embed_crops_in_sections
from lib.multipart import parse_boundary, log_to_file


def _has_table(sections: list) -> bool:
    """True if any section (incl. nested two_column) is a table."""
    for s in sections:
        if s.get("type") == "table":
            return True
        if s.get("type") == "two_column":
            if _has_table(s.get("left", []) or []) or _has_table(s.get("right", []) or []):
                return True
    return False


def _ocr_page(image_bytes: bytes, mime_type: str, source_lang: str, engine: str) -> dict:
    """OCR one page. engine='azure' → Azure layout (business docs) with a Gemini
    fallback when Azure finds NO table (R-MATH: never lose math) or errors out.
    engine='gemini' (default) → Gemini math OCR unchanged.
    """
    if engine == "azure":
        # S4: bugetul rămas pt fallback-ul Gemini, ca Azure(≤35s) + Gemini să nu
        # stea peste 60s (maxDuration). Azure normal ~6s → Gemini primește ~45s;
        # dacă Azure a mâncat tot, Gemini primește minim 10s (eroare curată, nu 504).
        t_start = time.time()

        def _gemini_budget() -> int:
            return min(45, max(10, 48 - int(time.time() - t_start)))

        try:
            page_data = azure_layout(image_bytes, mime_type, source_lang)
            if not _has_table(page_data.get("sections", [])):
                print("[OCR] Azure found no table -> Gemini fallback (R-MATH)", file=sys.stderr)
                page_data = ocr_structured(image_bytes, mime_type, source_lang, timeout_s=_gemini_budget())
            return page_data
        except Exception as e:
            print(f"[OCR] Azure failed ({e}) -> Gemini fallback", file=sys.stderr)
            return ocr_structured(image_bytes, mime_type, source_lang, timeout_s=_gemini_budget())
    return ocr_structured(image_bytes, mime_type, source_lang)


def _pdf_to_images(pdf_bytes: bytes, dpi: int = 150, max_pages: int = 1) -> list[tuple[bytes, str]]:
    """Convert PDF pages to PNG images using PyMuPDF (DPI 150).

    Renders at most `max_pages` pages. On Vercel each /api/ocr invocation must
    stay under 60s, so server-side we only ever process ONE page per call; the
    browser (pdf-rasterize.ts) is responsible for splitting multi-page PDFs and
    POSTing one page image per request. This server-side path is a safety
    fallback only — capping the render also keeps PyMuPDF memory well under limit.
    """
    try:
        import pymupdf
    except ImportError:
        print("[OCR] PyMuPDF not installed, cannot process PDF", file=sys.stderr)
        return []

    pages = []
    try:
        doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
        total = len(doc)
        if total > max_pages:
            print(
                f"[OCR] WARNING: PDF has {total} pages but server processes only {max_pages} "
                f"(multi-page PDFs must be rasterized client-side, one page/request)",
                file=sys.stderr,
            )
        for page_num in range(min(total, max_pages)):
            page = doc[page_num]
            pix = page.get_pixmap(dpi=dpi)
            img_bytes = pix.tobytes("png")
            pages.append((img_bytes, "image/png"))
            print(f"[OCR] PDF page {page_num+1}/{total}: {pix.width}x{pix.height}px", file=sys.stderr)
        doc.close()
    except Exception as e:
        print(f"[OCR] PDF conversion error: {e}", file=sys.stderr)
        return []
    return pages


class handler(BaseHTTPRequestHandler):
    """OCR-only handler — no translation."""

    def do_OPTIONS(self):
        origin = os.environ.get("ALLOWED_ORIGIN", "*")
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        try:
            from lib.rate_limiter import reject_if_limited
            if reject_if_limited(self, "/api/ocr"):
                return

            MAX_BODY_SIZE = 4 * 1024 * 1024 + 4096

            content_length = int(self.headers.get("Content-Length", 0))
            if content_length > MAX_BODY_SIZE:
                from lib.exceptions import RequestTooLarge
                raise RequestTooLarge("Fisierul depaseste limita de 4MB")

            content_type = self.headers.get("Content-Type", "")
            body = self.rfile.read(content_length)

            if "multipart/form-data" in content_type:
                parts = self._parse_multipart(body, parse_boundary(content_type))
            else:
                parts = json.loads(body)

            source_lang = parts.get("source_lang", "ro")
            engine = parts.get("engine", "gemini")
            files = parts.get("files", [])

            if not files:
                self._send_json(400, {"error": "Nu au fost trimise fisiere", "status": "error"})
                return

            t0 = time.time()
            log_to_file(f"ACTION  | OCR initiat | {len(files)} fisier(e) | {source_lang}")

            # Expand PDFs to individual page images
            expanded_files = []
            for file_info in files:
                mime_type = file_info.get("mime_type", "image/jpeg")
                if "pdf" in mime_type.lower():
                    pdf_pages = _pdf_to_images(file_info["data"])
                    if pdf_pages:
                        filename = file_info.get("filename", "doc")
                        for pg_idx, (pg_bytes, pg_mime) in enumerate(pdf_pages):
                            expanded_files.append({
                                "data": pg_bytes, "mime_type": pg_mime,
                                "filename": f"{filename}_p{pg_idx+1}.png"
                            })
                        del pdf_pages
                        file_info["data"] = b""
                        continue
                expanded_files.append(file_info)

            # Enforce ONE page per invocation (Vercel 60s limit — see D7 / v4 design).
            # The browser rasterizes multi-page PDFs and POSTs one page image per
            # request; if more than one page reaches the server, process only the
            # first and warn (indicates the client contract was bypassed).
            MAX_PAGES = 1
            if len(expanded_files) > MAX_PAGES:
                print(
                    f"[OCR] WARNING: received {len(expanded_files)} pages in one request; "
                    f"processing only {MAX_PAGES} (expected one page/request on Vercel)",
                    file=sys.stderr,
                )
                expanded_files = expanded_files[:MAX_PAGES]

            # OCR each page
            all_structured_pages = []
            for idx, file_info in enumerate(expanded_files):
                print(f"[OCR] Processing page {idx+1}/{len(expanded_files)}", file=sys.stderr)
                try:
                    page_data = _ocr_page(file_info["data"], file_info.get("mime_type", "image/jpeg"), source_lang, engine)
                    # Embed cropped figures from original image (Option C). Azure bboxes
                    # are tight → skip the Gemini content-snap (would clip logos/seals).
                    use_snap = page_data.get("source") != "azure-layout"
                    page_data["sections"] = embed_crops_in_sections(file_info["data"], page_data.get("sections", []), snap=use_snap)
                    all_structured_pages.append(page_data)
                except Exception as e:
                    print(f"[OCR] Page {idx+1} failed: {e}", file=sys.stderr)
                    all_structured_pages.append({"title": "", "sections": [
                        {"type": "paragraph", "content": f"[Eroare OCR pagina {idx+1}: {e}]"}
                    ]})

            # Build HTML (no translation — source language)
            html = build_html_structured(all_structured_pages, [{} for _ in all_structured_pages], source_lang)

            duration_ms = int((time.time() - t0) * 1000)
            print(f"[OCR] Success: {len(all_structured_pages)} pages in {duration_ms}ms", file=sys.stderr)

            self._send_json(200, {
                "html": html,
                "structured_pages": all_structured_pages,
                "pages": len(all_structured_pages),
                "duration_ms": duration_ms,
                "status": "success",
                "source_lang": source_lang,
            })

        except Exception as e:
            print(f"[OCR ERROR] {e}", file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
            from lib.exceptions import error_response
            status, body = error_response(e, default_code="E-OCR-001")
            try:
                from lib import supabase_client
                supabase_client.log_error(body["error_code"], str(e), source="ocr")
            except Exception:
                pass
            self._send_json(status, body)

    def _parse_multipart(self, body: bytes, boundary: str) -> dict:
        import re
        parts_data = {"files": [], "source_lang": "ro"}
        boundary_bytes = f"--{boundary}".encode()
        sections = body.split(boundary_bytes)
        for section in sections[1:]:
            if section.strip() in (b"--", b"", b"--\r\n"):
                continue
            header_end = section.find(b"\r\n\r\n")
            if header_end == -1:
                continue
            header = section[:header_end].decode("utf-8", errors="replace")
            content = section[header_end + 4:]
            if content.endswith(b"\r\n"):
                content = content[:-2]
            name_match = re.search(r'name="([^"]+)"', header)
            if not name_match:
                continue
            name = name_match.group(1)
            if name in ("source_lang", "engine"):
                parts_data[name] = content.decode("utf-8").strip()
            elif name == "files" or "filename" in header:
                ct_match = re.search(r"Content-Type:\s*(\S+)", header)
                mime = ct_match.group(1) if ct_match else "image/jpeg"
                fname_match = re.search(r'filename="([^"]*)"', header)
                fname = fname_match.group(1) if fname_match else ""
                parts_data["files"].append({"mime_type": mime, "data": content, "filename": fname})
        return parts_data

    def _send_json(self, status: int, data: dict):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", os.environ.get("ALLOWED_ORIGIN", "*"))
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
