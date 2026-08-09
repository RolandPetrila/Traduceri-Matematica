# Sistem Traduceri Matematica — CLAUDE.md

# Versiune: 4.2 | Data: 2026-08-10 (curatare documentatie stale — modul Traduceri retras din UI la F7, iframe /asistent retras, model OCR actualizat)

## Overview

Aplicatie web (PWA) centrata pe matematica. Utilizator principal: Cristina (profesoara de matematica la sectia slovaca).
Flow unic (livrat prin modulul Editor, nu un tab „Traduceri" separat — vezi §Module):
Import fisier in Editor (rasterizare pdf.js in browser pt PDF) → Gemini OCR per-pagina (text + bbox figuri + LaTeX)
→ continut editabil in editorul TipTap → Traducere ON-DEMAND prin switch de limba RO|SK|EN|DE (F8, doar textul;
elementele matematice raman intacte, cache persistent per limba) → Editare live persistenta → Export PDF/DOCX/HTML.

## Status

- **Faza curenta**: v4.0 — LIVE pe Vercel + Supabase (migrat integral de pe Render; fara cold-start/keep-alive)
- **Progres**: Vezi `docs/PLAN_MASTER.md` — **SURSA UNICA de adevar** (din 2026-07-30, prin audit in cod). Cele 11 planuri vechi au fost STERSE (2026-07-30, §11 din MASTER); cele 9 tracked sunt recuperabile din git la `54fac8f`.
- **Deploy tinta**: Vercel (frontend + API Python serverless) + Supabase (log-uri). Free tier.
  - Domeniile finale se seteaza in env Vercel (`NEXT_PUBLIC_API_URL`, `ALLOWED_ORIGIN`).
  - Deploy real = confirmare explicita de la Roland (linkare conturi + env vars).
- **Ultima sesiune**: vezi `docs/HANDOFF_SESIUNE.md` (intrarea de sus, „REIA DE AICI") + `docs/PLAN_MASTER.md` §CURENT — starea volatilă (versiune PROD, coadă module) NU se listează aici intenționat, driftează.

## PRIMA ACTIUNE LA SESIUNE NOUA

0. **Citeste `docs/HANDOFF_SESIUNE.md`** — starea curenta + prompt de reluare + context operational (URL canonic, deploy, testare mobil). Apoi planul ACTIV din `docs/PLAN_*.md`. (Vezi **R-HANDOFF** in `.claude/rules/project_rules.md`.)
1. Citeste `docs/PLAN_MASTER.md` — **SURSA UNICA** de adevar (cerintele R1-R4, securitate, regresii, backlog, reguli de execuzie). Planurile vechi sunt stale.
2. Citeste `99_Plan_vs_Audit/PLAN_DECISIONS.md` — log decizii
3. Citeste `.claude/memory/*` si `.claude/rules/project_rules.md`
4. Continua cu primul task [ ] nemarcat din planul activ
5. **Dupa FIECARE faza/livrabil (R-HANDOFF):** actualizeaza la zi `docs/HANDOFF_SESIUNE.md` + planul (bifeaza [x] cu data) + memoria; commit/push (deploy = outward-facing, cu confirmare)

## Stack v4.0

- Frontend: Next.js 15 + Tailwind CSS + TypeScript (deploy Vercel)
- Backend: Python serverless stdlib (`api/*.py`, handlere Vercel) + shared lib (`api/lib/`) — apeluri urllib, fara framework
- AI OCR: Gemini 3.6 Flash → 3.5 Flash-Lite → 2.5 Flash (JSON mode; `gemini-2.5-pro` scos din lanț 2026-08-09, devenit paid-only) → fallback Mistral OCR — text + bbox figuri
- AI Traducere: DeepL Free (principal) → NLLB / OpenRouter / Gemini / Groq (lanturi fallback)
- Figuri: crop bbox din imaginea originala (Pillow)
- Rasterizare PDF: in browser cu pdf.js (o pagina/invocare → procesare per-pagina, comod sub `maxDuration` 300s)
- Log-uri + coduri eroare: Supabase (tabele `logs`, `gemini_counter`), cross-device
- Deploy: Vercel (auto-deploy din GitHub, free) + Supabase (free)
- Dezvoltare locala: `dev_server.py` + `DEV_LOCAL.bat` (emuleaza rutarea Vercel — DOAR local)

## Key Files

- `docs/PLAN_MASTER.md` — **SURSA UNICA** de adevar (tracking [ ]/[x]) · `docs/PROMPT_SESIUNE_NOUA.md` — prompt de reluare direct executabil
- `99_Plan_vs_Audit/PLAN_DECISIONS.md` — log decizii tehnice (backlog/imbunatatiri = acum in `docs/PLAN_MASTER.md` §7)
- `vercel.json` — config functii Python (maxDuration 300s)
- `supabase/schema.sql` — referinta tabele Supabase (logs + contoare)
- `config/error_codes.json` — coduri de eroare (`E-<ARIE>-<NNN>`)
- `api/ocr.py` — OCR o pagina (Gemini JSON, Pro→Flash fallback)
- `api/translate_text.py` — traducere text on-demand (switch limba)
- `api/lib/ocr_structured.py` — OCR Gemini JSON mode
- `api/lib/html_builder.py` — constructor HTML A4 din JSON structurat
- `api/lib/math_protect.py` — protectie formule la traducere
- `api/lib/translation_router.py` — provideri traducere (DeepL/Gemini/Groq/NLLB/OpenRouter)
- `api/lib/supabase_client.py` — wrapper Supabase (log-uri + contor Gemini)
- `frontend/src/components/editor/LanguageSwitch.tsx` + `editor-translate.ts`/`editor-translate-state.tsx` — F8, switch de limba RO|SK|EN|DE in editor (inlocuieste vechiul viewer 3 pasi, retras la F7)
- `frontend/src/lib/monitoring.ts` — logging + coduri eroare (client)

## Conventions

- Limba interfata/documentatie: ROMANA
- Limba cod/comentarii: ENGLEZA
- API keys: doar in .env / env Vercel, niciodata in cod
- Tema UI: tabla verde (#2d5016) + text creta (alb/galben); butoane vizibile (contrast WCAG AA)
- Servicii: GRATUITE prioritar (DeepL free, Gemini free, Vercel Hobby, Supabase free)
- LaTeX: protejat cu placeholders la traducere, randat cu MathJax (SVG vectorial)
- Figuri: crop bbox din original (Pillow)
- Editare: contentEditable persistat in cacheRef (supravietuieste switch limba + export)
- Serverless: procesare grea per-pagina (limita `maxDuration` 300s pe Hobby, setat in vercel.json — per-pagina ramane buna practica); fara stare in memorie intre invocari (contoare in Supabase)
- Commit/push: dupa modificari; deploy real doar cu confirmare (outward-facing)

## Flow UNIC traducere — livrat prin Editor + F8 (2 stări, nu 3 pași separați)

> Metoda originală era 3 pași (Original read-only → RO → tradus, tab „Traduceri" dedicat). Pasul
> „Original read-only" a dispărut (F7/G4) — originalul rămâne accesibil ca thumbnail+lightbox de
> verificare (`SourcePreview`), nu ca pas de flux separat. Vezi `docs/PLAN_MASTER.md` §9 pt istoric.

```
[IMPORT] Cristina incarca fisier (JPEG/PDF/DOCX) in Editor
  |  (PDF → rasterizat in browser cu pdf.js, o pagina/PNG; thumbnail-uri sursă păstrate pt verificare)
  v
[CONTINUT] Reconstructie OCR per-pagina (Gemini: text + bbox figuri + LaTeX), EDITABIL + persistent,
           limba curentă = limba documentului importat
  v
[TRADUCERE F8] Switch de limbă on-demand (buton RO|SK|EN|DE) — traduce doar textul (DeepL implicit),
               EDITABIL + persistent, cache per limbă (reveniri instant, fără re-consum cotă).
               Figuri + formule LaTeX + layout = INTACTE.
               Export: PDF (print vectorial) / DOCX (backend) / HTML — din continut EDITAT.
```

### Butoane in toolbar: `RO` | `SK` | `EN` | `DE` (F8, `LanguageSwitch.tsx`)

### Editare: continutul e editabil (contentEditable, persistat) in orice limbă selectată

### Ce se traduce vs ce ramane intact (la switch RO → SK)

| Element                       | Limba RO (import)  | Limba SK (F8)    |
| ----------------------------- | ------------------ | ---------------- |
| Text paragraf/titluri         | Original, editabil | TRADUS, editabil |
| Formule LaTeX                 | INTACT             | INTACT           |
| Figuri (crop bbox)            | INTACT             | INTACT           |
| Structura (ol/ul) + Layout A4 | INTACT             | INTACT           |

## Module (7 total)

> Modulul „Traduceri" original (viewer 3 pași: Original→RO→SK, tab dedicat) a fost RETRAS din UI la F7
> (commit `2891d00`) — funcționalitatea a fost absorbită de Editor: import+OCR la import, traducere
> on-demand prin F8 (switch limbă RO|SK|EN|DE, cache persistent). Backend-ul de translate/OCR a rămas,
> doar tab-ul separat a dispărut. NU re-propune reintroducerea lui fără cerere explicită.

1. **Convertor fisiere** — functional, de polish
2. **Editor matematic** (gimnaziu+liceu) — LIVRAT: **nativ TipTap** (iframe-ul vechi retras la F6), tema verde, quickbar + search matematic, 334+ formule V-XII; include import/OCR + traducere on-demand F8 (fostul modul Traduceri)
3. **Chat AI** — panou nativ (`ChatPanel.tsx`), tab id „asistent" păstrat doar pt continuitatea `localStorage["activeTab"]` (fostul iframe `/asistent` a fost șters la /improve #16, 2026-08-07)
4. **Calculator · Corectare-Generare teste (Teste)** — LIVRATE + DEPLOYATE (v30/v31/v32, 2026-08-04)
5. **Planșe** (fișe interactive offline) — LIVRAT: 6/6 generatoare (labirint/căutare/unește/dictare/numere/integramă) + coș multi-fișă (P4); integramă multi-formă + varietate extinsă (v39-v41)
6. **Școlare 🌐** (fișe curriculare AI, grădiniță→liceu) — 112/112 noduri (grădiniță→liceu) grounded, deployat v49; motor de desen determinist (grădiniță+primar cl.0-1) deployat 2026-08-09

## Important

- Fara autentificare — acces direct (inclusiv Supabase: fara auth, RLS strict)
- PWA instalabil pe Windows, Android, iPhone
- Utilizator principal: Cristina; owner proiect: Roland (petrilarolly@gmail.com)
- Limbi: RO -> SK (principal), RO -> EN (secundar), DE (germana, ex. rapoarte/documente oficiale), extensibil
- Toate serviciile: GRATUIT, fara exceptie
- Editor matematic: NATIV TipTap (iframe-ul vechi retras la F6). Chat AI: panou nativ (iframe-ul `/asistent` retras la /improve #16, 2026-08-07). Vezi `docs/PLAN_MASTER.md`
