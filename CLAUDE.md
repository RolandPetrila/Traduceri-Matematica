# Sistem Traduceri Matematica — CLAUDE.md

## Overview
Aplicatie web (PWA) pentru traducerea documentelor de matematica din romana in slovaca/engleza.
Pipeline: Foto -> AI Vision OCR -> Markdown+LaTeX+SVG -> Traducere AI -> HTML A4 printabil.

## Status
- **Faza curenta**: Structura completa creata, urmeaza instalare dependinte + testare
- **Progres**: 67 fisiere create cu cod functional (frontend + backend + config + PWA)
- **Urmatorul pas**: npm install + pip install, testare locala, git init + push GitHub

## PRIMA ACTIUNE LA SESIUNE NOUA
1. Citeste `CHECKPOINT.md` — contine TODO complet cu 5 faze si toate detaliile
2. Citeste `Cerinte_Roland.md` — 93 cerinte confirmate
3. Daca exista fisier de chat exportat (JSON/JSONL) — citeste-l pentru context complet
4. Incepe cu FAZA 1.1 din CHECKPOINT.md (instalare dependinte)

## Stack
- Frontend: Next.js 14 + Tailwind CSS + shadcn/ui
- Backend: FastAPI (Python) — API routes in frontend/src/app/api/ pentru Vercel
- AI primar: Google Gemini Free Tier (vision + traducere)
- AI fallback: Groq (traducere), Mistral/Pixtral (vision)
- Deploy: Vercel (auto-deploy din GitHub)

## Key Files
- `Cerinte_Roland.md` — document complet cerinte (93 cerinte)
- `config/languages.json` — limbi suportate si configurari
- `frontend/` — Next.js app cu tema "tabla verde + creta"
- `backend/` — Logica Python (OCR, traducere, SVG, conversii)
- `data/dictionary/` — dictionar terminologic persistent
- `data/history/` — istoric rulari

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
