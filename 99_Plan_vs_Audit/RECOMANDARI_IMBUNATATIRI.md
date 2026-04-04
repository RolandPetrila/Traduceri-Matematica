# RECOMANDARI IMBUNATATIRI — Sistem Traduceri Matematica
# Data: 2026-04-04 | Versiune: 3.0 | Mod: complet
# Analiza exhaustiva: inventar functii + imbunatatiri existente + functii noi + tehnic
# Delta fata de v2.0 (2026-03-29): 6 implementate, 12 NOI, 8 actualizate, 4 STERSE (rezolvate)

---

## SUMAR EXECUTIV

**Proiect**: PWA traduceri documente matematica (RO/SK/EN) — LIVE pe Render
**Stack**: Next.js 14 + Python serverless + Gemini 2.5 Pro + DeepL Free
**LOC**: ~7300 (2900 Python + 4000 TypeScript + 400 config)
**Utilizator**: Cristina (profesoara matematica, sectia slovaca)

**Schimbari majore de la v2.0:**
- Gemini 2.5 Flash → **Pro** (commit 8b8d7ba) — ATENTIE: limita 100 RPD
- Prompt OCR rescris: SVG inline (nu bbox/crop)
- html_builder.py refactorizat cu `_render_section()` recursiv
- figure_crop.py DEPRECIAT (SVG inline inlocuieste crop)
- Endpoint `/api/ocr` NOU (OCR fara traducere)
- Sprint 2.6 (metoda 3 pasi) IN EXECUTIE

**Recomandari**: 42 total (17 imbunatatiri existente, 13 functii noi, 12 tehnice)

---

## SUMAR PRIORITATI

| Prioritate | # | Nume | Complexitate | Impact | Categorie |
|---|---|---|---|---|---|
| **P0 — URGENT** | I1 | Gemini Pro quota — fallback la Flash | Mica | Maxim | Backend/Risc |
| **P0 — URGENT** | I2 | Diacritice PDF — font DejaVu in conversii | Mica | Mare | Convertor |
| **P0 — URGENT** | I3 | Rate limiter neintegrat — cod mort | Mica | Mare | Securitate |
| **P0 — URGENT** | I4 | DOMPurify SVG whitelist — XSS prevention | Mica | Mare | Securitate |
| **P1 — IMPORTANT** | I5 | Keep-alive periodic — previne re-sleep Render | Mica | Mare | Performanta |
| **P1 — IMPORTANT** | I6 | Cod mort de sters — 15 functii nefolosite | Mica | Mediu | Calitate cod |
| **P1 — IMPORTANT** | I7 | Validare dimensiune fisiere server-side | Mica | Mediu | Securitate |
| **P1 — IMPORTANT** | I8 | API keys din URL in Authorization header | Medie | Mare | Securitate |
| **P1 — IMPORTANT** | I9 | Error retry cu backoff pt API calls frontend | Medie | Mediu | Robustete |
| **P1 — IMPORTANT** | I10 | Separator traducere batch — JSON nu string split | Medie | Mediu | Robustete |
| **P1 — IMPORTANT** | N1 | Notificare browser la traducere completa | Mica | Mediu | UX |
| **P1 — IMPORTANT** | N2 | Gemini usage tracking (lipsa contor) | Medie | Mediu | Monitorizare |
| **P2 — VALOROS** | I11 | Cache key cu content hash (nu metadata) | Medie | Mediu | Calitate |
| **P2 — VALOROS** | I12 | PDF mare batching D16 neimplementat | Medie | Mediu | Robustete |
| **P2 — VALOROS** | I13 | MathJax deduplicare script in DocumentViewer | Mica | Mic | Performanta |
| **P2 — VALOROS** | I14 | Error handling standardizat backend | Medie | Mediu | Calitate cod |
| **P2 — VALOROS** | N3 | Comparatie vizuala Original vs HTML RO | Medie | Mare | UX |
| **P2 — VALOROS** | N4 | Export PDF nativ din HTML (nu Print→Save) | Medie | Mediu | UX |
| **P2 — VALOROS** | N5 | Undo/redo in editarea text (contentEditable) | Medie | Mediu | UX |
| **P2 — VALOROS** | N6 | Dictionar math bidirectional cu cautare | Mica | Mediu | UX |
| **P2 — VALOROS** | T1 | Unit teste backend (pytest) — 0 acum | Mare | Mare | Calitate |
| **P2 — VALOROS** | T2 | Unit teste frontend (Jest) — 0 acum | Mare | Mare | Calitate |
| **P3 — STRATEGIC** | I15 | Offline cache cu IndexedDB (nu localStorage) | Mare | Mediu | Arhitectura |
| **P3 — STRATEGIC** | I16 | Monitoring batching (nu per-request) | Medie | Mic | Performanta |
| **P3 — STRATEGIC** | I17 | Prompt OCR modular per tip document | Mare | Mare | Calitate OCR |
| **P3 — STRATEGIC** | N7 | Multi-pagina cu navigare pagina X/N | Mare | Mare | UX |
| **P3 — STRATEGIC** | N8 | Zoom si pan pe SVG figuri | Medie | Mediu | UX |
| **P3 — STRATEGIC** | N9 | Istoric versiuni per document (diff) | Mare | Mediu | UX |
| **P3 — STRATEGIC** | N10 | Auto-save editari locale periodic | Medie | Mediu | UX |
| **P3 — STRATEGIC** | T3 | Content Security Policy headers | Medie | Mediu | Securitate |
| **P3 — STRATEGIC** | T4 | Structured logging backend (JSON) | Medie | Mediu | Monitorizare |
| **P4 — NICE-TO-HAVE** | N11 | Dark/light mode toggle | Mica | Mic | UX |
| **P4 — NICE-TO-HAVE** | N12 | Keyboard shortcuts (Ctrl+S save, Ctrl+P print) | Mica | Mic | UX |
| **P4 — NICE-TO-HAVE** | N13 | Drag reorder pagini multi-JPEG | Medie | Mic | UX |
| **P4 — NICE-TO-HAVE** | T5 | Service Worker upgrade la Serwist/next-pwa | Mare | Mic | Arhitectura |
| **P4 — NICE-TO-HAVE** | T6 | Bundle size audit si tree-shaking | Mica | Mic | Performanta |

