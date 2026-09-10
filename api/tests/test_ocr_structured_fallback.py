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


def _gemini_recitation_bytes() -> bytes:
    """HTTP 200 shape Gemini actually returns on a copyright-filter block —
    `content: {}`, no `parts`, `finishReason: RECITATION`. Reproduced live in
    the OCR A/B test (Faza 4.5d) on 2 real lab-report PDFs."""
    return json.dumps({
        "candidates": [{
            "content": {},
            "finishReason": "RECITATION",
            "index": 0,
            "finishMessage": "The generated content was filtered...",
        }],
    }).encode("utf-8")


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


# --- Faza 4.5d: RECITATION (HTTP 200, content gol) trebuie tratat ca tranzitoriu,
# nu ca "succes cu conținut gol" — reprodus live pe 2 documente reale în testul A/B ---


@patch.dict("os.environ", {"GOOGLE_AI_API_KEY": "test-key"})
@patch("lib.ocr_structured.increment_gemini_counter", lambda *a, **k: None)
def test_recitation_on_first_model_falls_through_to_next():
    """gemini-3.6-flash RECITATION (200, content gol) → cascadează la modelul
    următor, nu iese din buclă ca "succes" cu un KeyError necaptat mai jos."""
    sections = '{"title":"T","sections":[{"type":"paragraph","content":"ok"}]}'

    def _side(req, *a, **k):
        url = getattr(req, "full_url", "")
        if "gemini-3.6-flash" in url:
            return _FakeResp(_gemini_recitation_bytes())
        return _FakeResp(_gemini_ok_bytes(sections))

    with patch("urllib.request.urlopen", side_effect=_side):
        result = ocr_structured_call()

    assert result["sections"][0]["content"] == "ok"


@patch.dict("os.environ", {"GOOGLE_AI_API_KEY": "test-key"})
@patch("lib.ocr_structured.increment_gemini_counter", lambda *a, **k: None)
def test_recitation_on_all_models_falls_to_mistral():
    """RECITATION pe toate cele 3 modele (tier free) → Mistral OCR, nu crash."""
    def _side(req, *a, **k):
        return _FakeResp(_gemini_recitation_bytes())

    sentinel = {"title": "M", "sections": [{"type": "paragraph", "content": "mistral"}]}
    with patch("urllib.request.urlopen", side_effect=_side), \
         patch("lib.ocr_structured._ocr_with_mistral_structured", return_value=sentinel) as m:
        result = ocr_structured_call()

    m.assert_called_once()
    assert result["sections"][0]["content"] == "mistral"


@patch.dict("os.environ", {"GOOGLE_AI_API_KEY_PAID": "test-paid-key"})
@patch("lib.ocr_structured.increment_gemini_counter", lambda *a, **k: None)
def test_recitation_on_all_models_paid_tier_does_NOT_fall_to_mistral():
    """RECITATION pe toate 3, tier PLĂTIT → eșuează vizibil, nu Mistral (free terț)."""
    def _side(req, *a, **k):
        return _FakeResp(_gemini_recitation_bytes())

    png = b"\x89PNG\r\n\x1a\nFAKE"
    with patch("urllib.request.urlopen", side_effect=_side), \
         patch("lib.ocr_structured._ocr_with_mistral_structured") as m:
        with pytest.raises(RuntimeError, match="Mistral OMIS"):
            ocr_mod.ocr_structured(png, "image/png", "ro", key_env="GOOGLE_AI_API_KEY_PAID")

    m.assert_not_called()


# --- Faza 4.5d: bbox pe scala nativa Gemini 0-1000 (gasit in testul A/B, doar pe
# coordonata `y`, doar la gemini-3.5-flash-lite) trebuie normalizat, nu clampat orb ---


@patch.dict("os.environ", {"GOOGLE_AI_API_KEY": "test-key"})
@patch("lib.ocr_structured.increment_gemini_counter", lambda *a, **k: None)
def test_bbox_y_on_native_1000_scale_is_normalized():
    """y=551.0 (scala 0-1000 a Gemini) -> 0.551, nu clampat orb la 1.0."""
    sections = json.dumps({
        "title": "T",
        "sections": [{
            "type": "figure",
            "bbox": {"x": 0.392, "y": 551.0, "w": 0.273, "h": 0.103},
        }],
    })

    def _side(req, *a, **k):
        return _FakeResp(_gemini_ok_bytes(sections))

    with patch("urllib.request.urlopen", side_effect=_side):
        result = ocr_structured_call()

    bbox = result["sections"][0]["bbox"]
    assert bbox["y"] == pytest.approx(0.551)
    assert bbox["x"] == pytest.approx(0.392)  # neatins, deja in 0-1


