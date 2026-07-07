"""Gemini API daily call counter.

Storage:
  - Supabase (table `gemini_counter`, atomic RPC `increment_gemini`) when
    SUPABASE_URL/SUPABASE_SERVICE_KEY are set — survives the stateless serverless
    model (each Vercel invocation is a fresh process, so pure in-memory state
    would always read 0).
  - In-memory fallback for local dev / when Supabase is unavailable (fail-open).

Usage:
    from lib.gemini_counter import increment_gemini_counter, get_gemini_usage
"""

from __future__ import annotations

import threading
from datetime import datetime

from lib import supabase_client

_lock = threading.Lock()
_state: dict = {"count": 0, "date": ""}

# Gemini free tier limits (RPD = requests per day)
GEMINI_LIMITS = {
    "gemini-2.5-flash": 1000,
    "gemini-2.5-flash-lite": 1500,
    "gemini-2.5-pro": 100,
    "total": 2600,
}


def _today() -> str:
    return datetime.now().strftime("%Y-%m-%d")


def increment_gemini_counter(model: str = "gemini-2.5-flash") -> None:
    """Increment the daily call counter (Supabase atomic + in-memory fallback)."""
    today = _today()

    # Atomic increment in Supabase (fail-open — never breaks the OCR call).
    if supabase_client.is_configured():
        supabase_client.increment_counter(today)

    # Always keep a local fallback figure too.
    with _lock:
        if _state["date"] != today:
            _state["count"] = 0
            _state["date"] = today
        _state["count"] += 1


def get_gemini_usage() -> dict:
    """Return current usage stats for the UI (Supabase preferred, else in-memory)."""
    today = _today()

    count = None
    source = "in-memory"
    if supabase_client.is_configured():
        count = supabase_client.get_counter(today)
        if count is not None:
            source = "supabase"

    if count is None:
        with _lock:
            count = _state["count"] if _state["date"] == today else 0

    limit = GEMINI_LIMITS["total"]
    remaining = max(0, limit - count)
    percent = round((count / limit) * 100, 1) if limit else 0
    return {
        "count": count,
        "limit": limit,
        "remaining": remaining,
        "percent": percent,
        "date": today,
        "note": f"Sursa: {source}",
    }
