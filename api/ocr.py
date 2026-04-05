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
from lib.figure_crop import embed_crops_in_sections
from lib.multipart import parse_boundary, log_to_file


def _pdf_to_images(pdf_bytes: bytes, dpi: int = 150) -> list[tuple[bytes, str]]:
    """Convert PDF pages to PNG images using PyMuPDF (DPI 150)."""
    try:
        import pymupdf
    except ImportError:
        print("[OCR] PyMuPDF not installed, cannot process PDF", file=sys.stderr)
        return []

    pages = []
    try:
        doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
        for page_num in range(len(doc)):
            page = doc[page_num]
            pix = page.get_pixmap(dpi=dpi)
            img_bytes = pix.tobytes("png")
            pages.append((img_bytes, "image/png"))
            print(f"[OCR] PDF page {page_num+1}/{len(doc)}: {pix.width}x{pix.height}px", file=sys.stderr)
        doc.close()
    except Exception as e:
        print(f"[OCR] PDF conversion error: {e}", file=sys.stderr)
        return []
    return pages


class handler(BaseHTTPRequestHandler):
    """OCR-only handler — no translation."""

    def do_OPTIONS(self):
        origin = os.environ.get("ALLOWED_ORIGIN", "https://traduceri-matematica-7sh7.onrender.com")
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        try:
            MAX_BODY_SIZE = 4 * 1024 * 1024 + 4096

            content_length = int(self.headers.get("Content-Length", 0))
            if content_length > MAX_BODY_SIZE:
                self._send_json(413, {"error": "Fisierul depaseste limita de 4MB", "status": "error"})
                return

            content_type = self.headers.get("Content-Type", "")
            body = self.rfile.read(content_length)

            if "multipart/form-data" in content_type:
                parts = self._parse_multipart(body, parse_boundary(content_type))
            else:
                parts = json.loads(body)

            source_lang = parts.get("source_lang", "ro")
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

            # Limit pages
            MAX_PAGES = 30
            if len(expanded_files) > MAX_PAGES:
                expanded_files = expanded_files[:MAX_PAGES]

            # OCR each page
            all_structured_pages = []
            for idx, file_info in enumerate(expanded_files):
                print(f"[OCR] Processing page {idx+1}/{len(expanded_files)}", file=sys.stderr)
                try:
                    page_data = ocr_structured(file_info["data"], file_info.get("mime_type", "image/jpeg"), source_lang)
                    # Embed cropped figures from original image (Option C)
                    page_data["sections"] = embed_crops_in_sections(file_info["data"], page_data.get("sections", []))
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
            self._send_json(500, {"error": str(e), "status": "error"})

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
            if name == "source_lang":
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
        self.send_header("Access-Control-Allow-Origin", os.environ.get("ALLOWED_ORIGIN", "https://traduceri-matematica-7sh7.onrender.com"))
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
