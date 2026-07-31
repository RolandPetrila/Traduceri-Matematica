"""Tests for Azure prebuilt-layout → structured sections (R7).

PURE functions only — no network, no API key. Covers:
- reading order reconstructed from span offsets (R7.3 on the Azure path),
- table → rectangular grid + headerRows detection (R7.1),
- table-span paragraphs NOT duplicated as standalone text,
- figure polygon → fractional bbox (R7.4 feeds figure_crop),
- the 0-tables guard (`_has_table`) used for the Gemini fallback (R-MATH).
"""

from lib.azure_layout import (
    _result_to_sections,
    _table_to_section,
    _poly_to_bbox,
)
from ocr import _has_table


def _sample_result():
    return {
        "content": "x" * 400,
        "pages": [{"pageNumber": 1, "width": 1000, "height": 2000, "unit": "pixel"}],
        "paragraphs": [
            {"content": "Titlu", "role": "title", "spans": [{"offset": 0, "length": 5}]},
            {"content": "Intro text", "spans": [{"offset": 6, "length": 10}]},
            # offset 120 is INSIDE the table span (100..150) → must be skipped.
            {"content": "pH", "spans": [{"offset": 120, "length": 2}]},
            {"content": "Subsol", "role": "pageFooter", "spans": [{"offset": 300, "length": 6}]},
        ],
        "tables": [
            {
                "rowCount": 2,
                "columnCount": 2,
                "spans": [{"offset": 100, "length": 50}],
                "cells": [
                    {"rowIndex": 0, "columnIndex": 0, "content": "Param", "kind": "columnHeader"},
                    {"rowIndex": 0, "columnIndex": 1, "content": "Wert", "kind": "columnHeader"},
                    {"rowIndex": 1, "columnIndex": 0, "content": "pH"},
                    {"rowIndex": 1, "columnIndex": 1, "content": "7.2"},
                ],
            }
        ],
        "figures": [
            {
                "boundingRegions": [
                    {"pageNumber": 1, "polygon": [100, 200, 300, 200, 300, 400, 100, 400]}
                ],
                "spans": [{"offset": 20, "length": 1}],
            }
        ],
    }


def test_reading_order_by_span_offset():
    secs = _result_to_sections(_sample_result())
    types = [s["type"] for s in secs]
    # offset order: Titlu(0) Intro(6) figure(20) table(100) Subsol(300)
    assert types == ["heading", "paragraph", "figure", "table", "paragraph"]
    assert secs[0]["content"] == "Titlu" and secs[0]["level"] == 1


def test_table_span_paragraph_not_duplicated():
    secs = _result_to_sections(_sample_result())
    # "pH" appears ONLY inside the table, never as a standalone paragraph.
    standalone = [s for s in secs if s["type"] == "paragraph" and s.get("content") == "pH"]
    assert standalone == []


def test_table_grid_and_header():
    sec = _table_to_section(_sample_result()["tables"][0])
    assert sec["rows"] == [["Param", "Wert"], ["pH", "7.2"]]
    assert sec["headerRows"] == 1


def test_table_rectangular_with_missing_cell():
    table = {
        "rowCount": 2,
        "columnCount": 3,
        "cells": [
            {"rowIndex": 0, "columnIndex": 0, "content": "a"},
            {"rowIndex": 1, "columnIndex": 2, "content": "z"},
        ],
    }
    sec = _table_to_section(table)
    assert sec["rows"] == [["a", "", ""], ["", "", "z"]]  # padded, no ragged rows
    assert sec["headerRows"] == 0  # no columnHeader cells


def test_figure_polygon_to_fractional_bbox():
    bbox = _poly_to_bbox([100, 200, 300, 200, 300, 400, 100, 400],
                         {"width": 1000, "height": 2000})
    assert bbox == {"x": 0.1, "y": 0.1, "w": 0.2, "h": 0.1}


def test_poly_to_bbox_bad_input_returns_none():
    assert _poly_to_bbox([], {"width": 1000, "height": 2000}) is None
    assert _poly_to_bbox([1, 2, 3, 4], {"width": 0, "height": 0}) is None


def test_has_table_guard():
    assert _has_table([{"type": "table", "rows": []}]) is True
    assert _has_table([{"type": "paragraph"}]) is False
    # nested inside two_column
    assert _has_table([{"type": "two_column", "left": [{"type": "table"}], "right": []}]) is True


def test_no_elements_falls_back_to_content_paragraph():
    secs = _result_to_sections({"content": "doar text simplu", "pages": [], "paragraphs": [], "tables": [], "figures": []})
    assert secs == [{"type": "paragraph", "content": "doar text simplu"}]