---

## DELTA FATA DE v2.0 (2026-03-29)

### IMPLEMENTATE de la v2.0 (6 items):
- ~~P0 MathJax nu randeaza~~ → REZOLVAT (html_builder.py rescris cu MathJax config corect)
- ~~P1 figure_crop pixel-by-pixel loop~~ → REZOLVAT (figure_crop.py depreciat, SVG inline)
- ~~P1 Fix iterare files PDF expand~~ → REZOLVAT (translate.py cleanup)
- ~~P1 Fix state global figure pairs~~ → REZOLVAT (figure pairs logic stearsa)
- ~~P2 Comparatie vizuala OCR~~ → PARTIAL (referinte SVG create, test in curs)
- ~~P1 Tab state pierdut~~ → REZOLVAT prin restructurare flow (Sprint 2.6)

### NOI in v3.0 (12 items):
- **I1** Gemini Pro quota 100 RPD — risc epuizare (NOU — upgrade la Pro)
- **I3** Rate limiter neintegrat (descoperit la audit cod — functii exista dar nu sunt apelate)
- **I4** DOMPurify whitelist SVG (CVE-2026 descoperit la web research)
- **I8** API keys in URL (descoperit la audit cod detaliat)
- **I10** Separator batch string split → JSON (risc XSS descoperit)
- **N3** Comparatie vizuala Original vs HTML (din metoda 3 pasi)
- **N5** Undo/redo contentEditable (din Sprint 2.6)
- **N7** Multi-pagina navigare X/N (din PLAN_v3)
- **N8** Zoom SVG (din testare figuri)
- **N10** Auto-save editari (din contentEditable)
- **T3** CSP headers (din audit securitate)
- **T4** Structured logging JSON (din audit cod)

### STERSE (4 — rezolvate de refactorizare):
- figure_crop performance (deprecated)
- MathJax config bug (fixed)
- PDF expand iterare (fixed)
- State global figure pairs (removed)

---

## PARTEA I — IMBUNATATIRI FUNCTII EXISTENTE

### I1. Gemini Pro quota — fallback automat la Flash [P0 URGENT]

