# RUNDA CURENTA — Runda 14: METODA 3 PASI (Sprint 2.6) + FALLBACK GEMINI
# Actualizat: 2026-04-04 de T3 (orchestrator) — v2 (adaugat INTERVENTIE 0)

---

## INTERVENTIE 0: Fallback Gemini Pro → Flash [P0 URGENT — executa PRIMUL]

**Fisier:** `api/lib/ocr_structured.py` — linia ~94
**Problema:** Gemini 2.5 Pro pe free tier are doar **100 cereri/zi** (5 RPM). [CERT — sursa: Google AI docs, aprilie 2026]. Flash are 250 RPD si 10 RPM. Daca Cristina proceseaza 15+ pagini intr-o zi, Pro se blocheaza si OCR-ul nu mai merge deloc.

**Solutia:** Pastreaza Pro ca default (calitate mai buna), dar daca primeste 429 (rate limited) → retry automat cu Flash.

**Implementare:**

```python
MODELS = ["gemini-2.5-pro", "gemini-2.5-flash"]

for model_name in MODELS:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
    try:
        req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=180) as resp:
            if resp.status == 200:
                # success — parse and return
                print(f"[OCR-STRUCT] Success with {model_name}", file=sys.stderr)
                break
    except urllib.error.HTTPError as e:
        if e.code == 429 and model_name != MODELS[-1]:
            print(f"[OCR-STRUCT] {model_name} rate limited (429), falling back to {MODELS[-1]}", file=sys.stderr)
            continue
        raise
    except Exception as e:
        if "429" in str(e) and model_name != MODELS[-1]:
            print(f"[OCR-STRUCT] {model_name} quota exceeded, trying {MODELS[-1]}", file=sys.stderr)
            continue
        raise
```

**Ce se schimba:** doar `ocr_structured.py` — URL-ul devine dinamic in loc de hardcodat.
**Ce NU se schimba:** prompt-ul, validarea, restul fisierului.
**STOP dupa implementare:** NU, continua cu Interventiile 1-4.

---

## Context

Backend-ul SVG e OK (commit 8b8d7ba). Dar **frontend-ul nu implementeaza metoda 3 pasi (D23)**.

**Ce face ACUM (gresit):**
- Upload → apasa "Traduce" → OCR + traducere dintr-o data → arata rezultatul TRADUS
- Nu exista pas intermediar "Original" sau "HTML RO"
- Cristina nu vede originalul, nu poate corecta OCR-ul inainte de traducere

**Ce trebuie sa faca (D23 — metoda definitiva):**
```
Upload fisier → vede ORIGINALUL (imagine, read-only)
Click RO     → face DOAR OCR → vede HTML romanesc EDITABIL
Click SK     → face traducere ON-DEMAND → vede HTML tradus EDITABIL
```

---

## ANALIZA STARE CURENTA (T3 a verificat codul)

### Ce exista deja si FUNCTIONEAZA:
- `/api/translate` — face OCR + traducere intr-un singur apel (translate.py)
- `/api/translate-text` — traduce sectiuni text on-demand (translate_text.py) — DEJA FUNCTIONAL
- `DocumentViewer.tsx` — are butoane limba (RO/SK/EN), toggle `switchLanguage()`, cache in memorie
- `page.tsx` — `handleTranslate()` trimite fisiere la `/api/translate`, primeste `structured_pages`
- Functia `ocr_structured()` din `api/lib/ocr_structured.py` — face OCR si returneaza JSON structurat

### Ce LIPSESTE:
1. **Endpoint `/api/ocr`** — OCR fara traducere (returneaza structured_pages in limba sursa)
2. **Buton "Original"** — sa arate imaginea uploadata (read-only)
3. **Flow-ul 3 pasi** — upload = arata original, RO = OCR, SK = traducere on-demand
4. **ContentEditable** per paragraf in pasii 2 si 3

---

## CELE 4 INTERVENTII — ORDINE STRICTA

### INTERVENTIE 1: Endpoint `/api/ocr` (backend nou)

**Creaza fisier NOU:** `api/ocr.py`

