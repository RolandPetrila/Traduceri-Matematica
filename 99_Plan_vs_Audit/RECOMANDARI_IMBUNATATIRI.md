# RECOMANDARI IMBUNATATIRI — Sistem Traduceri Matematica

# Data: 2026-04-05 | Versiune: 4.0 | Mod: complet

# Sursa unica de adevar pentru toate imbunatatirile planificate

# Delta v3.0→v4.0: 8 NOI (S1-S8), I1 actualizat, I5 implementat

---

> ⚠️ **STATUS 2026-07-08 (audit complet):** Acest fișier e din era Render (2026-04-05).
> Migrarea v4 (Vercel+Supabase) a implementat DEJA ~85% din listă. Verificat cu dovezi
> file:line — vezi `.claude-outputs/audit/2026-07-08_032710/audit_report.md`.
>
> **DEJA FĂCUTE:** A1–A7, B1–B4, C3(obsolet-ok), D1–D2/D4/D6, E1–E4/E6–E9, F3, G1–G4.
> **OBSOLETE pe Vercel:** C3 standalone, D7 keep-alive (doar Render).
> **RĂMASE (cod):** H1 teste (parțial făcut), M5 retry translate-text, M6 cache SHA-256,
> M7 exceptions.py, E5 SplitView, F2 Jest. **Faza 4 (Chat AI):** G5/G6 neîncepute.
> **BLOCAT pe Roland:** deploy real, flux live e2e, test Android, cheie Google validă.

---

## FAZE DE EXECUTIE (ordine obligatorie)

```
FAZA A — Quick Wins (<30min fiecare, fara riscuri)
FAZA B — Securitate (obligatoriu inainte de orice test intensiv)
FAZA C — Modernizare stack (upgrade-uri versiuni)
FAZA D — Performanta & Robustete
FAZA E — UX & Functii noi
FAZA F — Calitate cod & Teste (cand proiectul stabilizeaza)
```

---

## FAZA A — QUICK WINS

_Executie: fiecare item max 30min, risc LOW, fara dependencies_

### [A1] npm audit fix — 2 vulnerabilitati HIGH

**Fisier:** `frontend/`
**Problema:** 2 HIGH in `picomatch` (ReDoS + method injection)
**Implementare:**

```bash
cd frontend && npm audit fix
```

**Verifica:** `npm audit` sa nu mai raporteze HIGH. ✓

---

### [A2] import fitz → import pymupdf (deprecation fix)

**Fisier:** `api/translate.py`, orice alt fisier cu `import fitz`
**Problema:** `fitz` este depreciat in PyMuPDF 1.25+, va fi eliminat
**Implementare:**

```python
# Inlocuieste peste tot:
import fitz  →  import pymupdf as fitz
# SAU foloseste direct pymupdf:
import pymupdf
doc = pymupdf.open(...)
```

**Verifica:** `grep -r "import fitz" api/` sa returneze 0 rezultate. ✓

---

### [A3] Pin versiuni Python in requirements.txt

**Fisier:** `requirements.txt`
**Problema:** `>=` permite upgrade automat la versiuni breaking. Render poate instala versiuni incompatibile.
**Implementare:**

```bash
# In virtualenv local (cu toate pachetele instalate):
pip freeze | grep -E "pypdf|python-docx|Pillow|markdown|fpdf2|PyMuPDF" > requirements_pinned.txt
# Copiaza versiunile exacte in requirements.txt
```

**Rezultat final:**

```
pypdf==4.x.x
python-docx==1.x.x
Pillow==11.x.x
Markdown==3.x.x
fpdf2==2.x.x
PyMuPDF==1.x.x
```

**Verifica:** Deploy Render reusit dupa schimbare. ✓

---

### [A4] Dead code cleanup

**Fisiere:** `api/translate.py` linia 45, `api/translate_text.py` linia 16
**Problema:** Import depreciat `figure_crop` si `import time` nefolosit
**Implementare:**

```python
# In translate.py — sterge:
from lib.figure_crop import embed_crops_in_sections  # DEPRECIAT D3

# In translate_text.py — sterge:
import time  # unused
```

**Verifica:** Server porneste fara ImportError. ✓

---

### [A5] Fix memory leak Object URLs

**Fisier:** `frontend/src/components/traduceri/DocumentViewer.tsx` linia ~77
**Problema:** `URL.createObjectURL()` fara cleanup cand `originalFiles` se schimba = memory leak
**Implementare:**

```typescript
// Inlocuieste useMemo cu useEffect + state:
const [originalUrls, setOriginalUrls] = useState<string[]>([]);

useEffect(() => {
  const urls = originalFiles.map((f) => URL.createObjectURL(f));
  setOriginalUrls(urls);
  return () => urls.forEach((url) => URL.revokeObjectURL(url)); // cleanup
}, [originalFiles]);
```

