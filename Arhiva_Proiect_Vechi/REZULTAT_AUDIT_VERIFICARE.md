# REZULTAT VERIFICARE AUDIT
# Data: 2026-03-23
# Verificat pe: cod LOCAL (C:\Proiecte\Traduceri_Matematica)
# Ultimul commit: af8f845 fix: enhanced OCR + translation prompts for Exemplu_BUN quality on all formats
# Fisiere locale modificate: NU (git status curat, doar CERINTE_AUDIT_CLAUDE_CODE.md untracked)

---

## REZUMAT

| Categorie | Numar |
|-----------|-------|
| Constatari **CONFIRMATE** | 21 din 35 |
| Constatari **INFIRMATE** | 6 din 35 |
| Constatari **PARTIAL CONFIRMATE** | 8 din 35 |
| Probleme **NOI** descoperite | 5 |

**Acuratete audit extern: ~83%** (29 din 35 constatari confirmate total sau partial)

---

## SECTIUNEA A — ERORI CRITICE (C01-C09)

---

### C01 — Divergenta api/ vs frontend/api/
**Verdict:** CONFIRMAT

**Detalii pe local:**
- Ambele directoare EXISTA: `api/` (3 fisiere) si `frontend/api/` (3 fisiere)
- **Vercel foloseste `api/`** conform vercel.json (routes: `api/translate.py`, `api/convert.py`, `api/health.py`)
- Diferente semnificative intre versiuni:
  - `api/translate.py` = 647 linii (versiune AVANSATA)
  - `frontend/api/translate.py` = 465 linii (versiune SIMPLIFICATA, -182 linii)
- Functii care LIPSESC din `frontend/api/translate.py`:
  - `format_and_translate_docx()` — pipeline DOCX structurat
  - `_sanitize_error()` — protectie API keys in mesaje eroare
  - Prompt OCR detaliat (171 linii vs 91 linii)
- `api/convert.py` (290 linii) vs `frontend/api/convert.py` (283 linii) — diferente minore (logging, headers)

**Concluzie:** `frontend/api/` este versiune outdated. Codul activ pe Vercel este `api/`. Risc: cineva poate modifica versiunea gresita.

---

### C02 — Operatiile PDF Edit neimplementate in backend
**Verdict:** CONFIRMAT

**Detalii pe local:**
- Frontend (`convertor/page.tsx` liniile 22-31) defineste 5 actiuni PDF Edit: rotate, delete, reorder, optimize, watermark
- Frontend trimite parametrii: `pdf_action`, `rotate_angle`, `page_range`, `watermark_text`, `reorder_sequence`
- **Backend `api/convert.py` NU contine NICIO referinta** la `edit-pdf`, `pdf_action`, `rotate`, `watermark`, `reorder`
- Daca user selecteaza "edit-pdf": backend returneaza `ValueError: Operatiune invalida: edit-pdf` (linia 173)

**Impact:** UI promite 5 operatii PDF care vor genera eroare 500 la executie.

---

### C03 — Conversii listate in UI dar neimplementate
**Verdict:** PARTIAL CONFIRMAT

**Tabel completat:**

| Conversie | Exista in backend? | Returneaza formatul corect? |
|-----------|--------------------|-----------------------------|
| PDF -> DOCX | DA | DA (DOCX real via python-docx) |
| PDF -> HTML | DA | DA |
| PDF -> JPG | DA | DA (image_convert) |
| PDF -> PNG | DA | DA (image_convert) |
| DOCX -> PDF | DA (ruta exista) | **NU — returneaza HTML** (apeleaza docx_to_html) |
| DOCX -> HTML | DA | DA |
| JPG/PNG -> PDF | DA | DA (image_to_pdf) |
| JPG <-> PNG | DA | DA (image_convert) |
| MD -> HTML | DA | DA |
| MD -> PDF | DA (ruta exista) | **NU — returneaza HTML** (apeleaza md_to_html) |
| HTML -> PDF | **NU** | N/A — lipseste din routes, genereaza ValueError |
| HTML -> MD | **NU** | N/A — lipseste din routes, genereaza ValueError |

**Probleme:** 2 conversii returneaza format gresit (HTML in loc de PDF), 2 conversii lipsesc complet din backend.

---

