# PLAN IMPLEMENTARE — Traduceri Matematica v2.0
> Fisier PERSISTENT — se actualizeaza la fiecare implementare
> Checkbox: [ ] = neefectuat | [x] = efectuat | [~] = partial | [-] = anulat cu motiv

---

## Faza 0: Proiect Initial (COMPLETAT — sesiunile anterioare)

### 0.1 Setup Initial
- [x] 2026-03-22 — Creare proiect Next.js + Vercel deploy
- [x] 2026-03-22 — Configurare Gemini AI (OCR + traducere)
- [x] 2026-03-22 — Pipeline: imagine → Gemini OCR → Markdown → traducere → HTML A4
- [x] 2026-03-22 — Tema UI: tabla verde + creta
- [x] 2026-03-22 — PWA instalabil (manifest.json, service worker)
- [x] 2026-03-23 — Deploy LIVE pe https://traduceri-matematica.vercel.app

### 0.2 Functionalitati de baza
- [x] 2026-03-23 — Upload imagini (JPEG, PNG) pentru traducere
- [x] 2026-03-23 — Upload DOCX pentru traducere
- [x] 2026-03-23 — Convertor fisiere (PDF↔DOCX↔HTML, merge, split, compress)
- [x] 2026-03-23 — Editare PDF (rotate, delete, reorder, watermark)
- [x] 2026-03-23 — Dictionar terminologic RO-SK (100 termeni pre-populati)
- [x] 2026-03-23 — Istoric traduceri + conversii (localStorage)
- [x] 2026-03-23 — Download HTML + DOCX + PDF (Print)
- [x] 2026-03-23 — Pagina diagnosticare (/diagnostics)
- [x] 2026-03-23 — Template HTML A4 (identic cu Exemplu_BUN.html)

### 0.3 AI Providers
- [x] 2026-03-23 — Gemini 2.0 Flash (OCR primar + traducere)
- [x] 2026-03-23 — Groq Llama 3.1 (traducere fallback)
- [x] 2026-03-23 — Mistral Pixtral 12B (OCR fallback)

### 0.4 Audit + Remediere
- [x] 2026-03-24 — Audit complet proiect (scor 62→82)
- [x] 2026-03-24 — Curatare cod mort (43%→5%)
- [x] 2026-03-24 — 19 din 25 probleme rezolvate

---

## Faza 1: Feedback Loop + Monitoring (COMPLETAT — sesiunea 2026-03-24)

### 1.1 Sistem Monitoring Complet (10 componente)
- [x] 2026-03-24 — Error Capture (window.onerror + unhandledrejection)
- [x] 2026-03-24 — Console.warn/error interception (React warnings, MathJax)
- [x] 2026-03-24 — Action Tracker pe TOATE componentele (13 logAction calls)
- [x] 2026-03-24 — API Interceptor global (fetch wrapper, status + durata)
- [x] 2026-03-24 — Data Validator (traduceri: LaTeX/SVG/headings count; conversii: file size)
- [x] 2026-03-24 — Session Context (device, browser, rezolutie, PWA)
- [x] 2026-03-24 — Server-side logging (translate.py + convert.py → local_debug.log)
- [x] 2026-03-24 — File Writer (logs/route.ts → data/logs/local_debug.log in dev)
- [x] 2026-03-24 — ISSUES.md template (probleme vizuale manuale)
- [x] 2026-03-24 — Buton "Copiaza loguri" pe /diagnostics

