"""Regression tests for DOCX export figure embedding (convert.html_to_docx).

Guards against the silent R-EXPORT/R-MATH bug where the tag-strip deleted every
<img> data-URI figure, producing a DOCX with text but zero figures. Deterministic:
a tiny inline PNG, no network, no API keys.
"""

import base64
import io
import zipfile

from convert import html_to_docx
from docx import Document
from PIL import Image


def _png_data_uri_b64(w=120, h=80, color="red"):
    """Real PNG the DOCX writer accepts (a degenerate 1x1 is rejected)."""
    buf = io.BytesIO()
    Image.new("RGB", (w, h), color).save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("ascii")


_PNG_1x1 = _png_data_uri_b64()


def _docx(html: str):
    res = html_to_docx(html.encode("utf-8"), "t")
    return Document(io.BytesIO(res["data"])), res["data"]


def test_figures_embedded_as_pictures():
    # Two DISTINCT crops (docx de-duplicates identical blobs into one media file).
    fig_red = _png_data_uri_b64(color="red")
    fig_blue = _png_data_uri_b64(color="blue")
    html = (
        "<h2>Titlu</h2>"
        f'<div class="figure"><img src="data:image/png;base64,{fig_red}" alt="fig1"></div>'
        "<p>Un paragraf.</p>"
        f'<div class="figure"><img src="data:image/png;base64,{fig_blue}" alt="fig2"></div>'
    )
    doc, data = _docx(html)
    # Both figures must survive as real embedded pictures.
    assert len(doc.inline_shapes) == 2
    media = [n for n in zipfile.ZipFile(io.BytesIO(data)).namelist() if n.startswith("word/media/")]
    assert len(media) == 2
    # Text must survive too.
    text = "\n".join(p.text for p in doc.paragraphs)
    assert "Titlu" in text and "Un paragraf." in text


def test_text_only_still_works():
    doc, _ = _docx("<h1>H</h1><p>doar text</p>")
    assert len(doc.inline_shapes) == 0
    assert any("doar text" in p.text for p in doc.paragraphs)


def test_malformed_base64_is_skipped_not_fatal():
    # A corrupt data-URI must not abort the whole conversion.
    html = '<div><img src="data:image/png;base64,@@@not-valid@@@"></div><p>text ok</p>'
    doc, _ = _docx(html)
    assert any("text ok" in p.text for p in doc.paragraphs)