**Verifica:** DevTools → Memory nu creste la re-selectare fisiere. ✓

---

### [A6] MathJax 3 → 4.0 (CDN update)

**Fisier:** `api/lib/html_builder.py` (URL CDN in HTML template) + `frontend/src/components/traduceri/DocumentViewer.tsx`
**Problema:** MathJax 4.0 disponibil: +30% rendering mai rapid, line-breaking, accesibilitate
**Implementare:**

```html
<!-- Inlocuieste URL-ul CDN MathJax 3.x cu: -->
<script
  src="https://cdn.jsdelivr.net/npm/mathjax@4/tex-chtml.js"
  id="MathJax-script"
  async
></script>
```

**Verifica:** Formule LaTeX randate corect dupa schimbare. ✓

---

### [A7] Inversare Gemini Flash primary → Pro fallback

**Fisier:** `api/lib/ocr_structured.py` linia ~94
**Problema:** Pro are 100 RPD, Flash are 1.000 RPD. Acum e invers. La 15+ pagini/zi OCR-ul se blocheaza.
**Implementare:**

```python
# Schimba ordinea in lista MODELS:
MODELS = ["gemini-2.5-flash", "gemini-2.5-pro"]  # Flash first (1000 RPD), Pro fallback (100 RPD)
```

**Verifica:** OCR functioneaza, log arata "Folosesc gemini-2.5-flash". ✓

---

## FAZA B — SECURITATE

_Executie: obligatoriu inainte de orice testare intensiva sau deploy public_

### [B1] Rate limiter integrat pe Render (I3)

**Fisier:** `api/dev_server.py` (sau handler-ul principal)
**Problema:** `rate_limiter.py` e scris dar NICIODATA apelat. API-ul e nprotejat.
**Implementare:**

```python
# In dev_server.py, adauga la inceput:
from lib.rate_limiter import is_rate_limited, start_cleanup_timer
start_cleanup_timer()  # porneste cleanup la fiecare 5min

# In do_POST, PRIMUL lucru:
def do_POST(self):
    ip = self.headers.get("X-Forwarded-For", self.client_address[0]).split(",")[0].strip()
    endpoint = self.path.split("?")[0]
    limited, msg = is_rate_limited(ip, endpoint)
    if limited:
        self.send_response(429)
        self.send_header("Content-Type", "application/json")
        self.send_header("Retry-After", "60")
        self.end_headers()
        self.wfile.write(json.dumps({"error": msg}).encode())
        return
    # ... restul
```

**Verifica:** 11 cereri rapide pe /api/translate → a 11-a returneza 429. ✓

---

### [B2] DOMPurify SVG whitelist (I4)

**Fisier:** `frontend/src/lib/sanitize.ts`
**Problema:** DOMPurify fara config permite `<svg onload="xss">`. XSS vector activ.
**Implementare:**

```typescript
// Inlocuieste complet sanitize.ts cu:
import DOMPurify from "dompurify";

const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    "p",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "br",
    "hr",
    "strong",
    "em",
    "b",
    "i",
    "u",
    "sub",
    "sup",
    "span",
    "ol",
    "ul",
    "li",
    "div",
    "table",
    "tr",
    "td",
    "th",
    "thead",
    "tbody",
    "svg",
    "g",
    "line",
    "circle",
    "rect",
    "path",
    "polyline",
    "polygon",
    "ellipse",
    "text",
    "tspan",
    "defs",
    "marker",
    "use",
    "clipPath",
    "title",
    "math",
    "mi",
    "mo",
    "mn",
    "mrow",
    "msup",
    "msub",
    "mfrac",
    "msqrt",
    "mtext",
  ],
  ALLOWED_ATTR: [
    "class",
    "style",
    "id",
    "contenteditable",
    "viewBox",
    "xmlns",
    "fill",
    "stroke",
    "stroke-width",
    "stroke-dasharray",
    "stroke-linecap",
    "d",
    "cx",
    "cy",
    "r",
    "rx",
    "ry",
    "x",
    "y",
    "x1",
    "y1",
    "x2",
    "y2",
    "width",
    "height",
    "transform",
    "font-family",
    "font-size",
    "font-style",
    "font-weight",
    "text-anchor",
    "points",
    "marker-end",
    "marker-start",
    "marker-mid",
    "refX",
    "refY",
    "orient",
    "markerWidth",
    "markerHeight",
    "clip-path",
    "opacity",
  ],
  FORBID_ATTR: [
    "onerror",
    "onload",
    "onclick",
    "onmouseover",
    "onfocus",
    "onblur",
    "onkeydown",
  ],
};

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, PURIFY_CONFIG);
}
```

**Verifica:** `<svg onload="alert(1)">` → sanificat la `<svg>`. ✓

