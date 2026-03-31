"""Retry with exponential backoff for transient API errors."""

from __future__ import annotations

import sys
import time
import urllib.error


TRANSIENT_CODES = {500, 502, 503, 504, 429}


def retry_with_backoff(func, max_retries=2, base_delay=1.0):
    """Decorator-style wrapper: retry func() on transient errors.

    Retries on: HTTP 5xx, 429, URLError, TimeoutError, ConnectionError.
    Does NOT retry on: HTTP 4xx (except 429), other exceptions.

    Args:
        func: callable to execute (no args — use lambda or functools.partial)
        max_retries: number of retries after first failure (default 2 = 3 total attempts)
        base_delay: initial delay in seconds (doubles each retry)

    Returns:
        Result of func()

    Raises:
        Last exception if all retries exhausted
    """
    last_error = None
    for attempt in range(max_retries + 1):
        try:
            return func()
        except urllib.error.HTTPError as e:
            if e.code not in TRANSIENT_CODES:
                raise  # Don't retry client errors
            last_error = e
            print(f"[RETRY] HTTP {e.code}, attempt {attempt+1}/{max_retries+1}", file=sys.stderr)
        except (urllib.error.URLError, TimeoutError, ConnectionError, OSError) as e:
            last_error = e
            print(f"[RETRY] {type(e).__name__}, attempt {attempt+1}/{max_retries+1}", file=sys.stderr)

        if attempt < max_retries:
            delay = base_delay * (2 ** attempt)
            print(f"[RETRY] Waiting {delay}s before retry", file=sys.stderr)
            time.sleep(delay)

    raise last_error