**Fisier:** `api/lib/ocr_structured.py` — linia ~94
**Problema actuala:** Commit 8b8d7ba a schimbat modelul de la `gemini-2.5-flash` (250 RPD) la `gemini-2.5-pro` (100 RPD). [CERT] Conform Google (aprilie 2026), Pro pe free tier are doar 5 RPM si 100 RPD — si poate fi rate-limited dupa 10-15 requesturi. Flash are 10 RPM si 250 RPD. Daca Cristina proceseaza 15+ pagini intr-o zi, Pro se blocheaza.

**Imbunatatire propusa:**
- Adauga fallback automat: incearca Pro, daca primeste 429/503 → retry cu Flash
- Log clar: "Pro rate limited, fallback la Flash"
- Pastreaza Pro ca default (calitate mai buna) dar cu plasa de siguranta

**Exemplu implementare:**
```python
MODELS = ["gemini-2.5-pro", "gemini-2.5-flash"]

for model in MODELS:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    try:
        # ... request logic ...
        if resp.status == 429:
            print(f"[OCR-STRUCT] {model} rate limited, trying next model", file=sys.stderr)
            continue
        # success — return result
        break
    except Exception as e:
        if "429" in str(e) or "quota" in str(e).lower():
            continue
        raise
```

**Complexitate:** Mica | **Impact:** Maxim — fara asta, OCR-ul se poate bloca complet

---

### I2. Diacritice PDF — font DejaVu in fpdf2 [P0 URGENT]

**Fisier:** `api/convert.py` — functia `_text_to_pdf()` linia ~143
**Problema actuala:** Cand convertesti Word → PDF sau Markdown → PDF, literele cu diacritice (a, i, s, t romanesti + c, s, z, d slovace) apar gresit ("?" sau patratele). Fontul default fpdf2 nu suporta Unicode complet.

**Imbunatatire propusa:**
- Fontul DejaVuSans.ttf EXISTA deja in `api/fonts/` — dar `_load_dejavu_font()` poate sa nu fie apelat corect in toate cazurile
- Verifica ca TOATE conversiile text→PDF folosesc fontul Unicode

**Exemplu implementare:**
```python
def _text_to_pdf(text: str, title: str = "") -> bytes:
    pdf = FPDF()
    pdf.add_page()
    # OBLIGATORIU: font Unicode
    font_path = os.path.join(os.path.dirname(__file__), "fonts", "DejaVuSans.ttf")
    if os.path.exists(font_path):
        pdf.add_font("DejaVu", "", font_path, uni=True)
        pdf.set_font("DejaVu", size=11)
    else:
        pdf.set_font("Helvetica", size=11)  # fallback fara Unicode
    # ... rest of PDF generation
```

**Complexitate:** Mica | **Impact:** Mare — conversiile PDF sunt broken pt RO/SK

---

### I3. Rate limiter neintegrat — cod mort activ [P0 URGENT]

**Fisier:** `api/lib/rate_limiter.py` (120 linii) + `api/dev_server.py`
**Problema actuala:** Rate limiter-ul e SCRIS (is_rate_limited, cleanup, etc.) dar NICIODATA apelat din handlerii API. Toate cele 5 functii din rate_limiter.py sunt cod mort. Site-ul e PUBLIC — oricine poate epuiza cota DeepL/Gemini fara protectie. PLAN_v3.md il declara "COMPLETAT" dar nu e integrat.

**Imbunatatire propusa:**
- Integreaza `is_rate_limited()` in `dev_server.py` inainte de rutarea requesturilor
- Sau integreaza direct in fiecare handler (`do_POST`)

**Exemplu implementare (in dev_server.py):**
```python
from lib.rate_limiter import is_rate_limited, start_cleanup_timer

# La start server:
start_cleanup_timer()

# In handler, inainte de procesare:
def do_POST(self):
    ip = self.headers.get("X-Forwarded-For", self.client_address[0]).split(",")[0].strip()
    endpoint = self.path.split("?")[0]
    limited, msg = is_rate_limited(ip, endpoint)
    if limited:
        self.send_response(429)
        self.send_header("Retry-After", "60")
        self.end_headers()
        self.wfile.write(json.dumps({"error": msg}).encode())
        return
    # ... rest of processing
```

**Complexitate:** Mica | **Impact:** Mare — protectie API lipsa

---

### I4. DOMPurify SVG whitelist — XSS prevention [P0 URGENT]

