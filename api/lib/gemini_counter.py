"""Shared in-memory Gemini API call counter (resets daily and on restart).

Usage:
    from lib.gemini_counter import increment_gemini_counter, get_gemini_usage
"""

from __future__ import annotations

import threading
from datetime import datetime

_lock = threading.Lock()
_state: dict = {"count": 0, "date": ""}

# Gemini free tier limits (RPD = requests per day)
GEMINI_LIMITS = {
    "gemini-2.5-flash": 1000,
    "gemini-2.5-flash-lite": 1500,
    "gemini-2.5-pro": 100,
    "total": 2600,
}


def increment_gemini_counter(model: str = "gemini-2.5-flash") -> None:
    """Increment the daily call counter. Auto-resets at midnight."""
    today = datetime.now().strftime("%Y-%m-%d")
    with _lock:
        if _state["date"] != today:
            _state["count"] = 0
            _state["date"] = today
        _state["count"] += 1


def get_gemini_usage() -> dict:
    """Return current usage stats for the UI."""
    today = datetime.now().strftime("%Y-%m-%d")
    with _lock:
        if _state["date"] != today:
            count = 0
        else:
            count = _state["count"]
    limit = GEMINI_LIMITS["total"]
    remaining = max(0, limit - count)
    percent = round((count / limit) * 100, 1) if limit else 0
    return {
        "count": count,
        "limit": limit,
        "remaining": remaining,
        "percent": percent,
        "date": today,
        "note": "In-memory — resets on server restart",
    }
