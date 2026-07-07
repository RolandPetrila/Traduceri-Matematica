# PLAN — UX vizibil + Hamburger + OCR + Conversii calitate superioară · Asistent Text AI

**Data:** 2026-06-15 · **Status:** DRAFT — aștept confirmare înainte de implementare (R-PLAN)
**Cerere user:** meniu hamburger, OCR, conversii fișiere de calitate superioară (nu basic), adaptat Android + Windows 10, UX vizibil. „Tot odată (plan mare)".
**Risc global:** MEDIU (atinge `index.html` live, dar additiv; fără infra nouă) — pe pași mai jos.

---

## 0. Decizii tehnice (recomandate — confirmă sau corectează)

| #   | Decizie                              | Recomandat                                                                                                          | De ce                                                                                                                                                   |
| --- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Motor OCR                            | **Gemini Vision (primary) + Tesseract.js (offline fallback)**                                                       | Gemini = calitate înaltă + cheia ta deja config; Tesseract = funcționează offline/privat. Acoperă ambele.                                               |
| D2  | Arhitectură pt „calitate superioară" | **Hibrid: rămân no-build + Gemini pt calitate**                                                                     | Zero risc pe deploy; calitatea vine din AI (extracție/restructurare) + librării CDN mai bune. Revizuim build DOAR dacă o conversie anume chiar îl cere. |
| D3  | PDF-XChange                          | **Exclus din PWA** (limită sandbox browser + cross-device). Opțional: track separat Electron Windows-only (NU acum) | Web app nu poate apela `.exe` local; app-ul merge și pe Android.                                                                                        |
| D4  | Livrare                              | **Pe faze, fiecare validată + deployată** (chiar dacă scope „tot odată")                                            | Vezi progres live + rollback ușor; respectă „validez înainte de deploy".                                                                                |

> **PDF-XChange găsit:** `C:\Program Files\PDF-XChange\PDF Editor\PXCEditor.exe`. Neutilizabil de PWA. Track Electron companion = decizie separată, la cerere.

---

## FAZA 1 — Hamburger + Shell UX (vizibil imediat, risc MIC)

- **Meniu hamburger** (☰) responsive: pe mobil = drawer lateral; pe desktop = meniu compact. Adună: Temă, Istoric, Ghid, Persona, Setări, Export. Accesibil (focus-trap, `aria-expanded`, Escape).
- **Acțiuni pe fiecare rezultat AI:** Copiază · Regenerează · „Folosește ca sursă" · Descarcă — vizibile pe cardul de output.
- **Responsive Android + Win10:** touch-targets ≥44px, viewport corect, layout fluid (testez pe ambele).
- **Contrast AA** (audit #21/#22): badge-uri/text sub 3:1 → corectate.
- Risc: MIC (UI additiv). Verificare: smoke Playwright + manual.

## FAZA 2 — OCR (imagine + PDF scanat → text)

- **Import imagine** (PNG/JPG/WEBP) + **buton „OCR"**. Pipeline:
  1. **Gemini Vision** (primary, online): trimit imaginea (base64 `inlineData`) prin proxy → `gemini` → text + opțional structură (Markdown). Calitate înaltă, RO inclus.
  2. **Tesseract.js** (fallback offline, CDN WASM, `lang=ron`): dacă offline sau user alege „privat".
- **PDF scanat:** detectez paginile fără text (pdf.js întoarce gol) → render canvas → OCR prin Gemini/Tesseract.
- Proxy: forwardează deja body-ul la Gemini → suport `inlineData`. Verific cost-cap (imaginea nu lovește allowlist-ul de model). Posibil `provider=gemini` rămâne.
- Risc: MEDIU (proxy + payload imagine). Teste: unit pe constructorul de payload + smoke real cu o imagine.

## FAZA 3 — Conversii fișiere „calitate superioară"

- **Import (calitate↑):**
  - PDF: text nativ (pdf.js) + **fallback Gemini vision** pe scanate/layout complex (păstrează structura).
  - DOCX: mammoth (păstrez), dar normalizez output-ul.
  - Imagine → text (OCR, Faza 2).
- **Export (calitate↑):**
  - **PDF:** îmbunătățesc `html2pdf` (margini, fonturi, diacritice, header brand) — sau evaluez `pdf-lib` (CDN) pt control mai fin.
  - **DOCX:** html-docx-js e basic + pachet mort. Evaluez o cale mai bună fără build; dacă calitatea „superioară" cere lib cu build → semnalez și cer decizie (D2). Onest: aici e plafonul no-build.
  - **MD/TXT/HTML:** păstrez, curăț.
- Risc: MEDIU. Teste: smoke pe fiecare pereche import/export.

## FAZA 4 — Polish + a11y + verificare cross-device

- Streaming feedback îmbunătățit, stări de loading unificate, mesaje clare.
- Re-test a11y (screen-reader pe noile controale) + contrast.
- Verificare finală: Android (Chrome) + Windows 10 (Chrome/Edge), smoke Playwright + manual.

---

## Reguli de siguranță (toate fazele)

- `pwa/` rămâne rădăcina de deploy. Fără build nou (D2) decât cu confirmare separată.
- Fiecare fază: `npm test` (verde, +teste noi) → syntax-check → **smoke browser** → commit → push → **deploy** → verificare live. Bump `CACHE` SW la fiecare deploy.
- Chei DOAR server-side. Cost-cap proxy păstrat. Imaginile OCR merg prin proxy (origin allowlist).
- Markdown/HTML din AI → DOMPurify (anti-XSS) — și pe output-ul OCR.

## Jurnal execuție

- [x] **Faza 1** — hamburger + UX + contrast (commit `5b87f25`) — verificat Playwright desktop (colaps 320→0→320) + mobil (drawer + editor-first).
- [x] **Faza 2** — OCR Gemini Vision + Tesseract fallback (commit `3018f68`) — verificat LIVE: imagine „FACTURA TEST 2026" + Tesseract „TEST 123", zero erori CSP.
- [x] **Faza 3** — export DOCX/PDF Markdown randat (commit `5b1730a`) — verificat: DOCX blob valid cu h1/tabel/bold reale (nu text brut), PDF A4+pagebreak.
- [x] **Faza 4** — verificare finală cross-device + docs (2026-06-15). Toate funcțiile live + coerente.

> **Rămas opțional (audit MEDIUM, NU cerut explicit):** unificare sisteme loading (#19), contrast `text-slate-400` pe light (#22), prag perf `checkAutocorrect`/diff doc mare (#14-16). Plus #1 proxy infra (app-token + RL persistent). Vezi `RESUME_PUNCT_CURENT.md`.

---

## Track OPȚIONAL (separat, la cerere) — Companion Windows cu PDF-XChange

Dacă vrei calitate PDF nativă PXC pe Windows: app Electron/Tauri (Windows-only) care apelează CLI-ul PXC pentru conversii locale. **NU** face parte din PWA, **NU** merge pe Android, schimbă modelul de distribuție. Decizie separată — spune dacă o vrei evaluată.
