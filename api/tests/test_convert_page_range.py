"""P5 (Faza 4.5a, 2026-09-10): input invalid la campul "Pagini" scurgea mesajul
brut al lui Python ("invalid literal for int() with base 10: 'abc'") la client,
fiindca handler-ul de exceptii trateaza orice ValueError ca "validare asteptata"
(decizia H2) si trimite str(e) neschimbat. Fix: _parse_page_range prinde
ValueError de la int() si re-arunca cu un mesaj romanesc.
"""

import pytest

from convert import _parse_page_range


def test_interval_valid_cu_liniuta_si_virgula():
    assert _parse_page_range("1,3,5-8", total=10) == [0, 2, 4, 5, 6, 7]


def test_gol_sau_all_intoarce_toate_paginile():
    assert _parse_page_range("", total=3) == [0, 1, 2]
    assert _parse_page_range("all", total=3) == [0, 1, 2]


def test_pagina_in_afara_intervalului_e_ignorata_nu_eroare():
    assert _parse_page_range("99", total=5) == [0, 1, 2, 3, 4]


def test_litere_produc_mesaj_romanesc_nu_eroarea_bruta_a_lui_python():
    with pytest.raises(ValueError) as exc:
        _parse_page_range("abc", total=5)
    message = str(exc.value)
    assert "invalid literal for int()" not in message
    assert "abc" in message


def test_liniuta_fara_capat_produce_mesaj_romanesc():
    with pytest.raises(ValueError) as exc:
        _parse_page_range("5-", total=10)
    assert "invalid literal for int()" not in str(exc.value)


def test_liniuta_fara_inceput_produce_mesaj_romanesc():
    with pytest.raises(ValueError) as exc:
        _parse_page_range("-5", total=10)
    assert "invalid literal for int()" not in str(exc.value)
