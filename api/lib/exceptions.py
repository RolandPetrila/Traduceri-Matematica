"""Typed application errors mapped to E-<AREA>-<NNN> codes + HTTP status.

Any point in a request's call chain can ``raise TranslationError(...)`` (or any
AppError subclass); the handler's outer ``except`` reads ``.error_code`` /
``.status`` via ``error_response()`` to build a consistent JSON body. A plain
(non-AppError) exception keeps the handler's existing default code, so wiring
this in is fully backwards-compatible.

Codes mirror config/error_codes.json. Kept dependency-free (no file I/O) so it is
safe to import inside serverless handlers.
"""

from __future__ import annotations


class AppError(Exception):
    """Base typed error. Subclasses set class-level error_code/status/message."""

    error_code = "E-APP-001"
    status = 500
    public_message = "Eroare aplicatie"

    def __init__(
        self,
        message: str | None = None,
        *,
        error_code: str | None = None,
        status: int | None = None,
    ):
        self.public_message = message or self.public_message
        if error_code is not None:
            self.error_code = error_code
        if status is not None:
            self.status = status
        super().__init__(self.public_message)

    def to_response(self) -> tuple[int, dict]:
        """(http_status, json_body) — ready for the handler to emit."""
        return self.status, {
            "error": self.public_message,
            "error_code": self.error_code,
            "status": "error",
        }


class OCRError(AppError):
    error_code = "E-OCR-001"
    public_message = "OCR a esuat pentru o pagina"


class OCRProvidersExhausted(AppError):
    error_code = "E-OCR-003"
    public_message = "Toti providerii OCR au esuat (Gemini + Mistral)"


class TranslationError(AppError):
    error_code = "E-TRANS-001"
    public_message = "Traducerea a esuat"


class TranslationProvidersExhausted(AppError):
    error_code = "E-TRANS-003"
    public_message = "Lantul de provideri de traducere s-a epuizat"


class ConversionError(AppError):
    error_code = "E-CONV-001"
    public_message = "Conversia fisierului a esuat"


class RateLimitError(AppError):
    error_code = "E-RATE-001"
    status = 429
    public_message = "Prea multe cereri (rate limit)"


class RequestTooLarge(AppError):
    error_code = "E-APP-001"
    status = 413
    public_message = "Fisierul depaseste limita permisa"


def error_response(
    exc: Exception,
    default_code: str = "E-APP-001",
    default_status: int = 500,
) -> tuple[int, dict]:
    """Build (status, body) for any exception.

    AppError instances use their own error_code/status; every other exception
    falls back to the caller-supplied default (backwards-compatible with the
    handlers' pre-existing hard-coded codes).
    """
    if isinstance(exc, AppError):
        return exc.to_response()
    # S6 (§2 securitate): NU expune ``str(exc)`` clientului — pt excepțiile
    # ne-AppError, mesajul poate conține corpul erorii providerului (ex.
    # ``RuntimeError(f"Mistral OCR error {code}: {error_body[:200]}")``) sau
    # detalii interne. Întoarce un mesaj GENERIC + codul de arie; detaliul real
    # rămâne în logurile server-side (handler-ul face print/traceback + Supabase
    # ``log_error(code, str(e))``). Clientul afișează codul → raportabil.
    return default_status, {
        "error": "Eroare internă a serverului. Reîncearcă; dacă persistă, raportează codul de mai jos.",
        "error_code": default_code,
        "status": "error",
    }
