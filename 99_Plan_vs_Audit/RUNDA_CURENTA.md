# RUNDA CURENTA — Runda 13: FIX CAUZA RADACINA SVG — IN EXECUTIE
# Actualizat: 2026-04-04 de T1

---

## Status executie

### INTERVENTIE 1: Upgrade model Gemini — COMPLETAT
- [x] `ocr_structured.py` — model schimbat de la `gemini-2.5-flash` la `gemini-2.5-pro`
- [x] Timeout crescut de la 90s la 180s (Pro dureaza mai mult)
- Decizie: D28

### INTERVENTIE 2: Rescriere COMPLETA prompt OCR — COMPLETAT
- [x] Prompt rescris de la bbox/crop la SVG inline cu 12 conventii geometrie scolara
- [x] Docstring modul actualizat (SVG inline, nu bbox/crop)
- [x] Docstring functie actualizat (svg field, nu bbox field)
- [x] Validare bbox inlocuita cu validare SVG (verifica tag `<svg>`)
- [x] Suport recursiv two_column in validare
- [x] Regula "join hyphenated words" adaugata (fix "compa- sului")
- Decizie: D29

### INTERVENTIE 3: Actualizare html_builder.py — COMPLETAT
- [x] `build_html_structured()` refactorizat — foloseste `_render_section()` recursiv
- [x] Handler `figure` cu SVG inline (nu base64 crop) — SVG direct in HTML
- [x] Handler `two_column` cu CSS grid (grid-template-columns: 1fr 1fr)
- [x] Functia _render_section e recursiva (two_column contine sub-sectiuni)
- Decizie: D31

### EXTRA: Actualizare translate.py — COMPLETAT
- [x] Import `crop_all_figures` scos (marcat DEPRECATED D3/D24)
- [x] Apelul `crop_all_figures()` inlocuit cu `cropped_figs = {}`
- [x] `_collect_text()` recursiv — colecteaza text si din two_column (left/right)
- [x] Write-back traduceri adaptat pentru noul format (secs_ref, index)
- Decizie: D30, D32

### Documentatie — COMPLETAT
- [x] PLAN_DECISIONS.md — Runda 7 adaugata (D28-D32, Q1-Q3, C22-C24)
- [x] AUDIT_FEEDBACK.md — Rundele 7, 8, 9 marcate [INTEGRAT]

---

## URMATORUL PAS

**ASTEPT confirmare Roland** inainte de commit + push.

Dupa confirmare:
1. Commit + push → Render deploy
2. Test pe test_page_1.jpeg pe Render live
3. Roland verifica output-ul vizual
4. Daca OK → Sprint 2.6 (mecanismul 3 pasi)

---

## FISIERE MODIFICATE

| Fisier | Ce s-a schimbat |
|--------|----------------|
| `api/lib/ocr_structured.py` | Model Pro, prompt SVG nou, validare SVG, timeout 180s |
| `api/lib/html_builder.py` | _render_section() recursiv, handler figure SVG + two_column |
| `api/translate.py` | Scos crop, _collect_text() recursiv, write-back adaptat |
| `99_Plan_vs_Audit/PLAN_DECISIONS.md` | Runda 7 (D28-D32) |
| `99_Plan_vs_Audit/AUDIT_FEEDBACK.md` | Runde 7-9 marcate [INTEGRAT] |
| `99_Plan_vs_Audit/RUNDA_CURENTA.md` | Acest fisier — status executie |