### C04 — Split PDF ignora page_range
**Verdict:** CONFIRMAT

**Detalii pe local:**
- Frontend trimite `page_range` in FormData (linia 106): `formData.append("page_range", pageRange)`
- Backend `split_pdf()` (liniile 128-138) accepta DOAR `data: bytes`, **fara parametru page_range**
- Functia returneaza MEREU doar pagina 0 (prima pagina): `writer.add_page(reader.pages[0])`
- Parserul multipart ignora campul `page_range`

**Impact:** Upload PDF 10 pagini cu range "1-3,5,7" → primesti DOAR pagina 1.

---

### C05 — DOCX download este fals (HTML salvat ca .docx)
**Verdict:** CONFIRMAT

**Detalii pe local:**
- `PreviewPanel.tsx` (liniile 12-34) si `HistoryDetail.tsx` (liniile 12-29):
  - `downloadAsDocx()` creeaza HTML cu namespace-uri Office XML
  - Seteaza MIME type `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - Dar continutul este **HTML pur**, NU un DOCX real (care e format ZIP cu XML)
- `frontend/package.json` NU contine nicio librarie npm pentru DOCX
- `python-docx` exista in `api/requirements.txt` dar e folosit doar in `convert.py` (citire), **NU in translate.py** (generare)

**Impact:** Microsoft Word deschide fisierul (suport legacy), dar LibreOffice/Google Docs pot refuza. Nu e un DOCX valid structural.

---

### C06 — Logica de combinare HTML multi-pagina se tripleaza
**Verdict:** PARTIAL CONFIRMAT

**Detalii pe local:**
- Backend (`api/translate.py` linia 591): `for r in results: r["html"] = unified_html` — pune ACELASI HTML la FIECARE result
- Frontend (`traduceri/page.tsx` liniile 106-109):
  ```javascript
  const allHtml = data.results
    ? data.results.map((r) => r.html).join("\n<hr>\n")
    : htmlResult;
  ```
- **La 1 fisier:** 1 result × 1 unified_html = OK, fara duplicare
- **La 3 fisiere:** 3 results × acelasi unified_html = **HTML triplicat** (9 sectiuni in loc de 3)

**Diferente fata de audit extern:** Constatarea e corecta doar pentru multi-file upload. Single file functioneaza corect.

---

### C07 — Dictionarul terminologic NU este trimis la traducere
**Verdict:** CONFIRMAT

**Detalii pe local:**
- `traduceri/page.tsx` functia `handleTranslate()` (liniile 70-73):
  ```javascript
  formData.append("files", f);
  formData.append("source_lang", sourceLang);
  formData.append("target_lang", targetLang);
  // LIPSA: formData.append("dictionary", ...)
  ```
- **FormData NU include termenii din dictionar**
- `api/translate.py` NU cauta si NU proceseaza parametrul dictionary
- Promptul de traducere NU mentioneaza dictionarul utilizatorului
- Componenta Dictionary.tsx se afiseaza in UI dar **efectul e zero** — termenii nu ajung la API

**Nota:** In `backend/` (cod mort) exista `apply_dictionary()`, dar in codul activ (`api/`) NU.

---

### C08 — Re-download din Istoric nu functioneaza pentru conversii
**Verdict:** PARTIAL CONFIRMAT

**Detalii pe local:**
- **Traduceri — FUNCTIONEAZA:** `HistoryDetail.tsx` are 3 butoane download (HTML, DOCX, PDF/Print). `HistoryEntry` contine `html?: string`.
- **Conversii — NU FUNCTIONEAZA:**
  - `ConversionHistoryEntry` (types.ts liniile 53-62) contine doar `output_filename: string` (numele, NU datele)
  - `HistoryList.tsx` afiseaza conversii dar **NU are butoane de re-download**
  - Datele fisierului output NU sunt salvate in istoric

**Diferente:** Auditul e corect partial — traducerile au re-download functional, conversiile nu.

---

### C09 — API route /api/history proxiaza backend inexistent
**Verdict:** CONFIRMAT

**Detalii pe local:**
- `frontend/src/app/api/history/route.ts` linia 3: `const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"`
- Face proxy la `${BACKEND_URL}/api/history` — backend FastAPI care **NU exista pe Vercel**
- **Nimeni nu apeleaza aceasta ruta:** grep pe "api/history" in frontend/src/ (exclus route.ts) = 0 rezultate
- Istoricul foloseste localStorage direct via `storage.ts`
- Ruta e **cod mort** — nu e apelata si nu ar functiona pe Vercel

