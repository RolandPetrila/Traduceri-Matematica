# PLAN — Traducere OVERLAY fidelă (document pixel-perfect)

**Data:** 2026-07-10 | **Status:** IN EXECUTIE | **Branch:** faza-g-editor

## Scop

Traducere care păstrează layout-ul EXACT (tabele, logo, poziții) pentru documente
complexe (rapoarte, oficiale), nu doar fișe de matematică. Metoda: **overlay** —
randez pagina originală + pun textul tradus poziționat peste cel original (mascat).

## De ce (problema)

Reconstrucția OCR actuală (proiectată pt fișe matematică) DEFORMEAZĂ documentele
complexe: reordonează, pierde tabele, taie logo-uri. Vezi `Analyse CettaClear 2026.pdf`
→ output deformat. Decizie Roland (2026-07-10): construim overlay complet în app.

## Sursă de inspirație (POC dovedit)

`Desktop\Roly\4. Artificial Inteligence\1.0_Traduceri\1.0_Traduceri_in_Lucru\`:

- `_pilot_overlay/`, `poc_html_pixelperfect/`, **`BAnz_HTML_Interactive/genereaza_html.py`** (referința principală).
- Tehnica: PyMuPDF `get_text("dict"/"rawdict")` → spans cu bbox EXACT + size + font + flags;
  2 fundaluri PNG/pagină (original + redactat alb); HTML cu spans absolute contenteditable;
  toggle prin `body[data-lang]` CSS.
- POC-ul nostru validat: `scratchpad/overlay_translate.py` → `Desktop\Cristina\Analyse_RO_overlay.html`
  (layout identic, DeepL DE→RO batch, editabil). FUNCȚIONEAZĂ.

## Arhitectură (aleasă)

- **PDF text** (majoritatea oficialelor) → overlay pixel-perfect (PyMuPDF, poziții EXACTE).
- **Scanat/poză** → OCR actual (Gemini).
- **Fișă matematică** → reconstrucția curată (deja reparată: figuri + numerotare).
- Procesare **per-pagină** (ca OCR) pt limita serverless 60s.
- Traducerea liniilor: reutilizează `/api/translate-text` (DeepL/Gemini).

## Pași

- [x] **B1** `api/lib/overlay.py`: `overlay_page(pdf_bytes, page_idx)` (extract linii bbox/size/bold +
      2 fundaluri PNG original+redactat), `is_text_pdf`, `is_gibberish`. Verificat pe `Analyse CettaClear` (96 linii, layout identic). — 2026-07-10
- [x] **B2** `api/overlay.py` handler: multipart/JSON → JSON {is_text_pdf,w,h,bg_original,bg_redacted,lines[]};
      fallback `is_text_pdf:false` pt scanat; rate-limit + E-OVL-001. — 2026-07-10
- [x] **B3** `api/tests/test_overlay.py` (is_text_pdf, is_gibberish, extract+backgrounds, bad index) — pytest 41/41. — 2026-07-10
- [x] **F1** componentă `OverlayViewer.tsx`: fundal + spans poziționate editabile + toggle + export
      (print + Descărcă HTML self-contained, ambele din DOM live → editările intră în export). Toate paginile
      STACKED (nu paginat) + span-uri memoizate → editările persistă (R-EDIT). — 2026-07-10
- [x] **F2** traducere linii via `/api/translate-text` (dedup unique + batch 40/cerere, fail-open pe chunk). — 2026-07-10
- [x] **D1** auto-detect în `traduceri/page.tsx`: 1 PDF → probe `/api/overlay` pag.0; `is_text_pdf` → overlay;
      altfel OCR. Fail-open (probe eșuat → OCR). Buton „Reproceseaza (OCR)" ca escape manual pt PDF text de
      matematică (gap semnalat de advisor). — 2026-07-10
- [x] **D2** rafinări: skip-gibberish (backend `is_gibberish`), `shouldTranslate` client (skip coduri/numere),
      font web-safe (Arial), auto-shrink (`fitSize`), fallback per-chunk. `api/overlay` adăugat în `dev_server.py`. — 2026-07-10
- [x] **GATE local** — tsc 0 · eslint 0 erori · jest 15/15 · next build ✓ · pytest 41/41 · endpoint `/api/overlay`
      testat LIVE local (HTTP 200, 96 linii, 2 PNG-uri, contract corect pe raportul real). — 2026-07-10
- [x] **RENDER verificat** — CSS-ul componentei (`.ov-*`) randat in Chrome pe datele reale: spans aliniate
      perfect pe fundalul redactat, coloanele din dreapta NEclipate, tabel+semnatura+footer identice cu
      originalul. Fix: scos `max-width:100%` de pe `.ov-page` (distorsiona/cliba spans pt fix) → `.ov-wrap`
      scroll orizontal + media query <900px. — 2026-07-10
- [ ] **D3** (GATED — deploy Roland) redeploy api+frontend + verificare live pe `Analyse CettaClear` + o fișă
      matematică (non-regresie). Necesită `!` de la Roland (R-DEPLOY, outward-facing).

## Gotchas (din POC + audit pilot)

- Fragmentare spans → folosim LINIA ca unitate (traducere mai bună).
- DeepL 429 → BATCH (max 45 texte/cerere) + throttle 0.4s. (rezolvat în POC)
- Soft-hyphen `­` + `\xa0` → curăță. (rezolvat)
- Overflow (traducere mai lungă) → auto-shrink font (min ~5pt), fără wrap.
- Font PDF embedded → aproximare web-safe (Arial/Times/Courier).
- Unele PDF-uri au mapare font defectă (I→t, A→4) pe coduri → editabil manual; DeepL corectează cuvintele.
- Ștampile/logo cu text stilizat → `is_gibberish` le sare.

## Non-regresie

Fișele de matematică TREBUIE să meargă în continuare (reconstrucția curată). Overlay
NUMAI pt PDF text. Verificat la D3.
