"""Ordinea lanțului de traducere `_run_translation_chain` (translate_text.py).

Blochează inserarea Azure (2026-08-20) după DeepL și înainte de NLLB, plus
comportamentul de fallback. Provideri mock (fără rețea/chei) — deterministe.
"""
import translate_text as tt


def _fail(*_a, **_k):
    raise RuntimeError("provider indisponibil (mock)")


def _ok(label):
    def _fn(*_a, **_k):
        return f"[{label}]TRAD"
    return _fn


def _setenv(monkeypatch):
    for k in ("DEEPL_API_KEY", "AZURE_TRANSLATOR_KEY", "HF_TOKEN", "OPENROUTER_API_KEY"):
        monkeypatch.setenv(k, "x")
    monkeypatch.setattr(tt, "_HAS_DEEPL", True)
    monkeypatch.setattr(tt, "_HAS_EXTRA_PROVIDERS", True)


def test_deepl_first_when_healthy(monkeypatch):
    _setenv(monkeypatch)
    monkeypatch.setattr(tt, "_deepl_translate", _ok("deepl"))
    _out, prov = tt._run_translation_chain("Salut", "ro", "sk", "deepl")
    assert prov == "DeepL"


def test_azure_is_tried_right_after_deepl(monkeypatch):
    """Cheia fixului: DeepL cade → Azure (NU direct NLLB)."""
    _setenv(monkeypatch)
    monkeypatch.setattr(tt, "_deepl_translate", _fail)
    monkeypatch.setattr(tt, "translate_with_azure", _ok("azure"))
    monkeypatch.setattr(tt, "translate_with_nllb", _ok("nllb"))  # nu trebuie atins
    _out, prov = tt._run_translation_chain("Salut", "ro", "sk", "deepl")
    assert prov == "Azure Translator"


def test_falls_through_deepl_azure_to_nllb(monkeypatch):
    _setenv(monkeypatch)
    monkeypatch.setattr(tt, "_deepl_translate", _fail)
    monkeypatch.setattr(tt, "translate_with_azure", _fail)
    monkeypatch.setattr(tt, "translate_with_nllb", _ok("nllb"))
    _out, prov = tt._run_translation_chain("Salut", "ro", "sk", "deepl")
    assert prov == "NLLB"


def test_azure_skipped_when_no_key(monkeypatch):
    _setenv(monkeypatch)
    monkeypatch.delenv("AZURE_TRANSLATOR_KEY", raising=False)
    monkeypatch.delenv("AZURE_TRANSLATOR_KEY_2", raising=False)
    monkeypatch.setattr(tt, "_deepl_translate", _fail)
    # Azure ar arunca dacă ar fi apelat — dar fără cheie trebuie SĂRIT, nu apelat.
    monkeypatch.setattr(tt, "translate_with_azure", _fail)
    monkeypatch.setattr(tt, "translate_with_nllb", _ok("nllb"))
    _out, prov = tt._run_translation_chain("Salut", "ro", "sk", "deepl")
    assert prov == "NLLB"


def test_gemini_primary_branch_includes_azure(monkeypatch):
    _setenv(monkeypatch)
    monkeypatch.setattr(tt, "_gemini_translate", _fail)
    monkeypatch.setattr(tt, "translate_with_azure", _ok("azure"))
    _out, prov = tt._run_translation_chain("Salut", "ro", "sk", "gemini")
    assert prov == "Azure Translator"
