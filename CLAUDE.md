# Sistem Traduceri Matematica — CLAUDE.md

# Versiune: 4.0 | Data: 2026-07-07

## Overview

Aplicatie web (PWA) centrata pe matematica. Utilizator principal: Cristina (profesoara de matematica la sectia slovaca).
Flow unic: Upload fisier → (rasterizare pdf.js in browser) → Gemini OCR per-pagina (text + bbox figuri + LaTeX)
→ Afisare in pagina web ca original (A4, paginat) → Traducere ON-DEMAND prin switch limba (doar textul;
elementele matematice raman intacte) → Editare live persistenta → Export PDF/DOCX/HTML.

## Status

- **Faza curenta**: v4.0 — LIVE pe Vercel + Supabase (migrat integral de pe Render; fara cold-start/keep-alive)
- **Progres**: Vezi `docs/PLAN_MASTER.md` — **SURSA UNICA de adevar** (din 2026-07-30, prin audit in cod). Cele 11 planuri vechi au fost STERSE (2026-07-30, §11 din MASTER); cele 9 tracked sunt recuperabile din git la `54fac8f`.
- **Deploy tinta**: Vercel (frontend + API Python serverless) + Supabase (log-uri). Free tier.
  - Domeniile finale se seteaza in env Vercel (`NEXT_PUBLIC_API_URL`, `ALLOWED_ORIGIN`).
  - Deploy real = confirmare explicita de la Roland (linkare conturi + env vars).
- **Ultima sesiune**: 2026-07-11 — Overlay „document fidel" LIVE (pixel-perfect PDF text) + fix SEV1 CORS (traducere browser reparata: text/plain) + naming export D/G. Snapshot: `~/.claude/context-snapshots/Traduceri-Matematica-checkpoint-2026-07-11/`

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
- AI OCR: Gemini 2.5 Flash → Flash-Lite → Pro (JSON mode) → fallback Mistral OCR — text + bbox figuri
- AI Traducere: DeepL Free (principal) → NLLB / OpenRouter / Gemini / Groq (lanturi fallback)
- Figuri: crop bbox din imaginea originala (Pillow)
- Rasterizare PDF: in browser cu pdf.js (o pagina/invocare → respecta 60s serverless)
- Log-uri + coduri eroare: Supabase (tabele `logs`, `gemini_counter`), cross-device
- Deploy: Vercel (auto-deploy din GitHub, free) + Supabase (free)
- Dezvoltare locala: `dev_server.py` + `DEV_LOCAL.bat` (emuleaza rutarea Vercel — DOAR local)

## Key Files

- `docs/PLAN_MASTER.md` — **SURSA UNICA** de adevar (tracking [ ]/[x]) · `docs/PROMPT_SESIUNE_NOUA.md` — prompt de reluare direct executabil
- `99_Plan_vs_Audit/PLAN_DECISIONS.md` — log decizii tehnice (backlog/imbunatatiri = acum in `docs/PLAN_MASTER.md` §7)
- `vercel.json` — config functii Python (maxDuration 60s)
- `supabase/schema.sql` — referinta tabele Supabase (logs + contoare)
- `config/languages.json` — limbi suportate (RO/SK/EN/DE + extensibil)
- `config/error_codes.json` — coduri de eroare (`E-<ARIE>-<NNN>`)
- `config/math_terms_ro_sk.json` — dictionar RO-SK
- `api/ocr.py` — OCR o pagina (Gemini JSON, Pro→Flash fallback)
- `api/translate_text.py` — traducere text on-demand (switch limba)
- `api/lib/ocr_structured.py` — OCR Gemini JSON mode
- `api/lib/html_builder.py` — constructor HTML A4 din JSON structurat
- `api/lib/math_protect.py` — protectie formule la traducere
- `api/lib/translation_router.py` — provideri traducere (DeepL/Gemini/Groq/NLLB/OpenRouter)
- `api/lib/supabase_client.py` — wrapper Supabase (log-uri + contor Gemini)
- `frontend/src/components/traduceri/DocumentViewer.tsx` — viewer 3 pasi + editare + export
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
- Serverless: procesare grea per-pagina (limita 60s); fara stare in memorie intre invocari (contoare in Supabase)
- Commit/push: dupa modificari; deploy real doar cu confirmare (outward-facing)

## Flow UNIC traducere — Metoda unificata 3 pasi (definitiva)

```
[UPLOAD] Cristina incarca fisier (JPEG/PDF/DOCX)
  |  (PDF → rasterizat in browser cu pdf.js, o pagina/PNG)
  v
[PAS 1] ORIGINAL — Imaginea/fisierul incarcat, afisat ca atare (100% fidel, read-only)
  v
[PAS 2] HTML RO — Reconstructie OCR per-pagina (Gemini: text + bbox figuri + LaTeX), EDITABIL + persistent
  v
[PAS 3] HTML TRADUS — Traducere on-demand (DeepL), EDITABIL + persistent
          Doar textul tradus (SK/EN). Figuri + formule LaTeX + layout = INTACTE.
          Export: PDF (print vectorial) / DOCX (backend) / HTML — din continut EDITAT.
```

### Butoane in toolbar: `Original` | `RO` | `SK` | `EN` + navigare pagina 1/N

### Editare: pasii 2 si 3 sunt editabili (contentEditable, persistat) — pasul 1 e read-only

### Ce se traduce vs ce ramane intact (la switch RO → SK)

| Element                       | Pas 2 (RO)         | Pas 3 (SK)       |
| ----------------------------- | ------------------ | ---------------- |
| Text paragraf/titluri         | Original, editabil | TRADUS, editabil |
| Formule LaTeX                 | INTACT             | INTACT           |
| Figuri (crop bbox)            | INTACT             | INTACT           |
| Structura (ol/ul) + Layout A4 | INTACT             | INTACT           |

## Module planificate (6+ total)

1. **Traduceri** — prioritar, in executie
2. **Convertor fisiere** — functional, de polish
3. **Editor matematic** (gimnaziu+liceu) — INTEGRAT (Faza G): iframe `/editor`, tema verde, quickbar + search matematic
4. **Asistent Text AI** — INTEGRAT (Faza G): iframe `/asistent` (drop-in), proxy AI same-origin (`/api/proxy`)
5. **Chat AI / Calculator / Corectare-Generare teste** — schitate

## Important

- Fara autentificare — acces direct (inclusiv Supabase: fara auth, RLS strict)
- PWA instalabil pe Windows, Android, iPhone
- Utilizator principal: Cristina; owner proiect: Roland (petrilarolly@gmail.com)
- Limbi: RO -> SK (principal), RO -> EN (secundar), DE (germana, ex. rapoarte/documente oficiale), extensibil
- Toate serviciile: GRATUIT, fara exceptie
- Editor matematic: NATIV TipTap (iframe-ul vechi retras la F6). Asistent_Text_AI: modul iframe. Vezi `docs/PLAN_MASTER.md`
