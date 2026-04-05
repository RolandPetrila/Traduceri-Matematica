"""Endpoint GET /api/deepl-usage — combined usage of both DeepL keys.

Returns a single combined number (D17): Cristina sees one counter,
not two separate keys. Example: "234.500 / 1.000.000 (23%)"
"""

from __future__ import annotations

from http.server import BaseHTTPRequestHandler
import json
import os
import sys

# Ensure api/lib/ is importable
_api_dir = os.path.dirname(os.path.abspath(__file__))
if _api_dir not in sys.path:
    sys.path.insert(0, _api_dir)

from lib.deepl_client import get_usage


class handler(BaseHTTPRequestHandler):
    def _cors_origin(self):
        return os.environ.get("ALLOWED_ORIGIN", "https://traduceri-matematica-7sh7.onrender.com")

    def _send_json(self, status: int, data: dict):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", self._cors_origin())
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_GET(self):
        try:
            key1 = os.environ.get("DEEPL_API_KEY", "").strip()
            key2 = os.environ.get("DEEPL_API_KEY2", "").strip()

            total_count = 0
            total_limit = 0

            for label, key in [("KEY1", key1), ("KEY2", key2)]:
                if not key:
                    continue
                usage = get_usage(key)
                total_count += usage.get("character_count", 0)
                total_limit += usage.get("character_limit", 500000)

            remaining = total_limit - total_count
            percent = round((total_count / total_limit) * 100, 1) if total_limit else 0

            chars_per_page = 1350
            pages_remaining = remaining // chars_per_page if remaining > 0 else 0

            data = {
                "character_count": total_count,
                "character_limit": total_limit,
                "remaining": remaining,
                "percent": percent,
                "pages_remaining": pages_remaining,
                "status": "ok",
            }

            if percent >= 90:
                data["warning"] = f"Cota aproape epuizata! Mai poti traduce ~{pages_remaining} pagini."
                data["level"] = "critical"
            elif percent >= 70:
                data["warning"] = f"Cota se apropie de limita. Mai ai ~{pages_remaining} pagini disponibile."
                data["level"] = "warning"
            else:
                data["level"] = "ok"

            self._send_json(200, data)

        except Exception as e:
            print(f"[DEEPL-USAGE] Error: {e}", file=sys.stderr)
            self._send_json(500, {"status": "error", "error": str(e), "level": "ok",
                                  "character_count": 0, "character_limit": 0})

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin",
                         os.environ.get("ALLOWED_ORIGIN", "https://traduceri-matematica-7sh7.onrender.com"))
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