---

## SECTIUNEA B — ERORI MAJORE (M01-M12)

---

### M01 — Backend FastAPI (backend/) este cod mort
**Verdict:** CONFIRMAT

- `vercel.json` NU mentioneaza `backend/`
- Zero importuri din `backend/` in vreun fisier activ
- 585 linii de cod Python complet nefolosite (20 fisiere)
- Toata logica a fost migrata in `api/` (functii serverless Vercel)

---

### M02 — Hook useTranslation neutilizat
**Verdict:** CONFIRMAT

- Hook definit in `/frontend/src/hooks/useTranslation.ts` (82 linii)
- **Zero importuri** in vreun fisier .tsx/.ts din proiect
- `traduceri/page.tsx` implementeaza propria logica de fetch inline, fara a folosi hook-ul
- Cod mort functional — ar putea fi folosit, dar nu este

---

### M03 — Functiile din lib/api.ts neutilizate
**Verdict:** CONFIRMAT

- Exporta 4 functii: `translateFiles()`, `convertFiles()`, `fetchHistory()`, `deleteHistoryEntry()`
- **Zero importuri** din lib/api.ts in orice fisier .tsx
- Paginile fac `fetch()` direct la API endpoints
- 46 linii de cod mort complet

---

### M04 — Fallback OCR Mistral lipseste
**Verdict:** CONFIRMAT

- `backend/app/providers/mistral.py` — exista cu `vision_ocr()` si model `pixtral-12b-2409`
- **DAR backend/ este cod mort** — nu ruleaza pe Vercel
- In codul ACTIV (`api/translate.py`):
  - `ocr_with_gemini()` (liniile 171-216) — **FARA try/except cu fallback**
  - Daca Gemini OCR esueaza → eroare propagata direct catre utilizator
  - Doar TRADUCEREA are fallback Groq (liniile 570-574), **NU OCR-ul**

**Impact:** Gemini OCR down = aplicatia complet nefunctionala (fara alternativa).

---

### M05 — Cerebras API key neutilizat
**Verdict:** CONFIRMAT

- `CEREBRAS_API_KEY` prezent in `.env`
- **Zero referinte** in cod executabil (.py, .ts, .tsx)
- Apare doar in documentatie/cerinte (CHECKPOINT.md, Cerinte_Roland.md)
- Feature planificat dar **niciodata implementat**

---

### M06 — MarkdownEditor importat dar neutilizat
**Verdict:** CONFIRMAT

- Component definit in `/frontend/src/components/traduceri/MarkdownEditor.tsx` (140 linii)
- **Zero importuri** in vreun fisier .tsx din proiect
- Editor Markdown cu live preview — feature gata dar neintegrat
- Nici `traduceri/page.tsx`, nici `convertor/page.tsx` nu-l folosesc

---

### M07 — DOCX->PDF si MD->PDF returneaza HTML nu PDF
**Verdict:** CONFIRMAT

- `api/convert.py` liniile 185-187:
  ```python
  ("docx", "pdf"): lambda: docx_to_html(data, name),  # Apeleaza docx_to_html()!
  ("md", "pdf"): lambda: md_to_html(data, name),       # Apeleaza md_to_html()!
  ```
- Ambele functii returneaza `{"mime": "text/html", "filename": "*.html"}`
- User cere PDF, primeste HTML — **conversie incorecta**

---

### M08 — Preview tradus pierde layout A4
**Verdict:** INFIRMAT

- `PreviewPanel.tsx` (liniile 119-125): foloseste `dangerouslySetInnerHTML` cu `className="prose max-w-none"`
- HTML-ul din `api/translate.py` contine CSS A4 complet inline (210mm × 297mm, padding 12mm, font Cambria)
- CSS-ul A4 SE APLICA in preview — stilurile inline au prioritate peste clase Tailwind
- Layout-ul vizual e constrans de container (jumatate ecran), dar A4 formatting se pastreaza la print

---

### M09 — DOMPurify poate elimina SVG/MathJax
**Verdict:** INFIRMAT

