"""Tests for math_protect — the LaTeX/SVG protection used at DeepL translation.

This module had a real bug (nested <keep> tags -> DeepL "Tag handling parsing
failed") and a later fix (numeric-entity unescape). These tests lock in the
round-trip invariant and those two edge cases so a future refactor can't silently
re-break the translation path.
"""

from lib.math_protect import (
    protect_for_deepl,
    restore_from_deepl,
    protect_with_placeholders,
    restore_from_placeholders,
    _xml_unescape,
)

# Representative inputs spanning inline/display math, LaTeX commands, SVG figures,
# raw HTML that must NOT be protected, and literal &/</> characters.
ROUNDTRIP_CASES = [
    "Fie triunghiul $ABC$ dreptunghic.",
    "Inegalitatea $a < b$ si $c > d$ trebuie pastrata.",
    "Text simplu, fara matematica deloc.",
    "Formula bloc: $$\\int_0^1 x\\,dx = \\frac{1}{2}$$ gata.",
    "Comanda \\triangle plus \\text{cm} inline.",
    "Ampersand & literal cu <b>tag</b> neprotejat ramane.",
    '<div><svg><circle r="2"/></svg></div> este o figura.',
]


def test_deepl_roundtrip_is_identity():
    """protect -> restore must reproduce the original exactly (DeepL passthrough)."""
    for s in ROUNDTRIP_CASES:
        assert restore_from_deepl(protect_for_deepl(s)) == s, s


def test_keep_tags_are_never_nested():
    """The fixed bug: <keep> wrappers must be flat (depth 0/1), never nested."""
    s = "Fie $x$ apoi <div><svg>fig</svg></div> si apoi $y$ final."
    protected = protect_for_deepl(s)
    assert protected.count("<keep>") == protected.count("</keep>")
    import re

    depth = 0
    for tok in re.findall(r"<keep>|</keep>", protected):
        depth += 1 if tok == "<keep>" else -1
        assert depth in (0, 1), f"nested <keep> detected in: {protected}"
    assert depth == 0


def test_inequality_is_xml_escaped():
    """$a < b$ must be XML-escaped so DeepL's XML parser doesn't choke on '<'."""
    protected = protect_for_deepl("Avem relatia $a < b$ mereu.")
    assert "&lt;" in protected
    assert "<keep>" in protected


def test_xml_unescape_numeric_and_named_entities():
    assert _xml_unescape("&#39;") == "'"
    assert _xml_unescape("&apos;") == "'"
    assert _xml_unescape("&#34;") == '"'
    assert _xml_unescape("&quot;") == '"'
    assert _xml_unescape("&lt;tag&gt;") == "<tag>"


def test_xml_unescape_decodes_amp_last():
    """&amp;lt; must become &lt; (literal), not '<' (no double-decode)."""
    assert _xml_unescape("&amp;lt;") == "&lt;"


def test_placeholder_roundtrip_is_identity():
    for s in ROUNDTRIP_CASES:
        protected, placeholders = protect_with_placeholders(s)
        assert restore_from_placeholders(protected, placeholders) == s, s