---

### [B3] API keys din URL in Authorization header (I8)

**Fisier:** `api/lib/ocr_structured.py` linia ~94, `api/lib/translation_router.py` linia ~44
**Problema:** `?key=AIza...` apare in loguri, stack traces, error messages.
**Implementare:**

```python
# Inlocuieste URL cu key:
url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

# Cu header:
url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
req = urllib.request.Request(url, data=payload, headers={
    "Content-Type": "application/json",
    "x-goog-api-key": api_key,
})
```

**Verifica:** Loguri de eroare Gemini nu contin cheia API. ✓

---

### [B4] Validare dimensiune fisiere server-side (I7)

**Fisier:** `api/translate.py` linia ~129
**Problema:** Validarea e pe body total dar nu per fisier. PDF 3.9MB cu 100 pagini trece dar crasheaza serverul.
**Implementare:**

```python
# Dupa parsare multipart, verifica fiecare fisier:
for file_info in files:
    if len(file_info["data"]) > 4 * 1024 * 1024:
        raise ValueError(f"Fisierul {file_info.get('filename','?')} depaseste limita de 4MB")
    # Verifica pagini PDF:
    if file_info.get("mime_type") == "application/pdf":
        doc = pymupdf.open(stream=file_info["data"], filetype="pdf")
        if len(doc) > 30:
            raise ValueError(f"PDF-ul are {len(doc)} pagini. Limita: 30 pagini.")
```

**Verifica:** Upload PDF 31 pagini → 413 cu mesaj clar. ✓

---

## FAZA C — MODERNIZARE STACK

_Executie: dupa Faza A si B, testeaza bine dupa fiecare upgrade_

### [C1] Next.js 14 → 15.x (CVE CRITIC)

**Fisier:** `frontend/package.json`
**Problema:** CVE-2025-29927 — authorization bypass in middleware, afecteaza 14.x stabil. [CERT]
**Implementare:**

```bash
cd frontend
npx @next/codemod@latest upgrade  # tool automat migrare
# SAU manual:
npm install next@15 react@19 react-dom@19
npm install --save-dev @types/react@19 @types/react-dom@19
```

**Breaking changes de rezolvat:**

- `cookies()`, `headers()`, `params` devin async → adauga `await`
- `fetch()` nu mai face cache implicit → adauga `cache: 'force-cache'` explicit unde e necesar
- `useFormState` → `useActionState`

**Verifica:** `npm run build` fara erori, toate paginile functionale. ✓

---

### [C2] Tailwind v3 → v4 (optional, dupa C1)

**Fisier:** `frontend/package.json`, `frontend/tailwind.config.ts`, `frontend/globals.css`
**Problema:** Tailwind v4 (Rust engine): build de la 3.5s la <100ms. Tool automat disponibil.
**Implementare:**

```bash
cd frontend
npx @tailwindcss/upgrade  # migreaza config automat
```

**Verifica:** UI arata identic vizual. `npm run dev` porneste rapid. ✓

---

### [C3] Next.js output standalone (reduce cold start)

**Fisier:** `frontend/next.config.js`
**Problema:** Deploy fara `standalone` include fisiere inutile, creste footprint Render.
**Implementare:**

```javascript
// In next.config.js:
const nextConfig = {
  output: "standalone",
  // ... restul configuratiei existente
};
```

**Verifica:** `.next/standalone/` creat dupa `npm run build`. ✓

---

## FAZA D — PERFORMANTA & ROBUSTETE

_Executie: dupa Faza C, sau independent daca nu faci upgrade-uri_

### [D1] Batch traduceri — elimina N+1 requests

**Fisier:** `frontend/src/components/traduceri/DocumentViewer.tsx` linia ~188, `api/translate_text.py`
**Problema:** Fiecare sectiune = 1 cerere HTTP separata. Document cu 50 sectiuni = 50 cereri.
**Implementare backend** (`api/translate_text.py`):

```python
# Accepta array de texte in loc de text singular:
def do_POST(self):
    body = json.loads(self.rfile.read(...))
    texts = body.get("texts")  # array
    target_lang = body.get("target_lang")

    if texts:
        results = [translate_text(t, target_lang) for t in texts]
        response = {"translations": results}
    else:
        text = body.get("text")
        result = translate_text(text, target_lang)
        response = {"translation": result}
```

**Implementare frontend** (`DocumentViewer.tsx`):

```typescript
// In loc de loop cu fetch individual:
const allTexts = sections.map((s) => s.text);
const res = await fetch(`${API_URL}/api/translate-text`, {
  method: "POST",
  body: JSON.stringify({ texts: allTexts, target_lang: lang }),
});
const { translations } = await res.json();
```

**Verifica:** DevTools Network → 1 cerere la switch limba in loc de N. ✓

