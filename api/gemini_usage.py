"""Endpoint GET /api/gemini-usage — daily Gemini call counter (Supabase-backed).

Returns daily call count vs free tier limits (2600 RPD total). The count is
persisted in Supabase (`gemini_counter` table, atomic RPC) so it survives across
serverless invocations on Vercel; a local in-memory fallback is used if Supabase
is unavailable.
"""

from __future__ import annotations

from http.server import BaseHTTPRequestHandler
import json
import os
import sys

_api_dir = os.path.dirname(os.path.abspath(__file__))
if _api_dir not in sys.path:
    sys.path.insert(0, _api_dir)

from lib.gemini_counter import get_gemini_usage


class handler(BaseHTTPRequestHandler):
    def _cors_origin(self):
        return os.environ.get("ALLOWED_ORIGIN", "*")

    def _send_json(self, status: int, data: dict):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", self._cors_origin())
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_GET(self):
        try:
            data = get_gemini_usage()
            percent = data["percent"]
            if percent >= 80:
                data["level"] = "critical"
                data["warning"] = f"Cota Gemini aproape epuizata! {data['remaining']} apeluri ramase azi."
            elif percent >= 60:
                data["level"] = "warning"
                data["warning"] = f"Cota Gemini la {percent}%. {data['remaining']} apeluri ramase."
            else:
                data["level"] = "ok"
            data["status"] = "ok"
            self._send_json(200, data)
        except Exception as e:
            print(f"[GEMINI-USAGE] Error: {e}", file=sys.stderr)
            self._send_json(500, {"status": "error", "error": str(e), "level": "error",
                                  "count": 0, "limit": 2600})

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", self._cors_origin())
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
