# CHECKPOINT — Sistem Traduceri Matematica
# Data: 2026-03-22 | Sesiune: Planificare + Setup Structura
# CITESTE ACEST FISIER COMPLET INAINTE DE ORICE ACTIUNE

---

## CONTEXT PROIECT

Acest proiect a fost planificat si structurat intr-o sesiune anterioara.
Utilizatorul (Roland) a atasat exportul conversatiei in acest folder — citeste-l
pentru context complet daca ai nevoie de detalii suplimentare.

**Scop**: Aplicatie web (PWA) care traduce documente de matematica romanesti
in slovaca/engleza folosind AI Vision + AI Translation, pastreaza complet
notatia matematica (LaTeX, SVG figuri geometrice), si genereaza HTML A4 printabil.

**Utilizator final**: Cristina (sotia lui Roland) — profesoara de matematica in Slovacia.
Are nevoie de manuale traduse din romana in slovaca cu toate figurile geometrice intacte.

**Proiect originar CLI**: `C:\Users\ALIENWARE\Desktop\Cristina\Extragere_Traducere_HTML_Codex`
— contine scripturi Python functionale (build_print_html.py, validate_translation.py, etc.)
care trebuie reutilizate/adaptate in backend-ul FastAPI.

---

## CE S-A REALIZAT (COMPLET)

### 1. Documentare cerinte — Cerinte_Roland.md (93 cerinte)
- 3 runde initiale Q&A (9 intrebari) + 2 runde suplimentare (6 intrebari)
- Toate confirmate de Roland la 95%+ claritate
- Document complet: `Cerinte_Roland.md` — CITESTE-L pentru lista exacta

### 2. Structura proiect creata — 67 fisiere, 33+ foldere
Toate fisierele sunt create cu cod functional (nu placeholder-e goale):