---

### [D2] Request deduplication cu AbortController

**Fisier:** `frontend/src/components/traduceri/DocumentViewer.tsx`
**Problema:** Switch rapid RO→SK→RO generaza cereri duplicate, risipeste cota API.
**Implementare:**

```typescript
const abortControllerRef = useRef<AbortController | null>(null);

const translateTo = async (lang: string) => {
  // Anuleaza cererea anterioara:
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }
  abortControllerRef.current = new AbortController();

  try {
    const res = await fetch(url, {
      signal: abortControllerRef.current.signal,
      // ...
    });
  } catch (err) {
    if (err.name === "AbortError") return; // ignore, normal
    throw err;
  }
};
```

**Verifica:** Switch rapid de 5 ori → DevTools arata cereri anulate (red), doar ultima completa. ✓

---

### [D3] Error retry cu backoff (I9)

**Fisier:** `frontend/src/app/traduceri/page.tsx` — `handleTranslate()`
**Problema:** Un singur fetch fara retry. Erori tranzitorii (502/503 Render cold start) = utilizatorul vede eroare.
**Implementare:**

```typescript
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 2,
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);
    if (res.ok || [400, 413, 422].includes(res.status)) return res; // nu retry pe erori de input
    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, attempt === 0 ? 2000 : 5000));
    }
  }
  throw new Error("Server indisponibil dupa 3 incercari");
}
```

**Verifica:** Simuleaza 503 (opreste temporar API) → frontend reincearca automat. ✓

---

### [D4] PDF mare batching D16 (I12)

**Fisier:** `api/translate.py` linia ~197
**Problema:** `MAX_PAGES = 30` trunchiaza, nu proceseaza in loturi. PDF 25 pagini pierde paginile 31+.
**Implementare:**

```python
BATCH_SIZE = 5

def process_in_batches(pages, batch_size=BATCH_SIZE):
    for i in range(0, len(pages), batch_size):
        batch = pages[i:i+batch_size]
        batch_num = i // batch_size + 1
        total_batches = (len(pages) + batch_size - 1) // batch_size
        print(f"[TRANSLATE] Lot {batch_num}/{total_batches}...", file=sys.stderr)
        yield batch
```

**Verifica:** PDF 25 pagini → proceseaza tot, nu trunchiaza. ✓

---

### [D5] Separator batch → JSON array (I10)

**Fisier:** `api/translate_text.py` linia ~117
**Problema:** `"|||SEP|||"` ca separator poate aparea in traduceri → coruptie date.
**Implementare:** Integrat in D1 (batch traduceri) — trimite JSON array direct, nu string cu separator.

---

### [D6] MathJax deduplicare script (I13)

**Fisier:** `frontend/src/components/traduceri/DocumentViewer.tsx` linia ~76
**Problema:** Script MathJax adaugat la fiecare montare — duplicate la re-montare.
**Implementare:**

```typescript
// Inainte de a adauga scriptul, verifica:
if (!document.getElementById("mathjax-script")) {
  const script = document.createElement("script");
  script.id = "mathjax-script";
  script.src = "https://cdn.jsdelivr.net/npm/mathjax@4/tex-chtml.js";
  script.async = true;
  document.head.appendChild(script);
}
```

**Verifica:** Re-montare DocumentViewer → 1 singur script MathJax in DOM. ✓

---

### [D7] Keep-alive periodic anti-sleep (I5) — IMPLEMENTAT (commit 70bc75b)

**Status:** ✅ Implementat. Cron job pe Render pinguieste API la fiecare 10 minute.

---

## FAZA E — UX & FUNCTII NOI

### [E1] Notificare browser la traducere completa (N1) [P1]

**Fisier:** `frontend/src/app/traduceri/page.tsx` — dupa succes in `handleTranslate()`
**Implementare:**

```typescript
// Dupa traducere completa:
const showNotification = async (pageCount: number, duration: number) => {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default")
    await Notification.requestPermission();
  if (Notification.permission === "granted") {
    new Notification("Traducere completa!", {
      body: `${pageCount} pagini procesate in ${duration}s`,
      icon: "/icons/icon-192.png",
    });
  }
};
```

---

### [E2] Gemini usage tracking (N2) [P1]

**Fisiere:** `api/dev_server.py` (contor global) + NOU `frontend/src/components/traduceri/GeminiUsage.tsx`
**Implementare backend:**

```python
# Global counter in dev_server.py:
_gemini_calls_today = {"count": 0, "date": ""}

def increment_gemini_counter():
    today = datetime.now().strftime("%Y-%m-%d")
    if _gemini_calls_today["date"] != today:
        _gemini_calls_today["count"] = 0
        _gemini_calls_today["date"] = today
    _gemini_calls_today["count"] += 1

# Endpoint /api/gemini-usage returneaza count + limita (Flash=1000/Pro=100)
```

