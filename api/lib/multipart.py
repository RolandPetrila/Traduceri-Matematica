"""Shared multipart parsing and logging utilities."""

from __future__ import annotations

import os
import re
import sys


def parse_boundary(content_type: str) -> str:
    """Extract multipart boundary from Content-Type header."""
    for part in content_type.split(";"):
        part = part.strip()
        if part.startswith("boundary="):
            return part[len("boundary="):].strip('"').strip("'")
    raise ValueError(f"No boundary found in Content-Type: {content_type}")


def log_to_file(message: str) -> None:
    """Append log entry to data/logs/local_debug.log (local dev only)."""
    log_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "logs"
    )
    if not os.path.isdir(log_dir):
        return
    try:
        from datetime import datetime
        ts = datetime.now().strftime("%H:%M:%S")
        with open(os.path.join(log_dir, "local_debug.log"), "a", encoding="utf-8") as f:
            f.write(f"[{ts}] {message}\n")
    except Exception:
        pass
