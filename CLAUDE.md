# Sistem Traduceri Matematica — CLAUDE.md
# Versiune: 3.0 | Data: 2026-03-26

## Overview
Aplicatie web (PWA) cu 6 module, centrata pe matematica. Utilizator principal: Cristina (profesoara de matematica la sectia slovaca).
Pipeline: Input (JPEG/PDF/DOCX) -> OCR structurat (Gemini) -> Crop figuri (Pillow) -> Traducere (DeepL/Gemini) -> HTML A4 printabil.

## Status
- **Faza curenta**: v3.0 — Faza 1 in executie (reparatii + ecran incarcare)
- **Progres**: Vezi `99_Plan_vs_Audit/PLAN_v3.md` — SURSA UNICA de adevar
- **Deploy**: LIVE pe Render (auto-deploy din GitHub)
  - Frontend: https://traduceri-matematica-7sh7.onrender.com
  - API: https://traduceri-api.onrender.com
- **Ultima sesiune**: 2026-03-26

## PRIMA ACTIUNE LA SESIUNE NOUA
1. Citeste `99_Plan_vs_Audit/PLAN_v3.md` — sursa UNICA de adevar pt progres
2. Citeste `99_Plan_vs_Audit/PLAN_DECISIONS.md` — log decizii
3. Citeste `99_Plan_vs_Audit/RUNDA_CURENTA.md` — ce se discuta acum
4. Continua cu primul task [ ] nemarcat din PLAN_v3.md
5. Dupa ORICE implementare: marcheaza [x] cu data in plan + commit + push

## Stack v3
- Frontend: Next.js 14 + Tailwind CSS
- Backend: Python serverless (api/) + shared lib (api/lib/)
- AI OCR: Gemini 2.5 Flash (JSON mode, gratuit, 250 cereri/zi)
- AI Traducere: DeepL Free (principal, 2 chei = 1M car/luna) + Gemini (fallback)
- AI Fallback: Groq Llama 3.3 (traducere + chat), Mistral Pixtral (OCR)
- Figure: Crop din original cu Pillow (nu SVG generat)
- Deploy: Render (auto-deploy din GitHub, free tier, Frankfurt)
- Monitoring: Feedback loop complet (10 componente)

## Key Files
- `99_Plan_vs_Audit/PLAN_v3.md` — **SURSA UNICA** de adevar (tracking [ ]/[x])
- `99_Plan_vs_Audit/PLAN_DECISIONS.md` — log decizii tehnice
- `99_Plan_vs_Audit/AUDIT_FEEDBACK.md` — feedback auditor
- `99_Plan_vs_Audit/RUNDA_CURENTA.md` — discutia curenta
- `99_Plan_vs_Audit/T1_REGULAMENT.md` — regulament terminal executie
- `config/languages.json` — limbi suportate (RO/SK/EN + extensibil)
- `config/tabs.json` — tab-uri dinamice (extensibil)
- `config/math_terms_ro_sk.json` — dictionar RO-SK (100 termeni)
- `api/` — Python serverless + api/lib/ (module partajate)
- `frontend/` — Next.js app cu tema "tabla verde + creta"
- `docs/` — documentatie (CHANGELOG, ghiduri)
- `dev_server.py` + `DEV_LOCAL.bat` — dezvoltare locala

## Conventions
- Limba interfata/documentatie: ROMANA
- Limba cod/comentarii: ENGLEZA
- API keys: doar in .env, niciodata in cod
- Tema UI: tabla verde (#2d5016) + text creta (alb/galben)
- Servicii: GRATUITE prioritar (DeepL free, Gemini free)
- LaTeX: protejat cu placeholders inainte de traducere
- Figuri: crop din original (nu SVG generat de AI)
- Dupa ORICE modificare: commit + push automat (Render deploy)

## Pipeline v3 (multi-pas)
```
Input (JPEG/PDF/DOCX)
  -> [1] Gemini OCR structurat (JSON mode) -> text + figuri bbox
  -> [2] Pillow crop figuri + background removal -> alb
  -> [3] DeepL/Gemini traducere (selectabil) -> text tradus
  -> [4] build_html() + MathJax -> HTML A4 printabil
```

## Module planificate (6 total)
1. **Traduceri** — prioritar, in executie (Faza 1-2)
2. **Convertor fisiere** — functional, de polish (Faza 3)
3. **Chat AI** — schitat (Faza 4)
4. **Calculator matematic** — schitat (Faza 5)
5. **Corectare teste** — mentionat (Faza 6)
6. **Generare teste** — mentionat (Faza 6)

## Important
- Fara autentificare — acces direct
- PWA instalabil pe Windows, Android, iPhone
- Utilizator principal: Cristina (profesoara matematica)
- Limbi: RO -> SK (principal), RO -> EN (secundar), extensibil
- Toate serviciile: GRATUIT, fara exceptie
