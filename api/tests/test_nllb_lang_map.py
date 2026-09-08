"""Regression test for the NLLB language map (Faza 2, decision 2c: SK + EN + DE).

The bug this guards against, found on 2026-09-08 by the requirements auditor:
`de` was missing from the map and the code used `lang_map.get(target_lang, "slk_Latn")`.
A German translation request that reached NLLB therefore came back in SLOVAK, with
status 200 and no error logged anywhere. Fluent, confident, wrong language.

That is the same failure class Roland keeps hitting: a silent false success. A missing
language must FAIL so the provider chain moves on, never fall back to a guess.
"""

import pytest

from api.lib.translation_router import NLLB_LANG_MAP, nllb_codes


def test_all_four_ui_languages_are_mapped():
    """RO, SK, EN, DE are the languages the editor's F8 switch offers."""
    assert set(NLLB_LANG_MAP) == {"ro", "sk", "en", "de"}


def test_german_maps_to_german_not_slovak():
    """The actual regression: de -> deu_Latn, never slk_Latn."""
    src, tgt = nllb_codes("ro", "de")
    assert src == "ron_Latn"
    assert tgt == "deu_Latn"
    assert tgt != "slk_Latn"


@pytest.mark.parametrize(
    "target,expected",
    [("sk", "slk_Latn"), ("en", "eng_Latn"), ("de", "deu_Latn")],
)
def test_each_target_language_from_romanian(target, expected):
    assert nllb_codes("ro", target)[1] == expected


def test_unknown_target_raises_instead_of_defaulting():
    """No silent default. The chain must fall through to the next provider."""
    with pytest.raises(RuntimeError, match="unsupported language pair"):
        nllb_codes("ro", "hu")


def test_unknown_source_raises_too():
    with pytest.raises(RuntimeError, match="unsupported language pair"):
        nllb_codes("hu", "sk")


def test_error_message_lists_what_is_supported():
    """The log line must say what WOULD work — diagnosing beats guessing."""
    with pytest.raises(RuntimeError) as exc:
        nllb_codes("ro", "fr")
    msg = str(exc.value)
    for code in ("de", "en", "ro", "sk"):
        assert code in msg
