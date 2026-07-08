"""Tests for rate_limiter — per-IP sliding-window abuse protection.

Covers the anti-spoof client-IP extraction (X-Real-IP preferred, RIGHTMOST
X-Forwarded-For fallback) hardened in the prior review, and the minute-limit
enforcement. Pure in-memory, no network.
"""

import pytest

from lib import rate_limiter
from lib.rate_limiter import get_client_ip, is_rate_limited


class FakeHandler:
    """Minimal stand-in for a BaseHTTPRequestHandler (headers + client_address)."""

    def __init__(self, headers=None, client_ip="9.9.9.9"):
        self.headers = headers if headers is not None else {}
        self.client_address = (client_ip, 12345)


@pytest.fixture(autouse=True)
def _clear_state():
    rate_limiter._requests.clear()
    yield
    rate_limiter._requests.clear()


def test_get_client_ip_prefers_x_real_ip():
    h = FakeHandler(headers={"X-Real-IP": "5.5.5.5", "X-Forwarded-For": "1.1.1.1, 2.2.2.2"})
    assert get_client_ip(h) == "5.5.5.5"


def test_get_client_ip_uses_rightmost_xff():
    # Leftmost is client-supplied/spoofable; the trusted proxy appends rightmost.
    h = FakeHandler(headers={"X-Forwarded-For": "1.1.1.1, 2.2.2.2, 3.3.3.3"})
    assert get_client_ip(h) == "3.3.3.3"


def test_get_client_ip_falls_back_to_socket():
    h = FakeHandler(headers={}, client_ip="7.7.7.7")
    assert get_client_ip(h) == "7.7.7.7"


def test_under_limit_is_allowed():
    h = FakeHandler(headers={"X-Real-IP": "10.0.0.1"})
    limited, msg = is_rate_limited(h, "/api/ocr")
    assert limited is False
    assert msg == ""


def test_minute_limit_blocks_after_threshold():
    ep = "/api/__unknown_for_test__"  # unknown -> DEFAULT_LIMIT
    per_min = rate_limiter.DEFAULT_LIMIT[0]
    h = FakeHandler(headers={"X-Real-IP": "10.0.0.2"})
    for _ in range(per_min):
        limited, _m = is_rate_limited(h, ep)
        assert limited is False
    limited, msg = is_rate_limited(h, ep)
    assert limited is True
    assert "cereri" in msg.lower()


def test_distinct_ips_have_independent_buckets():
    ep = "/api/__unknown_for_test2__"
    per_min = rate_limiter.DEFAULT_LIMIT[0]
    h1 = FakeHandler(headers={"X-Real-IP": "10.0.0.3"})
    h2 = FakeHandler(headers={"X-Real-IP": "10.0.0.4"})
    for _ in range(per_min):
        is_rate_limited(h1, ep)
    limited1, _ = is_rate_limited(h1, ep)
    limited2, _ = is_rate_limited(h2, ep)
    assert limited1 is True
    assert limited2 is False
