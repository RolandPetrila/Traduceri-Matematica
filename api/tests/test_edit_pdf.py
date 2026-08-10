"""M9 (audit 2026-08-10): edit_pdf() avea 0 teste — refactorul in per-actiune
(dispatch dict, vezi convert.py) a scos empiric un bug real (watermark folosea
PdfReader fara sa-l importe in noul scop, NameError). Acest fisier fixeaza
comportamentul cu teste, ca sa nu se piarda acoperirea castigata prin verificare
manuala.
"""
from __future__ import annotations

import io
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import convert as C
from pypdf import PdfReader, PdfWriter


def _blank_pdf(n_pages: int = 4) -> bytes:
    buf = io.BytesIO()
    w = PdfWriter()
    for _ in range(n_pages):
        w.add_blank_page(width=200, height=200)
    w.write(buf)
    return buf.getvalue()


def test_rotate_keeps_page_count():
    data = _blank_pdf(4)
    r = C.edit_pdf(data, "t.pdf", pdf_action="rotate", rotate_angle="90", page_range="all")
    reader = PdfReader(io.BytesIO(r["data"]))
    assert len(reader.pages) == 4
    assert r["filename"] == "t_rotate.pdf"


def test_delete_removes_requested_page():
    data = _blank_pdf(4)
    r = C.edit_pdf(data, "t.pdf", pdf_action="delete", page_range="2")
    reader = PdfReader(io.BytesIO(r["data"]))
    assert len(reader.pages) == 3


def test_delete_all_pages_raises():
    data = _blank_pdf(2)
    try:
        C.edit_pdf(data, "t.pdf", pdf_action="delete", page_range="1-2")
        assert False, "ar fi trebuit sa ridice ValueError"
    except ValueError:
        pass


def test_reorder_keeps_page_count():
    data = _blank_pdf(4)
    r = C.edit_pdf(data, "t.pdf", pdf_action="reorder", reorder_sequence="4,1,2,3")
    reader = PdfReader(io.BytesIO(r["data"]))
    assert len(reader.pages) == 4


def test_optimize_keeps_page_count():
    data = _blank_pdf(4)
    r = C.edit_pdf(data, "t.pdf", pdf_action="optimize")
    reader = PdfReader(io.BytesIO(r["data"]))
    assert len(reader.pages) == 4


def test_watermark_keeps_page_count_and_produces_valid_pdf():
    # Regresie directa a bug-ului gasit la audit: watermark-ul foloseste
    # PdfReader intern (parseaza pagina de watermark generata cu fpdf2) — dupa
    # extragerea in functie separata, importul local trebuie sa ramana prezent.
    data = _blank_pdf(3)
    r = C.edit_pdf(data, "t.pdf", pdf_action="watermark", watermark_text="TEST")
    reader = PdfReader(io.BytesIO(r["data"]))
    assert len(reader.pages) == 3
    assert len(r["data"]) > 0


def test_unknown_action_raises_value_error():
    data = _blank_pdf(1)
    try:
        C.edit_pdf(data, "t.pdf", pdf_action="nu-exista")
        assert False, "ar fi trebuit sa ridice ValueError"
    except ValueError as e:
        assert "necunoscuta" in str(e)


def test_missing_action_raises_value_error():
    data = _blank_pdf(1)
    try:
        C.edit_pdf(data, "t.pdf")
        assert False, "ar fi trebuit sa ridice ValueError"
    except ValueError:
        pass
