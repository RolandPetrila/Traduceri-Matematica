"""In-memory rate limiter — sliding window per IP (no Redis needed).

Protects API quotas (DeepL, Gemini) from abuse on public endpoints.

Serverless note: on Vercel each invocation runs in a fresh (warm-reused) process,
so this in-memory state is per-instance — best-effort across invocations. All four
public handlers (ocr / translate / translate-text / convert) DO call
reject_if_limited(); the local dev_server sets handler._rate_checked so each
request is counted exactly once. For a true cross-request cap, use an external
store (e.g. Upstash Redis).
Limits are calibrated for the page-at-a-time flow: a multi-page document issues
one /api/ocr (and one /api/translate-text) call PER PAGE, so per-minute limits
must comfortably exceed the largest document's page count to avoid false 429s.
Thread-safe via threading.Lock.
"""

from __future__ import annotations

import json
import os
import sys
import time
import threading
from collections import defaultdict

# --- Configuration per endpoint ---
# (requests_per_minute, requests_per_day)
# Page-at-a-time: one call per page, so per-minute caps are high enough for a
# large multi-page document processed in a burst (up to ~120 pages/min).
RATE_LIMITS: dict[str, tuple[int, int]] = {
    "/api/ocr": (120, 2000),
    "/api/translate": (120, 1000),
    "/api/translate-text": (120, 3000),
    "/api/convert": (30, 300),
    "/api/deepl-usage": (60, 1000),
    "/api/gemini-usage": (60, 1000),
    "/api/chat": (30, 300),      # future
    "/api/health": (120, 20000),  # permissive
}

# Default for unknown endpoints
DEFAULT_LIMIT = (15, 150)

WINDOW_MINUTE = 60
WINDOW_DAY = 86400
CLEANUP_INTERVAL = 300  # purge stale entries every 5 min

# --- Shared state ---
_lock = threading.Lock()
_requests: dict[str, list[float]] = defaultdict(list)
_cleanup_started = False


def _make_key(ip: str, endpoint: str) -> str:
    """Combine IP and endpoint into a single key."""
    return f"{ip}:{endpoint}"


def get_client_ip(handler) -> str:
    """Extract real client IP behind the platform proxy (Vercel/local).

    Prefer X-Real-IP (set by the platform to the true client IP). Fall back to
    the RIGHTMOST X-Forwarded-For entry (added by the closest trusted proxy) —
    NOT the leftmost, which is client-supplied and spoofable (a spoofed value
    would get its own rate-limit bucket, defeating the per-IP cap).
    """
    headers = getattr(handler, "headers", None)
    if headers is not None:
        real_ip = (headers.get("X-Real-IP", "") or "").strip()
        if real_ip:
            return real_ip
        xff = (headers.get("X-Forwarded-For", "") or "").strip()
        if xff:
            return xff.split(",")[-1].strip()
    if hasattr(handler, "client_address"):
        return handler.client_address[0]
    return "unknown"


def reject_if_limited(handler, endpoint: str) -> bool:
    """Enforce the per-IP limit inside a Vercel serverless handler.

    Writes a 429 JSON response and returns True when the request is over limit,
    so the handler can simply do ``if reject_if_limited(self, "/api/ocr"): return``.

    Skips the check when an upstream router already performed it (dev_server sets
    ``handler._rate_checked = True`` before dispatch), so local dev counts each
    request exactly once. On Vercel there is no upstream, so the handler is the
    only guard. Best-effort on serverless (state is per warm instance), but it
    still throttles the sustained bursts that abuse implies and fully protects
    the persistent local dev server.
    """
    if getattr(handler, "_rate_checked", False):
        return False

    limited, msg = is_rate_limited(handler, endpoint)
    if not limited:
        return False

    origin = os.environ.get("ALLOWED_ORIGIN", "*")
    body = json.dumps(
        {"error": msg, "error_code": "E-RATE-001", "status": "error"}
    ).encode()
    try:
        handler.send_response(429)
        handler.send_header("Content-Type", "application/json")
        handler.send_header("Access-Control-Allow-Origin", origin)
        handler.send_header("Retry-After", "60")
        handler.end_headers()
        handler.wfile.write(body)
    except Exception as e:  # never let limiter bookkeeping crash a request
        print(f"[RATE-LIMIT] failed to send 429: {e}", file=sys.stderr)
    return True


def is_rate_limited(handler, endpoint: str) -> tuple[bool, str]:
    """Check per-minute and per-day limits for an IP + endpoint.

    Returns (is_limited, error_message_in_romanian).
    """
    ip = get_client_ip(handler)
    per_min, per_day = RATE_LIMITS.get(endpoint, DEFAULT_LIMIT)
    key = _make_key(ip, endpoint)
    now = time.time()
    minute_ago = now - WINDOW_MINUTE
    day_ago = now - WINDOW_DAY

    with _lock:
        # Prune old entries (keep only last 24h)
        _requests[key] = [t for t in _requests[key] if t > day_ago]

        recent_day = _requests[key]
        recent_minute = [t for t in recent_day if t > minute_ago]

        if len(recent_minute) >= per_min:
            wait = int(WINDOW_MINUTE - (now - recent_minute[0])) + 1
            print(f"[RATE-LIMIT] {ip} hit minute limit on {endpoint}: {len(recent_minute)}/{per_min}", file=sys.stderr)
            return True, f"Prea multe cereri. Incearca din nou in {wait} secunde."

        if len(recent_day) >= per_day:
            print(f"[RATE-LIMIT] {ip} hit daily limit on {endpoint}: {len(recent_day)}/{per_day}", file=sys.stderr)
            return True, "Limita zilnica atinsa. Incearca din nou maine."

        # Allowed — record this request
        _requests[key].append(now)

    return False, ""


def cleanup_stale_entries():
    """Remove IPs with no activity in the last 24h. Call periodically."""
    now = time.time()
    cutoff = now - WINDOW_DAY
    with _lock:
        stale = [k for k, ts in _requests.items() if not ts or ts[-1] < cutoff]
        for k in stale:
            del _requests[k]
    if stale:
        print(f"[RATE-LIMIT] Cleaned {len(stale)} stale entries", file=sys.stderr)


def start_cleanup_timer():
    """Start periodic cleanup (call once at server boot)."""
    global _cleanup_started
    if _cleanup_started:
        return
    _cleanup_started = True

    def _tick():
        cleanup_stale_entries()
        timer = threading.Timer(CLEANUP_INTERVAL, _tick)
        timer.daemon = True
        timer.start()

    timer = threading.Timer(CLEANUP_INTERVAL, _tick)
    timer.daemon = True
    timer.start()
    print(f"[RATE-LIMIT] Cleanup timer started (every {CLEANUP_INTERVAL}s)", file=sys.stderr)
