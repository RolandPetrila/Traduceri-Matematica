# PLAN PROIECT — Sistem Traduceri Matematica
# Versiune: 1.0 | Data: 2026-03-23
# Metodologie: Template Planificare Proiect V2

---

## 1. DESCRIERE PROIECT

**Nume:** Sistem Traduceri Matematica
**Tip:** Aplicatie web (PWA) pentru traducere documente matematice
**Scop:** Traduce manuale de matematica romanesti in slovaca/engleza, pastreaza complet notatia matematica (LaTeX, SVG figuri geometrice), genereaza HTML A4 printabil.
**Utilizator final:** Cristina (profesoara de matematica in Slovacia) — are nevoie de manuale traduse din romana in slovaca cu toate figurile geometrice intacte.

---

## 2. STACK TEHNIC

| Componenta | Tehnologie | Motiv |
|------------|------------|-------|
| Frontend | Next.js 14 + Tailwind + shadcn/ui | Modern, PWA ready, Vercel native |
| Backend | FastAPI Python | Reutilizeaza scripturile CLI existente |
| AI primar | Google Gemini Free Tier | Gratuit, vision + text |
| AI fallback traducere | Groq (Llama 3.1 70B) | Gratuit, rapid |
| AI fallback vision | Mistral/Pixtral | Gratuit, vision capabil |
| Deploy | Vercel (hybrid: Next.js + Python serverless) | Gratuit, CI/CD automat |
| Tema UI | "Tabla verde + creta" | Verde #2d5016, text alb/galben, Patrick Hand font |
| Math rendering | MathJax 3 | LaTeX in HTML |
| Editor | CodeMirror 6 | Syntax highlighting Markdown + LaTeX |

**Constrangere absoluta:** ZERO costuri — totul gratuit.

---

## 3. ARHITECTURA

```
[Browser/PWA]
    |
    v
[Next.js Frontend — Vercel]
    |-- Tab Traduceri (upload + OCR + traducere + preview)
    |-- Tab Convertor (conversii fisiere + PDF editing)
    |-- Tab Istoric (lista traduceri + re-download)
    |-- Dictionar terminologic (panel pliabil, pre-populat)
    |-- Editor Markdown (CodeMirror + MathJax live preview)
    |
    v
[API Routes — Vercel Serverless]
    |-- /api/translate (Python) -> Gemini Vision OCR + AI Translation
    |-- /api/convert (Python) -> File conversions
    |-- /api/health (Python) -> Health check
    |
    v
[AI Providers]
    |-- Gemini (primar: vision + text)
    |-- Groq (fallback: traducere)
    |-- Mistral (fallback: vision)
```

---

## 4. PIPELINE TRADUCERE (FLUX DETALIAT)

```
1. Upload imagini (JPG/PNG/PDF, max 10 fisiere)
       |
2. AI Vision OCR (Gemini > Mistral fallback)
   - Extrage text + formule + figuri
   - Output: Markdown cu LaTeX ($...$, $$...$$)
       |
3. Protectie LaTeX (protect_math)
   - Inlocuieste formule cu placeholders
   - Previne alterarea de catre markdown processor
       |
4. Traducere AI (Gemini > Groq fallback)
   - RO -> SK sau RO -> EN
   - Foloseste dictionarul terminologic
   - Pastreaza placeholders LaTeX intacte
       |
5. Restaurare LaTeX (restore_math)
   - Readuce formulele din placeholders
       |
6. Generare HTML A4
   - MathJax pentru formule
   - SVG inline pentru figuri geometrice
   - Page numbers, auto-scaling
   - Layout fidel originalului
       |
7. Preview side-by-side + download HTML
```

---

## 5. STRUCTURA PROIECT

```
C:\Proiecte\Traduceri_Matematica\
|-- frontend/
|   |-- src/app/           — Pages (page.tsx, traduceri/, convertor/)
|   |-- src/components/    — UI components (layout/, traduceri/, history/)
|   |-- src/hooks/         — Custom hooks (useTranslation, useHistory)
|   |-- src/lib/           — Utils (api.ts, types.ts, storage.ts)
|   |-- public/            — Static assets (manifest, SW, icons, dict data)
|   |-- tailwind.config.ts — Tema custom "tabla verde"
|
|-- backend/
|   |-- app/main.py        — FastAPI app
|   |-- app/providers/     — AI providers (gemini, groq, mistral)
|   |-- app/services/      — Business logic (ocr, translator, html_builder)
|   |-- app/utils/         — Helpers (math_protect, validation)
|
|-- api/                   — Vercel Python serverless functions
|   |-- translate.py       — OCR + traducere endpoint
|   |-- health.py          — Health check
|
|-- config/                — Configuration files
|   |-- languages.json     — Limbi suportate
|   |-- math_terms_ro_sk.json — Dictionar RO-SK (100 termeni)
|   |-- math_terms_ro_en.json — Dictionar RO-EN (100 termeni)
|
|-- tests/                 — E2E tests + fixtures
|-- data/                  — Runtime data (logs, temp files)
```