**Implementare frontend:** Similar cu `DeeplUsage.tsx` — bara vizuala verde/galben/rosu.

---

### [E3] Diacritice PDF — font DejaVu (I2) [P0]

**Fisier:** `api/convert.py` — `_text_to_pdf()` linia ~143
**Problema:** Conversii Word/MD → PDF produc "?" pt litere cu diacritice RO/SK.
**Implementare:**

```python
def _text_to_pdf(text: str, title: str = "") -> bytes:
    pdf = FPDF()
    pdf.add_page()
    font_path = os.path.join(os.path.dirname(__file__), "fonts", "DejaVuSans.ttf")
    if os.path.exists(font_path):
        pdf.add_font("DejaVu", "", font_path, uni=True)
        pdf.set_font("DejaVu", size=11)
    else:
        pdf.set_font("Helvetica", size=11)
    pdf.multi_cell(0, 7, text)
    return bytes(pdf.output())
```

**Verifica:** "ăîșțâčšžďľ" → apar corect in PDF generat. ✓

---

### [E4] Lazy loading componente (S9) [P2]

**Fisier:** `frontend/src/app/page.tsx` linia ~35
**Implementare:**

```typescript
import dynamic from "next/dynamic";

const TraduceriPage = dynamic(() => import("./traduceri/page"), { loading: () => <div>Se incarca...</div> });
const ConvertorPage = dynamic(() => import("./convertor/page"), { loading: () => <div>Se incarca...</div> });
const HistoryList = dynamic(() => import("@/components/history/HistoryList"), { ssr: false });
```

---

### [E5] Comparatie vizuala split view Original vs HTML (N3) [P2]

**Fisier:** NOU `frontend/src/components/traduceri/SplitView.tsx`
**Implementare:** CSS Grid cu 2 coloane. Stanga: `<img>` original. Dreapta: HTML reconstruit. Scroll sincronizat.

---

### [E6] Auto-save editari locale (N10) [P3]

**Fisier:** `frontend/src/components/traduceri/DocumentViewer.tsx`
**Implementare:** `setInterval` la 30s care salveaza `innerHTML` din contentEditable in localStorage cu key `autosave_${cacheKey}_${lang}`.

---

### [E7] Undo/redo in editare (N5) [P3]

**Fisier:** `frontend/src/components/traduceri/DocumentViewer.tsx`
**Implementare:** Stack de max 20 snapshots HTML. Ctrl+Z pop, Ctrl+Y push. Nu reinitializa MathJax daca nu exista formule noi.

---

### [E8] Multi-pagina navigare X/N (N7) [P3]

**Fisier:** `frontend/src/components/traduceri/DocumentViewer.tsx` + CSS
**Implementare:** Afiseaza doar pagina activa (CSS `display:none` pe celelalte). Butoane ← → cu pagina curenta/total.

---

### [E9] Dictionar math bidirectional (N6) [P2]

**Fisier:** `frontend/src/components/dictionary/Dictionary.tsx`
**Implementare:** Toggle buton RO→SK / SK→RO care inverseaza directia cautarii.

---

## FAZA F — CALITATE COD & TESTE

_Executie: cand proiectul e stabil si inainte de Faza 4 (Chat AI)_

### [F1] Unit teste backend pytest (T1) [P2]

**Fisier:** NOU `api/tests/`
**Implementare minima:**

```python
# tests/test_ocr.py — mock Gemini API
# tests/test_html_builder.py — build_html_structured()
# tests/test_translation_router.py — mock DeepL/Gemini
# tests/test_sanitize.py — protectie formule
```

```bash
pip install pytest pytest-mock
pytest api/tests/ -v
```

---

### [F2] Unit teste frontend Jest (T2) [P2]

**Fisier:** NOU `frontend/src/__tests__/`
**Implementare minima:** `translation-cache.test.ts`, `sanitize.test.ts`, `validator.test.ts`

---

### [F3] Structured logging JSON (T4) [P3]

**Fisier:** `api/` — functia `log_to_file()`
**Implementare:** Inlocuieste text liber cu:

```python
import json
log_entry = {"ts": datetime.now().isoformat(), "level": "info", "endpoint": path, "duration_ms": ms}
log_file.write(json.dumps(log_entry) + "\n")
```

---

### [F4] Error handling standardizat backend (I14) [P2]

**Fisiere:** `api/translate.py`, `api/lib/translation_router.py`, `api/translate_text.py`
**Implementare:** Creeaza `api/lib/exceptions.py` cu `OCRError`, `TranslationError`, `QuotaExhaustedError`. Toate modulele arunca exceptii, handlerul principal le prinde si genereaza HTTP corect.

---

### [F5] Bundle size audit (T6) [P4]

