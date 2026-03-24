# Harta Module — Sistem Traduceri Matematica
# Descriere completa a tuturor functiilor aplicatiei
# Data: 2026-03-23

---

## VIZUALIZARE STRUCTURA

```
[Aplicatie Web — https://traduceri-matematica.vercel.app]
    |
    +-- [Tab 1: TRADUCERI] ................. Pipeline complet: Foto -> OCR -> Traducere -> HTML A4
    |     +-- Upload fisiere (drag & drop)
    |     +-- Selectie limba sursa/tinta
    |     +-- Buton "Traduce"
    |     +-- Progress bar cu etape
    |     +-- Preview side-by-side
    |     +-- Download HTML / PDF / DOCX
    |     +-- Dictionar terminologic
    |
    +-- [Tab 2: CONVERTOR] ................ Conversii fisiere si editare PDF
    |     +-- Conversie (PDF<->DOCX, IMG->PDF, MD->HTML)
    |     +-- Merge (combina mai multe PDF-uri)
    |     +-- Split (extrage pagini din PDF)
    |     +-- Compress (reduce dimensiune PDF)
    |     +-- Editare PDF (rotire, stergere, watermark)
    |     +-- Progress bar cu etape
    |
    +-- [Tab 3: ISTORIC] .................. Istoric traduceri + conversii
    |     +-- Lista traduceri anterioare
    |     +-- Lista conversii anterioare
    |     +-- Re-download in HTML / PDF / DOCX
    |     +-- Preview rezultat
    |
    +-- [/diagnostics] .................... Monitorizare si loguri
          +-- Loguri erori
          +-- Loguri actiuni utilizator
          +-- Filtrare pe tip (erori, actiuni, info)
          +-- Informatii dispozitiv
```

---

## TAB 1: TRADUCERI — Pipeline Complet

### Proces executie (0% -> 100%):

**Pasul 0 — Selectie fisiere (0%)**
- Utilizatorul deschide tab-ul "Traduceri"
- Selecteaza limba sursa (default: Romana) si limba tinta (Slovaca sau Engleza)
- Trage fotografii/documente in zona de upload SAU click pentru selectie
- Formate acceptate: JPG, JPEG, PNG, PDF, DOCX
- Maximum 10 fisiere per sesiune
- Fisierele sunt validate local (tip, extensie)

**Pasul 1 — Pregatire (5%)**
- Se creeaza FormData cu fisierele si setarile de limba
- Se porneste progress bar-ul cu simulare etape
- Log: "Traducere pornita" salvat in monitorizare

**Pasul 2 — Upload la server (15%)**
- FormData se trimite la `/api/translate` (Python serverless pe Vercel)
- Fisierele sunt parsate din multipart/form-data

**Pasul 3 — OCR cu AI Vision (30%)**
- **Provider primar**: Google Gemini 2.0 Flash (gratuit)
- Gemini primeste imaginea + prompt detaliat:
  - "Extract ALL content from this math textbook image"
  - "Output as Markdown with LaTeX ($...$, $$...$$)"
  - "For geometric figures, create inline SVG"
- Rezultat: text Markdown cu formule LaTeX si figuri SVG
- **Daca DOCX**: se extrage textul direct cu python-docx (fara OCR)
- **Fallback**: Mistral/Pixtral daca Gemini esueaza

**Pasul 4 — Protectie matematica (35%)**
- Functia `protect_math()` inlocuieste toate elementele matematice cu placeholders:
  - SVG-uri (`<div>...<svg>...</svg>...</div>`) -> `__MATH_0__`
  - LaTeX (`$formula$`, `$$formula$$`) -> `__MATH_1__`
  - HTML tags -> `__MATH_2__`
- Scop: AI-ul sa NU traduca/modifice formulele matematice

**Pasul 5 — Traducere AI (55%)**
- **Provider primar**: Google Gemini 2.0 Flash
- Prompt: "Translate from {sursa} to {tinta}. Preserve ALL LaTeX, HTML/SVG, markdown."
- **Fallback**: Groq (Llama 3.1 70B) daca Gemini esueaza
- AI-ul traduce DOAR textul natural, nu placeholder-urile

**Pasul 6 — Restaurare matematica (70%)**
- `restore_math()` inlocuieste placeholder-urile inapoi cu elementele originale
- Rezultat: Markdown tradus cu formule + figuri intacte

**Pasul 7 — Generare HTML A4 (75%)**
- `build_html()` genereaza document HTML profesional:
  - Format A4 (210mm x 297mm)
  - MathJax 3 CDN pentru randare formule LaTeX
  - Auto-scaling JS pentru incadrare continut pe pagina
  - Toolbar cu buton Print
  - Stil Cambria/Times New Roman, 12pt
- Fiecare pagina din original = o sectiune `<section class="paper">`

**Pasul 8 — Raspuns + Salvare (90%)**
- Serverul returneaza JSON: `{results, html, pages, duration_ms, status}`
- Frontend-ul afiseaza rezultatul in preview side-by-side
- Se salveaza automat in Istoric (localStorage)
- Log: "Traducere reusita" salvat in monitorizare