---

## 6. FAZE DE IMPLEMENTARE

### FAZA 1 — Functional Local [COMPLET]
- [x] Instalare dependinte frontend (npm) + backend (pip)
- [x] Configurare .env cu chei API
- [x] Generare iconite PWA din SVG
- [x] Sistem monitorizare + loguri
- [x] Testare locala (backend :8000, frontend :3000)
- [x] Fix-uri dupa prima rulare

### FAZA 2 — Git + GitHub [COMPLET]
- [x] Initializare Git + remote
- [x] Primul commit (87 fisiere) + push

### FAZA 3 — Vercel Deploy [COMPLET]
- [x] Restructurare hybrid (Next.js + Python serverless)
- [x] Conectare Vercel + GitHub
- [x] Configurare env vars pe Vercel
- [x] Deploy LIVE: https://traduceri-matematica.vercel.app

### FAZA 4 — Imbunatatiri si Polish [COMPLET]
- [x] 4.1 Integrare Istoric (tab nou + salvare automata dupa traducere)
- [x] 4.2 Editor Markdown avansat (CodeMirror + MathJax preview live)
- [x] 4.3 Convertor fisiere complet (PDF editing: rotire, stergere, reordonare, watermark)
- [x] 4.4 Dictionar pre-populat (100 termeni RO-SK + 100 termeni RO-EN)
- [x] 4.5 Testare E2E cu poze reale
- [x] 4.6 PLAN_PROIECT.md (acest document)

### FAZA 5 — Extensii Viitoare [PLANIFICAT]
- [ ] Limbi noi (maghiara, ceha) — doar JSON in config/languages.json
- [ ] Quiz generator din continutul tradus
- [ ] Rezolvare automata exercitii
- [ ] Export PDF direct (nu doar HTML)
- [ ] Batch processing > 10 pagini cu queue
- [ ] PDF editing avansat: drag & drop reordonare pagini

---

## 7. DECIZII TEHNICE

| # | Decizie | Alternativa respinsa | Motiv |
|---|---------|---------------------|-------|
| D1 | Gemini gratuit ca AI primar | OpenAI/Claude (platite) | Constrangere cost zero |
| D2 | Next.js + Vercel | Create React App | PWA + deploy gratuit + SSR |
| D3 | FastAPI (Python) | Express (Node) | Reutilizare cod CLI existent |
| D4 | Hybrid deploy (Next.js + Python serverless) | Backend separat pe Railway | Un singur serviciu, gratuit |
| D5 | MathJax 3 | KaTeX | Suport mai larg LaTeX |
| D6 | CodeMirror 6 | Monaco Editor | Mai usor, React wrapper bun |
| D7 | localStorage pt istoric | IndexedDB / SQLite | Simplu, suficient pentru uz intern |
| D8 | FARA autentificare | Auth0 / NextAuth | Uz intern, nu necesita parola |
| D9 | Dictionar pre-populat JSON | API extern terminologic | Offline, editabil, zero costuri |

---

## 8. RISCURI SI MITIGARI

| Risc | Probabilitate | Impact | Mitigare |
|------|--------------|--------|----------|
| Gemini rate limit (15 RPM) | Medie | Mediu | Fallback automat Groq/Mistral |
| Calitate OCR pe poze neclare | Medie | Mare | Editor Markdown pt corectii manuale |
| Vercel Python cold start lent | Mica | Mic | Health endpoint keep-alive |
| LaTeX corupt dupa traducere | Mica | Mare | protect_math/restore_math placeholders |
| Pierdere date localStorage | Mica | Mic | Export HTML inainte de clear |
| Chei API expirate/revocate | Mica | Mare | .env.example + doc setup |

---

## 9. METRICI DE SUCCES

| Metrica | Criteriu | Status |
|---------|----------|--------|
| Traducere functionala RO->SK | Rezultat HTML corect | De verificat E2E |
| Formule matematice intacte | LaTeX rendat corect cu MathJax | De verificat E2E |
| Figuri geometrice pastrate | SVG afisat in HTML output | De verificat E2E |
| PWA instalabila | manifest.json + SW functional | DONE |
| Deploy automat | Push pe GitHub = deploy pe Vercel | DONE |
| Timp traducere < 60s / pagina | Gemini response time | De masurat |
| Cost ZERO | Niciun serviciu platit | DONE |

---

## 10. INFORMATII CONTACT

- **Dezvoltator:** Roland (cu asistenta AI — Claude Code)
- **Utilizator final:** Cristina
- **Repository:** GitHub (private)
- **URL live:** https://traduceri-matematica.vercel.app
- **Proiect CLI originar:** C:\Users\ALIENWARE\Desktop\Cristina\Extragere_Traducere_HTML_Codex

---

*Document generat: 2026-03-23 | Metodologie: Template Planificare Proiect V2*
