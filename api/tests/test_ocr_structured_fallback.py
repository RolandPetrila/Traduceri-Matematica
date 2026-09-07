"""Fallback-chain tests for ocr_structured (2026-09-07).

Regression guard for the real cause of intermittent OCR failure found in prod
logs: gemini-3.6-flash returned HTTP 503 "high demand" on ~half the requests,
and 503 did NOT trigger the model fallback (only 429/404 did) → the page failed
instead of trying gemini-3.5-flash-lite / gemini-2.5-flash. Fix: 500/502/503/529
now fall through to the next model. This test plants that exact scenario.
"""

from __future__ import annotations

import io
import json
import urllib.error
from unittest.mock import patch

import pytest

from lib import ocr_structured as ocr_mod


class _FakeResp:
    """Context-manager HTTP response with .read() (urlopen success shape)."""

    def __init__(self, data: bytes):
        self._data = data

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False

    def read(self):
        return self._data


def _gemini_ok_bytes(sections_json: str) -> bytes:
    """A valid Gemini generateContent envelope wrapping the JSON `text`."""
    return json.dumps(
        {"candidates": [{"content": {"parts": [{"text": sections_json}]}}]}
    ).encode("utf-8")


def _http_503(url: str) -> urllib.error.HTTPError:
    return urllib.error.HTTPError(
        url, 503, "high demand", {}, io.BytesIO(b'{"error":{"code":503,"status":"UNAVAILABLE"}}')
    )


@patch.dict("os.environ", {"GOOGLE_AI_API_KEY": "test-key"})
@patch("lib.ocr_structured.increment_gemini_counter", lambda *a, **k: None)
def test_503_on_first_model_falls_through_to_next():
    """gemini-3.6-flash 503 → must retry the NEXT model, not fail the page."""
    sections = '{"title":"T","sections":[{"type":"paragraph","content":"ok"}]}'

    def _side(req, *a, **k):
        url = getattr(req, "full_url", "")
        if "gemini-3.6-flash" in url:
            raise _http_503(url)
        # any next model (3.5-flash-lite / 2.5-flash) succeeds
        return _FakeResp(_gemini_ok_bytes(sections))

    with patch("urllib.request.urlopen", side_effect=_side):
        result = ocr_structured_call()

    assert result["title"] == "T"
    assert result["sections"][0]["content"] == "ok"


@patch.dict("os.environ", {"GOOGLE_AI_API_KEY": "test-key"})
@patch("lib.ocr_structured.increment_gemini_counter", lambda *a, **k: None)
def test_read_timeout_on_first_model_falls_through():
    """gemini-3.6-flash read-timeout → must retry the NEXT model, not fail the page.

    This was the residual prod failure: TimeoutError wasn't in the fallback set, so
    a 45s hang returned a degenerate 1-paragraph page instead of trying a faster model.
    """
    sections = '{"title":"T","sections":[{"type":"paragraph","content":"ok"}]}'

    def _side(req, *a, **k):
        url = getattr(req, "full_url", "")
        if "gemini-3.6-flash" in url:
            raise TimeoutError("The read operation timed out")
        return _FakeResp(_gemini_ok_bytes(sections))

    with patch("urllib.request.urlopen", side_effect=_side):
        result = ocr_structured_call()

    assert result["sections"][0]["content"] == "ok"


@patch.dict("os.environ", {"GOOGLE_AI_API_KEY": "test-key"})
@patch("lib.ocr_structured.increment_gemini_counter", lambda *a, **k: None)
def test_all_models_503_falls_to_mistral():
    """All 3 Gemini tiers 503 → last-resort Mistral OCR is attempted (not a crash)."""
    def _side(req, *a, **k):
        raise _http_503(getattr(req, "full_url", ""))

    sentinel = {"title": "M", "sections": [{"type": "paragraph", "content": "mistral"}]}
    with patch("urllib.request.urlopen", side_effect=_side), \
         patch("lib.ocr_structured._ocr_with_mistral_structured", return_value=sentinel) as m:
        result = ocr_structured_call()

    m.assert_called_once()
    assert result["sections"][0]["content"] == "mistral"


def ocr_structured_call():
    """Tiny PNG bytes → ocr_structured with defaults."""
    png = b"\x89PNG\r\n\x1a\nFAKE"
    return ocr_mod.ocr_structured(png, "image/png", "ro")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
