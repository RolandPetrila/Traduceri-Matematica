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

- [ ] **V3** (§8): OCR real end-to-end din browser pe prod cu poză de manual (math)
- [ ] **V4** (§8): PDF multi-pagină scanat (buclă per-pagină + plafon 20 + marcaj `[Pagina N: OCR eșuat]`)
- [ ] Gol R7.4 `[~]`: calea PDF-cu-text-BUN (`rawTextToBlocks`) nu extrage figuri
- [ ] Gol R3.9 ETAPA B: liste numerotate DOCX → paragrafe; tabele → aplatizate
- [ ] Remediază ce se poate determinist; ce rămâne perceptual → boundary uman (F6)

### F5 — Audit per-modul: „toate rulările fără eroare, pe fiecare modul"

> Sistematic, cu dovezi `file:line`; deploy incremental după fiecare grup verde.

- [ ] Convertor · Editor (F1-F9) · Chat AI · Calculator · Teste · Planșe (6/6) · Școlare · Import/OCR
- [ ] Pentru fiecare: rulare reală a fluxurilor principale + fix bug-uri găsite + gate + deploy

### F6 — Boundary uman (NU se automatizează — livrat ca listă cu dovezi, nu ascuns în „funcționează")

- [ ] **V2** — corectitudinea matematică/notațională a 334+ formule (judecata Cristinei)
- [ ] **V3/V4** — verificarea perceptuală finală export/OCR (ochi uman)
- [ ] **Școlare** — validitatea curriculară per programă (Cristina/Roland)

---

## Ordine (advisor): gate real ✅ → log-uri ✅ → deploy #1+#2 → probă provideri → OCR V3/V4 → audit module