**Implementare:**

```bash
cd frontend
npm install --save-dev @next/bundle-analyzer
ANALYZE=true npm run build
```

---

### [F6] Cache key cu content hash (I11) [P2]

**Fisier:** `frontend/src/lib/translation-cache.ts` linia ~25
**Implementare:** Calculeaza SHA-256 din primii 64KB ai fisierului (Web Crypto API), adauga hash la cache key.

---

---

## FAZA G — AI API EXTENSIONS

_Sursa: analiza TOP20_AI_API_GRATUITE_2026.md (2026-04-06)_
_Executie: G1 imediat (30min), G2-G3 in Faza D, G4-G5 la Faza 4 Chat AI_

### Chain-uri complete dupa implementare Faza G

```
OCR (in ordine prioritate):
  Gemini Flash (1000 RPD)
    → Gemini Flash-Lite (1500 RPD)   [G1 — NOU]
    → Gemini Pro (100 RPD)
    → Mistral OCR (1B tok/luna)      [G2 — NOU, alt provider]

TRADUCERE (in ordine prioritate):
  DeepL (1M chars/luna, 2 chei)
    → NLLB HuggingFace (1000 req/zi, ro→sk direct)  [G3 — NOU]
    → OpenRouter auto (free models)                  [G4 — NOU]
    → Groq Llama (14.400 req/zi)
    → Gemini Flash

CHAT AI — Faza 4 (in ordine prioritate):
  Cerebras (text, 1M tok/zi, 2000 tok/sec)   [G5 — NOU]
    → Groq (backup rapid)
    → GitHub o3-mini (math reasoning)         [G6 — NOU]
    → Gemini Flash (poze/multimodal)
```

---

### [G1] Gemini Flash-Lite — tier 3 OCR [P0, 30min]

**Fisier:** `api/lib/ocr_structured.py`
**Problema:** Chain-ul actual are doar 2 tiere Gemini (Flash 1000 RPD + Pro 100 RPD = 1100 total). Flash-Lite exista la 1500 RPD si nu e folosit.
**Implementare:** Adauga un singur string in lista MODELS:

```python
# In ocr_structured.py, inlocuieste lista de modele cu:
MODELS = [
    "gemini-2.5-flash",       # Principal: 1000 RPD, calitate buna
    "gemini-2.5-flash-lite",  # Intermediar: 1500 RPD, calitate ok pt docs simple
    "gemini-2.5-pro",         # Rezerva calitate: 100 RPD, doar docs complexe
]
# Total disponibil: 2600 RPD in loc de 1100 RPD
```

**Verifica:** La epuizare Flash, log arata "switching to gemini-2.5-flash-lite". ✓
**Efort:** MIC (<30min) | **ROI: 8/10**

---

### [G2] Mistral OCR — fallback OCR alt provider [P1, 3-4h]

**Fisier:** `api/lib/ocr_structured.py` + `api/lib/translation_router.py`
**Problema:** Toti tierii OCR actuali sunt Gemini. Daca Google are probleme, tot OCR-ul pica. Mistral OCR returneaza Markdown structurat cu layout preservation, 1B tokens/luna, servere EU (GDPR).
**Limitare importanta:** 2 RPM pe planul gratuit (max 2 pagini/minut). Util ca fallback, nu ca principal. Nu genereaza SVG — returneaza Markdown. Ideal pentru documente text-only (algebra, analiza).
**Implementare:**

```python
# In api/lib/ocr_structured.py — adauga functie noua:
def ocr_with_mistral(file_bytes: bytes, mime_type: str) -> dict:
    """Fallback OCR cu Mistral — returneaza Markdown structurat (fara SVG)."""
    from mistralai import Mistral
    import base64

    api_key = os.environ.get("MISTRAL_API_KEY")
    if not api_key:
        raise RuntimeError("MISTRAL_API_KEY not set")

    client = Mistral(api_key=api_key)
    b64 = base64.b64encode(file_bytes).decode()

    if mime_type == "application/pdf":
        doc = {"type": "document_url", "document_url": f"data:application/pdf;base64,{b64}"}
    else:
        doc = {"type": "image_url", "image_url": f"data:{mime_type};base64,{b64}"}

    response = client.ocr.process(model="mistral-ocr-latest", document=doc)

    # Converteste Markdown la structura JSON compatibila cu html_builder.py
    sections = []
    for page in response.pages:
        sections.append({
            "type": "paragraph",
            "content": page.markdown,
            "figures": []  # Mistral OCR nu genereaza SVG
        })
    return {"sections": sections, "source": "mistral-ocr"}


# In ocr_structured.py — integreaza ca tier 4 in functia principala:
def ocr_structured(file_bytes, mime_type, source_lang="ro"):
    # ... logica Gemini existenta ...
    # Dupa ce toate tierele Gemini esueaza:
    print("[OCR] Toate tierele Gemini epuizate, incerc Mistral OCR...", file=sys.stderr)
    try:
        return ocr_with_mistral(file_bytes, mime_type)
    except Exception as e:
        raise RuntimeError(f"Toate metodele OCR au esuat: {e}")
```