**Fisier:** `frontend/src/lib/sanitize.ts` (8 linii) + `frontend/src/components/traduceri/DocumentViewer.tsx`
**Problema actuala:** `sanitizeHtml()` apeleaza DOMPurify fara config explicit. DOMPurify default permite SVG cu event handlers (`<svg onload="alert('xss')">`). [CERT] CVE recent (GHSA-CJMM-F4JC-QW8R, aprilie 2026) afecteaza versiuni < 3.3.2. Proiectul are 3.3.3 (OK pt acel CVE) dar configuratia lipsa e un risc.

**Imbunatatire propusa:**
- Configureaza DOMPurify cu whitelist strict de tag-uri si atribute
- Permite SVG geometric (line, circle, rect, path, text, polygon, polyline) dar blocheaza event handlers

**Exemplu implementare:**
```typescript
// frontend/src/lib/sanitize.ts
import DOMPurify from "dompurify";

const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    // HTML text
    "p", "h1", "h2", "h3", "h4", "h5", "h6", "br", "hr",
    "strong", "em", "b", "i", "u", "sub", "sup", "span",
    "ol", "ul", "li", "div", "table", "tr", "td", "th",
    // SVG geometric
    "svg", "g", "line", "circle", "rect", "path", "polyline", "polygon",
    "text", "tspan", "defs", "marker", "use", "clipPath",
    // MathJax
    "math", "mi", "mo", "mn", "mrow", "msup", "msub", "mfrac",
  ],
  ALLOWED_ATTR: [
    "class", "style", "id", "viewBox", "xmlns", "fill", "stroke",
    "stroke-width", "stroke-dasharray", "d", "cx", "cy", "r", "x", "y",
    "x1", "y1", "x2", "y2", "width", "height", "transform",
    "font-family", "font-size", "font-style", "text-anchor",
    "points", "marker-end", "marker-start", "contenteditable",
  ],
  FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
};

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, PURIFY_CONFIG);
}
```

**Complexitate:** Mica | **Impact:** Mare — inchide vector XSS

---

### I5. Keep-alive periodic — previne re-sleep Render [P1]

**Fisier:** `frontend/src/components/layout/ServerWakeup.tsx` — linia ~124
**Problema actuala:** ServerWakeup.tsx face ping la boot, dar dupa ce serverul e treaz, nu mai trimite nimic. Render pune serverul la somn dupa 15 minute de inactivitate. Daca Cristina lucreaza la un document 20 min fara sa faca cereri API, urmatorul request dureaza 30-60s.

**Imbunatatire propusa:**
- Dupa ce serverul e treaz, trimite ping la /api/health la fiecare 4 minute
- Se opreste cand pagina e inchisa (cleanup in useEffect)

**Exemplu implementare:**
```typescript
// In ServerWakeup.tsx, dupa ce isReady = true:
useEffect(() => {
  if (!isReady) return;
  const keepAlive = setInterval(() => {
    fetch(`${API_URL}/api/health`).catch(() => {});
  }, 4 * 60 * 1000); // 4 minute
  return () => clearInterval(keepAlive);
}, [isReady]);
```

**Complexitate:** Mica | **Impact:** Mare — elimina re-sleep in timpul sesiunii

---

### I6. Cod mort de sters — 15 functii nefolosite [P1]

**Fisiere:** `api/lib/figure_crop.py`, `api/lib/translation_router.py`, `api/lib/math_protect.py`, `api/lib/rate_limiter.py`
**Problema actuala:** 15 functii definite dar niciodata apelate in flow-ul activ. 148 linii figure_crop.py complet depreciat. ~200 linii cod mort in translation_router.py (claude_*, translate_with_groq, ocr_with_mistral).

**Imbunatatire propusa:**
- Sterge `figure_crop.py` complet (depreciat D3/D24)
- Sterge `claude_ocr_and_translate`, `claude_translate_text` din translation_router.py
- Sterge `protect_with_placeholders`, `restore_from_placeholders` din math_protect.py
- Pastreaza `translate_with_groq` si `ocr_with_mistral` DOAR daca sunt fallback-uri planificate

**Complexitate:** Mica | **Impact:** Mediu — reduce confuzia si suprafata de atac

---

### I7. Validare dimensiune fisiere server-side [P1]

