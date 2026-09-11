# PLAN PROGRAM GENERAL — „Totul funcțional + mereu live" (2026-09-07)

> **Cerere Roland (2026-09-07):** „implementarea tuturor celor stabilite încât la final să funcționeze
> toate rulările din aplicație fără eroare, pe fiecare modul; OCR avansat să păstreze layout-ul fidel,
> focusat pe matematică; toate testele, fișele de mate, generările etc. să fie complete; rezolvată
> problema atingerii limitelor de utilizare a AI-urilor; actualizează în permanență documentația și
> sincronizează automat cu cloud prin git commit/push; întotdeauna live."
>
> **Autorizare deploy:** „întotdeauna live doresc aplicația!" + „sincronizeze automat prin git commit
> push" = confirmare permanentă R-DEPLOY pt acest program → commit+push+deploy după FIECARE fază verde,
> fără a re-cere confirmarea (feedback_auto_push). **NU** cablez git→Vercel auto-deploy-on-push (ar rata
> bump-ul `CACHE_VERSION` + verificarea pe alias pe un app folosit de un profesor real; deploy-ul rămâne
> prin CLI, deliberat — §CURENT PLAN_MASTER).
>
> **Direcție OCR (fixată de reguli, nu de întrebare):** R-EDIT (conținut editabil în TipTap) + R-EXPORT
> (export din `editor.getHTML()`) EXCLUD un overlay pixel-perfect la import. „Layout fidel" = închiderea
> golurilor din reconstrucția STRUCTURATĂ (tabele/figuri/ordine citire/math), măsurat pe fișiere reale.

## Reguli de execuție (la fiecare fază)

- Gate REAL după fiecare item: `npm run typecheck` (0) · `npm run test` (verde) · `npm run build` (OK)
  · `pytest` (backend). **Fără mascare pipe** — citește `EXIT_*` din output, nu exit-ul harness.
- Verificare LIVE pe prod (alias, nu URL de deployment); atenție la cele 2 proiecte Vercel frontend.
- Bump `CACHE_VERSION` în `frontend/public/sw.js` la fiecare deploy frontend (altfel telefonul ia bundle vechi).
- R-HANDOFF: după fiecare fază → HANDOFF + acest plan (bifează) + memoria + commit/push.
- Onestitate (R3): ce n-a fost rulat/verificat vizual = declarat explicit, nu „end-to-end".

---

## FAZE

### F0 — Fundație gate ✅ FĂCUT (2026-09-07)

- [x] `node_modules` lipsea (checkout nou laptop Dell) → `npm install` (804 pachete, exit 0)
- [x] Gate real frontend: **tsc 0 · jest 356/356** (rulate real; gate-ul anterior era fals-verde din pipe-masking)
- [x] `next build` OK (10/10 rute) → **gate frontend REAL VERDE: tsc 0 · jest 356/356 · build OK**
- [x] Mediu Python `.venv` + `pytest` → **backend gate: pytest 67/67**. Baseline complet: tsc 0 · jest 356/356 · build OK · pytest 67/67

### F1 — R-DIAG-AUTO (log-uri prod) ✅ FĂCUT (2026-09-07)

- [x] Interogat Supabase `logs` (tenders-ro `ywlykyyivthpsxfkdwzl`), nivele lowercase (`error`/`warn`).
- [x] **Fără erori active recurente.** Toate cele reale (E-NET-001 mistral 20s timeout, groq 404,
      E-CONV-001, ∛ metrics) au ÎNCETAT după fix-urile din 08-20 (deci sunt LIVE + funcționează).
      `ResizeObserver loop` ×29 (last 08-03) = zgomot benign. SW-install ×1 (09-03 Firefox desktop) = tranzitoriu.
      Activitate până 09-06 fără erori noi = sănătos.

### F2 — Deploy #1+#2 ✅ DEJA LIVE (descoperit 2026-09-07)