- `frontend/src/lib/sanitize.ts` (liniile 5-7):
  ```typescript
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true, svg: true, mathMl: true },
  });
  ```
- `svg: true` — permite TOATE tag-urile SVG (svg, path, circle, line, polygon, text, etc.)
- `mathMl: true` — permite MathML
- Configurare **explicita si permisiva** — SVG si MathJax nu sunt eliminate

---

### M10 — Vercel body size limit
**Verdict:** PARTIAL CONFIRMAT

- `vercel.json` — **NU contine** configurare `maxBodyLength` sau `payloadLimit`
- `next.config.js` — **NU contine** configurare body size
- Se foloseste default Vercel: **4.5MB** request body
- Pentru imagini mari (fotografii >4MB) sau upload multiplu, limita poate fi atinsa
- Nu e bug, dar e **risc netestet** — fara configurare explicita

---

### M11 — Protectie LaTeX interfereaza cu HTML valid
**Verdict:** INFIRMAT

- `api/translate.py` liniile 22-45:
  - LATEX_PATTERNS: 5 pattern-uri (display math, inline math, environments, commands)
  - HTML_PATTERN: `r"<[^>]+>"` — captureaza tag-uri HTML
  - Ordine aplicare: SVG → LaTeX → HTML (corect — fiecare tip e protejat separat)
- LaTeX patterns NU captureaza tag-uri HTML (pattern-urile cauta `$`, `\\`, `\begin`)
- HTML pattern aplicat DUPA LaTeX — nu exista interferenta in practica
- Risc teoretic: daca atribute HTML contin `$` — dar in acest proiect nu apare

---

### M12 — Service Worker cache version hardcodat
**Verdict:** CONFIRMAT

- `frontend/public/sw.js` linia 3: `const CACHE_VERSION = "v4-" + "20260323b";`
- String **hardcodat manual** — NU generat la build time
- Nu exista script de auto-increment in `package.json` sau `next.config.js`
- La fiecare deploy, developerul trebuie sa actualizeze manual — risc de stale cache

---

## SECTIUNEA C — ERORI MINORE (m01-m14)

---

### m01 — Footer neutilizat
**Verdict:** CONFIRMAT
- `Footer.tsx` exista (13 linii) dar **zero importuri** in codebase. Nu e inclus in `layout.tsx`.

---

### m02 — languages.json contine limbi neimplementate
**Verdict:** INFIRMAT
- `config/languages.json` contine **exact 3 limbi**: RO, SK, EN — toate implementate.
- `LanguageSelector.tsx` foloseste aceleasi 3 limbi hardcodate. Nicio limba in plus.

---

### m03 — Testele E2E testeaza localhost, nu Vercel
**Verdict:** CONFIRMAT
- `test_e2e.py` linia 18: `BASE_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")`
- Default = localhost. Pentru Vercel trebuie setat `BACKEND_URL` explicit.

---

### m04 — .claude/ memory files publice pe GitHub
**Verdict:** PARTIAL CONFIRMAT
- `.claude/rules/project_rules.md` — **tracked in git** (public pe GitHub)
- Memory files sunt la nivel user (`C:\Users\ALIENWARE\.claude\projects\...`) — **NU in repo**
- `.gitignore` exclude doar `.claude/settings.local.json`
- Regulile proiectului sunt publice (intentionat), memory-ul nu e in repo

---

### m05 — start.html hardcodeaza URL
**Verdict:** CONFIRMAT
- `start.html` contine URL hardcodata: `https://traduceri-matematica.vercel.app`
- Nu e configurabil — functioneaza doar pentru deploy-ul curent

---

### m06 — Pattern-uri LaTeX incomplete
**Verdict:** PARTIAL CONFIRMAT
- 5 pattern-uri definite acoperind: display math, inline math, environments, commands cu argumente, commands simple
- Acopera **majoritatea** cazurilor uzuale
- **Lipsesc**: pattern-uri specifice pentru `\begin{matrix}`, `\begin{align}` nested, LaTeX in atribute HTML
- In practica, `\\begin\{[^}]+\}` captureaza si matrix/align — deci acoperirea e buna, nu perfecta

---

