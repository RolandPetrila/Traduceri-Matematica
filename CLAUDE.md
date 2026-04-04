# Sistem Traduceri Matematica — CLAUDE.md
# Versiune: 3.2 | Data: 2026-04-05

## Overview
Aplicatie web (PWA) cu 6 module, centrata pe matematica. Utilizator principal: Cristina (profesoara de matematica la sectia slovaca).
Flow unic: Upload fisier → Gemini OCR (text + SVG figuri + LaTeX) → Afisare in pagina web ca original (A4, paginat) → Traducere ON-DEMAND prin switch limba (doar textul, elementele matematice raman intacte).

## Status
- **Faza curenta**: v3.2 — Fix Layout + NLLB HF Spaces
- **Progres**: Vezi `99_Plan_vs_Audit/PLAN_v3.md` — SURSA UNICA de adevar
- **Deploy**: LIVE pe Render (auto-deploy din GitHub)
  - Frontend: https://traduceri-matematica-7sh7.onrender.com
  - API: https://traduceri-api.onrender.com
- **Ultima sesiune**: 2026-04-05
- **Problema activa**: Layout deformat la upload imagine (fitPaperSections + overflow:hidden)

## PRIMA ACTIUNE LA SESIUNE NOUA
1. Citeste `99_Plan_vs_Audit/PLAN_v3.md` — sursa UNICA de adevar pt progres
2. Citeste `99_Plan_vs_Audit/PLAN_DECISIONS.md` — log decizii
3. Citeste `99_Plan_vs_Audit/RUNDA_CURENTA.md` — ce se discuta acum
4. Continua cu primul task [ ] nemarcat din PLAN_v3.md
5. Dupa ORICE implementare: marcheaza [x] cu data in plan + commit + push

## Stack v3.2
- Frontend: Next.js 14 + Tailwind CSS
- Backend: Python serverless (api/) + shared lib (api/lib/)
- AI OCR: Gemini 2.5 Pro → Flash fallback (JSON mode, gratuit) — extrage text + SVG figuri inline
- AI Traducere: DeepL Free (principal) → Gemini → NLLB HF Spaces (planificat) → Groq Llama 3.3
- Figure: SVG inline generat de Gemini la OCR (ca in Exemplu_BUN.html)
- Deploy: Render (auto-deploy din GitHub, free tier, Frankfurt)
- Monitoring: Feedback loop complet (10 componente)

## Key Files
- `99_Plan_vs_Audit/PLAN_v3.md` — **SURSA UNICA** de adevar (tracking [ ]/[x])
- `99_Plan_vs_Audit/PLAN_DECISIONS.md` — log decizii tehnice
- `99_Plan_vs_Audit/RUNDA_CURENTA.md` — discutia curenta
- `99_Plan_vs_Audit/RECOMANDARI_IMBUNATATIRI.md` — imbunatatiri planificate
- `99_Roland_Work/Exemplu_BUN.html` — **REFERINTA CALITATE** (standard minim output)
- `config/languages.json` — limbi suportate (RO/SK/EN + extensibil)
- `config/math_terms_ro_sk.json` — dictionar RO-SK (100 termeni)
- `api/lib/ocr_structured.py` — OCR Gemini JSON mode (Pro→Flash fallback)
- `api/lib/html_builder.py` — constructor HTML A4 din JSON structurat
- `api/lib/math_protect.py` — protectie formule la traducere
- `api/lib/translation_router.py` — routare DeepL/Gemini/Groq
- `dev_server.py` + `DEV_LOCAL.bat` — dezvoltare locala

## Conventions
- Limba interfata/documentatie: ROMANA
- Limba cod/comentarii: ENGLEZA
- API keys: doar in .env, niciodata in cod
- Tema UI: tabla verde (#2d5016) + text creta (alb/galben)
- Servicii: GRATUITE prioritar (DeepL free, Gemini free)
- LaTeX: protejat cu placeholders la traducere, randat cu MathJax
- Figuri: SVG inline generat de Gemini (ca Exemplu_BUN.html)
- Dupa ORICE modificare: commit + push automat (Render deploy)

## Flow UNIC traducere — Metoda unificata 3 pasi (definitiva)
```
[UPLOAD] Cristina incarca fisier (JPEG/PDF/DOCX)
  |
  v
[PAS 1] ORIGINAL — Imaginea/fisierul incarcat, afisat ca atare (100% fidel, read-only)
  |       Referinta vizuala — asa arata manualul original
  v
[PAS 2] HTML RO — Reconstructie OCR (Gemini: text + SVG figuri + LaTeX), EDITABIL
  |       Cristina poate corecta erori OCR (text gresit, diacritice, formule)
  |       ~85% fidel fata de original, dar editarea ridica la ~95%+
  v
[PAS 3] HTML TRADUS — Traducere on-demand (DeepL), EDITABIL
          Acelasi HTML ca pasul 2, doar textul tradus in limba dorita (SK/EN)
          Figuri SVG + formule LaTeX + layout = INTACTE
          Cristina poate corecta erori de traducere
```

### Butoane in toolbar: `Original` | `RO` | `SK` + navigare pagina 1/N
### Editare: pasii 2 si 3 sunt editabili (contentEditable) — pasul 1 e read-only

### Ce se traduce vs ce ramane intact (la switch RO → SK)
| Element | Pas 2 (RO) | Pas 3 (SK) |
|---------|------------|------------|
| Text paragraf | Original, editabil | TRADUS, editabil |
| Titluri/headings | Original, editabil | TRADUS, editabil |
| Formule LaTeX | INTACT | INTACT |
| Figuri SVG | INTACT | INTACT |
| Structura (ol/ul) | INTACT | INTACT |
| Layout A4 | INTACT | INTACT |

### Fidelitate per format input
| Format input | Pas 1 (original) | Pas 2-3 (HTML) | Cu editare manuala |
|-------------|-------------------|----------------|-------------------|
| JPEG (poze manual) | 100% | ~80-85% | ~95%+ |
| PDF (scanat) | 100% | ~80-85% | ~95%+ |
| PDF (text nativ) | 100% | ~85-90% | ~97%+ |
| DOCX (Word) | 100% | ~55-65% | ~80%+ |

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