**Fisier:** `api/translate.py` — linia ~129
**Problema actuala:** `MAX_BODY_SIZE = 4 * 1024 * 1024 + 4096` e verificat la nivel de body total, dar fisierele individuale nu sunt validate. Un PDF de 3.9MB cu 100 pagini ar trece validarea dar ar crasha serverul (512MB RAM Render).

**Imbunatatire propusa:**
- Validare per fisier: max 4MB
- Validare numar pagini PDF: max 30 (exista deja MAX_PAGES dar e soft limit)
- Reject cu mesaj clar: "Fisierul X depaseste limita de 4MB"

**Complexitate:** Mica | **Impact:** Mediu — previne crash server

---

### I8. API keys din URL in Authorization header [P1]

**Fisier:** `api/lib/ocr_structured.py` linia 94, `api/lib/translation_router.py` linia 44
**Problema actuala:** Cheile Gemini sunt in URL (`?key=...`). Apar in loguri, in stack traces, si in error messages. `_sanitize_error()` incearca sa le stearga dar nu acopera toate cazurile.

**Imbunatatire propusa:**
- Muta cheia din URL in header `x-goog-api-key`
- Gemini API suporta ambele metode

**Exemplu implementare:**
```python
url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent"
req = urllib.request.Request(url, data=payload, headers={
    "Content-Type": "application/json",
    "x-goog-api-key": api_key,
})
```

**Complexitate:** Medie (trebuie schimbat in 3-4 locuri) | **Impact:** Mare — elimina risc expunere chei

---

### I9. Error retry cu backoff pt API calls frontend [P1]

**Fisier:** `frontend/src/app/traduceri/page.tsx` — `handleTranslate()`
**Problema actuala:** Frontend-ul face un singur `fetch()` la API. Daca Gemini raspunde cu 503 (overloaded) sau Render cu 502 (cold start timeout), utilizatorul vede eroare si trebuie sa apese manual din nou.

**Imbunatatire propusa:**
- Retry automat de maxim 2 ori cu backoff (2s, apoi 5s)
- Doar pe erori tranzitorii (502, 503, 429, network error)
- Nu pe 400, 413, 422 (erori de input)

**Complexitate:** Medie | **Impact:** Mediu — experienta mai buna la erori temporare

---

### I10. Separator traducere batch — JSON array nu string split [P1]

**Fisier:** `api/translate_text.py` — linia ~117
**Problema actuala:** Textul se concateneaza cu `"|||SEP|||"` si se trimite ca string la DeepL/Gemini. La split, daca traducerea contine accidental separatorul, rebuild-ul produce sectiuni gresite. Risc de XSS daca un separator ajunge in HTML.

**Imbunatatire propusa:**
- Trimite fiecare sectiune separat (mai lent dar sigur)
- SAU: foloseste JSON array format in loc de string cu separator
- SAU minim: valideaza ca numarul de parti dupa split == numarul de sectiuni input

**Complexitate:** Medie | **Impact:** Mediu — previne coruptie date + potential XSS

---

### I11. Cache key cu content hash [P2]

**Fisier:** `frontend/src/lib/translation-cache.ts` — linia ~25
**Problema actuala:** Cache key bazat pe `file.name:file.size:file.lastModified`. Doua fisiere cu acelasi nume, dimensiune si timestamp ar coliziona. Rar, dar posibil.

**Imbunatatire propusa:**
- Calculeaza SHA-256 din primii 64KB ai fisierului
- Adauga hash-ul la cache key

**Complexitate:** Medie | **Impact:** Mediu — previne coliziuni cache

---

### I12. PDF mare batching D16 neimplementat [P2]

**Fisier:** `api/translate.py` — linia ~197
**Problema actuala:** D16 spune "PDF >20 pagini se proceseaza in loturi de 5" dar codul face `MAX_PAGES = 30` si trunchiaza (nu proceseaza in loturi). Un PDF de 25 pagini pierde paginile 31+.

**Imbunatatire propusa:**
- Implementeaza batching real: proceseaza cate 5 pagini, concateneaza rezultatele
- Mesaj progress: "Procesare lot 1/5..."

**Complexitate:** Medie | **Impact:** Mediu — suport PDF-uri mari

---

### I13. MathJax deduplicare script [P2]

**Fisier:** `frontend/src/components/traduceri/DocumentViewer.tsx` — linia ~76
**Problema actuala:** Script-ul MathJax se adauga la `<head>` la fiecare montare a componentei. Daca DocumentViewer se re-monteaza, se creeaza scripturi duplicate.

