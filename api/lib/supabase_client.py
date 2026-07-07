"""Thin Supabase (PostgREST) client over stdlib urllib — fail-open.

Matches the codebase convention of using stdlib only (no `requests`).
Used for:
  - centralized diagnostic logs + error codes  (table: logs)
  - Gemini daily call counter                  (table: gemini_counter, RPC: increment_gemini)

Design rules:
  - FAIL-OPEN: every call swallows errors and returns a safe default, so a
    Supabase outage (or the free tier pausing after inactivity) never breaks
    OCR/translate. Failures print to stderr only.
  - The SERVICE-ROLE key is read from env and used ONLY server-side. It must
    never reach the browser.

Env:
  SUPABASE_URL           e.g. https://xxxx.supabase.co
  SUPABASE_SERVICE_KEY   service-role key (server-side only)
"""

from __future__ import annotations

import json
import os
import sys
import urllib.request
import urllib.error


def _base() -> tuple[str, str] | None:
    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_KEY", "")
    if not url or not key:
        return None
    return url, key


def is_configured() -> bool:
    return _base() is not None


def _request(method: str, path: str, body: dict | list | None = None,
             extra_headers: dict | None = None, timeout: float = 5.0):
    """Perform a PostgREST request. Returns parsed JSON or None on any failure."""
    base = _base()
    if base is None:
        return None
    url, key = base
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    if extra_headers:
        headers.update(extra_headers)

    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(f"{url}{path}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            return json.loads(raw) if raw else []
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")[:200] if hasattr(e, "read") else ""
        print(f"[SUPABASE] HTTP {e.code} on {method} {path}: {detail}", file=sys.stderr)
        return None
    except Exception as e:  # noqa: BLE001 — fail-open by design
        print(f"[SUPABASE] {type(e).__name__} on {method} {path}: {e}", file=sys.stderr)
        return None


# --- Logs -----------------------------------------------------------------

def insert_log(entry: dict) -> bool:
    """Insert one diagnostic log row. Fail-open (returns False on any error)."""
    row = {
        "level": entry.get("level", "info"),
        "error_code": entry.get("errorCode") or entry.get("error_code"),
        "message": (entry.get("message") or "")[:4000],
        "source": entry.get("source"),
        "page": entry.get("page"),
        "device": entry.get("device"),
        "context": entry.get("context"),
        "stack": entry.get("stack"),
    }
    res = _request("POST", "/rest/v1/logs", body=row,
                   extra_headers={"Prefer": "return=minimal"})
    return res is not None


def log_error(error_code: str, message: str, source: str = "backend",
              context: dict | None = None) -> None:
    """Convenience: record a server-side error in Supabase. Fail-open."""
    insert_log({
        "level": "error",
        "errorCode": error_code,
        "message": message,
        "source": source,
        "context": context,
    })


def get_logs(limit: int = 200, level: str | None = None,
             error_code: str | None = None) -> list:
    """Fetch recent logs, newest first. Returns [] on any failure."""
    params = [f"select=*", f"order=created_at.desc", f"limit={max(1, min(limit, 1000))}"]
    if level:
        params.append(f"level=eq.{level}")
    if error_code:
        params.append(f"error_code=eq.{error_code}")
    res = _request("GET", "/rest/v1/logs?" + "&".join(params))
    return res if isinstance(res, list) else []


# --- Gemini daily counter -------------------------------------------------

def increment_counter(date: str) -> bool:
    """Atomically bump today's Gemini counter via a Postgres RPC.

    Requires a SQL function `increment_gemini(d date)` (see supabase/schema.sql)
    that performs an atomic UPSERT + increment. Fail-open.
    """
    res = _request("POST", "/rest/v1/rpc/increment_gemini", body={"d": date})
    return res is not None


def get_counter(date: str) -> int | None:
    """Read today's Gemini count. Returns None if Supabase is unavailable."""
    res = _request("GET", f"/rest/v1/gemini_counter?select=count&date=eq.{date}")
    if isinstance(res, list) and res:
        try:
            return int(res[0].get("count", 0))
        except (TypeError, ValueError):
            return None
    if isinstance(res, list):
        return 0  # no row yet today
    return None