**Frontend (Next.js 14 + Tailwind + shadcn/ui):**
- `frontend/src/app/layout.tsx` — PWA layout, service worker registration, math decorations
- `frontend/src/app/page.tsx` — home page cu tab navigation
- `frontend/src/app/globals.css` — tema COMPLETA "tabla verde + creta"
- `frontend/src/app/traduceri/page.tsx` — tab principal traduceri
- `frontend/src/app/convertor/page.tsx` — tab convertor fisiere (5 operatii)
- `frontend/src/app/api/translate/route.ts` — API route proxy catre backend
- `frontend/src/app/api/convert/route.ts` — API route proxy conversii
- `frontend/src/app/api/history/route.ts` — API route istoric
- `frontend/src/components/layout/Header.tsx` — header cu formule matematice decorative
- `frontend/src/components/layout/TabNav.tsx` — navigatie tab Traduceri / Convertor
- `frontend/src/components/layout/Footer.tsx` — footer
- `frontend/src/components/traduceri/FileUpload.tsx` — drag & drop, max 10 fisiere
- `frontend/src/components/traduceri/LanguageSelector.tsx` — RO/SK/EN cu swap
- `frontend/src/components/traduceri/PreviewPanel.tsx` — side-by-side original vs tradus
- `frontend/src/components/traduceri/ProgressBar.tsx` — bara progres cu gradient
- `frontend/src/components/traduceri/Dictionary.tsx` — panel pliabil dictionar terminologic
- `frontend/src/components/traduceri/MarkdownEditor.tsx` — editor Markdown cu preview live
- `frontend/src/components/history/HistoryList.tsx` — lista istoric complet
- `frontend/src/components/history/HistoryDetail.tsx` — detalii + re-download
- `frontend/src/hooks/useTranslation.ts` — hook traducere cu progress tracking
- `frontend/src/hooks/useHistory.ts` — hook istoric
- `frontend/src/lib/api.ts` — client API
- `frontend/src/lib/types.ts` — TypeScript types (TranslationResult, HistoryEntry, etc.)
- `frontend/src/lib/storage.ts` — localStorage/IndexedDB pentru istoric
- `frontend/package.json` — dependinte: next 14, react 18, tailwind, codemirror, react-dropzone, lucide
- `frontend/tailwind.config.ts` — paleta custom: chalkboard (#2d5016), chalk (white, yellow, red, blue, green)
- `frontend/tsconfig.json`, `next.config.js`, `postcss.config.js`, `next-env.d.ts`

**PWA:**
- `frontend/public/manifest.json` — name "Sistem Traduceri", 8 icon sizes, standalone, theme verde
- `frontend/public/sw.js` — service worker: cache-first static, network-first API
- `frontend/public/icons/icon.svg` — iconita SVG matematica (triunghi + sigma + RO->SK)

**Backend (FastAPI Python):**
- `backend/app/main.py` — FastAPI app, CORS, 3 routers
- `backend/app/config.py` — configurari din .env, paths, constante
- `backend/app/routers/translate.py` — endpoint POST /api/translate (OCR + translate + build HTML)
- `backend/app/routers/convert.py` — endpoint POST /api/convert (5 operatii)
- `backend/app/routers/history.py` — endpoints GET/DELETE /api/history
- `backend/app/providers/base.py` — clasa abstracta AIProvider
- `backend/app/providers/gemini.py` — Google Gemini (vision + translation) cu prompts detaliate
- `backend/app/providers/groq.py` — Groq fallback (translation only, Llama 3.1 70B)
- `backend/app/providers/mistral.py` — Mistral/Pixtral fallback (vision + translation)
- `backend/app/services/ocr.py` — OCR cu fallback automat Gemini > Mistral
- `backend/app/services/translator.py` — traducere cu protectie LaTeX+HTML, fallback Gemini > Groq
- `backend/app/services/html_builder.py` — HTML A4 generator cu MathJax, page numbers, auto-scaling
- `backend/app/services/converter.py` — conversii: PDF<->DOCX, IMG->PDF, MD->HTML, merge, split, compress
- `backend/app/services/dictionary.py` — dictionar terminologic persistent (JSON)
- `backend/app/utils/math_protect.py` — protect_math / restore_math (LaTeX placeholders)
- `backend/app/utils/validation.py` — detectie limba, draft markers, validare traducere
- `backend/requirements.txt` — 12 dependinte (fastapi, uvicorn, google-generativeai, groq, mistralai, etc.)

**Configurari:**
- `.gitignore` — node_modules, .env, __pycache__, .next, data/
- `.env.example` — template API keys (fara valori)
- `.env` — EXISTA DEJA cu chei reale (NU o urca pe GitHub!)
- `vercel.json` — config Vercel (Next.js framework, rewrites)
- `config/languages.json` — RO, SK, EN cu flaguri, configurari, encoding fallbacks
- `package.json` (root) — scripturi monorepo (dev, build, backend, install:all)
- `README.md` — documentatie + setup local

**Claude Code integration:**
- `CLAUDE.md` — overview proiect, status, stack, conventions, key files
- `.claude/rules/project_rules.md` — 7 reguli: R-COST, R-MATH, R-LAYOUT, R-LANG, R-THEME, R-SEC, R-EXT
- `.claude/memory/MEMORY.md` — index memorie
- `.claude/memory/user_roland.md` — profil Roland
- `.claude/memory/project_overview.md` — context proiect, decizii tehnice confirmate

---

## CE TREBUIE FACUT (TODO — in ordinea prioritatii)

### FAZA 1 — Functional Local (PRIORITATE MAXIMA)

- [x] **1.1. Instalare dependinte frontend** — DONE 2026-03-23 (183 pachete, 19 directe)
- [x] **1.2. Instalare dependinte backend** — DONE 2026-03-23 (requirements.txt actualizat pt Python 3.13)
- [x] **1.3. Configurare .env** — DONE 2026-03-23 (chei existente, Roland a confirmat continuarea)
- [x] **1.4. Generare iconite PNG din SVG** — DONE 2026-03-23 (8 PNG-uri: 72-512px, via sharp)
- [x] **1.5. Implementare sistem monitorizare + loguri** — DONE 2026-03-23 (6 fisiere noi)
- [x] **1.6. Testare locala** — DONE 2026-03-23 (backend :8000 OK, frontend :3000 OK, /api/logs OK)
- [x] **1.7. Fix-uri dupa prima rulare** — DONE 2026-03-23 (mistralai v2 API fix, requirements.txt actualizat)

### FAZA 2 — Git + GitHub

- [ ] **2.1. Initializare Git** — git init + remote add origin
- [ ] **2.2. Primul commit + push** — ATENTIE: NU adauga .env (e in .gitignore)
- Commit: "Initial project structure — Sistem Traduceri Matematica"
- Push la GitHub

### FAZA 3 — Vercel Deploy

#### 3.1. Conectare Vercel
- Roland are cont Vercel existent
- Conecteaza repo GitHub la Vercel
- Framework: Next.js, root: `frontend/`
- Build command: `cd frontend && npm run build`
- Output: `frontend/.next`
- Environment variables: adauga GOOGLE_AI_API_KEY, GROQ_API_KEY, MISTRAL_API_KEY, BACKEND_URL

#### 3.2. Problema arhitecturala: Backend Python pe Vercel
- Vercel suporta nativ Next.js (Node.js), NU FastAPI (Python)
- OPTIUNI:
  A) **API Routes Next.js** — muta logica Python in API routes Node.js (rescrie in TypeScript)
     Pro: totul pe Vercel, simplu, gratuit
     Contra: rescrierea serviciilor Python
  B) **Vercel Serverless Functions (Python)** — Vercel suporta Python runtime
     Pro: pastreaza codul Python, ruleaza pe Vercel
     Contra: limite de executie (10s free tier), cold starts
  C) **Backend separat** — deploy FastAPI pe Railway/Render (free tier)
     Pro: pastreaza arhitectura actuala
     Contra: doua servicii de gestionat, latenta inter-servicii
  D) **Hybrid** — conversii simple in API Routes Next.js, OCR+traducere ca Vercel Python Functions
     Pro: cea mai buna balanta
     Contra: complexitate medie
