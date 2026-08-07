"""Handler-level tests for /api/ocr (do_POST/do_OPTIONS), not just pure functions.

Gap closed (/improve #15): the existing suite covered only pure helpers
(azure_layout parsing, figure crop heuristics, etc.) — nothing exercised the
actual HTTP entrypoints: CORS headers, multipart parsing through the real
handler, the 413 body-size guard (wired to RequestTooLarge in /improve #9),
or a full success round-trip. `BaseHTTPRequestHandler` subclasses can't be
constructed normally in a test (the base `__init__` drives real socket I/O),
so we bypass `__init__` and wire `rfile`/`wfile`/`headers` by hand — the
standard pattern for unit-testing `http.server` handlers.
"""

from __future__ import annotations

import io
import json
from email.message import Message
from unittest.mock import patch

import pytest

import ocr as ocr_module


def _make_handler(body: bytes = b"", headers: dict | None = None):
    """Build an `ocr.handler` instance without running BaseHTTPRequestHandler's
    socket-driven __init__ (which would call self.handle() on a real connection).
    """
    inst = ocr_module.handler.__new__(ocr_module.handler)
    inst.rfile = io.BytesIO(body)
    inst.wfile = io.BytesIO()
    inst.client_address = ("127.0.0.1", 54321)
    inst.command = "POST"
    inst.request_version = "HTTP/1.1"
    inst.requestline = "POST /api/ocr HTTP/1.1"
    inst.close_connection = True
    msg = Message()
    for k, v in (headers or {}).items():
        msg[k] = v
    if "Content-Length" not in msg:
        msg["Content-Length"] = str(len(body))
    inst.headers = msg
    return inst


def _multipart_body(fields: dict, files: list[dict], boundary: str = "TESTBOUNDARY") -> bytes:
    """Build a multipart/form-data body matching what `_parse_multipart` expects."""
    parts = []
    for name, value in fields.items():
        parts.append(
            f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode()
        )
    for f in files:
        parts.append(
            (
                f'--{boundary}\r\nContent-Disposition: form-data; name="files"; '
                f'filename="{f["filename"]}"\r\nContent-Type: {f["mime_type"]}\r\n\r\n'
            ).encode()
            + f["data"]
            + b"\r\n"
        )
    parts.append(f"--{boundary}--\r\n".encode())
    return b"".join(parts)


def _response(inst) -> tuple[int, dict]:
    """Parse (status, json_body) written to `inst.wfile` by send_response/_send_json."""
    raw = inst.wfile.getvalue()
    status_line, _, rest = raw.partition(b"\r\n")
    status = int(status_line.split(b" ")[1])
    _headers_raw, _, body = rest.partition(b"\r\n\r\n")
    return status, json.loads(body.decode("utf-8"))


def _response_headers(inst) -> dict[str, str]:
    raw = inst.wfile.getvalue()
    _status_line, _, rest = raw.partition(b"\r\n")
    headers_raw, _, _body = rest.partition(b"\r\n\r\n")
    out = {}
    for line in headers_raw.split(b"\r\n"):
        if b":" in line:
            k, _, v = line.partition(b":")
            out[k.decode().strip()] = v.decode().strip()
    return out


class TestOptions:
    def test_options_returns_200_with_cors_headers(self):
        inst = _make_handler()
        inst.do_OPTIONS()
        raw = inst.wfile.getvalue()
        assert b" 200" in raw.splitlines()[0]
        headers = _response_headers(inst)
        assert headers["Access-Control-Allow-Origin"] == "*"
        assert "POST" in headers["Access-Control-Allow-Methods"]


class TestBodyTooLarge:
    def test_post_body_too_large_returns_413(self):
        # Content-Length lies above MAX_BODY_SIZE (4MB+4096); body itself is
        # never read (the check happens before rfile.read()).
        oversized = 4 * 1024 * 1024 + 4097
        inst = _make_handler(body=b"", headers={"Content-Length": str(oversized)})
        with patch("lib.rate_limiter.reject_if_limited", return_value=False):
            inst.do_POST()
        status, data = _response(inst)
        assert status == 413
        assert data["status"] == "error"
        # Routed through RequestTooLarge (/improve #9) -> shared error_code, custom message.
        assert data["error_code"] == "E-APP-001"
        assert "4MB" in data["error"]


class TestNoFiles:
    def test_post_no_files_returns_400(self):
        body = _multipart_body({"source_lang": "ro", "engine": "gemini"}, files=[])
        inst = _make_handler(
            body=body,
            headers={
                "Content-Type": "multipart/form-data; boundary=TESTBOUNDARY",
                "Content-Length": str(len(body)),
            },
        )
        with patch("lib.rate_limiter.reject_if_limited", return_value=False):
            inst.do_POST()
        status, data = _response(inst)
        assert status == 400
        assert "fisiere" in data["error"].lower()


class TestSuccessRoundTrip:
    def test_post_valid_multipart_mocked_ocr_returns_structured_pages(self):
        fake_image = b"\x89PNG\r\n\x1a\nFAKE-PNG-BYTES-FOR-TEST"
        body = _multipart_body(
            {"source_lang": "ro", "engine": "gemini"},
            files=[{"filename": "p1.png", "mime_type": "image/png", "data": fake_image}],
        )
        inst = _make_handler(
            body=body,
            headers={
                "Content-Type": "multipart/form-data; boundary=TESTBOUNDARY",
                "Content-Length": str(len(body)),
            },
        )
        fake_page = {"title": "", "sections": [{"type": "paragraph", "content": "Rezultat OCR fals"}]}
        with patch("lib.rate_limiter.reject_if_limited", return_value=False), \
             patch("ocr.ocr_structured", return_value=fake_page) as mock_ocr:
            inst.do_POST()
        status, data = _response(inst)
        assert status == 200
        assert data["status"] == "success"
        assert data["pages"] == 1
        assert data["structured_pages"][0]["sections"][0]["content"] == "Rezultat OCR fals"
        assert "Rezultat OCR fals" in data["html"]
        mock_ocr.assert_called_once()
        # engine="gemini" (default path) calls ocr_structured with the raw image bytes.
        called_bytes = mock_ocr.call_args[0][0]
        assert called_bytes == fake_image


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