**Imbunatatire propusa:**
- Verifica daca script-ul MathJax exista deja inainte de a-l adauga

```typescript
if (!document.getElementById("mathjax-config")) {
  const configScript = document.createElement("script");
  configScript.id = "mathjax-config";
  // ... rest
}
```

**Complexitate:** Mica | **Impact:** Mic — previne memory leak minor

---

### I14. Error handling standardizat backend [P2]

**Fisiere:** `api/translate.py`, `api/lib/translation_router.py`, `api/translate_text.py`
**Problema actuala:** Unele functii arunca RuntimeError, altele returneaza string de eroare, altele fac catch silentios. Mixul face debugging-ul dificil.

**Imbunatatire propusa:**
- Creeaza exceptii custom: `OCRError`, `TranslationError`, `QuotaExhaustedError`
- Toate functiile arunca exceptii (nu returneaza string eroare)
- Handler-ul principal le prinde si genereaza raspuns JSON cu cod HTTP corect

**Complexitate:** Medie | **Impact:** Mediu — debugging si maintainability

---

### I15. Offline cache cu IndexedDB [P3]

**Fisier:** `frontend/src/lib/translation-cache.ts` + NOU
**Problema actuala:** Cache-ul traducerilor e in localStorage (~5MB limita). IndexedDB suporta sute de MB si e mai rapid pt date structurate.

**Imbunatatire propusa:**
- Migreaza cache-ul de traduceri de la localStorage la IndexedDB
- Pastreaza localStorage doar pt setari mici (activeTab, preferences)

**Complexitate:** Mare | **Impact:** Mediu — cache mai mare, mai robust

---

### I16. Monitoring batching [P3]

**Fisier:** `frontend/src/lib/monitoring.ts` — linia ~76
**Problema actuala:** Fiecare log trimite un fetch individual la `/api/logs`. La logging intens, poate DDoS-a propriul server.

**Imbunatatire propusa:**
- Acumuleaza loguri local (max 10 sau 30 secunde)
- Trimite batch periodic

**Complexitate:** Medie | **Impact:** Mic — reduce overhead retea

---

### I17. Prompt OCR modular per tip document [P3]

**Fisier:** `api/lib/ocr_structured.py` — prompt
**Problema actuala:** Prompt-ul e optimizat pentru GEOMETRIE scolara (constructii triunghiuri). Dar manualele contin si algebra, analiza, statistica — care nu au figuri SVG dar au formule complexe.

**Imbunatatire propusa:**
- Detecteaza tipul paginii (geometrie vs algebra vs text pur) din prima trecere OCR
- Aplica prompt specializat per tip (geometrie = SVG conventions, algebra = LaTeX focus)

**Complexitate:** Mare | **Impact:** Mare — calitate OCR pe toate tipurile de continut

---

## PARTEA II — FUNCTII NOI

### N1. Notificare browser la traducere completa [P1]

**Descriere:** Cand traducerea dureaza 30-60 secunde, Cristina poate sa treaca la alt tab. O notificare browser ii spune "Traducerea e gata!" fara sa verifice manual.

**De ce e util:** Cristina fotografiaza 5 pagini, le incarca, si vrea sa lucreze in alt tab. Fara notificare, trebuie sa verifice periodic.

**Complexitate:** Mica | **Impact:** Mediu

**Exemplu implementare:**
```typescript
// In handleTranslate(), dupa succes:
if ("Notification" in window && Notification.permission === "granted") {
  new Notification("Traducere completa!", {
    body: `${files.length} pagini procesate in ${duration}s`,
    icon: "/icons/icon-192.png",
  });
} else if (Notification.permission !== "denied") {
  Notification.requestPermission();
}
```

---

### N2. Gemini usage tracking [P1]

**Descriere:** Contor DeepL exista si e vizibil. Dar Gemini (250 cereri/zi, acum 100 RPD pe Pro) nu are contor vizibil. Cristina nu stie cat a consumat din cota Gemini.

**De ce e util:** Daca Cristina depaseste cota Gemini, OCR-ul se blocheaza fara explicatie. Un contor previne asta.

**Complexitate:** Medie (Gemini API nu are endpoint de usage — trebuie numarat local) | **Impact:** Mediu

