# Sistem Traduceri Matematica — CLAUDE.md

## Overview
Aplicatie web (PWA) pentru traducerea documentelor de matematica din romana in slovaca/engleza.
Pipeline: Foto -> AI Vision OCR -> Markdown+LaTeX+SVG -> Traducere AI -> HTML A4 printabil.

## Status
- **Faza curenta**: POST-AUDIT REMEDIATION COMPLETE — LIVE pe https://traduceri-matematica.vercel.app
- **Progres**: Audit 62/100 → ~82/100, 19 din 25 probleme rezolvate, cod mort 43% → ~5%
- **Urmatorul pas**: Testare pe Vercel live (PDF Edit, Dictionary, Split PDF, DOCX download)
- **Ultima sesiune**: 2026-03-24 (audit remediation: 5 sprint-uri, 45 fisiere, -2084/+1029 linii)

## PRIMA ACTIUNE LA SESIUNE NOUA
1. Citeste `CHECKPOINT.md` — contine TODO complet cu progres live (checkbox-uri)
2. Citeste `TODO.md` — contine amanari, idei noi, known issues
3. Citeste `Cerinte_Roland.md` — 119 cerinte (v2.0)
4. Continua cu primul task nemarcat din CHECKPOINT.md

## Stack
- Frontend: Next.js 14 + Tailwind CSS + shadcn/ui
- Backend: Python serverless — API routes in api/ pentru Vercel
- AI primar: Google Gemini Free Tier (vision + traducere)
- AI fallback: Groq (traducere), Mistral/Pixtral (OCR fallback)
- Deploy: Vercel (auto-deploy din GitHub)

## Key Files
- `CHECKPOINT.md` — plan master cu progres live (checkbox-uri)
- `PLAN_PROIECT.md` — document formal de planificare (arhitectura, pipeline, riscuri)
- `TODO.md` — amanari, idei noi, known issues
- `Cerinte_Roland.md` — document complet cerinte (93 cerinte)
- `config/languages.json` — limbi suportate si configurari
- `config/math_terms_ro_sk.json` — dictionar pre-populat RO-SK (100 termeni)
- `config/math_terms_ro_en.json` — dictionar pre-populat RO-EN (100 termeni)
- `frontend/` — Next.js app cu tema "tabla verde + creta"
- `api/` — Vercel Python serverless functions (translate, convert, health)
- `AUDIT_FULL_v2_RAPORT.md` — raport audit complet cu scor si probleme
- `tests/test_e2e.py` — teste E2E cu imagini reale
- `STRUCTURA_MODULE.md` — harta completa module/functii cu descriere proces executie
- `start.html` — fisier pentru deschidere rapida aplicatie cu dublu-click
- `frontend/src/app/diagnostics/` — pagina diagnosticare completa (erori + actiuni + info)

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
