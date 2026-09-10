"""P3 (Faza 4.5b) — spatiul de la granita dintre sectiuni trebuie pastrat EXACT
din sursa, indiferent ce face providerul de traducere cu el.

Vezi docs/PLAN_FAZA4.5B_TRADUCERE_F8_2026-09-10.md pt diagnostic complet +
reproducerea live (3/3, deterministic) care a confirmat cauza: `.strip()`
necondiționat pe fiecare bucata tradusa, aplicat in `_apply_translations_recursive`.

Testele de mai jos trebuie sa PICE daca cineva revine la vechiul
`new_s["content"] = translated_text.strip()` (fara reatasare din sursa).
"""
import translate_text as tt


# --- unitare: _reattach_boundary_whitespace -------------------------------

def test_no_boundary_whitespace_passthrough():
    assert tt._reattach_boundary_whitespace("dreptunghic", "pravouhlý") == "pravouhlý"


def test_leading_space_preserved():
    # cazul din jurnal (#5): "Triunghiul este " -> spatiul final trebuie sa supravietuiasca
    assert tt._reattach_boundary_whitespace("dreptunghic ", "pravouhlý") == "pravouhlý "


def test_trailing_space_preserved():
    assert tt._reattach_boundary_whitespace(" dreptunghic", "pravouhlý") == " pravouhlý"


def test_both_ends_preserved():
    assert tt._reattach_boundary_whitespace(" dreptunghic ", "pravouhlý") == " pravouhlý "


def test_multiple_consecutive_spaces_preserved():
    assert tt._reattach_boundary_whitespace("   dreptunghic   ", "pravouhlý") == "   pravouhlý   "


def test_nbsp_preserved():
    nbsp = " "
    assert tt._reattach_boundary_whitespace(f"{nbsp}dreptunghic{nbsp}", "pravouhlý") == f"{nbsp}pravouhlý{nbsp}"


def test_newline_at_margin_preserved():
    assert tt._reattach_boundary_whitespace("\ndreptunghic\n", "pravouhlý") == "\npravouhlý\n"


def test_mixed_whitespace_margin_preserved():
    # spatiu + nbsp amestecate, ca la un OCR care produce "  " intre cuvinte
    src = "  dreptunghic  "
    assert tt._reattach_boundary_whitespace(src, "pravouhlý") == f"  pravouhlý  "


def test_whitespace_only_section_passthrough_unchanged():
    # sectiune formata DOAR din spatiu -> nimic de tradus, trece neschimbata
    assert tt._reattach_boundary_whitespace("   ", "ORICE") == "   "


def test_nbsp_only_section_passthrough_unchanged():
    assert tt._reattach_boundary_whitespace(" ", "ORICE") == " "


def test_empty_section_passthrough_unchanged():
    assert tt._reattach_boundary_whitespace("", "ORICE") == ""


def test_provider_leaked_separator_residue_is_absorbed():
    # rezidiu de \n scurs din join/split-ul cu SEP (\n|||SEP|||\n la unire,
    # |||SEP||| la despartire) — trebuie absorbit de strip-ul pe miez, NU
    # confundat cu spatiul de granita din sursa.
    assert tt._reattach_boundary_whitespace("dreptunghic ", "\npravouhlý\n") == "pravouhlý "


# --- contra-proba: providerul cel mai defavorabil (strip agresiv) ----------
# Simuleaza un provider care, indiferent de intrare, intoarce textul tradus
# FARA nicio urma de spatiu de margine (exact ce se intampla azi cu DeepL,
# vezi reproducerea live din plan). Daca fix-ul e revenit (inlocuit cu
# `.strip()` simplu pe raspunsul providerului), acest test PICA.

def test_apply_translations_recursive_survives_worst_case_provider():
    sections = [
        {"type": "paragraph", "content": "Triunghiul este "},
        {"type": "paragraph", "content": "dreptunghic"},
        {"type": "paragraph", "content": " și isoscel."},
    ]
    # providerul cel mai defavorabil: strip agresiv pe fiecare bucata
    worst_case_provider_output = iter([
        "Trojuholník je".strip(),
        "pravouhlý".strip(),
        "a rovnoramenný.".strip(),
    ])
    result = tt._apply_translations_recursive(sections, worst_case_provider_output)
    # Fiecare sectiune isi pastreaza spatiul din sursa, deci concatenarea bruta
    # (ca in client, editor-translate.ts) reda spatiile corect:
    assert result[0]["content"] == "Trojuholník je "
    assert result[1]["content"] == "pravouhlý"
    assert result[2]["content"] == " a rovnoramenný."
    assert "".join(s["content"] for s in result) == "Trojuholník je pravouhlý a rovnoramenný."


def test_apply_translations_recursive_whitespace_only_section_mid_stream():
    # sectiune-spatiu intre doua fragmente marcate diferit (ex. "cuvant" + " " + "**bold**")
    sections = [
        {"type": "paragraph", "content": "cuvânt"},
        {"type": "paragraph", "content": " "},
        {"type": "paragraph", "content": "bold"},
    ]
    provider_output = iter(["slovo", "ORICE-AR-INTOARCE-PROVIDERUL", "tučné"])
    result = tt._apply_translations_recursive(sections, provider_output)
    assert result[1]["content"] == " "  # neatins, byte-exact
    assert "".join(s["content"] for s in result) == "slovo tučné"


def test_two_column_recurses_with_boundary_fix():
    sections = [{
        "type": "two_column",
        "left": [{"type": "paragraph", "content": "stânga "}],
        "right": [{"type": "paragraph", "content": " dreapta"}],
    }]
    provider_output = iter(["left", "right"])
    result = tt._apply_translations_recursive(sections, provider_output)
    assert result[0]["left"][0]["content"] == "left "
    assert result[0]["right"][0]["content"] == " right"