### 1.2 Dev Local
- [x] 2026-03-24 — DEV_LOCAL.bat (pornire mediu local cu cleanup)
- [x] 2026-03-24 — dev_server.py (Python API local pe port 8000)
- [x] 2026-03-24 — next.config.js rewrites (proxy /api/* → localhost:8000)

### 1.3 AI Upgrades
- [x] 2026-03-24 — Gemini 2.0 Flash → 2.5 Flash
- [x] 2026-03-24 — Groq Llama 3.1 → 3.3 70B
- [x] 2026-03-24 — Claude Sonnet 4.6 integrat (suspendat — utilizare la cerere)

### 1.4 Prompt Engineering + Post-procesare
- [x] 2026-03-24 — Prompt OCR rescris (pasi ca paragrafe, SVG sizing, pairing)
- [x] 2026-03-24 — Prompt DOCX rescris (aceleasi reguli)
- [x] 2026-03-24 — Post-procesare deterministica (_post_process_markdown)
- [x] 2026-03-24 — HTML builder fix (heading demotion, ol/ul nesting)

### 1.5 Preview + Convertor
- [x] 2026-03-24 — Preview panel: iframe srcDoc (izolare completa)
- [x] 2026-03-24 — JPEG extension adaugata in convertor

### 1.6 Documentatie
- [x] 2026-03-24 — GHID_FEEDBACK_LOOP.md (ghid utilizare complet)
- [x] 2026-03-24 — COMENZI_SLASH.md (referinta comenzi)

---

## Faza 2: Refactorizare v2.0 (IN CURS)

### Sprint 0: Pregatire structura (COMPLETAT)
- [x] 2026-03-24 — Creaza `Arhiva_Proiect_Vechi/` — mutat AUDIT_FULL, PLAN_PROIECT, REZULTAT_AUDIT, STRUCTURA_MODULE
- [x] 2026-03-24 — Creaza `api/lib/` folder cu `__init__.py`
- [x] 2026-03-24 — Creaza `docs/` folder — mutat GHID_FEEDBACK_LOOP.md, COMENZI_SLASH.md, adaugat CHANGELOG.md
- [x] 2026-03-24 — Adaugat in `.env`: DEEPL_API_KEY, DEEPL_API_KEY2
- [x] 2026-03-24 — Actualizat `CLAUDE.md` — regulament v2 complet
- [x] 2026-03-24 — Creat `config/tabs.json` — tab-uri initiale (traduceri, convertor, istoric)
- [x] 2026-03-24 — Creat `PLAN_IMPLEMENTARE_v2.md` + `GHID_UTILIZARE_ROLAND.md`
- [x] 2026-03-24 — Commit `bd609c9` + push → Vercel deploy

### Sprint 1: DeepL Integration + Language Toggle (COMPLETAT)
- [x] 2026-03-24 — Creat `api/lib/deepl_client.py` — DeepL REST (2 keys, auto-fallback, usage)
- [x] 2026-03-24 — Creat `api/lib/math_protect.py` — LaTeX protection XML `<keep>` + placeholders
- [x] 2026-03-24 — Integrat DeepL in `api/translate.py` — selectabil cu `translate_engine`
- [x] 2026-03-24 — Creat `language-context.tsx` + `LanguageToggle.tsx` + `EngineSelector.tsx`
- [x] 2026-03-24 — Integrat LanguageToggle in Header + LanguageProvider in layout
- [ ] Test: traducere DeepL → verificare diacritice slovace
- [ ] Test: switch engine DeepL ↔ Gemini → compara rezultate
- [x] 2026-03-24 — Commit `88baf70` + push → Vercel deploy

### Sprint 2: OCR Structurat + Crop Figuri (COMPLETAT)
- [x] 2026-03-24 — Creat `api/lib/ocr_structured.py` — Gemini JSON mode OCR
- [x] 2026-03-24 — Creat `api/lib/figure_crop.py` — Pillow crop + background removal alb
- [x] 2026-03-24 — Creat `build_html_structured()` — HTML din JSON + figuri `<img>` base64
- [x] 2026-03-24 — Integrat pipeline structured in `do_POST` cu legacy fallback
- [x] 2026-03-24 — Fix filename: `originalName_engine.html`
- [x] 2026-03-24 — Fix heading demotion regex Unicode P₁-P₉
- [ ] Fix DOCX: converteste la PDF → Gemini (sprint urmator)
- [ ] Test: upload JPEG → figuri crop pe fundal alb → HTML
- [x] 2026-03-24 — Commit `18aa9ed` + push → Vercel deploy

### Sprint 2.5: Migrare Vercel → Render (IN CURS)
- [x] 2026-03-25 — Creare cont Render.com + conectare GitHub repo
- [x] 2026-03-25 — Configurare Render Web Service backend Python (traduceri-api)
- [x] 2026-03-25 — Transfer variabile mediu (.env → Render Dashboard) — 8 env vars
- [x] 2026-03-25 — Configurare Render Web Service frontend Node (traduceri-matematica-7sh7)
- [x] 2026-03-25 — Configurare build command + start command (npx next start -p $PORT)
- [x] 2026-03-25 — render.yaml blueprint (2 servicii, frankfurt, free tier)
- [x] 2026-03-25 — dev_server.py — suport PORT env var (Render)
- [x] 2026-03-25 — next.config.js — proxy rewrites PYTHON_API_URL
- [x] 2026-03-25 — Test traducere 1 pagina pe Render (test_page_2 — Gemini OK, DeepL bug gasit+fixat)
- [x] 2026-03-25 — Fix: direct API calls (bypass Next.js 30s proxy timeout)
- [x] 2026-03-25 — Fix: DeepL fallback la Gemini cand traducerea esueaza
- [ ] Test traducere 20 pagini pe Render (verificare timeout OK)
- [x] 2026-03-25 — Folosire render URL-uri (fara domeniu custom)
- [ ] Dezactivare Vercel deploy (dupa confirmare Render OK)
- [ ] Commit final + push → Render deploy
- **URLs**: Frontend: https://traduceri-matematica-7sh7.onrender.com | API: https://traduceri-api.onrender.com

### Sprint 3: Preview + Editare Inline + Tab-uri Dinamice (IN CURS)
- [x] 2026-03-25 — Creat `frontend/src/lib/tab-config.ts` — tab-uri din config/tabs.json
- [x] 2026-03-25 — Refactorizare `TabNav.tsx` — tab-uri dinamice din JSON config
- [x] 2026-03-25 — Refactorizare `page.tsx` — foloseste TabId dinamic
- [x] 2026-03-25 — Rescriere `PreviewPanel.tsx` — 3 moduri: Vizualizare / A4 Printabil / Editare
- [x] 2026-03-25 — Creat `InlineEditor.tsx` — contentEditable pe text, figuri protejate
- [ ] Creaza `SideBySide.tsx` — comparatie RO|SK coloane, scroll sync
- [ ] Test: editare inline → salvare → export cu text modificat
- [ ] Commit + push → Render deploy

### Sprint 4: Export Complet + Batch Processing
- [ ] Export HTML — template Exemplu_BUN cu figuri crop
- [ ] Export DOCX — adaptat din Translator_Portable
- [ ] Export PDF — server-side sau print-to-PDF
- [ ] Creaza `BatchPanel.tsx` — multi-fisiere, progress, ZIP download
- [ ] Test: export HTML + DOCX + PDF verificate
- [ ] Test: batch 3 fisiere → traducere → ZIP
- [ ] Commit + push → Vercel deploy

### Sprint 5: Istoric + Dictionar + Diagnostics
- [ ] Extinde `HistoryList.tsx` — cautare, filtrare, sortare
- [ ] Extinde `Dictionary.tsx` — sync API, import/export
- [ ] Extinde `diagnostics/page.tsx` — DeepL usage, API health, notificari
- [ ] Toast notifications — erori, alerte, quota exceeded
- [ ] Actualizeaza monitoring.ts — log engine, DeepL usage, crop count
- [ ] Test E2E complet
- [ ] Commit + push → Vercel deploy

### Sprint 6: Polish + Regulamente Finale
- [ ] Actualizeaza `CLAUDE.md` — regulament v2 final
- [ ] Actualizeaza `CHECKPOINT.md` — progres complet
- [ ] Curatenie cod: stergere cod mort, comentarii outdated
- [ ] Verifica monitoring local + Vercel
- [ ] Commit final + push → Vercel deploy

---

## Reguli de lucru

- **Dupa ORICE implementare**: marcheaza [x] cu data in acest fisier
- **Dupa ORICE modificare cod**: commit + push automat (Vercel deploy)
- **Task-uri noi**: se adauga in sprint-ul corespunzator sau sprint nou
- **Probleme**: se noteaza cu [~] partial sau [-] anulat cu motiv
- **Acest fisier**: sursa UNICA de adevar pentru progresul proiectului