- **DECIZIE ROLAND: Optiunea D — Hybrid** (confirmat 2026-03-23)

### FAZA 3 — Vercel Deploy

- [ ] **3.1. Conectare Vercel** — repo GitHub la Vercel, framework Next.js, root frontend/
- [ ] **3.2. Restructurare hybrid** — conversii in API Routes TS, OCR+traducere in Python serverless
- [ ] **3.3. Configurare env vars** — GOOGLE_AI_API_KEY, GROQ_API_KEY, MISTRAL_API_KEY pe Vercel
- [ ] **3.4. Test deploy** — verificare ca totul merge pe URL-ul Vercel

### FAZA 4 — Imbunatatiri si Polish

- [ ] **4.1. Integrare Istoric** — HistoryList + HistoryDetail in page.tsx (tab sau sectiune)
- [ ] **4.2. Editor Markdown avansat** — CodeMirror syntax highlighting + MathJax preview live
- [ ] **4.3. Convertor fisiere complet** — PDF editing avansat (rotire, stergere, reordonare, watermark)
- [ ] **4.4. Dictionar pre-populat** — math_terms_ro_sk.json + math_terms_ro_en.json
- [ ] **4.5. Testare E2E cu poze reale** — din proiectul originar CLI
- [ ] **4.6. PLAN_PROIECT.md** — document formal bazat pe template

### FAZA 5 — Extensii Viitoare (mutate in TODO.md)

---

## DECIZII TEHNICE CONFIRMATE (NU LE SCHIMBA FARA CONFIRMAREA LUI ROLAND)

| Decizie | Valoare | Motiv |
|---------|---------|-------|
| AI primar | Google Gemini Free Tier | Gratuit, vision + text, cheia existenta |
| AI fallback traducere | Groq (Llama 3.1 70B) | Gratuit, rapid, cheia existenta |
| AI fallback vision | Mistral/Pixtral | Gratuit, vision capabil, cheia existenta |
| Frontend | Next.js 14 + Tailwind + shadcn/ui | Modern, PWA ready, Vercel native |
| Backend | FastAPI Python | Reutilizeaza scripturile CLI existente |
| Tema UI | "Tabla verde + creta" | Verde-inchis #2d5016, text alb/galben, font Patrick Hand |
| Deploy | Vercel auto-deploy din GitHub | Gratuit, CI/CD automat |
| Autentificare | FARA — acces direct | Uz intern, nu necesita parola |
| Istoric | Complet cu detalii, preview, re-download | localStorage in browser |
| Dictionar | Panel pliabil in tab Traduceri | Persistenta localStorage, editabil manual |
| Editor | Markdown + preview live side-by-side | Syntax highlighting + MathJax render |
| Convertor | Tab separat, toate formatele, PDF editing | Nu incetineste pipeline-ul principal |
| Limbi | RO (sursa), SK + EN (tinta), extensibil | Dropdown in UI, config in JSON |
| Cost | ZERO — totul gratuit | Constrangere absoluta, fara negociere |
| PWA | Instalabil Windows/Android/iPhone | manifest.json + service worker |
| Layout | Pastrare fidela a originalului | Figuri exact unde sunt in documentul sursa |
| Numere pagina | Da, in partea de jos | Ca in originalul fotografiat |
| Header "Source" | ELIMINAT | Roland a cerut explicit eliminarea |

