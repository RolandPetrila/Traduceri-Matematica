"""Teste pt convert.pdf_to_image — conversie PDF->JPG/PNG (PyMuPDF, deja
dependinta de PRODUCTIE, folosita si de api/ocr.py._pdf_to_images pt acelasi
randaj). Gasit la audit Faza C: UI oferea PDF->JPG/PNG fara ruta backend (400);
implementat aici, nu doar ascuns din UI. Deterministic, fara retea/chei API.
"""

import io
import zipfile

import pytest

from convert import pdf_to_image


def _pdf_with_pages(n: int) -> bytes:
    import pymupdf

    doc = pymupdf.open()
    for _ in range(n):
        doc.new_page()
    buf = io.BytesIO()
    doc.save(buf)
    doc.close()
    return buf.getvalue()


def test_pagina_unica_intoarce_imaginea_direct_nu_zip():
    pdf = _pdf_with_pages(1)
    res = pdf_to_image(pdf, "fisa.pdf", "png")
    assert res["mime"] == "image/png"
    assert res["filename"] == "fisa.png"
    assert res["data"][:8] == b"\x89PNG\r\n\x1a\n"  # semnatura PNG reala


def test_pagina_unica_jpg():
    pdf = _pdf_with_pages(1)
    res = pdf_to_image(pdf, "fisa.pdf", "jpg")
    assert res["mime"] == "image/jpeg"
    assert res["filename"] == "fisa.jpg"
    assert res["data"][:4] == b"\xff\xd8\xff\xe0"  # semnatura JPEG reala


def test_multi_pagina_intoarce_zip_cu_toate_paginile():
    pdf = _pdf_with_pages(3)
    res = pdf_to_image(pdf, "lucrare.pdf", "png")
    assert res["mime"] == "application/zip"
    assert res["filename"] == "lucrare_pagini.zip"
    zf = zipfile.ZipFile(io.BytesIO(res["data"]))
    names = sorted(zf.namelist())
    assert names == [
        "lucrare_pagina01.png",
        "lucrare_pagina02.png",
        "lucrare_pagina03.png",
    ]
    # fiecare intrare e o imagine PNG reala, nu un fisier gol/corupt
    for n in names:
        assert zf.read(n)[:8] == b"\x89PNG\r\n\x1a\n"


def test_plafon_pagini_respins_cu_eroare_clara():
    pdf = _pdf_with_pages(2)
    with pytest.raises(ValueError, match="depaseste plafonul"):
        pdf_to_image(pdf, "mare.pdf", "png", max_pages=1)
