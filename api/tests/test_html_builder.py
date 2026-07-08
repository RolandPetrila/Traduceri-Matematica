"""Smoke tests for html_builder — structured OCR JSON -> A4 printable HTML.

Guards against crashes on the section schema and ensures the MathJax runtime and
the actual text content make it into the output (the export pipeline depends on
both). Pure string building, no network.
"""

from lib.html_builder import build_html_structured, build_html


def test_build_html_structured_includes_content_and_mathjax():
    pages = [
        {
            "title": "Geometrie",
            "sections": [
                {"type": "paragraph", "content": "Fie triunghiul $ABC$ dreptunghic."},
                {"type": "heading", "content": "Observatii", "level": 2},
                {"type": "list", "content": "1. prima\n2. a doua"},
            ],
        }
    ]
    html = build_html_structured(pages, [], "sk")
    assert isinstance(html, str)
    assert "Geometrie" in html
    assert "Fie triunghiul" in html
    assert "prima" in html
    assert "mathjax" in html.lower()


def test_build_html_structured_handles_empty_pages():
    html = build_html_structured([], [], "ro")
    assert isinstance(html, str)
    assert "mathjax" in html.lower()


def test_build_html_markdown_path():
    html = build_html(["# Titlu\n\nText cu $x^2$ aici."], "en")
    assert isinstance(html, str)
    assert "Titlu" in html
    assert "mathjax" in html.lower()