### m07 — Auto-scaling fara paginare
**Verdict:** PARTIAL CONFIRMAT
- `fitPaperSections()` (liniile 461-480) scaleaza continut: `Math.min(1, avail / need)`
- **NU implementeaza paginare reala** — daca continutul e prea mare, e scalat mai mic in loc sa fie impartit pe pagini
- Functioneaza acceptabil pentru documente scurte, problematic pentru documente lungi

---

### m08 — Erori mix RO/EN
**Verdict:** CONFIRMAT
- Mesaje in ROMANA: `"Nu au fost trimise fisiere"`, `"configureaza variabila in Vercel dashboard"`
- Mesaje in ENGLEZA: `"[GEMINI ERROR] Status..."`, `"[OCR] Processing file..."`
- **Mix inconsistent** — fara conventie clara

---

### m09 — console.log/print in productie
**Verdict:** CONFIRMAT
- `api/translate.py`: **19 instructiuni `print()`** cu debug info (file=sys.stderr)
- `api/convert.py`: **multiple `print()`** pentru logging
- Toate activeaza in productie — genereaza log noise pe Vercel

---

### m10 — CONVERSION_MAP incomplet
**Verdict:** INFIRMAT
- CONVERSION_MAP din `convertor/page.tsx` (6 formate sursa) se aliniaza cu routes din `api/convert.py`
- Toate conversiile listate au o ruta backend (chiar daca unele returneaza format gresit — vezi C03/M07)
- Problema nu e CONVERSION_MAP incomplet, ci implementarea incorecta a unelor rute

---

### m11 — Fara validare dimensiune fisier
**Verdict:** CONFIRMAT
- `FileUpload.tsx`: defineste `MAX_FILES = 10` si `ACCEPTED_MIMES`/`ACCEPTED_EXTS`
- **NU exista `maxSize` sau limita de dimensiune**
- User poate incerca upload fisiere de orice marime — esec silentios la limita Vercel (4.5MB)

---

### m12 — Dropdown limbi permite SK->SK
**Verdict:** INFIRMAT
- `LanguageSelector.tsx` linia 59: `LANGUAGES.filter((l) => l.code !== sourceLang)`
- Filtru activ — target language **NU poate fi aceeasi** cu source. SK->SK imposibil.

---

### m13 — PDF edit params neparsate in backend
**Verdict:** CONFIRMAT
- Frontend trimite: `pdf_action`, `rotate_angle`, `page_range`, `watermark_text`, `reorder_sequence`
- Backend `process()` (liniile 156-192) parseaza doar `operation` si `target_format`
- **Toti parametrii PDF edit sunt ignorati complet** (legat de C02)

---

### m14 — Model Groq posibil deprecat
**Verdict:** PARTIAL CONFIRMAT
- `api/translate.py` linia 275: model = `"llama-3.1-70b-versatile"`
- Modelul **functioneaza in prezent** pe Groq
- **Nu e cel mai recent** (llama-3.3 exista) — risc de deprecare in viitor fara notificare
- Nu e bug activ, dar necesita monitorizare

---

## SECTIUNEA D — VERIFICARE API KEYS

**Chei declarate in .env (doar nume, NU valori):**
```
GOOGLE_AI_API_KEY, GROQ_API_KEY, MISTRAL_API_KEY, CEREBRAS_API_KEY,
OPENAPI_RO_KEY, TAVILY_API_KEY, TAVILY_MONTHLY_QUOTA, TAVILY_WARN_AT,
TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, GMAIL_USER, GMAIL_APP_PASSWORD,
APP_SECRET_KEY, BACKEND_PORT, FRONTEND_PORT, DATABASE_PATH, OUTPUTS_DIR,
CHECKPOINT_DB_PATH, LOG_LEVEL, MAX_CONCURRENT_JOBS, SYNTHESIS_MODE,
REQUEST_DELAY_GOV, REQUEST_DELAY_WEB
```

**Chei EFECTIV FOLOSITE in codul activ:**

