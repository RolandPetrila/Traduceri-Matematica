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

# Gemini free tier limits (RPD = requests per day). "total" e un plafon local
# ORIENTATIV (fail-open, nu blocheaza apeluri) — Google nu publica un tabel
# exact per-model, cifrele sunt cele mai bune estimari disponibile la
# 2026-08-08. gemini-2.5-flash-lite a fost RETRAS de Google (404, "no longer
# available to new users") — inlocuit cu gemini-3.5-flash-lite in lantul de
# fallback (vezi ocr_structured.py). gemini-2.5-pro scos din lant (acum
# paid-only pe pagina oficiala de preturi, R-COST).
GEMINI_LIMITS = {
    "gemini-3.6-flash": 1000,
    "gemini-3.5-flash-lite": 1500,
    "gemini-2.5-flash": 1000,
    "total": 3500,
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
