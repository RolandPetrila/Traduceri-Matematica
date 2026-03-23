# Sistem Traduceri Matematica — CLAUDE.md

## Overview
Aplicatie web (PWA) pentru traducerea documentelor de matematica din romana in slovaca/engleza.
Pipeline: Foto -> AI Vision OCR -> Markdown+LaTeX+SVG -> Traducere AI -> HTML A4 printabil.

## Status
- **Faza curenta**: FAZA 1+2+3 COMPLETE — LIVE pe https://traduceri-matematica.vercel.app
- **Progres**: 95+ fisiere, deploy Vercel LIVE, Python health OK, frontend OK
- **Urmatorul pas**: FAZA 4 — imbunatatiri (Istoric, Editor avansat, Dictionar, E2E testing)
- **Ultima sesiune**: 2026-03-23

## PRIMA ACTIUNE LA SESIUNE NOUA
1. Citeste `CHECKPOINT.md` — contine TODO complet cu progres live (checkbox-uri)
2. Citeste `TODO.md` — contine amanari, idei noi, known issues
3. Citeste `Cerinte_Roland.md` — 93 cerinte confirmate
4. Continua cu primul task nemarcat din CHECKPOINT.md

## Stack
- Frontend: Next.js 14 + Tailwind CSS + shadcn/ui
- Backend: FastAPI (Python) — API routes in frontend/src/app/api/ pentru Vercel
- AI primar: Google Gemini Free Tier (vision + traducere)
- AI fallback: Groq (traducere), Mistral/Pixtral (vision)
- Deploy: Vercel (auto-deploy din GitHub)

## Key Files
- `CHECKPOINT.md` — plan master cu progres live (checkbox-uri)
- `TODO.md` — amanari, idei noi, known issues
- `Cerinte_Roland.md` — document complet cerinte (93 cerinte)
- `config/languages.json` — limbi suportate si configurari
- `frontend/` — Next.js app cu tema "tabla verde + creta"
- `backend/` — Logica Python (OCR, traducere, SVG, conversii)
- `api/` — Vercel Python serverless functions (translate, health)
- `data/logs/` — loguri erori client-side (JSONL)
- `frontend/src/app/diagnostics/` — pagina diagnosticare erori (/diagnostics)

## Conventions
- Limba interfata/documentatie: ROMANA
- Limba cod/comentarii: ENGLEZA
- API keys: doar in .env, niciodata in cod
- Tema UI: tabla verde (#2d5016) + text creta (alb/galben)
- Toate serviciile: GRATUITE (zero costuri)
- LaTeX: protejat cu placeholders inainte de procesare Markdown
- SVG: wrappat in <div> pentru passthrough Markdown

## Important
- Proiectul originar CLI: C:\Users\ALIENWARE\Desktop\Cristina\Extragere_Traducere_HTML_Codex
- Scripturile Python de acolo se reutilizeaza/adapteaza
- Fara autentificare — acces direct
- PWA instalabil pe Windows, Android, iPhone