**Exemplu implementare:**
- Numara cererile Gemini in `dev_server.py` (variabila globala + endpoint `/api/gemini-usage`)
- Frontend: componenta `GeminiUsage.tsx` (similar cu `DeeplUsage.tsx`)
- Afiseaza: "Cereri Gemini azi: 15/100 (Pro) sau 15/250 (Flash)"

---

### N3. Comparatie vizuala Original vs HTML RO (split view) [P2]

**Descriere:** In metoda 3 pasi, Cristina vede Original SAU HTML RO, dar nu ambele simultan. Un view split (stanga original, dreapta HTML) ar facilita corectarea OCR.

**De ce e util:** Cristina vede eroarea OCR (dreapta) si originalul (stanga) in acelasi timp — corectare mai rapida.

**Complexitate:** Medie | **Impact:** Mare

---

### N4. Export PDF nativ din HTML [P2]

**Descriere:** Acum PDF-ul se genereaza prin Print → Save as PDF (browser). Un buton "Descarca PDF" care genereaza PDF-ul server-side ar fi mai direct.

**De ce e util:** Cristina apasa un buton, primeste PDF-ul descarcabil. Fara dialog print, fara configurare.

**Complexitate:** Medie (necesita html-to-pdf pe server, ex: weasyprint) | **Impact:** Mediu

---

### N5. Undo/redo in editarea text [P2]

**Descriere:** ContentEditable in pasii RO si SK permite editarea textului. Dar daca Cristina sterge accidental un paragraf, nu poate reveni. Ctrl+Z functioneaza partial (browser nativ) dar nu e fiabil cu MathJax re-render.

**De ce e util:** Siguranta la editare — greseli reversibile.

**Complexitate:** Medie | **Impact:** Mediu

---

### N6. Dictionar math cu cautare bidirectionala [P2]

**Descriere:** Dictionary.tsx exista dar permite doar cautare de la sursa la destinatie. Cautare inversa (SK → RO) ar fi utila cand Cristina verifica traducerea.

**De ce e util:** Verifica rapid daca "trojuholnik" inseamna "triunghi".

**Complexitate:** Mica | **Impact:** Mediu

---

### N7. Multi-pagina cu navigare X/N [P3]

**Descriere:** Cand Cristina incarca 5 pagini, vede un document lung cu scroll. Navigare cu butoane "Pagina 1/5", "2/5" ar fi mai naturala (ca in manual).

**De ce e util:** Cristina lucreaza pagina cu pagina, nu pe document intreg.

**Complexitate:** Mare | **Impact:** Mare

---

### N8. Zoom si pan pe figuri SVG [P3]

**Descriere:** Figurile SVG sunt mici in pagina A4. Un click pe figura ar deschide o versiune marita (modal/lightbox) cu zoom si pan.

**De ce e util:** Cristina poate verifica detaliile figurii (etichete, masuri) fara sa forteze ochii.

**Complexitate:** Medie | **Impact:** Mediu

---

### N9. Istoric versiuni per document [P3]

**Descriere:** Cand Cristina editeaza textul in pasul RO sau SK, editarile se pierd daca reincarca pagina. Un sistem de versiuni ar pastra istoricul editarilor.

**De ce e util:** Cristina poate reveni la o versiune anterioara daca a gresit editarea.

**Complexitate:** Mare | **Impact:** Mediu

---

### N10. Auto-save editari locale [P3]

**Descriere:** Editarile contentEditable sa se salveze automat in localStorage la fiecare 30 secunde. La revenire, se restaureaza editarile.

**De ce e util:** Cristina nu pierde munca daca inchide accidental tab-ul sau browserul.

**Complexitate:** Medie | **Impact:** Mediu

---

### N11. Dark/light mode toggle [P4]

**Descriere:** Tema tabla verde e frumoasa dar obositoare dupa ore de lucru. Un toggle light mode ar ajuta.

**Complexitate:** Mica | **Impact:** Mic

---

### N12. Keyboard shortcuts [P4]

**Descriere:** Ctrl+S = salveaza editarile, Ctrl+P = print, Ctrl+Z = undo, Ctrl+1/2/3 = switch limba.

**Complexitate:** Mica | **Impact:** Mic

---

### N13. Drag reorder pagini multi-JPEG [P4]