---

## CHEI API (REFERINTA — NU AFISA VALORILE)

Fisierul `.env` exista deja in radacina proiectului cu:
- GOOGLE_AI_API_KEY — pt Gemini (primar)
- GROQ_API_KEY — pt Groq (fallback traducere)
- MISTRAL_API_KEY — pt Mistral (fallback vision)
- CEREBRAS_API_KEY — optional

IMPORTANT: Cheile au fost expuse accidental in sesiunea anterioara.
Roland a confirmat continuarea (2026-03-23) — chei considerate valide.

---

## LOG PROGRES (actualizat live)

| Data | Pas | Status | Note |
|------|-----|--------|------|
| 2026-03-23 | 0. Tracking + memorie | DONE | TODO.md creat, CHECKPOINT.md reformatat, memorie salvata |
| 2026-03-23 | 1.1 npm install | DONE | 183 pachete, 19 directe, 0 vulnerabilitati |
| 2026-03-23 | 1.2 pip install | DONE | requirements.txt actualizat (Pillow>=11, mistralai>=1.0), Python 3.13 |
| 2026-03-23 | 1.4 Iconite PNG | DONE | 8 PNG-uri generate din SVG via sharp (72-512px) |
| 2026-03-23 | 1.5 Monitorizare | DONE | ErrorBoundary, monitoring.ts, /api/logs, /diagnostics, data/logs/ |
| 2026-03-23 | 1.6 Testare locala | DONE | Backend :8000 health OK, Frontend :3000 OK, /api/logs write+read OK |
| 2026-03-23 | 1.7 Fix-uri | DONE | mistralai v2 import fix (MistralClient -> Mistral), requirements.txt updated |

---

## REGULI OBLIGATORII PENTRU CLAUDE IN ACEST PROIECT

1. Citeste CLAUDE.md si .claude/rules/project_rules.md INAINTE de orice actiune
2. Citeste Cerinte_Roland.md pentru lista completa de cerinte
3. NICIODATA nu citi sau afisa continutul .env
4. NICIODATA nu propune solutii cu costuri — totul GRATUIT
5. Limba comunicare cu Roland: ROMANA
6. Limba cod/variabile/comentarii: ENGLEZA
7. Toate modificarile UI respecta tema "tabla verde + creta"
8. LaTeX trebuie protejat cu placeholders inainte de procesare Markdown
9. SVG trebuie wrappat in <div> pentru passthrough prin Markdown
10. Figurile geometrice apar exact unde sunt in originalul fotografiat
11. Intreaba inainte de orice decizie major — Roland vrea 95% claritate

---

## FISIERE ATASATE RELEVANTE

- `CHAT_EXPORT_*.json` sau `*.jsonl` — exportul conversatiei anterioare (atasat de Roland)
  Citeste-l pentru context complet daca ai nevoie de detalii despre decizii, discutii, sau preferinte
- `TEMPLATE_PLANIFICARE_PROIECT_V2.md` — template metodologic pentru PLAN_PROIECT.md
- `PROMPT_TEMPLATE_V2.md` — meta-prompt pentru imbunatatirea template-ului (NU pentru proiect)

---

*Checkpoint generat: 2026-03-22 | Sesiune: Planificare completa + Setup structura*
*Urmatoarea sesiune incepe cu FAZA 1.1 — Instalare dependinte*