> Lista de deploy-uri Vercel arată `dpl_8eco...` = commit **`63d781e`** (exact #1+#2), READY, target
> production, cel mai recent → aliasul îl servește. Adnotarea „NEDEPLOYAT" din handoff era **stale**
> (scrisă în același commit, înainte de deploy — tiparul din §CURENT PLAN_MASTER).

- [x] #1+#2 confirmat live prin lista de deployment-uri Vercel (63d781e = ultimul prod READY)
- [x] `CACHE_VERSION` v50→v51 bump-uit + committed (`1a0064f`) — se livrează la următorul deploy
- [ ] Probă LIVE comportamentală generare Teste + Școlare (auto-continuare → barem complet) — de făcut la primul deploy

### F3 — Limite AI ✅ CAUZĂ GĂSITĂ + FIX (chat), pending deploy

> **Descoperirea centrală (asta E „atingerea limitelor"):** lanțul de chat era efectiv RUPT — sondă
> directă (`scratchpad/chat_providers_probe.mjs`) → doar Gemini viu. `mistral-large-latest`=403
> tier-locked, groq llama-uri=404 retrase, cerebras 402, sambanova/fireworks/nvidia/scaleway moarte.

- [x] Probă directă a tuturor providerilor free cu cheile reale (nu catalog)
- [x] **Fix lanț chat** (`6e305d6`): gemini→gemini2→**groq(gpt-oss-20b)**→**mistral(small)**→mistral2(small)
      = 3 vendori independenți (Google×2, Groq, Mistral×2) în loc de 1. Gate: tsc 0 · jest 356/356.
- [x] **DEPLOY** ✅ (Roland a permis `Bash(vercel:*)`; `dpl_FzhEaLpZYnd...` READY, alias servește **sw v51**)
- [x] **Verificat LIVE post-deploy** (`provider_health.mjs`): **groq 200** (era 404, model forțat gpt-oss-20b), mistral **429** rate-limit tranzitoriu (NU mai 403 tier-lock) → accesibil. gemini×2 200. **3 vendori vii.**
- [ ] Traducere/OCR: verifică `mistral-ocr-latest` nu e și el tier-locked; restul (Azure 4M/DeepL/Doc Intel) sănătos per inventar
- [ ] (rezervă) Cohere `command-r` viu — cablabil ca al 4-lea vendor dacă se cere mai mult headroom

### F3b — Observabilitate + headroom suplimentar (după deploy-ul fix-ului)

> Riscul rezidual nu e „prea puțini provideri" (acum 3 vendori vii), ci un provider care MOARE tăcut
> în lanț (ca acum). Fixul durabil = observabilitate, nu doar mai multe chei.

- [ ] Sondă periodică / alertă când un provider din lanț devine 4xx (evită „mort tăcut" luni de zile)
- [ ] Observabilitate/hard-cap: `gemini_counter` există în Supabase → expune consum + prag pe /diagnostics
- [ ] (opțional) Cablează Google Translate 1M / Cloudflare Workers AI la traducere dacă proba le confirmă vii

### F4 — OCR fidelitate layout (focus matematică) — MĂSOARĂ apoi remediază

> Golurile sunt deja enumerate; rulez verificările nerulate ca ele să definească munca reală.

- [x] **V3 măsurat + CAUZĂ REALĂ găsită (log-uri prod `traduceri-api`).** ⚠️ **Corecție onestă:** ambele
      mele „constatări" despre figuri (bbox=null ȘI 0 figuri) erau **ARTEFACTE DE SONDĂ** — nu știam că
      `embed_crops_in_sections` înlocuiește `bbox`→`img_b64` după crop. **Figurile FUNCȚIONEAZĂ**: log-urile
  - JSON-ul salvat (run3) arată **6 figuri, fiecare cu `img_b64` = PNG valid**, bbox-uri reale
    (`[CROP] Figure: bbox=(0.15,0.17,...) -> 365x360px`), structură bogată (6 pași, 3 two_column). Deci
    premisa întrebării „investește în figuri" era GREȘITĂ → NU s-a construit merge-ul Azure (ar rezolva
    o non-problemă + risc cotă).
- [x] **Cauza reală a OCR-ului nefidel = HTTP 503.** `gemini-3.6-flash` întorcea **503 „high demand" la
      ~jumătate din cereri**, iar 503 NU declanșa fallback (doar 429/404) → pagina eșua/degenera (run cu 1
      paragraf). **Fix (`c3ecf3b`):** 500/502/503/529 → fallback la modelul următor (3.5-flash-lite →
      2.5-flash → Mistral) + `temperature:0` (taie răspunsurile degenerate). 2 teste noi. pytest 69/69.
- [x] **DEPLOY backend `traduceri-api`** (`6b0b065`) + **verificat LIVE**: log-uri = zid de reușite
      (16-25s, 6 figuri + img_b64 fiecare); direct 3/4 rulări bogate. 2 fix-uri: 503→fallback (`c3ecf3b`) +
      read-timeout→fallback (`6b0b065`) + `.vercelignore` bundle (`860d143`). Reziduu: cold-start Vercel
      (1/4 prima rulare = non-JSON platformă, nu ajunge la handler) — prins de `fetchWithRetry` client (2×5xx).
- [x] **Figuri = confirmat funcționale** (nu era nevoie de Azure-merge; premisa era artefact de sondă).
- [ ] **V4** (§8): PDF multi-pagină scanat (buclă per-pagină + plafon 20 + marcaj `[Pagina N: OCR eșuat]`)
- [ ] Gol R7.4 `[~]`: calea PDF-cu-text-BUN (`rawTextToBlocks`) nu extrage figuri
- [ ] Gol R3.9 ETAPA B: liste numerotate DOCX → paragrafe; tabele → aplatizate
- [ ] Remediază ce se poate determinist; ce rămâne perceptual → boundary uman (F6)

### F5 — Audit „fiecare buton executabil" ✅ FĂCUT (6 module, 6 subagenți + probe live)

> Cerere Roland: auditează fiecare buton prin care se fac execuții + verifică că chiar generează/execută
> comanda reală+completă. Metodă: inventar static per modul (subagenți) + probe LIVE pe prod (endpoint-uri).

**Verdict per modul (butoane executabile):**

- **Editor toolbar/math/insert/find/Ctrl+K:** ~73 ✓ · 2 ⚠ cosmetice (Font/Mărime nu afișează valoarea
  curentă la cursor, dar APLICĂ corect) · 0 ✗.
- **Editor import/export/traducere:** 12+ ✓ toate cablate real (OCR multipart, export PDF vectorial/HTML/DOCX
  client-side, F8 `/api/translate-text`). Verificat live: **translate RO→SK 200, formulă intactă**.
- **Chat AI:** toate ✓ (Trimite/Testează/Continuă/📎OCR/➕editor). Live: groq 200.
- **Calculator:** toate ✓, motor mathjs corect (verificat empiric). **0 bug-uri.**
- **Teste:** flux real ✓; live: **generare 200, finish=STOP, are exerciții + barem = COMPLET**. 3 bug-uri FIXATE (jos).
- **Planșe:** 6/6 generatoare ✓ (toate selectoarele → generare, print, coș). 1 gap: `remember()` cod mort.
- **Școlare:** flux central ✓ (generare reală+completă cu barem, auto-continuare). 5 ⚠ minore.

**FIXATE + DEPLOYATE (commit `c140b5b`):**

- [x] 🔴 **CONVERTOR CRITIC** — nume fișier cu diacritice RO/SK crăpa `send_header` → răspuns HTTP
      dublu/malformat (lovea `Fișă_matematică.pdf` al Cristinei). Fix: Content-Disposition RFC 5987. +5 teste.
      **Verificat LIVE:** `Fișă`/`Skúška` → 200, nume corecte, fără crash.
- [x] **CONVERTOR scurgere antet** (`Access-Control-Expose-Headers` cobora în corp → blob corupt). Fix
      (`ca4892c`): oglindit `_send_json` (Allow-Origin ultimul, fără Expose-Headers/Content-Length manual).
      **Verificat LIVE: `antet_scurs=false`.** Reziduu: `\r\n` inițial + cold-start `x-vercel-timing` =
      artefact runtime Vercel Python (toate endpoint-urile; inofensiv JSON/HTML, poate afecta binar docx/png) —
      logica de conversie corectă, doar framing HTTP; fix complet = alt mecanism răspuns (backlog).
- [x] **TESTE #1** — `continueGenerate`/`continueCorrect` fără try/catch → tab blocat pe „loading". Fix.
- [x] **TESTE #2** — auto-continuare raporta succes fals când o rundă eșua → barem tăiat tăcut. Fix: notă onestă.
- [x] **TESTE #3** — text „[Eroare OCR]" era notat ca lucrarea elevului. Fix: scoate markerele + oprește onest.
- [x] **CONVERTOR** — gardă format lipsă la Compress (.docx → eroare criptică). Fix.

**RĂMAS (⚠ minore/medii — nu butoane rupte; de făcut la cerere/next):**

- [ ] Școlare „➕ În editor" nu randează markerele `[[DESEN]]` (text brut în editor; Print/PDF e OK)
- [ ] Școlare `parseParams` trunchiază `culori=rosu, albastru` la primul spațiu (baloane)
- [ ] Planșe `remember()` = cod mort → Print direct (fără coș) nu dedup-ează
- [ ] Editor Font/Mărime select nu reflectă valoarea curentă (cosmetic)
- [ ] Buget OCR calibrat pe 60s deși `maxDuration=300s` → pagini lente eșuează evitabil (recalibrare 270s)
- [ ] Convertor: PDF↔DOCX/HTML text-only (pierde imagini/tabele) — limitare pypdf/fpdf2, nu bug
- [ ] Docs stale: DOCX „backend" (e client-side), MathJax (e KaTeX)

### F6 — Boundary uman (NU se automatizează — livrat ca listă cu dovezi, nu ascuns în „funcționează")

- [ ] **V2** — corectitudinea matematică/notațională a 334+ formule (judecata Cristinei)
- [ ] **V3/V4** — verificarea perceptuală finală export/OCR (ochi uman)
- [ ] **Școlare** — validitatea curriculară per programă (Cristina/Roland)

---

## Ordine (advisor): gate real ✅ → log-uri ✅ → deploy #1+#2 → probă provideri → OCR V3/V4 → audit module
