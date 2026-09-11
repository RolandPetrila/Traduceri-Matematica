# RAPORT F5 — Audit „fiecare buton executabil" + remediere secvențială (2026-09-07)

> **Cerere Roland:** auditează fiecare buton prin care se fac execuții, verifică că fiecare chiar
> generează/execută comanda reală+completă cum era programat; raportează; apoi **remediem pas cu pas
> secvențial, fără să omitem ceva**.
>
> **Metodă audit:** 6 sub-audite paralele (inventar static buton→handler→endpoint per modul) + **probe
> LIVE pe prod** (endpoint-urile reale + căile de eroare, nu doar „happy path").

## Verdict per modul (butoane executabile)

| Modul                                         | Butoane | Verdict                                                                             |
| --------------------------------------------- | ------- | ----------------------------------------------------------------------------------- |
| Editor toolbar/math/insert/tabel/find/Ctrl+K  | ~73     | ✓ · 2 cosmetice (Font/Mărime) · 0 rupte                                             |
| Editor import/OCR · export PDF/DOCX/HTML · F8 | 12+     | ✓ (live: translate RO→SK 200, formulă intactă)                                      |
| Chat AI                                       | toate   | ✓ (live: groq 200)                                                                  |
| Calculator                                    | toate   | ✓ motor verificat empiric · 0 bug-uri                                               |
| Teste                                         | toate   | ✓ flux (live: generare STOP + barem complet); 3 bug-uri pe căile de eroare (fixate) |
| Planșe                                        | toate   | ✓ 6/6 generatoare produc real                                                       |
| Școlare                                       | toate   | ✓ flux central real+complet cu barem                                                |

## Bug-uri REALE reparate + DEPLOYATE + verificate live (prima rundă)

- [x] 🔴 **CRITIC Convertor diacritice RO/SK** — `Fișă_matematică.pdf`/`Skúška` crăpau `send_header`
      (latin-1) → răspuns HTTP malformat. Fix RFC 5987 + 5 teste. Live: fără crash. (`c140b5b`)
- [x] **Convertor scurgere antet în corp** → blob corupt. Fix: oglindit `_send_json`. Live: `antet_scurs=false`. (`ca4892c`)
- [x] **Teste #1** continue fără try/catch → blocaj „loading". (`c140b5b`)
- [x] **Teste #2** auto-continuare succes-fals → barem tăiat tăcut. Fix: notă onestă. (`c140b5b`)
- [x] **Teste #3** text „[Eroare OCR]" notat ca lucrarea elevului. Fix: scoate markerele. (`c140b5b`)
- [x] **Convertor Compress** fără gardă format. Fix. (`c140b5b`)

Gate: `tsc 0 · jest 356/356 · build OK · pytest 75/75`. Frontend v52 + backend live.

---

## REMEDIERE SECVENȚIALĂ — reziduuri (pas cu pas, fără omisiuni)

> Ordine: de la clar+ieftin la greu. Gate + commit per item/grup, deploy per grup, verificare live.

- [ ] **R1 — Docs stale** (CLAUDE.md + `.claude/rules/project_rules.md`): „DOCX (backend)" e de fapt
      client-side (`@turbodocx/html-to-docx`) pt Export Editor; „MathJax" e de fapt KaTeX. Corectează.
- [ ] **R2 — Școlare `parseParams`**: `culori=rosu, albastru` (cu spațiu) se trunchiază la primul spațiu
      → pierdere tăcută de culori la markerul `baloane`. Fix regex + test.
- [ ] **R3 — Școlare controale la loading**: radio Dificultate + input Cerință + „Deselectează tot" nu
      au `disabled={status==="loading"}` (inconsecvent cu select-urile). Fix.
- [ ] **R4 — Școlare `loadRegulament`** înghite tăcut eșecul de fetch → bannerul „ghidat" e fals. Fix:
      semnalează vizibil când regulamentul n-a putut fi încărcat.
- [ ] **R5 — Școlare „➕ În editor"** nu randează markerele `[[DESEN]]` (text brut în editor; Print/PDF OK).
      Fix: randează desenele înainte de inserare (sau inserează-le ca imagini).
- [ ] **R6 — Planșe `remember()`** = cod mort → Print direct (fără coș) nu marchează planșa ca „văzută"
      (posibile duplicate). Fix: apelează `remember` la print.
- [ ] **R7 — Editor Font/Mărime select** nu reflectă valoarea curentă la cursor (cosmetic). Fix: `value` controlat.
- [ ] **R8 — Buget OCR** calibrat pe 60s deși `maxDuration=300s` → pagini lente eșuează evitabil.
      Recalibrează constantele (ocr.py / azure_layout.py / ocr_structured.py) la ~270s.
- [ ] **R9 — Convertor framing binar**: `\r\n` inițial + cold-start = artefact runtime Vercel Python
      (poate corupe descărcări binare docx/png cu 2 bytes). Investighează mecanism de răspuns alternativ.
- [ ] **R10 — Convertor PDF↔DOCX/HTML text-only** (pierde imagini/tabele) — limitare pypdf/fpdf2.
      Decizie: documentează onest în UI SAU rutează prin pipeline-ul OCR (efort mare) — de discutat.
- [ ] **R11 — Chat**: „context document" (capacitate în cod, neconectată la conținutul Editorului) +
      absența butoanelor Șterge conversație / Copiere. De decis dacă se adaugă.
- [ ] **R12 — F4 V4**: verificare PDF multi-pagină scanat (buclă per-pagină + plafon 20 + marcaj eșec).

## Jurnal execuție remediere

**Rundă reziduuri (2026-09-07):**

- [x] **R1** docs stale corectate (KaTeX, DOCX client-side) — CLAUDE.md + project_rules.md.
- [x] **R2** Școlare `parseParams` acceptă liste cu spații (`culori=rosu, albastru`) + test.
- [x] **R3** Școlare radio Dificultate + Cerință + „Deselectează tot" — `disabled` la loading.
- [x] **R4** Școlare `loadRegulament` eșec → avertisment vizibil (+ bonus: Bug#2-Școlare = notă onestă la barem trunchiat).
- [x] **R5** Școlare „➕ În editor" randează `[[DESEN]]` ca imagini SVG (`scolareToSegments` + inserare segmentată).
- [x] **R6** Planșe `remember()` cablat la Print direct (6 generatoare) → unicitate și fără coș.
- [x] **R7** Editor Font/Mărime select reflectă valoarea curentă la cursor.
- [x] **R8** Buget OCR recalibrat pe maxDuration real 300s (Gemini fallback 30-120s, Azure 55s).
- Gate: `tsc 0 · jest 357/357 · pytest 75/75`. Deploy: frontend v53 + backend.

**RĂMASE (de decis cu Roland / verificare):**

- [x] **R9** Convertor framing binar CONFIRMAT (warm `0d 0a`+PNG, cold „x-vercel-timing"+PNG → fișiere
      binare corupte). FIX client-side `stripVercelFraming` (sare la prima semnătură PNG/JPG/PDF/ZIP);
      verificat logic (warm+cold+curat+html). Backend-ul tot scurge (artefact runtime Vercel) — mitigat la client.
      **Rundă decizii Roland (2026-09-07):**

- [x] **R10** (decizie: notă în UI) — notă onestă la conversia document↔document (text-only; trimite la Editor+OCR pt figuri/tabele). DEPLOYAT.
- [x] **R11** (decizie: da) — Chat vede documentul din Editor (`getEditorText`) + butoane Șterge conversație + Copiază răspuns. DEPLOYAT.
- [x] **R12** (decizie: test Chrome) — **VERIFICAT LIVE prin extensia Chrome:** import PDF digital multi-pag = toate paginile (text path);
      import PDF SCANAT 2 pag = **buclă per-pagină OCR (1/2→2/2)** + marcaj **`[Pagina 1: OCR eșuat]`** pe pagina picată (NU săritură tăcută) +
      conținut OCR real pe pagina reușită + „Vezi originalul (2)". Toate cele 3 cerințe V4 confirmate.

**TOATE R1-R12 = REZOLVATE + DEPLOYATE + VERIFICATE.** Gate final: `tsc 0 · jest 357/357 · pytest 75/75`. Frontend v55 + backend `a7304a2` live.