Acest endpoint face DOAR OCR (fara traducere). Flow:
1. Primeste fisier(e) via multipart/form-data (ca `/api/translate`)
2. PDF → `_pdf_to_images()` cu PyMuPDF (DPI 150) — copiaza logica din translate.py
3. Imagine → `ocr_structured()` din `api/lib/ocr_structured.py`
4. Construieste HTML cu `build_html_structured()` din `api/lib/html_builder.py`
5. Returneaza JSON:

```json
{
  "html": "<html>...documentul in limba sursa...</html>",
  "structured_pages": [...],
  "pages": 1,
  "duration_ms": 12345,
  "status": "success",
  "source_lang": "ro"
}
```

**NU traduce nimic.** Returneaza textul EXACT cum l-a extras Gemini (in limba originala).

**Inregistreaza ruta** in `dev_server.py` (la fel ca celelalte endpoint-uri).
**Rate limiting:** 10/min, 100/zi (la fel ca translate).

### INTERVENTIE 2: Butonul "Traduce" devine "Proceseaza" + flow nou (page.tsx)

**Fisier:** `frontend/src/app/traduceri/page.tsx`

Schimbari in `handleTranslate()` (sau redenumit `handleProcess()`):
1. **Apeleaza `/api/ocr`** in loc de `/api/translate`
2. Salveaza fisierele originale in state (pentru afisare in pasul Original)
3. Salveaza `structured_pages` primite (HTML RO — fara traducere)
4. Trimite la DocumentViewer cu `activeLang = sourceLang` (RO, nu SK)

**State nou necesar:**
```typescript
const [originalFiles, setOriginalFiles] = useState<File[]>([])  // fisierele uploadate
const [ocrPages, setOcrPages] = useState<StructuredPage[]>([])  // OCR fara traducere
```

**Butonul:** textul "Traduce" devine "Proceseaza" (sau "Extrage text").
**Progress steps:** actualizeaza etichetele (scoate "Se traduce..." — nu mai traduce la upload).

### INTERVENTIE 3: DocumentViewer — 3 pasi cu buton Original (frontend)

**Fisier:** `frontend/src/components/traduceri/DocumentViewer.tsx`

**Props noi:**
```typescript
interface DocumentViewerProps {
  structuredPages: StructuredPage[]    // OCR pages (limba sursa — RO)
  fullHtml: string                     // HTML complet pentru download
  sourceLang: string                   // "ro"
  initialTargetLang: string            // NU mai e relevant — porneste cu sourceLang
  translateEngine: string
  filename?: string
  originalFiles?: File[]               // NOU — fisierele uploadate (pentru afisare Original)
}
```

**Butoane toolbar:** `Original` | `RO` | `SK` | `EN`

**Comportament pe fiecare buton:**

**Original (NOU):**
- Afiseaza imaginea uploadata (File → URL.createObjectURL)
- Read-only (nu editabil)
- Stil: cadru A4 cu imaginea centrata
- NU face niciun apel API

**RO (starea initiala dupa upload):**
- Afiseaza HTML-ul din OCR (structured_pages primite)
- EDITABIL (contentEditable pe paragrafe)
- NU face apel API — datele sunt deja in state
- Cristina poate corecta erori OCR aici

**SK / EN (traducere on-demand):**
- La PRIMUL click: apeleaza `/api/translate-text` (deja existent si functional!)
- Trimite sectiunile din pasul RO (eventual editate de Cristina)
- Cache-uieste rezultatul in `cacheRef` (deja implementat in switchLanguage)
- La click-uri ulterioare: din cache, INSTANT
- EDITABIL (contentEditable pe paragrafe)

**IMPORTANT:** `switchLanguage()` deja face aproape tot ce trebuie — apeleaza `/api/translate-text` si cache-uieste. Trebuie doar:
1. Adaugat butonul "Original" care arata imaginea
2. Schimbat starea initiala de la `targetLang` la `sourceLang` (porneste cu RO, nu SK)
3. Cache-ul `cacheRef` sa contina RO din start: `{ ro: structuredPages }`

### INTERVENTIE 4: ContentEditable per paragraf

**Fisier:** `frontend/src/components/traduceri/DocumentViewer.tsx`