| Cheie | Folosita in | Status |
|-------|-------------|--------|
| GOOGLE_AI_API_KEY | api/translate.py (OCR + traducere) | ACTIVA |
| GROQ_API_KEY | api/translate.py (fallback traducere) | ACTIVA |
| MISTRAL_API_KEY | backend/app/providers/mistral.py | COD MORT (backend/) |
| CEREBRAS_API_KEY | nicaieri in .py/.ts | NEUTILIZATA |
| OPENAPI_RO_KEY | nicaieri | NEUTILIZATA |
| TAVILY_* (3 chei) | nicaieri | NEUTILIZATE |
| TELEGRAM_* (2 chei) | nicaieri | NEUTILIZATE |
| GMAIL_* (2 chei) | nicaieri | NEUTILIZATE |
| APP_SECRET_KEY | nicaieri | NEUTILIZATA |
| Restul variabilelor | nicaieri in proiect | NEUTILIZATE |

**Concluzie:** Doar 2 din ~20 chei sunt activ utilizate. Restul sunt din alte proiecte sau feature-uri neimplementate. `.env` este partajat intre mai multe proiecte.

---

## SECTIUNEA E — VERIFICARE COMPLETITUDINE VS CERINTE

| Cerinta | Descriere | Status | Evidenta |
|---------|-----------|--------|----------|
| **1.13** | Download HTML + PDF + DOCX | **PARTIAL** | HTML si PDF(print) OK. DOCX e fals — HTML salvat ca .docx (vezi C05) |
| **3.4** | Fallback automat OCR | **NEIMPLEMENTAT** | In codul activ (api/translate.py) OCR foloseste doar Gemini, fara fallback. Mistral exista doar in backend/ (cod mort) |
| **4.5** | Dictionar terminologic la traduceri | **NEIMPLEMENTAT** | Dictionarul se afiseaza in UI dar NU se trimite in FormData si NU ajunge la API (vezi C07) |
| **5.2.8** | Download 3 formate din Traduceri | **PARTIAL** | 3 butoane exista dar DOCX nu e real (vezi C05) |
| **5.3.4** | Merge/Split/Compress | **PARTIAL** | Merge si compress functioneaza. Split returneaza doar pagina 1 (vezi C04) |
| **5.3.5** | Editare PDF (5 operatii) | **NEIMPLEMENTAT** | UI exista, backend returneaza eroare (vezi C02) |
| **5.4.4** | Re-descarcare din istoric | **PARTIAL** | Traduceri: DA (3 formate). Conversii: NU (vezi C08) |
| **5.4.6** | Istoric separat conversii | **IMPLEMENTAT** | Tab "Conversii" in HistoryList cu ConversionHistoryEntry |
| **5.4.7** | Re-descarcare fisiere conversii | **NEIMPLEMENTAT** | ConversionHistoryEntry salveaza doar filename, NU datele fisierului |
| **12.1-12.7** | Sistem monitorizare | **IMPLEMENTAT** | monitoring.ts complet: 4 niveluri log, device detection, localStorage, pagina diagnostics |

**Scor completitudine cerinte verificate:** 2 complete, 4 partiale, 4 neimplementate = **40% complet**

---

## SECTIUNEA F — VERIFICARE CALITATE TRADUCERE