**Descriere:** Cand Cristina incarca 5 poze, ordinea e dupa nume/selectie. Drag & drop ar permite reordonarea inainte de procesare.

**Complexitate:** Medie | **Impact:** Mic

---

## PARTEA III — IMBUNATATIRI TEHNICE

### T1. Unit teste backend (pytest) [P2]

**Problema:** Zero teste backend. Orice modificare poate introduce regresii nedetectate.
**Solutie:** Adauga pytest cu teste minime pt: `ocr_structured()` (mock Gemini), `build_html_structured()`, `_render_section()`, `protect_for_deepl()`/`restore_from_deepl()`.
**Complexitate:** Mare | **Impact:** Calitate

---

### T2. Unit teste frontend (Jest) [P2]

**Problema:** Zero teste frontend. Componentele complexe (DocumentViewer, FileUpload) pot avea regresii.
**Solutie:** Adauga Jest + React Testing Library. Teste minime pt: cache, sanitize, validator.
**Complexitate:** Mare | **Impact:** Calitate

---

### T3. Content Security Policy headers [P3]

**Problema:** Fara CSP, orice XSS poate incarca scripturi externe. CSP limiteaza daunele.
**Solutie:** Adauga header CSP: `script-src 'self' cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:;`
**Complexitate:** Medie | **Impact:** Securitate

---

### T4. Structured logging backend (JSON) [P3]

**Problema:** `log_to_file()` scrie text liber in `data/logs/`. Greu de parsat si analizat.
**Solutie:** JSON lines format: `{"timestamp":"...","level":"info","endpoint":"/api/translate","duration_ms":1234}`
**Complexitate:** Medie | **Impact:** Monitorizare

---

### T5. Service Worker upgrade la Serwist/next-pwa [P4]

**Problema:** Service Worker-ul e scris manual (sw.js). Librarii precum Serwist ofera precaching, offline fallback, si auto-update.
**Solutie:** Migreaza la `@serwist/next` sau `@ducanh2912/next-pwa`.
**Complexitate:** Mare | **Impact:** Arhitectura

---

### T6. Bundle size audit [P4]

**Problema:** Fara audit de bundle, dependinte neutilizate pot creste dimensiunea.
**Solutie:** Ruleaza `npx @next/bundle-analyzer` si elimina importuri neutilizate.
**Complexitate:** Mica | **Impact:** Performanta

---

## NOTE IMPLEMENTARE

1. **Constrangere R-COST**: Toate solutiile trebuie sa fie 100% gratuite. Nicio recomandare nu introduce costuri.
2. **Gemini Pro vs Flash**: I1 e cea mai urgenta — daca Pro se blocheaza, OCR-ul se opreste complet. Fallback-ul la Flash trebuie implementat INAINTE de deploy productie.
3. **Dependinte intre recomandari**:
   - I3 (rate limiter) trebuie INAINTE de orice deploy public
   - I4 (DOMPurify) trebuie INAINTE de Sprint 2.6 (contentEditable)
   - I1 (Gemini fallback) trebuie INAINTE de testare intensiva
   - N7 (paginare) depinde de Sprint 2.6 (metoda 3 pasi) completat
4. **Ce NU se schimba**: Pipeline-ul DeepL, structura JSON OCR, tema UI, deploy Render

---

## SURSE WEB RESEARCH

- [Gemini API Rate Limits — Google AI](https://ai.google.dev/gemini-api/docs/rate-limits) [CERT]
- [Gemini 2.5 Pro Free Tier 100 RPD](https://www.aifreeapi.com/en/posts/gemini-2-5-pro-free-tier-daily-quota-rpd) [CERT]
- [Gemini API Free Tier April 2026 Changes](https://findskill.ai/blog/gemini-api-pricing-guide/) [PROBABIL]
- [DOMPurify GHSA-CJMM-F4JC-QW8R — April 2026](https://cvereports.com/reports/GHSA-CJMM-F4JC-QW8R) [CERT]
- [DOMPurify GitHub — Config Options](https://github.com/cure53/DOMPurify) [CERT]
- [Next.js PWA Guide — Official](https://nextjs.org/docs/app/guides/progressive-web-apps) [CERT]
- [Serwist for Next.js PWA](https://blog.logrocket.com/nextjs-16-pwa-offline-support/) [CERT]