In componenta `RenderSection` (linia ~289), adauga `contentEditable="true"` pe elementele text:
- `<h1-h4>` — editabile
- `<p>` (step, paragraph, observation) — editabile
- `<div class="figure-container">` — NU editabil (SVG protejat)
- `<ol>`, `<li>` — editabile

Cand Cristina editeaza un paragraf, textul editat trebuie salvat in `structuredPages` state (sau ref) ca la traducere sa se trimita textul CORECTAT, nu cel original.

---

## CE NU SE SCHIMBA

- **`/api/translate`** — ramane functional (poate fi folosit de alte flow-uri)
- **`/api/translate-text`** — deja functioneaza perfect pentru traducere on-demand
- **`html_builder.py`** — tocmai l-am actualizat, nu se atinge
- **`ocr_structured.py`** — prompt-ul e bun, nu se atinge
- **Cache localStorage** — ramane functional
- **DeeplUsage** — ramane vizibil
- **Rate limiting, CORS, securitate** — nu se atinge

---

## ORDINE EXECUTIE

```
Pas 0: INTERVENTIE 0 — Fallback Gemini Pro → Flash (ocr_structured.py)
Pas 1: INTERVENTIE 1 — Creaza /api/ocr (endpoint OCR fara traducere)
Pas 2: Inregistreaza ruta in dev_server.py
Pas 3: INTERVENTIE 2 — Actualizeaza page.tsx (apeleaza /api/ocr, nu /api/translate)
Pas 4: INTERVENTIE 3 — Actualizeaza DocumentViewer.tsx (buton Original + porneste cu RO + contentEditable)
Pas 5: INTERVENTIE 4 — ContentEditable per paragraf
Pas 6: STOP — raporteaza ce ai facut, asteapta confirmare Roland
Pas 7: Commit + push → Render deploy
Pas 8: Roland testeaza pe Render live cu test_page_1.jpeg
```

---

## METRICI DE SUCCES

Output-ul e OK cand:
- [ ] Upload fisier → apare imaginea originala (buton "Original" activ)
- [ ] Click RO → apare HTML romanesc cu SVG + LaTeX (fara traducere)
- [ ] Click SK → traducere on-demand (5-15 sec prima data, instant din cache dupa)
- [ ] Click Original → revine la imagine (instant)
- [ ] Click RO → revine la HTML romanesc (instant, din cache)
- [ ] Textul din RO si SK e EDITABIL (click pe paragraf → cursor de editare)
- [ ] Figurile SVG NU sunt editabile (protejate)
- [ ] Formulele LaTeX se randeaza corect cu MathJax in pasii RO si SK
- [ ] Butoane vizibile in toolbar: Original | RO | SK (minim)
- [ ] NU se face traducere la upload — doar OCR
- [ ] Gemini Pro → Flash fallback functional (daca Pro da 429, trece automat la Flash)

---

## DECIZII RELEVANTE

| Decizie | Ce spune |
|---------|----------|
| D23 | **METODA DEFINITIVA**: Original (imagine) → HTML RO editabil → HTML tradus editabil |
| D25 | DeepL = DOAR traducere text, DOAR la switch buton limba. Nu la upload |
| D26 | Gemini = OCR + SVG figuri inline (la upload). NU traducere |
| D27 | Prompt OCR cere SVG inline + text structurat |

---

## REFERINTE PENTRU T1

| Fisier | Ce adopti |
|--------|-----------|
| `api/translate.py` liniile 170-296 | Logica PDF expand + OCR — copiaza in `/api/ocr` |
| `api/translate_text.py` | Endpoint traducere on-demand — deja functional, nu modifica |
| `frontend/src/components/traduceri/DocumentViewer.tsx` | `switchLanguage()` — extinde cu buton Original |
| `99_Plan_vs_Audit/PLAN_v3.md` sectiunea D23 | Flow-ul complet al metodei 3 pasi |

---

## NIVEL RISC

**MEDIUM** — se modifica frontend-ul (page.tsx + DocumentViewer.tsx) si se creaza endpoint nou (/api/ocr).
Pipeline-ul existent de traducere NU se atinge.
Daca ceva nu merge, flow-ul vechi (`/api/translate`) ramane functional ca fallback.