**Pasul 9 — Download (100%)**
- Utilizatorul poate descarca in 3 formate:
  - **HTML**: fisier complet cu MathJax, print-ready
  - **PDF**: deschide Print dialog → "Save as PDF"
  - **DOCX**: HTML convertit client-side in format Word

> **Sugestii extindere**: Batch > 10 pagini cu queue, traducere automata clipboard, comparatie doua traduceri side-by-side

---

## TAB 2: CONVERTOR — Conversii Fisiere

### Operatii disponibile:

**1. Conversie format (0% -> 100%)**
- Upload fisier -> detectare format automat -> selectie format tinta
- Rute suportate:
  - PDF -> DOCX, HTML, JPG, PNG
  - DOCX -> PDF, HTML
  - JPG/PNG -> PDF, alte formate imagine
  - MD -> HTML, PDF
- Executie: Python serverless pe Vercel (pypdf, python-docx, Pillow, markdown)
- Progress bar cu 4 etape

**2. Merge (combinare PDF-uri)**
- Upload mai multe PDF-uri
- Se unesc in ordine intr-un singur document
- Foloseste pypdf PdfWriter

**3. Split (extragere pagini)**
- Upload un PDF
- Extrage pagina specificata (input text: "1-3,5,7-10")
- Returneaza PDF cu paginile selectate

**4. Compress (optimizare dimensiune)**
- Upload PDF
- `compress_identical_objects()` reduce dimensiunea
- Returneaza PDF optimizat

**5. Editare PDF**
- Rotire pagini (90/180/270 grade)
- Stergere pagini selectate
- Reordonare pagini (ordine custom)
- Optimizare dimensiune
- Adaugare watermark text

> **Sugestii extindere**: OCR pe PDF scanat, merge imagini in PDF, conversie batch, previzualizare PDF inainte de editare

---

## TAB 3: ISTORIC

### Functionare:

**Istoric Traduceri**
- Lista cronologica a tuturor traducerilor efectuate
- Informatii per intrare: data, limbi, pagini, durata, status
- Click pe intrare -> detalii + preview HTML
- Re-download in HTML, PDF (print), DOCX
- Stocare: localStorage (persistent pe fiecare dispozitiv)
- Limita: ultimele 100 traduceri

**Istoric Conversii**
- Lista cronologica a tuturor conversiilor
- Informatii: data, operatie, format tinta, durata, fisier output
- Stocare: localStorage

> **Sugestii extindere**: Export istoric ca CSV, sincronizare cloud intre dispozitive, statistici utilizare

---

## PAGINA /diagnostics — Monitorizare

### Functionare:

- Afiseaza TOATE logurile de pe dispozitivul curent
- Tipuri de loguri:
  - **ERROR** (rosu): erori de la API, erori JS globale, promise rejections
  - **WARN** (galben): avertismente
  - **INFO** (verde): traduceri/conversii resite, app loaded
  - **ACTION** (albastru): actiuni utilizator (traducere pornita, download, etc.)
- Filtrare pe tip cu contoare
- Informatii per log: mesaj, timestamp, dispozitiv (OS/browser/screen), context detaliat
- Stack trace expandabil pentru erori
- Logurile se salveaza in localStorage (max 200)
- Logurile se trimit si la server (console.log -> Vercel Log stream)

> **Sugestii extindere**: Sincronizare loguri cross-device, alertare email la erori critice, dashboard grafic cu statistici

---

## COMPONENTE TRANSVERSALE

### Sistem AI (Provideri)
| Provider | Rol | Cost | Limite |
|----------|-----|------|--------|
| Google Gemini 2.0 Flash | OCR + Traducere (primar) | GRATUIT | 15 RPM, 1M tokens/zi |
| Groq (Llama 3.1 70B) | Traducere (fallback) | GRATUIT | 30 RPM |
| Mistral/Pixtral | Vision (fallback) | GRATUIT | 1 RPM |

### Service Worker (PWA)
- Cache versioning dinamic (se actualizeaza la fiecare deploy)
- API calls: NICIODATA cached (mereu network)
- HTML pages: network-first cu fallback cache
- Static assets: cache-first (iconite, manifest)
- Notificare automata la versiune noua

### Dictionar Terminologic
- Panel pliabil in tab Traduceri
- 100 termeni pre-populati RO-SK + 100 RO-EN
- Filtrare pe domeniu (algebre, geometrie, analiza, etc.)
- Editare/adaugare/stergere manuala
- Persistenta in localStorage

---

## INFRASTRUCTURA

```
[Utilizator] --> [Vercel CDN] --> [Next.js Frontend]
                                        |
                                        +-> /api/translate --> [Python Serverless] --> [Gemini/Groq API]
                                        +-> /api/convert  --> [Python Serverless] --> [pypdf/Pillow]
                                        +-> /api/health   --> [Python Serverless]
                                        +-> /api/logs     --> [Next.js Route] --> [Vercel Logs]
```

- Deploy: Vercel (auto-deploy din GitHub pe push)
- Runtime: Next.js 14 (Node.js) + Python 3.13 (serverless)
- CDN: Vercel Edge Network (global)
- Stocare: localStorage (per device) — zero costuri server

---

*Document generat: 2026-03-23 | Sistem Traduceri Matematica v1.0*
