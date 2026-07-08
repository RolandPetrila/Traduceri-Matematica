"""Tests for the typed error hierarchy (exceptions.py) + error_response mapping."""

from lib.exceptions import (
    AppError,
    OCRError,
    OCRProvidersExhausted,
    TranslationError,
    TranslationProvidersExhausted,
    ConversionError,
    RateLimitError,
    RequestTooLarge,
    error_response,
)


def test_subclasses_carry_expected_codes_and_status():
    assert OCRError().error_code == "E-OCR-001"
    assert OCRError().status == 500
    assert OCRProvidersExhausted().error_code == "E-OCR-003"
    assert TranslationError().error_code == "E-TRANS-001"
    assert TranslationProvidersExhausted().error_code == "E-TRANS-003"
    assert ConversionError().error_code == "E-CONV-001"
    assert RateLimitError().status == 429
    assert RequestTooLarge().status == 413


def test_message_and_overrides():
    e = TranslationError("custom boom", error_code="E-TRANS-002", status=502)
    assert str(e) == "custom boom"
    assert e.error_code == "E-TRANS-002"
    assert e.status == 502


def test_to_response_shape():
    status, body = OCRError("boom").to_response()
    assert status == 500
    assert body == {"error": "boom", "error_code": "E-OCR-001", "status": "error"}


def test_error_response_uses_apperror_own_code():
    status, body = error_response(RateLimitError())
    assert status == 429
    assert body["error_code"] == "E-RATE-001"


def test_error_response_plain_exception_falls_back_to_default():
    status, body = error_response(ValueError("x"), default_code="E-OCR-001")
    assert status == 500
    assert body["error_code"] == "E-OCR-001"
    assert body["error"] == "x"


def test_all_typed_errors_are_apperror_subclasses():
    for cls in (
        OCRError,
        OCRProvidersExhausted,
        TranslationError,
        TranslationProvidersExhausted,
        ConversionError,
        RateLimitError,
        RequestTooLarge,
    ):
        assert issubclass(cls, AppError)
