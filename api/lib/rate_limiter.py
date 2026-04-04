"""In-memory rate limiter — sliding window per IP (no Redis needed).

Protects API quotas (DeepL, Gemini) from abuse on public endpoints.
State resets on Render spin-down (acceptable — rate limits simply reset).
Thread-safe via threading.Lock.
"""

from __future__ import annotations

import sys
import time
import threading
from collections import defaultdict

# --- Configuration per endpoint ---
# (requests_per_minute, requests_per_day)
RATE_LIMITS: dict[str, tuple[int, int]] = {
    "/api/ocr": (10, 100),
    "/api/translate": (10, 100),
    "/api/translate-text": (10, 100),
    "/api/convert": (20, 200),
    "/api/deepl-usage": (30, 500),
    "/api/chat": (30, 300),      # future
    "/api/health": (60, 10000),  # permissive
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
    """Extract real client IP behind Render's proxy.

    Render adds X-Forwarded-For; take the leftmost entry (original client).
    """
    xff = handler.headers.get("X-Forwarded-For", "") if hasattr(handler, 'headers') else ""
    if xff:
        return xff.split(",")[0].strip()
    if hasattr(handler, 'client_address'):
        return handler.client_address[0]
    return "unknown"


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