### Prompt OCR (api/translate.py liniile 181-207)
- **27 linii** — prompt DETALIAT
- Include: headings (#, ##, ###), bold (**Exemplu.**, **Observatie.**), LaTeX ($...$ si $$...$$)
- Reguli SVG: vertices, measurements, angles cu culori specifice, filled polygon
- Constructii: groupare perechi (P1+P2, P3+P4) side by side
- **Calitate: BUNA** — corespunde standardului Exemplu_BUN

### Prompt Traducere (liniile 229-249)
- Include sectiunea "MATH TERMINOLOGY" cu 15+ termeni: triangle, angle, segment, perpendicular, parallel, bisector, median, altitude, etc.
- Instructiuni: "Use correct {tgt} mathematical terminology"
- **Calitate: BUNA**

### HTML Builder (functia build_html, liniile 363-491)
- CSS A4: `210mm × 297mm`, padding 12mm, font Cambria
- `@page { size: A4; margin: 0; }` pentru print
- `page-break-inside: avoid` pentru paragrafe
- MathJax CDN integrat (tex-svg)
- Toolbar sticky cu buton "Tipareste"
- **Calitate: PROFESIONALA** — corespunde Exemplu_BUN

---

## SECTIUNEA G — COD MORT IDENTIFICAT

| Fisier/Director | Status | Linii cod | Impact |
|-----------------|--------|-----------|--------|
| `frontend/api/` (3 fisiere) | DUPLICAT OUTDATED | ~750 | Confuzie — versiune veche a api/ |
| `backend/` (20 fisiere) | COMPLET MORT | 585 | FastAPI nedeployed, cod v0 abandonat |
| `useTranslation.ts` | NEFOLOSIT | 82 | Hook gata dar neintegrat |
| `lib/api.ts` | NEFOLOSIT | 46 | Wrapper API ignorat, fetch direct |
| `Footer.tsx` | NEFOLOSIT | 13 | Component orphan, neinclus in layout |
| `api/history/route.ts` | RUTA MOARTA | 27 | Proxy la localhost:8000, nimeni nu o apeleaza |

**Total cod mort estimat: ~1.500 linii** (din ~3.500 linii totale = **~43% cod mort**)

---

## SECTIUNEA H — PROBLEME SUPLIMENTARE DESCOPERITE

### S01 — .env partajat cu alte proiecte
**Severitate:** MICA
- `.env` contine ~20 variabile, dar doar 2 sunt folosite in acest proiect
- Restul (Telegram, Gmail, Tavily, etc.) sunt din alte proiecte
- Risc: expunere accidentala chei API nerelate

### S02 — 19 instructiuni print() in productie
**Severitate:** MICA
- `api/translate.py` contine 19 `print()` cu debug info (file=sys.stderr)
- `api/convert.py` contine multiple `print()` pentru logging
- Genereaza log noise pe Vercel, potential expun detalii interne

### S03 — MISTRAL_API_KEY declarat dar folosit doar in cod mort
**Severitate:** MICA
- Cheia exista in .env si in backend/app/providers/mistral.py
- Dar backend/ e cod mort — cheia nu e niciodata folosita in codul activ
- Feature fallback OCR planificat dar neimplementat in serverless

### S04 — Nicio validare dimensiune fisier pe frontend
**Severitate:** MEDIE
- `FileUpload.tsx` valideaza tip fisier si numar (max 10) dar NU dimensiune
- Combinat cu limita Vercel 4.5MB = esec silentios pentru fisiere mari
- User nu primeste feedback util la upload prea mare

### S05 — api/translate.py este fisier monolitic (647 linii)
**Severitate:** MICA
- Contine: OCR, traducere, HTML builder, multipart parser, DOCX handler — totul intr-un fisier
- Candidat pentru refactorizare in module separate
- Functional dar greu de mentinut

---

## CONCLUZIE

### Acuratete audit extern
- **21 din 35 constatari CONFIRMATE** (60%)
- **8 PARTIAL CONFIRMATE** (23%)
- **6 INFIRMATE** (17%)
- **Acuratete totala: ~83%** (29 confirmate total/partial din 35)

### Constatarile INFIRMATE (auditul extern a gresit):
1. **M08** — Preview NU pierde layout A4 (CSS inline se aplica)
2. **M09** — DOMPurify NU elimina SVG/MathJax (configurat cu svg: true, mathMl: true)
3. **M11** — LaTeX protection NU interfereaza cu HTML (ordine corecta de aplicare)
4. **m02** — languages.json contine exact 3 limbi, toate implementate
5. **m10** — CONVERSION_MAP se aliniaza cu backend routes
6. **m12** — Dropdown PREVINE aceeasi limba sursa/target

### Top 5 probleme critice de remediat:
1. **C02/C13** — PDF Edit complet neimplementat (UI promite, backend esueaza)
2. **C07** — Dictionarul terminologic ignorat la traducere (feature iluzoriu)
3. **C06** — HTML triplicat la upload multiplu
4. **C01** — Doua versiuni API divergente (frontend/api/ vs api/)
5. **C03/M07** — Conversii PDF false (returneaza HTML)

### Recomandari imediate:
1. STERGE `frontend/api/` (duplicat outdated)
2. STERGE `backend/` (cod mort complet)
3. Implementeaza trimiterea dictionarului in FormData + prompt
4. Fix `split_pdf()` sa parseze `page_range`
5. Implementeaza conversie reala HTML→PDF (WeasyPrint sau similar gratuit)
6. Fix HTML triplication la multi-file upload

---

*Raport generat: 2026-03-23*
*Verificat de: Claude Code (Opus 4.6) pe cod local*
*Durata verificare: ~15 minute*
*35 constatari verificate + 5 probleme noi identificate*