**Verifica:** Blocheaza cheile Gemini in .env → OCR cade pe Mistral, returneaza HTML (fara figuri SVG). ✓
**Efort:** MEDIU (3-4h) | **ROI: 9/10**

---

### [G3] NLLB HuggingFace — traducere ro→sk directa [P1, 1-2h]

**Fisier:** `api/lib/translation_router.py`
**Problema:** Fallback-urile actuale (Gemini, Groq) traduc prin engleza ca pivot — calitate mai slaba pentru perechi de limbi europene minore. NLLB-200 e antrenat explicit pe ro→sk direct.
**Implementare:**

```python
# In translation_router.py — adauga functie noua:
import urllib.request

def translate_with_nllb(text: str, target_lang: str) -> str:
    """Traducere cu NLLB-200 via HuggingFace Inference API — ro→sk direct."""
    hf_token = os.environ.get("HF_TOKEN")
    if not hf_token:
        raise RuntimeError("HF_TOKEN not set")

    # Mapeaza limba la codul NLLB
    lang_map = {"sk": "slk_Latn", "en": "eng_Latn", "ro": "ron_Latn"}
    tgt_lang = lang_map.get(target_lang, "slk_Latn")

    api_url = "https://api-inference.huggingface.co/models/facebook/nllb-200-distilled-1.3B"
    payload = json.dumps({
        "inputs": text,
        "parameters": {"src_lang": "ron_Latn", "tgt_lang": tgt_lang, "max_length": 512}
    }).encode()

    req = urllib.request.Request(
        api_url,
        data=payload,
        headers={"Authorization": f"Bearer {hf_token}", "Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        result = json.loads(resp.read())
        return result[0]["translation_text"]


# In TRANSLATION_PROVIDERS din translation_router.py — adauga:
# DeepL → NLLB (ro→sk direct) → Gemini → Groq
```

**Nota:** La primul request dupa inactivitate, modelul HF are cold start 30-60s. Al doilea request e instant.
**Verifica:** `translate_with_nllb("Fie triunghiul ABC dreptunghic", "sk")` → returneaza slovaca corecta. ✓
**Efort:** MIC (1-2h) | **ROI: 7/10**

---

### [G4] OpenRouter — fallback traducere auto [P2, 1h]

**Fisier:** `api/lib/translation_router.py`
**Problema:** Lantul de fallback manual necesita mentenanta la fiecare schimbare de API. OpenRouter face routing si fallback automat printr-un singur endpoint.
**Implementare:**

```python
# In translation_router.py — adauga ca ultimul fallback inainte de Groq:
def translate_with_openrouter(text: str, target_lang: str) -> str:
    """Fallback traducere via OpenRouter — selectie automata model gratuit."""
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY not set")

    lang_names = {"sk": "Slovak", "en": "English", "ro": "Romanian"}
    lang_name = lang_names.get(target_lang, target_lang)

    payload = json.dumps({
        "model": "openrouter/auto",
        "messages": [{"role": "user", "content": f"Translate to {lang_name} (preserve math formulas): {text}"}]
    }).encode()

    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "X-OR-Fallback": "meta-llama/llama-3.3-70b:free,deepseek/deepseek-v3:free,google/gemma-3-27b:free"
        }
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        result = json.loads(resp.read())
        return result["choices"][0]["message"]["content"]
```

**Limite:** 50 req/zi fara sold in cont, 1000 req/zi cu $10. Ca fallback de urgenta e suficient.
**Verifica:** Cu celelalte chei blocate, traducerea cade pe OpenRouter si returneaza text tradus. ✓
**Efort:** MIC (1h) | **ROI: 6/10**

---

### [G5] Cerebras — Chat AI ultra-rapid [P3, la Faza 4]

**Fisier:** NOU `api/lib/chat_providers.py` (Faza 4)
**Problema:** Groq are 500 tok/sec — bun. Cerebras are 2000 tok/sec — de 4x mai rapid. La streaming in Chat AI, diferenta e vizibila: textul apare instant vs cu un lag mic.
**Implementare (la Faza 4):**

