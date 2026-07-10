"""Tests for the overlay extraction module (pixel-perfect PDF text translation).

Builds a tiny text PDF in-memory with PyMuPDF so the tests are deterministic and
need no fixtures/network. Covers is_text_pdf, is_gibberish, and overlay_page
(line extraction + backgrounds).
"""
import base64

import fitz  # PyMuPDF
import pytest

from lib.overlay import is_text_pdf, is_gibberish, overlay_page


def _text_pdf() -> bytes:
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)  # A4
    page.insert_text((60, 80), "Chemische Untersuchung", fontsize=16)
    page.insert_text((60, 120), "Parameter: pH", fontsize=11)
    page.insert_text((60, 150), "Ergebnis: 11,6", fontsize=11)
    return doc.tobytes()


def _blank_pdf() -> bytes:
    doc = fitz.open()
    doc.new_page(width=595, height=842)  # no text — like a scan with no OCR layer
    return doc.tobytes()


def test_is_text_pdf_true_for_text():
    assert is_text_pdf(_text_pdf(), min_spans=2) is True


def test_is_text_pdf_false_for_blank():
    assert is_text_pdf(_blank_pdf(), min_spans=2) is False


def test_is_gibberish():
    assert is_gibberish("?i^,il' rl'*,*-,.") is True   # symbol-dominated seal junk
    assert is_gibberish("x") is True                    # too short
    assert is_gibberish("Chemische Untersuchung") is False
    assert is_gibberish("0 971 / 78 56-0") is False     # phone: alnum-heavy, kept
    assert is_gibberish("DIN EN ISO 10523") is False


def test_overlay_page_extracts_lines_and_backgrounds():
    r = overlay_page(_text_pdf(), 0)
    assert r["page_count"] == 1 and r["page"] == 0
    assert round(r["width"]) == 595 and round(r["height"]) == 842
    texts = [l["text"] for l in r["lines"]]
    assert any("Chemische Untersuchung" in t for t in texts)
    # every line carries an exact position + size
    for l in r["lines"]:
        assert len(l["bbox"]) == 4 and l["size"] > 0 and "id" in l
    # two real PNG backgrounds (original + redacted), non-trivial size
    assert base64.b64decode(r["bg_original"])[:8] == b"\x89PNG\r\n\x1a\n"
    assert base64.b64decode(r["bg_redacted"])[:8] == b"\x89PNG\r\n\x1a\n"
    assert len(r["bg_original"]) > 500 and len(r["bg_redacted"]) > 500


def test_overlay_page_bad_index():
    with pytest.raises(ValueError):
        overlay_page(_text_pdf(), 5)
