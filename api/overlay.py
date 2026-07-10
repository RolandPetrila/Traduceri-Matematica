"""Overlay translation endpoint — pixel-perfect, layout-preserving.

POST /api/overlay
  multipart/form-data: `files` (a TEXT PDF) + optional `page` (int, default 0)
  or JSON: {"pdf_b64": "...", "page": 0}
Returns JSON:
  {is_text_pdf, page_count, page, width, height, bg_original, bg_redacted,
   lines:[{id,text,bbox,size,bold,italic,color}], status, duration_ms}

If the PDF has no real text layer (scanned image), returns {is_text_pdf:false} so
the client falls back to the OCR pipeline. One page per call (60s serverless cap).
"""
from __future__ import annotations

from http.server import BaseHTTPRequestHandler
import base64
import json
import os
import re
import sys
import time

_api_dir = os.path.dirname(os.path.abspath(__file__))
if _api_dir not in sys.path:
    sys.path.insert(0, _api_dir)

from lib.multipart import parse_boundary
from lib.overlay import overlay_page, is_text_pdf


class handler(BaseHTTPRequestHandler):
    """Extract one page of a text PDF for overlay translation."""

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
            if reject_if_limited(self, "/api/overlay"):
                return

            content_length = int(self.headers.get("Content-Length", 0))
            if content_length > 4 * 1024 * 1024 + 4096:  # under Vercel's ~4.5MB edge cap
                self._send_json(413, {"error": "Fisierul depaseste limita de 4MB", "status": "error"})
                return

            content_type = self.headers.get("Content-Type", "")
            body = self.rfile.read(content_length)
            pdf_bytes, page_idx = self._parse(body, content_type)
            if not pdf_bytes:
                self._send_json(400, {"error": "Niciun PDF trimis", "status": "error"})
                return

            if not is_text_pdf(pdf_bytes):
                # Scanned / image-only PDF — no exact text layer. Client falls back to OCR.
                self._send_json(200, {"is_text_pdf": False, "status": "success"})
                return

            t0 = time.time()
            data = overlay_page(pdf_bytes, page_idx)
            data["is_text_pdf"] = True
            data["status"] = "success"
            data["duration_ms"] = int((time.time() - t0) * 1000)
            print(f"[OVERLAY] page {page_idx + 1}/{data['page_count']}: "
                  f"{len(data['lines'])} lines in {data['duration_ms']}ms", file=sys.stderr)
            self._send_json(200, data)

        except Exception as e:
            print(f"[OVERLAY ERROR] {e}", file=sys.stderr)
            from lib.exceptions import error_response
            status, body = error_response(e, default_code="E-OVL-001")
            try:
                from lib import supabase_client
                supabase_client.log_error(body.get("error_code", "E-OVL-001"), str(e), source="overlay")
            except Exception:
                pass
            self._send_json(status, body)

    def _parse(self, body: bytes, content_type: str):
        """Return (pdf_bytes, page_idx) from multipart or JSON."""
        page_idx = 0
        if "multipart/form-data" in content_type:
            boundary = parse_boundary(content_type)
            bb = f"--{boundary}".encode()
            pdf = None
            for sec in body.split(bb)[1:]:
                if sec.strip() in (b"--", b"", b"--\r\n"):
                    continue
                he = sec.find(b"\r\n\r\n")
                if he == -1:
                    continue
                head = sec[:he].decode("utf-8", "ignore")
                val = sec[he + 4:]
                if val.endswith(b"\r\n"):
                    val = val[:-2]
                name_m = re.search(r'name="([^"]+)"', head)
                name = name_m.group(1) if name_m else ""
                if "filename=" in head:
                    pdf = val
                elif name == "page":
                    try:
                        page_idx = int(val.decode("utf-8", "ignore").strip())
                    except Exception:
                        page_idx = 0
            return pdf, page_idx
        # JSON fallback
        d = json.loads(body)
        raw = d.get("pdf_b64", "")
        return (base64.b64decode(raw) if raw else None), int(d.get("page", 0))

    def _send_json(self, status: int, data: dict, origin: str = None):
        origin = origin or os.environ.get("ALLOWED_ORIGIN", "*")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", origin)
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))
