# Sistem Traduceri Matematica — CLAUDE.md
# Versiune: 2.0 | Data: 2026-03-24

## Overview
Aplicatie web (PWA) pentru traducerea documentelor de matematica din romana in slovaca/engleza.
Pipeline v2: Input (JPEG/PDF/DOCX) → OCR structurat (Gemini) → Crop figuri (Pillow) → Traducere (DeepL/Gemini) → HTML A4 printabil.

## Status
- **Faza curenta**: REFACTORIZARE v2.0 — Sprint 2.5 (migrare Render)
- **Progres**: Vezi `PLAN_IMPLEMENTARE_v2.md` pentru tracking complet
- **Deploy**: LIVE pe Render (migrare de la Vercel)
  - Frontend: https://traduceri-matematica-7sh7.onrender.com
  - API: https://traduceri-api.onrender.com
- **Ultima sesiune**: 2026-03-25

## PRIMA ACTIUNE LA SESIUNE NOUA
1. Citeste `PLAN_IMPLEMENTARE_v2.md` — sursa UNICA de adevar pt progres
2. Citeste `CHECKPOINT.md` — context general
3. Continua cu primul task [ ] nemarcat din PLAN_IMPLEMENTARE_v2.md
4. Dupa ORICE implementare: marcheaza [x] cu data in plan + commit + push

## Stack v2
- Frontend: Next.js 14 + Tailwind CSS
- Backend: Python serverless (api/) + shared lib (api/lib/)
- AI OCR: Gemini 2.5 Flash (JSON mode, gratuit)
- AI Traducere: DeepL Free (principal) + Gemini (fallback) — selectabil din UI
- AI Fallback: Groq Llama 3.3 (traducere), Mistral Pixtral (OCR)
- AI Premium: Claude Sonnet/Opus (suspendat — activare la cerere)
- Figure: Crop din original cu Pillow (nu SVG generat)
- Deploy: Render (auto-deploy din GitHub, free tier, Frankfurt)
- Monitoring: Feedback loop complet (10 componente)

## Key Files
- `PLAN_IMPLEMENTARE_v2.md` — **SURSA UNICA** de adevar (tracking [ ]/[x])
- `GHID_UTILIZARE_ROLAND.md` — ghid testare per sprint
- `config/languages.json` — limbi suportate (RO/SK/EN + extensibil)
- `config/tabs.json` — tab-uri dinamice (extensibil)
- `config/math_terms_ro_sk.json` — dictionar RO-SK (100 termeni)
- `api/` — Python serverless + api/lib/ (module partajate)
- `frontend/` — Next.js app cu tema "tabla verde + creta"
- `docs/` — documentatie (CHANGELOG, ghiduri)
- `Arhiva_Proiect_Vechi/` — documente din v1 (arhivate)
- `data/logs/` — loguri feedback loop
- `dev_server.py` + `DEV_LOCAL.bat` — dezvoltare locala

## Conventions
- Limba interfata/documentatie: ROMANA
- Limba cod/comentarii: ENGLEZA
- API keys: doar in .env, niciodata in cod
- Tema UI: tabla verde (#2d5016) + text creta (alb/galben)
- Servicii: GRATUITE prioritar (DeepL free, Gemini free)
- LaTeX: protejat cu placeholders inainte de traducere
- Figuri: crop din original (nu SVG generat de AI)
- Dupa ORICE modificare: commit + push automat (Vercel deploy)

## Pipeline v2 (multi-pas)
```
Input (JPEG/PDF/DOCX)
  → [1] Gemini OCR structurat (JSON mode) → text + figuri bbox
  → [2] Pillow crop figuri + background removal → alb
  → [3] DeepL/Gemini traducere (selectabil) → text tradus
  → [4] build_html() + MathJax → HTML A4 printabil
```

## Proiecte referinta (reutilizare cod)
- `C:\Users\ALIENWARE\platform-predare\` — LanguageToggle, traducere JSON, cache Blob
- `C:\Users\ALIENWARE\Desktop\Cristina\Translator_Portable\` — DeepL 2 keys, AzureTranslator, DOCX paragraph translate
- `C:\Users\ALIENWARE\Desktop\Cristina\Extragere_Traducere_HTML_Codex\` — pipeline CLI original

## Important
- Fara autentificare — acces direct
- PWA instalabil pe Windows, Android, iPhone
- Utilizator principal: Cristina (profesoara matematica)
- Limbi: RO → SK (principal), RO → EN (secundar), extensibil
