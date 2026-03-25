from http.server import BaseHTTPRequestHandler
import json
import os

BUILD_VERSION = (
    os.environ.get("NEXT_PUBLIC_BUILD_VERSION")
    or os.environ.get("VERCEL_GIT_COMMIT_SHA", "")[:7]
    or "dev"
)


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", os.environ.get("ALLOWED_ORIGIN", "https://traduceri-matematica-7sh7.onrender.com"))
        self.end_headers()
        self.wfile.write(
            json.dumps({
                "status": "ok",
                "service": "Sistem Traduceri API",
                "runtime": "vercel-python",
                "build_version": BUILD_VERSION,
            }).encode()
        )