```python
# In api/lib/chat_providers.py:
def chat_stream_cerebras(messages: list, system_prompt: str = ""):
    """Streaming ultra-rapid cu Cerebras — 2000 tokens/sec."""
    from cerebras.cloud.sdk import Cerebras

    api_key = os.environ.get("CEREBRAS_API_KEY")
    if not api_key:
        raise RuntimeError("CEREBRAS_API_KEY not set")

    client = Cerebras(api_key=api_key)
    all_messages = []
    if system_prompt:
        all_messages.append({"role": "system", "content": system_prompt})
    all_messages.extend(messages)

    stream = client.chat.completions.create(
        model="llama3.3-70b",
        messages=all_messages,
        stream=True,
        max_tokens=1024
    )
    for chunk in stream:
        content = chunk.choices[0].delta.content
        if content:
            yield content

# Provider order in chat: Cerebras (viteza) → Groq (backup) → Gemini (poze)
```

**Limite:** 1M tokens/zi, 30 RPM, 14.400 RPD — suficient pt utilizare scolara.
**Efort:** MIC (1-2h, la Faza 4) | **ROI: 8/10 (la Faza 4)**

---

### [G6] GitHub Models o3-mini — math reasoning in Chat AI [P3, la Faza 4]

**Fisier:** NOU `api/lib/chat_providers.py` (Faza 4)
**Problema:** Groq/Cerebras sunt rapide dar nu au reasoning matematic specializat. o3-mini rezolva ecuatii si demonstratii pas-cu-pas — ideal pentru "Cristina intreaba: demonstreaza teorema".
**Implementare (la Faza 4):**

```python
# In api/lib/chat_providers.py:
def chat_math_reasoning(question: str) -> str:
    """Reasoning matematic pas-cu-pas cu o3-mini via GitHub Models."""
    import urllib.request

    github_token = os.environ.get("GITHUB_TOKEN")  # Personal Access Token
    if not github_token:
        raise RuntimeError("GITHUB_TOKEN not set")

    payload = json.dumps({
        "model": "o3-mini",
        "messages": [
            {"role": "system", "content": "Esti expert matematica. Rezolva pas-cu-pas, in romana."},
            {"role": "user", "content": question}
        ],
        "max_tokens": 2048
    }).encode()

    req = urllib.request.Request(
        "https://models.inference.ai.azure.com/chat/completions",
        data=payload,
        headers={
            "Authorization": f"Bearer {github_token}",
            "Content-Type": "application/json"
        }
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        result = json.loads(resp.read())
        return result["choices"][0]["message"]["content"]

# Folosit in Chat AI doar pentru intrebari matematice complexe (detectate prin keyword)
# Pentru chat general: Cerebras sau Groq (mai ieftin pe cota)
```

**Limite:** 50 req/zi (modele high) — suficient pt chat educational sporadic.
**Nota:** Necesita GitHub Personal Access Token (gratuit, din contul GitHub).
**Efort:** MIC (1h, la Faza 4) | **ROI: 7/10 (la Faza 4)**

---

## SUMAR PRIORITATI

| Faza                      | Items | Efort total | Cand                                   |
| ------------------------- | ----- | ----------- | -------------------------------------- |
| **A — Quick Wins**        | A1-A7 | ~3h         | Imediat                                |
| **B — Securitate**        | B1-B4 | ~4h         | Inainte de test intensiv               |
| **C — Stack upgrade**     | C1-C3 | ~8h         | Saptamana 2                            |
| **D — Performanta**       | D1-D6 | ~8h         | Saptamana 2-3                          |
| **E — UX/Functii**        | E1-E9 | ~16h        | Saptamana 3-4                          |
| **F — Teste/Calitate**    | F1-F6 | ~12h        | Inainte de Faza 4 Chat AI              |
| **G — AI API Extensions** | G1-G6 | ~12h        | G1 imediat, G2-G4 Faza D, G5-G6 Faza 4 |

---

## CONSTRANGERI (nu se negociaza)

- **R-COST**: Zero costuri. Nicio solutie nu introduce API/servicii cu plata.
- **R-MATH**: Formulele LaTeX si figurile SVG raman intacte la orice modificare.
- **R-THEME**: Tema tabla verde (#2d5016) + creta (alb/galben) la orice UI nou.
- **R-LANG**: Cod in engleza, UI/mesaje in romana.

---

## NOTE DEPENDINTE

- B1 (rate limiter) → INAINTE de orice publicitate/test extensiv
- B2 (DOMPurify) → INAINTE de sprint cu contentEditable
- C1 (Next.js 15) → INAINTE de C2 (Tailwind v4)
- D1 (batch) → inlocuieste D5 (separator) — sunt acelasi lucru
- E8 (paginare) → dupa metoda 3 pasi complet stabila
- F1+F2 (teste) → INAINTE de Faza 4 (Chat AI)
- G1 (Flash-Lite) → independent, oricand
- G2 (Mistral OCR) → dupa G1, adauga `MISTRAL_API_KEY` in Render env
- G3 (NLLB) → adauga `HF_TOKEN` in Render env
- G5+G6 → DOAR la implementarea Fazei 4 (Chat AI)
