"""Regression: Content-Disposition must survive RO/SK diacritics in filenames.

Before the fix, a filename like "Fișă_matematică.pdf" crashed send_header
(latin-1 strict) → malformed double HTTP response. Now RFC 5987: ASCII fallback
(latin-1-safe) + UTF-8 filename*.
"""

from __future__ import annotations

import convert as convert_module


def test_ascii_fallback_is_latin1_encodable():
    for name in ["Fișă_matematică.pdf", "Skúška_5A.docx", "raport ăîâșț.html", "ľ ĺ ŕ ô.png"]:
        fb = convert_module._ascii_fallback_filename(name)
        # The crash was here: header value must encode as latin-1 without error.
        fb.encode("latin-1", "strict")
        assert fb  # never empty


def test_ascii_fallback_folds_diacritics():
    assert convert_module._ascii_fallback_filename("Fișă.pdf") == "Fisa.pdf"
    assert convert_module._ascii_fallback_filename("Skúška.docx") == "Skuska.docx"


def test_ascii_fallback_never_empty():
    # A name that folds to nothing (pure non-latin) still yields a usable header.
    out = convert_module._ascii_fallback_filename("книга.pdf")  # Cyrillic → drops
    out.encode("latin-1", "strict")
    assert out


def test_content_disposition_has_both_params_and_is_latin1_safe():
    cd = convert_module._content_disposition("Fișă_matematică.pdf")
    cd.encode("latin-1", "strict")  # whole header must be sendable
    assert 'filename="' in cd
    assert "filename*=UTF-8''" in cd
    assert "%C8%99" in cd or "%C4%83" in cd  # ș / ă percent-encoded in the UTF-8 param


def test_content_disposition_no_header_injection():
    cd = convert_module._content_disposition('evil"\r\nSet-Cookie: x.pdf')
    assert "\r" not in cd and "\n" not in cd
    cd.encode("latin-1", "strict")
