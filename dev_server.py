# -*- coding: utf-8 -*-
"""Local Python dev server for API functions on localhost:8000 (mirrors Render)."""

from __future__ import annotations

import os
import sys

# Force UTF-8 on Windows (must be before any file reads)
os.environ["PYTHONUTF8"] = "1"
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
    sys.stderr.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]

from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path

# Ensure api/ is importable
sys.path.insert(0, str(Path(__file__).parent))

# CORS — restrict to allowed origins (env var or default)
ALLOWED_ORIGIN = os.environ.get(
    "ALLOWED_ORIGIN",
    "https://traduceri-matematica-7sh7.onrender.com"
)

def _cors_origin(handler) -> str:
    """Return CORS origin: use ALLOWED_ORIGIN, or * for localhost dev."""
    origin = handler.headers.get("Origin", "")
    if "localhost" in origin or "127.0.0.1" in origin:
        return origin
    return ALLOWED_ORIGIN

# Load .env BEFORE importing handlers
_env_file = Path(__file__).parent / ".env"
if _env_file.exists():
    for _line in _env_file.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if _line and "=" in _line and not _line.startswith("#"):
            _k, _, _v = _line.partition("=")
            os.environ.setdefault(_k.strip(), _v.strip())
    print("[DEV] .env loaded", file=sys.stderr, flush=True)

# Pre-import all handlers at startup
from api.health import handler as HealthHandler
from api.ocr import handler as OcrHandler
from api.translate import handler as TranslateHandler
from api.translate_text import handler as TranslateTextHandler
from api.convert import handler as ConvertHandler
from api.deepl_usage import handler as DeeplUsageHandler

from api.lib.rate_limiter import is_rate_limited, start_cleanup_timer

print("[DEV] Handlers imported OK", file=sys.stderr, flush=True)

ROUTES = {
    "/api/health": HealthHandler,
    "/api/deepl-usage": DeeplUsageHandler,
    "/api/ocr": OcrHandler,
    "/api/translate-text": TranslateTextHandler,
    "/api/translate": TranslateHandler,
    "/api/convert": ConvertHandler,
}


class DevRouter(BaseHTTPRequestHandler):
    """Routes /api/* to the matching Python function handler."""

    def _route(self):
        for prefix, cls in ROUTES.items():
            if prefix in self.path:
                return cls
        return None

    def _delegate(self, method: str):
        cls = self._route()
        if not cls:
            self.send_response(404)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", _cors_origin(self))
            self.end_headers()
            self.wfile.write(b'{"error":"Route not found"}')
            return

        # Rate limiting (skip OPTIONS and health checks)
        if method == "POST":
            endpoint = self.path.split("?")[0]  # strip query params
            limited, msg = is_rate_limited(self, endpoint)
            if limited:
                self.send_response(429)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", _cors_origin(self))
                self.send_header("Retry-After", "60")
                self.end_headers()
                import json
                self.wfile.write(json.dumps({"error": msg, "status": "rate_limited"}).encode())
                return

        # Borrow handler's custom methods (_parse_multipart, _send_json, etc.)
        borrowed = []
        for name in vars(cls):
            if not name.startswith("__") and callable(getattr(cls, name)):
                if not hasattr(DevRouter, name):
                    setattr(self, name, getattr(cls, name).__get__(self))
                    borrowed.append(name)

        try:
            getattr(cls, f"do_{method}")(self)
        finally:
            for name in borrowed:
                try:
                    delattr(self, name)
                except AttributeError:
                    pass

    def do_GET(self):
        self._delegate("GET")

    def do_POST(self):
        self._delegate("POST")

    def do_OPTIONS(self):
        """Handle CORS preflight requests."""
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", _cors_origin(self))
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Max-Age", "86400")
        self.end_headers()

    def log_message(self, format, *args):
        sys.stderr.write(f"[DEV-API] {self.command} {self.path}\n")
        sys.stderr.flush()


def main():
    port = int(os.environ.get("PORT", os.environ.get("DEV_API_PORT", "8000")))
    host = os.environ.get("DEV_API_HOST", "0.0.0.0")
    server = HTTPServer((host, port), DevRouter)
    start_cleanup_timer()
    print(f"[DEV] Python API server: http://localhost:{port}", file=sys.stderr, flush=True)
    print("[DEV] Routes: /api/health, /api/translate, /api/convert", file=sys.stderr, flush=True)
    print("[DEV] Rate limiting: active on POST endpoints", file=sys.stderr, flush=True)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[DEV] Server stopped", file=sys.stderr)
        server.server_close()


if __name__ == "__main__":
    main()