@patch.dict("os.environ", {"GOOGLE_AI_API_KEY": "test-key"})
@patch("lib.ocr_structured.increment_gemini_counter", lambda *a, **k: None)
def test_bbox_values_already_in_0_1_are_untouched():
    """Un bbox deja corect (toate valorile in 0-1) nu trebuie alterat de fix."""
    sections = json.dumps({
        "title": "T",
        "sections": [{
            "type": "figure",
            "bbox": {"x": 0.14, "y": 0.63, "w": 0.23, "h": 0.04},
        }],
    })

    def _side(req, *a, **k):
        return _FakeResp(_gemini_ok_bytes(sections))

    with patch("urllib.request.urlopen", side_effect=_side):
        result = ocr_structured_call()

    bbox = result["sections"][0]["bbox"]
    assert bbox == {"x": 0.14, "y": 0.63, "w": 0.23, "h": 0.04}


@patch.dict("os.environ", {"GOOGLE_AI_API_KEY": "test-key"})
@patch("lib.ocr_structured.increment_gemini_counter", lambda *a, **k: None)
def test_bbox_extreme_out_of_range_still_clamps_as_final_safety_net():
    """O valoare absurda (ex. 5000) tot cade sub plasa de siguranta 0-1 finala,
    chiar daca /1000 n-o aduce complet in domeniu."""
    sections = json.dumps({
        "title": "T",
        "sections": [{
            "type": "figure",
            "bbox": {"x": 0.1, "y": 5000.0, "w": 0.2, "h": 0.2},
        }],
    })

    def _side(req, *a, **k):
        return _FakeResp(_gemini_ok_bytes(sections))

    with patch("urllib.request.urlopen", side_effect=_side):
        result = ocr_structured_call()

    bbox = result["sections"][0]["bbox"]
    assert bbox["y"] == 1.0  # 5000/1000=5.0, clamped la 1.0 de plasa finala


def ocr_structured_call():
    """Tiny PNG bytes → ocr_structured with defaults."""
    png = b"\x89PNG\r\n\x1a\nFAKE"
    return ocr_mod.ocr_structured(png, "image/png", "ro")


# --- Faza 4.5d (2026-09-11): selector de tier per cerere (§1 — corectarea lucrărilor
# elevilor pe cheia PLĂTITĂ, restul OCR-ului rămâne free) ---


@patch.dict("os.environ", {"GOOGLE_AI_API_KEY_PAID": "test-paid-key"})
@patch("lib.ocr_structured.increment_gemini_counter", lambda *a, **k: None)
def test_paid_tier_all_models_fail_does_NOT_fall_to_mistral():
    """Tier plătit (lucrare de elev): dacă toate modelele Gemini eșuează, NU cade pe
    Mistral (procesator free terț) — eșuează vizibil. Contra-probă la
    test_all_models_503_falls_to_mistral (comportamentul free rămâne neatins)."""
    def _side(req, *a, **k):
        raise _http_503(getattr(req, "full_url", ""))

    png = b"\x89PNG\r\n\x1a\nFAKE"
    with patch("urllib.request.urlopen", side_effect=_side), \
         patch("lib.ocr_structured._ocr_with_mistral_structured") as m:
        with pytest.raises(RuntimeError, match="Mistral OMIS"):
            ocr_mod.ocr_structured(png, "image/png", "ro", key_env="GOOGLE_AI_API_KEY_PAID")

    m.assert_not_called()


@patch.dict("os.environ", {"GOOGLE_AI_API_KEY_PAID": "test-paid-key"})
@patch("lib.ocr_structured.increment_gemini_counter", lambda *a, **k: None)
def test_paid_tier_reads_the_paid_env_var():
    """`key_env` selectează efectiv cheia trimisă la Gemini (nu doar declarativ)."""
    seen_keys = []
    sections = '{"title":"T","sections":[{"type":"paragraph","content":"ok"}]}'

    def _side(req, *a, **k):
        seen_keys.append(req.headers.get("X-goog-api-key"))
        return _FakeResp(_gemini_ok_bytes(sections))

    png = b"\x89PNG\r\n\x1a\nFAKE"
    with patch("urllib.request.urlopen", side_effect=_side):
        ocr_mod.ocr_structured(png, "image/png", "ro", key_env="GOOGLE_AI_API_KEY_PAID")

    assert seen_keys and seen_keys[0] == "test-paid-key"


def test_paid_tier_missing_key_raises_clear_error():
    """Cheia plătită lipsă din env → eroare clară, nu KeyError opac."""
    with pytest.raises(RuntimeError, match="GOOGLE_AI_API_KEY_PAID not set"):
        ocr_mod.ocr_structured(
            b"\x89PNG\r\n\x1a\nFAKE", "image/png", "ro", key_env="GOOGLE_AI_API_KEY_PAID"
        )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
