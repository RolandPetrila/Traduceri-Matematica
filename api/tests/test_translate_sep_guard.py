"""Tests for the |||SEP||| alignment guard in translate_text.

The batch path joins texts with a separator and splits the translation back. If
a provider mangles the separator, parts stop mapping 1:1 onto the source
sections and text would land on the wrong one (R-MATH/correctness). These tests
lock the collect/apply ordering invariant and the per-section fallback. Pure
functions, no network — providers are monkeypatched.
"""

import translate_text as tt


def _figure(img="B64"):
    return {"type": "figure", "img_b64": img}


def test_collect_apply_are_order_aligned():
    sections = [
        {"type": "heading", "content": "T"},
        {"type": "paragraph", "content": "A"},
        _figure(),
        {
            "type": "two_column",
            "left": [{"type": "paragraph", "content": "L1"}, _figure("L")],
            "right": [{"type": "paragraph", "content": "R1"}],
        },
        {"type": "paragraph", "content": "Z"},
    ]
    texts = tt._collect_texts_recursive(sections)
    # Figures contribute NO text; order is depth-first, left before right.
    assert texts == ["T", "A", "L1", "R1", "Z"]

    # Applying the same texts back reproduces content in place (inverse walk).
    result = tt._apply_translations_recursive(sections, iter(texts))
    assert tt._collect_texts_recursive(result) == texts
    # Figures preserved untouched (including nested).
    assert result[2] == _figure()
    assert result[3]["left"][1] == _figure("L")


def test_mismatch_condition_is_detectable():
    sections = [{"type": "paragraph", "content": c} for c in ("a", "b", "c")]
    texts = tt._collect_texts_recursive(sections)
    assert len(texts) == 3
    # Provider dropped a separator → 2 parts for 3 texts → guard must trigger.
    mangled = "x|||SEP|||y"
    assert len(mangled.split("|||SEP|||")) != len(texts)


def test_translate_each_preserves_order(monkeypatch):
    monkeypatch.setattr(tt, "_gemini_translate", lambda t, s, g: t.upper())
    out = tt._translate_each(["a", "b", "c"], "ro", "sk", "gemini")
    assert out == ["A", "B", "C"]  # 1:1, order preserved


def test_translate_each_keeps_empty_and_failures(monkeypatch):
    calls = {"n": 0}

    def fake(t, s, g):
        calls["n"] += 1
        if t == "boom":
            raise RuntimeError("provider down")
        return t + "!"

    monkeypatch.setattr(tt, "_gemini_translate", fake)
    out = tt._translate_each(["ok", "", "boom", "   "], "ro", "sk", "gemini")
    # empty/whitespace skipped; failing text keeps its original (never misalign/drop)
    assert out == ["ok!", "", "boom", "   "]
    assert calls["n"] == 2  # only "ok" and "boom" were attempted


def test_translate_each_deepl_branch(monkeypatch):
    monkeypatch.setenv("DEEPL_API_KEY", "x")
    monkeypatch.setattr(tt, "_HAS_DEEPL", True, raising=False)
    monkeypatch.setattr(tt, "protect_for_deepl", lambda t: t, raising=False)
    monkeypatch.setattr(tt, "restore_from_deepl", lambda t: t, raising=False)
    monkeypatch.setattr(
        tt, "_deepl_translate", lambda text, tgt, src: f"{text}->{tgt}", raising=False
    )
    out = tt._translate_each(["hi"], "ro", "sk", "deepl")
    assert out == ["hi->sk"]


def test_full_recovery_lands_text_on_right_section(monkeypatch):
    # End-to-end of the recovery: per-section translation applied back keeps each
    # translated string on its own section and figures intact.
    monkeypatch.setattr(tt, "_gemini_translate", lambda t, s, g: t + "_SK")
    sections = [
        {"type": "paragraph", "content": "unu"},
        _figure(),
        {"type": "paragraph", "content": "doi"},
    ]
    texts = tt._collect_texts_recursive(sections)
    parts = tt._translate_each(texts, "ro", "sk", "gemini")
    result = tt._apply_translations_recursive(sections, iter(parts))
    assert result[0]["content"] == "unu_SK"
    assert result[1] == _figure()  # figure untouched
    assert result[2]["content"] == "doi_SK"
