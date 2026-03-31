# RECOMANDARI IMBUNATATIRI — Sistem Traduceri Matematica
# Data: 2026-03-29 | Versiune: 2.0 | Mod: complet
# Analiza exhaustiva: inventar functii + imbunatatiri existente + functii noi + tehnic
# Delta fata de v1.0 (2026-03-28): 0 implementate, 8 NOI, 5 actualizate

---

## SUMAR EXECUTIV

**Proiect analizat**: Sistem Traduceri Matematica v3.0
**Fisiere analizate**: 52 sursa (15 Python + 31 TypeScript/React + 6 config)
**Functii inventariate**: ~100 (65 backend + 35 frontend)
**Recomandari totale**: 38 (16 imbunatatiri existente + 12 functii noi + 10 tehnice)
**Delta v1.0**: +8 NOI, 5 actualizate, 0 implementate din versiunea anterioara

### Comparatie cu v1.0 (2026-03-28)

| Categorie | v1.0 | v2.0 | Delta |
|-----------|------|------|-------|
| Imbunatatiri existente | 13 | 16 | +3 NOI |
| Functii noi | 10 | 12 | +2 NOI |
| Tehnice | 7 | 10 | +3 NOI |
| **Total** | **30** | **38** | **+8** |
| Implementate din v1.0 | - | 0 | RUNDA_CURENTA nefinalizata |

---

## PARTEA I — IMBUNATATIRI FUNCTII EXISTENTE

---

### 1. `_text_to_pdf()` — Suport diacritice RO/SK in conversii PDF [v1.0 — NEIMPLEMENTAT]

**Fisier:** `api/convert.py` — linia ~140
**Problema actuala:** Foloseste fontul `Helvetica` (built-in fpdf2) care suporta doar Latin-1. Caracterele romanesti (ă, â, î, ș, ț) si slovace (č, ď, ľ, ň, š, ť, ž) sunt **pierdute sau garbled** in output-ul PDF. Afecteaza TOATE conversiile care produc PDF: `docx_to_pdf`, `md_to_pdf`, `html_to_pdf`, si `edit_pdf` watermark (linia ~417).

**Imbunatatire propusa:**
- Descarca DejaVu Sans TTF (~700KB) in `api/fonts/`
- Inregistreaza fontul in fpdf2 cu `add_font()` + `uni=True`
- Inlocuieste TOATE apelurile `set_font("Helvetica", ...)` cu fontul nou
- Include si watermark-ul din `edit_pdf()` (linia 417) care are aceeasi problema

**Exemplu implementare:**
```python
# api/convert.py — _text_to_pdf()
import os

def _text_to_pdf(text: str, title: str = "") -> bytes:
    from fpdf import FPDF

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    # Font cu suport Unicode complet (diacritice RO/SK)
    font_dir = os.path.join(os.path.dirname(__file__), "fonts")
    font_path = os.path.join(font_dir, "DejaVuSans.ttf")
    if os.path.exists(font_path):
        pdf.add_font("DejaVu", "", font_path, uni=True)
        pdf.add_font("DejaVu", "B", os.path.join(font_dir, "DejaVuSans-Bold.ttf"), uni=True)
        font_name = "DejaVu"
    else:
        font_name = "Helvetica"  # fallback

    pdf.set_font(font_name, size=11)
    if title:
        pdf.set_font(font_name, "B", 16)
        pdf.cell(0, 10, title, ln=True)
        pdf.ln(4)
        pdf.set_font(font_name, size=11)
    for line in text.split("\n"):
        stripped = line.strip()
        if stripped.startswith("# "):
            pdf.set_font(font_name, "B", 16)
            pdf.cell(0, 10, stripped[2:], ln=True)
            pdf.set_font(font_name, size=11)
        elif stripped.startswith("## "):
            pdf.set_font(font_name, "B", 14)
            pdf.cell(0, 9, stripped[3:], ln=True)
            pdf.set_font(font_name, size=11)
        elif stripped.startswith("### "):
            pdf.set_font(font_name, "B", 12)
            pdf.cell(0, 8, stripped[4:], ln=True)
            pdf.set_font(font_name, size=11)
        elif stripped.startswith("**") and stripped.endswith("**"):
            pdf.set_font(font_name, "B", 11)
            pdf.multi_cell(0, 6, stripped[2:-2])
            pdf.set_font(font_name, size=11)
        elif not stripped:
            pdf.ln(3)
        else:
            pdf.multi_cell(0, 6, stripped)
    return pdf.output()
```

**Complexitate:** Mica | **Impact:** Mare — conversiile PDF sunt inutilizabile pentru RO/SK

---

### 2. `build_html_structured()` — Eliminare state global pentru figure pairs [v1.0 — NEIMPLEMENTAT]

**Fisier:** `api/lib/html_builder.py` — linia ~88-92, ~105, ~153-175
**Problema actuala:** Foloseste `_build_figure_pair._skip_next = False` ca atribut mutable pe functie. Acesta este state global — **nu e thread-safe**. Daca 2 cereri de traducere ruleaza simultan, se corupe starea.

**Imbunatatire propusa:**
- Elimina atributul global de pe functie
- Foloseste variabila locala `skip_next` in bucla `for sec_idx`

**Exemplu implementare:**
```python
# api/lib/html_builder.py — build_html_structured()
# Sterge liniile 88-92 (_build_figure_pair + _build_figure_pair._skip_next)
# In build_html_structured(), inlocuieste linia 105 cu:
    for page_idx, (page, figs) in enumerate(zip(pages_data, figures)):
        skip_next = False  # LOCAL, nu global
        parts = []
        # ... restul codului neschimbat, doar inlocuieste:
        # _build_figure_pair._skip_next -> skip_next
        # getattr(_build_figure_pair, '_skip_next', False) -> skip_next
```

**Complexitate:** Mica | **Impact:** Mediu — previne bug-uri la cereri concurente

---

### 3. `translate.py:do_POST()` — Fix iterare lista `files` in timp ce o modifici [v1.0 — NEIMPLEMENTAT]

**Fisier:** `api/translate.py` — linia ~180-194
**Problema actuala:** La PDF-uri, paginile extrase sunt adaugate cu `files.append(...)` in timpul iteratiei `for idx, file_info in enumerate(files)`. E intentional dar fragil — potential bucla infinita daca un PDF extras e incorect identificat ca PDF.

**Imbunatatire propusa:**
- Separa faza de expandare PDF de faza de procesare

**Exemplu implementare:**
```python
# api/translate.py — do_POST() — inlocuieste liniile ~180-194
# FAZA 1: Expand PDFs to images
expanded_files = []
for file_info in files:
    mime_type = file_info.get("mime_type", "image/jpeg")
    filename = file_info.get("filename", "")
    is_pdf = mime_type == "application/pdf" or filename.lower().endswith(".pdf")
    is_docx = "wordprocessingml" in mime_type or filename.lower().endswith(".docx")

    if is_pdf and not is_docx:
        pdf_pages = _pdf_to_images(file_info["data"])
        if pdf_pages:
            for pg_idx, (pg_bytes, pg_mime) in enumerate(pdf_pages):
                expanded_files.append({
                    "data": pg_bytes, "mime_type": pg_mime,
                    "filename": f"{filename}_p{pg_idx+1}.png"
                })
            continue
    expanded_files.append(file_info)

# FAZA 2: Process all files (no more PDF expansion)
for idx, file_info in enumerate(expanded_files):
    # ... existing processing logic (lines ~197+)
```

**Complexitate:** Mica | **Impact:** Mediu — previne edge-case de bucla infinita, cod mai clar

---

### 4. `getCachedTranslation()` — Cache key bazat pe hash fisier [v1.0 — NEIMPLEMENTAT]

**Fisier:** `frontend/src/lib/translation-cache.ts` — linia ~25-28
**Problema actuala:** Cache key-ul se bazeaza doar pe `fileNames.sort().join("|")`. Daca Cristina modifica un fisier si il reincarca cu **acelasi nume**, primeste traducerea veche.

**Imbunatatire propusa:**
- Include `file.size` + `file.lastModified` in cache key
- Necesita schimbarea semnaturii: `getCachedTranslation` si `cacheTranslation` primesc `File[]` in loc de `string[]`

**Exemplu implementare:**
```typescript
// frontend/src/lib/translation-cache.ts — generateKey()
function generateKey(files: File[], sourceLang: string, targetLang: string): string {
  const fileSignature = files
    .map(f => `${f.name}:${f.size}:${f.lastModified}`)
    .sort()
    .join("|");
  return `${fileSignature}::${sourceLang}::${targetLang}`;
}
```

```typescript
// frontend/src/app/traduceri/page.tsx — actualizare apeluri
const cached = getCachedTranslation(files, sourceLang, targetLang);
// ...
cacheTranslation(files, sourceLang, targetLang, htmlResult);
```

**Complexitate:** Mica | **Impact:** Mediu — previne traduceri stale fara ca utilizatorul sa stie

---

### 5. `RenderSection()` — Elimina "Poznámka." hardcodat [v1.0 — NEIMPLEMENTAT]

**Fisier:** `frontend/src/components/traduceri/DocumentViewer.tsx` — linia ~253-258
**Problema actuala:** Cand tipul sectiunii este "observation", textul e prefixat cu `<strong>Poznámka. </strong>` (slovaca). Daca limba tinta e engleza sau romana, **apare tot in slovaca**.

**Imbunatatire propusa:**
- Sterge prefixul hardcodat — backend-ul traduce deja continutul inclusiv prefixul

**Exemplu implementare:**
```tsx
// frontend/src/components/traduceri/DocumentViewer.tsx — RenderSection()
if (type === "observation") {
  return (
    <p style={{ marginBottom: "0.3em" }}>
      <strong>{renderMathText(content || "")}</strong>
    </p>
  );
}
```

**Complexitate:** Mica | **Impact:** Mic — bug vizibil doar cand limba tinta nu e slovaca

---

### 6. `ServerWakeup` — Keep-alive periodic dupa ready [v1.0 — NEIMPLEMENTAT]

**Fisier:** `frontend/src/components/layout/ServerWakeup.tsx` — linia ~25-58
**Problema actuala:** Dupa ce serverul raspunde, nu mai trimite ping-uri. Render free tier pune serverul in sleep dupa 15 min inactivitate. Daca Cristina sta 20 min sa editeze, la urmatoarea cerere — cold start.

**Imbunatatire propusa:**
- Dupa `status === "ready"`, porneste `setInterval` la 4 min cu fetch la `/health`

**Exemplu implementare:**
```tsx
// frontend/src/components/layout/ServerWakeup.tsx — adauga useEffect
useEffect(() => {
  if (status !== "ready") return;
  const keepAlive = setInterval(async () => {
    try {
      await fetch(HEALTH_ENDPOINT, { signal: AbortSignal.timeout(5000) });
    } catch { /* ignore */ }
  }, 4 * 60 * 1000); // 4 minute
  return () => clearInterval(keepAlive);
}, [status]);
```

**Complexitate:** Mica | **Impact:** Mare — previne cold start in timpul sesiunii active

---

### 7. `deepl_client.py` — Load balancing round-robin [v1.0 — NEIMPLEMENTAT]

**Fisier:** `api/lib/deepl_client.py` — linia ~98-123
**Problema actuala:** KEY1 se incearca mereu prima, KEY2 doar la eroare. KEY1 se epuizeaza mai repede.

**Imbunatatire propusa:**
- Round-robin simplu cu counter global

**Exemplu implementare:**
```python
# api/lib/deepl_client.py
_call_count = 0

def translate_text(text, target_lang, source_lang="RO"):
    global _call_count
    if not text or not text.strip():
        return text

    key1 = os.environ.get("DEEPL_API_KEY", "").strip()
    key2 = os.environ.get("DEEPL_API_KEY2", "").strip()

    keys = []
    if key1: keys.append(("KEY1", key1))
    if key2: keys.append(("KEY2", key2))
    if not keys:
        raise RuntimeError("No DEEPL_API_KEY set")

    if len(keys) > 1:
        _call_count += 1
        if _call_count % 2 == 0:
            keys = keys[::-1]
    # ... rest unchanged
```

**Complexitate:** Mica | **Impact:** Mediu — distribuie uniform consumul pe 2 chei

---

### 8. `translate.py` + `convert.py` — Validare server-side dimensiune fisiere [v1.0 — NEIMPLEMENTAT]

**Fisier:** `api/translate.py` linia ~146, `api/convert.py` linia ~538
**Problema actuala:** Validarea e doar client-side (FileUpload.tsx, 4MB). POST direct cu fisier 100MB → crash server pe Render 512MB.

**Imbunatatire propusa:**
- La inceputul `do_POST()`, verifica `Content-Length` si reject cu 413 daca > 4MB

**Exemplu implementare:**
```python
# api/translate.py — do_POST() la inceput
MAX_BODY_SIZE = 4 * 1024 * 1024 + 1024  # 4MB + overhead headers

def do_POST(self):
    content_length = int(self.headers.get("Content-Length", 0))
    if content_length > MAX_BODY_SIZE:
        self._send_json(413, {"error": "Fisierul depaseste limita de 4MB", "status": "error"})
        return
    # ... rest unchanged
```

**Complexitate:** Mica | **Impact:** Mediu — previne crash server la fisiere mari

---

### 9. `DocumentViewer` — Buton DOCX lipsa [v1.0 — NEIMPLEMENTAT]

**Fisier:** `frontend/src/components/traduceri/DocumentViewer.tsx` — linia ~186-194
**Problema actuala:** PreviewPanel are 3 butoane (HTML, PDF, DOCX). DocumentViewer are doar 2 (HTML, Print). **Lipseste DOCX.**

**Imbunatatire propusa:**
- Adauga buton DOCX identic cu cel din PreviewPanel

**Exemplu implementare:**
```tsx
// DocumentViewer.tsx — adauga dupa butonul Print/PDF (linia ~194)
const handleDownloadDocx = async () => {
  const html = buildHtmlFromPages(currentPages, activeLang);
  const formData = new FormData();
  formData.append("files", new Blob([html], { type: "text/html" }), "traducere.html");
  formData.append("operation", "convert");
  formData.append("target_format", "docx");
  try {
    const res = await fetch(`${API_URL}/api/convert`, { method: "POST", body: formData });
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${filename}_${activeLang}.docx`; a.click();
    URL.revokeObjectURL(url);
  } catch { /* fallback: download HTML */ }
};

// In JSX toolbar:
<button onClick={handleDownloadDocx} className="px-3 py-2 bg-[#dce8ff] text-[#121212] rounded-md text-sm font-semibold">
  DOCX
</button>
```

**Complexitate:** Mica | **Impact:** Mediu — Cristina are nevoie de DOCX mai des decat HTML

---

### 10. `DocumentViewer` — MathJax nu randeaza in A4 paper view [v2.0 — NOU]

**Fisier:** `frontend/src/components/traduceri/DocumentViewer.tsx` — linia ~198-224
**Problema actuala:** DocumentViewer afiseaza paginile A4 direct in DOM-ul paginii (nu in iframe). MathJax este incarcat doar in HTML-ul generat pentru download/print (liniile 338-340), dar **nu e incarcat in pagina principala Next.js**. Rezultat: formule LaTeX ca `$\triangle ABC$` apar ca text raw in preview.

**Imbunatatire propusa:**
- Incarca MathJax in pagina principala (layout.tsx sau DocumentViewer)
- Apeleaza `MathJax.typesetPromise()` dupa fiecare randare/switch limba

**Exemplu implementare:**
```tsx
// frontend/src/components/traduceri/DocumentViewer.tsx — adauga useEffect
import { useEffect, useRef } from "react";

// Dupa setActiveLang sau la mount:
useEffect(() => {
  // Load MathJax if not already loaded
  if (!document.getElementById("mathjax-script")) {
    const cfg = document.createElement("script");
    cfg.textContent = `window.MathJax = {
      tex: { inlineMath: [['$','$'],['\\\\(','\\\\)']], displayMath: [['$$','$$'],['\\\\[','\\\\]']] },
      svg: { fontCache: 'global' }
    };`;
    document.head.appendChild(cfg);

    const script = document.createElement("script");
    script.id = "mathjax-script";
    script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js";
    script.async = true;
    document.head.appendChild(script);
  }
  // Re-typeset after render
  const timer = setTimeout(() => {
    if (window.MathJax?.typesetPromise) {
      window.MathJax.typesetPromise().catch(() => {});
    }
  }, 200);
  return () => clearTimeout(timer);
}, [activeLang, currentPages]);
```

**Complexitate:** Medie | **Impact:** Mare — fara asta, formulele sunt ilizibile in preview

---

### 11. `figure_crop.py` — Background removal lent (pixel-by-pixel Python loop) [v2.0 — NOU]

**Fisier:** `api/lib/figure_crop.py` — linia ~103-110
**Problema actuala:** Background removal itereaza peste fiecare pixel cu for loops Python:
```python
for py_ in range(ch):
    for px_ in range(cw):
        r, g, b, a = px[px_, py_]
        if abs(r - bg_r) < tolerance and ...
```
Pentru un crop de 800x600px = 480.000 iteratii in Python pur. La 6 figuri pe pagina, asta adauga ~2-5 secunde.

**Imbunatatire propusa:**
- Foloseste NumPy vectorizat (deja disponibil ca dependinta Pillow) sau `ImageDraw.floodfill`
- Alternativ: `Pillow.Image.point()` cu LUT (lookup table)

**Exemplu implementare:**
```python
# api/lib/figure_crop.py — crop_figure(), inlocuieste liniile 103-110
import numpy as np

# Vectorized background replacement (100x faster)
arr = np.array(cropped)
mask = (
    (np.abs(arr[:,:,0].astype(int) - bg_r) < tolerance) &
    (np.abs(arr[:,:,1].astype(int) - bg_g) < tolerance) &
    (np.abs(arr[:,:,2].astype(int) - bg_b) < tolerance)
)
arr[mask] = [*target_bg, 255]
cropped = Image.fromarray(arr, "RGBA")
```

**Complexitate:** Mica | **Impact:** Mediu — accelereaza crop figuri cu ~100x (de la secunde la milisecunde)

---

### 12. `translate.py` — PDF mare fara batching (D16 neimplementat) [v2.0 — NOU]

**Fisier:** `api/translate.py` — linia ~189-194
**Problema actuala:** PLAN_v3 mentioneaza D16 (PDF >20 pag: procesare in loturi de 5) dar codul expandeaza TOATE paginile PDF-ului odata cu `_pdf_to_images()` si le adauga TOATE in lista `files`. Un PDF de 30 pagini la DPI 150 → ~300MB RAM → crash pe Render 512MB.

**Imbunatatire propusa:**
- Proceseaza PDF-uri in loturi de 5 pagini
- Elibereaza memoria dupa fiecare lot

**Exemplu implementare:**
```python
# api/translate.py — in faza de expandare PDF
BATCH_SIZE = 5

if is_pdf and not is_docx:
    pdf_pages = _pdf_to_images(file_info["data"])
    if pdf_pages:
        # Process in batches to avoid memory exhaustion
        for batch_start in range(0, len(pdf_pages), BATCH_SIZE):
            batch = pdf_pages[batch_start:batch_start + BATCH_SIZE]
            for pg_idx, (pg_bytes, pg_mime) in enumerate(batch):
                expanded_files.append({
                    "data": pg_bytes, "mime_type": pg_mime,
                    "filename": f"{filename}_p{batch_start + pg_idx + 1}.png"
                })
        del pdf_pages  # free memory
        continue
```
NOTA: Asta doar rezolva expandarea. Pentru procesarea propriu-zisa in loturi cu progress reporting, trebuie refactorizat flow-ul complet.

**Complexitate:** Medie | **Impact:** Mare — previne crash pe documente mari

---

### 13. `handleTranslate()` — Progress estimat mai realist [v1.0 — ACTUALIZAT]

**Fisier:** `frontend/src/app/traduceri/page.tsx` — linia ~57-70
**Problema actuala:** Progresul e simulat cu `Math.random() * 4 + 1` la fiecare 600ms. Nu reflecta realitatea.

**Imbunatatire propusa:**
- Estimeaza durata pe baza numarului si dimensiunii fisierelor
- Progres proportional cu timpul estimat

**Exemplu implementare:**
```typescript
// frontend/src/app/traduceri/page.tsx
const startTime = Date.now();
const estimatedMs = files.reduce((sum, f) => sum + Math.max(f.size / 50, 10000), 0);

progressTimer.current = setInterval(() => {
  setProgress((prev) => {
    const elapsed = Date.now() - startTime;
    const estimated = Math.min(92, (elapsed / estimatedMs) * 92);
    const step = STEPS.findIndex((s) => s.at > estimated);
    if (step > 0) setStepLabel(STEPS[step - 1].label);
    return Math.max(prev, estimated);
  });
}, 500);
```

**Complexitate:** Mica | **Impact:** Mediu — UX mult mai bun

---

### 14. `ConvertorPage` — Preview fisier inainte de conversie [v1.0 — NEIMPLEMENTAT]

**Fisier:** `frontend/src/app/convertor/page.tsx`
**Problema actuala:** Dupa selectie fisier, se vede doar numele. Nu se poate confirma vizual ca e fisierul corect.

**Imbunatatire propusa:**
- Thumbnail pentru imagini, "preview indisponibil" pentru restul

**Exemplu implementare:**
```tsx
{files.length > 0 && files[0].type.startsWith("image/") && (
  <div className="mt-3 flex justify-center">
    <img
      src={URL.createObjectURL(files[0])}
      alt="Preview"
      className="max-h-48 rounded-lg border border-white/20"
    />
  </div>
)}
```

**Complexitate:** Mica | **Impact:** Mic — confirmare vizuala

---

### 15. `ocr_structured()` — Retry la JSON malformat [v1.0 — NEIMPLEMENTAT]

**Fisier:** `api/lib/ocr_structured.py` — linia ~82-92
**Problema actuala:** La JSON invalid de la Gemini, dupa fix cu regex daca esueaza, **toata structura se pierde** — un singur paragraf cu text raw.

**Imbunatatire propusa:**
- La esecul parsarii, incearca extragere cu regex din text raw

**Exemplu implementare:**
```python
except json.JSONDecodeError as e2:
    print(f"[OCR-STRUCT] JSON parse failed, trying regex extraction", file=sys.stderr)
    sections = []
    for line in raw.split("\n"):
        stripped = line.strip()
        if not stripped: continue
        if stripped.startswith("#"):
            level = len(stripped) - len(stripped.lstrip("#"))
            sections.append({"type": "heading", "content": stripped.lstrip("# "), "level": level})
        elif re.match(r'\$?P[_₁₂₃₄₅₆₇₈₉\d]+\$?', stripped):
            sections.append({"type": "step", "content": stripped})
        else:
            sections.append({"type": "paragraph", "content": stripped})
    return {"title": "", "sections": sections or [{"type": "paragraph", "content": raw}]}
```

**Complexitate:** Mica | **Impact:** Mediu — pastreaza structura partiala in loc de text flat

---

### 16. `page.tsx` (Home) — Tab state pierdut la re-mount [v2.0 — NOU]

**Fisier:** `frontend/src/app/page.tsx` — linia ~12-29
**Problema actuala:** Tab-urile sunt randare conditionala cu `{activeTab === "traduceri" && <TraduceriPage />}`. Cand Cristina trece de pe Traduceri pe Convertor si inapoi, **toata starea TraduceriPage se pierde** (fisiere selectate, rezultat, etc.) deoarece componenta se demonta si se remonta.

**Imbunatatire propusa:**
- Foloseste CSS `display: none` in loc de demontare conditionala
- Pastreaza toate componentele in DOM, ascunde cele inactive

**Exemplu implementare:**
```tsx
// frontend/src/app/page.tsx — inlocuieste render-ul conditional
<div className="mt-6">
  <div style={{ display: activeTab === "traduceri" ? "block" : "none" }}>
    <TraduceriPage />
  </div>
  <div style={{ display: activeTab === "convertor" ? "block" : "none" }}>
    <ConvertorPage />
  </div>
  <div style={{ display: activeTab === "istoric" ? "block" : "none" }}>
    <HistoryList />
  </div>
</div>
```
NOTA: Creste memoria (3 tab-uri montate simultan) dar previne pierderea starii. Acceptabil pentru 1 utilizator.

**Complexitate:** Mica | **Impact:** Mare — Cristina nu pierde munca cand navigheaza intre tab-uri

---

## PARTEA II — FUNCTII NOI

---

### 1. Keep-Alive cu UptimeRobot [v1.0 — NEIMPLEMENTAT]

**Descriere:** Configureaza UptimeRobot (gratuit, 50 monitoare) sa faca ping la `https://traduceri-api.onrender.com/health` la fiecare 5 minute. Previne cold start complet.

**De ce e util:** Render free tier opreste serverul dupa 15 min inactivitate. Cold start = 25-60 secunde. Cu UptimeRobot, serverul ramane treaz permanent → raspuns instant.

**Complexitate:** Mica | **Impact:** Maxim

**Pasi implementare:**
1. Cont gratuit pe uptimerobot.com
2. Add monitor: HTTP(S) → `https://traduceri-api.onrender.com/health`
3. Interval: 5 minute
4. Alert contacts: email Roland
5. Repeta pentru frontend: `https://traduceri-matematica-7sh7.onrender.com`

Nu necesita cod — doar configurare in browser. [CERT]

---

### 2. Error retry cu exponential backoff [v1.0 — NEIMPLEMENTAT]

**Descriere:** Decorator/functie `retry_with_backoff(max_retries=3, base_delay=1)` pentru toate apelurile API externe (Gemini, DeepL, Groq, Mistral).

**De ce e util:** Erori tranziente (Gemini 503, DeepL timeout, network glitch) cauzeaza fail instant. Cu retry, 90%+ din aceste erori se rezolva singure la a 2-a sau a 3-a incercare.

**Complexitate:** Medie | **Impact:** Mare

**Exemplu implementare:**
```python
# api/lib/retry.py — modul NOU
import time
import urllib.error

TRANSIENT_CODES = {500, 502, 503, 504, 429}

def retry_with_backoff(func, *args, max_retries=3, base_delay=1.0, **kwargs):
    """Retry function with exponential backoff on transient errors."""
    last_error = None
    for attempt in range(max_retries + 1):
        try:
            return func(*args, **kwargs)
        except urllib.error.HTTPError as e:
            if e.code not in TRANSIENT_CODES:
                raise  # Don't retry client errors (4xx except 429)
            last_error = e
        except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
            last_error = e
        except Exception:
            raise  # Don't retry unknown errors

        if attempt < max_retries:
            delay = base_delay * (2 ** attempt)
            print(f"[RETRY] Attempt {attempt+1}/{max_retries}, waiting {delay}s", file=sys.stderr)
            time.sleep(delay)
    raise last_error
```

```python
# Utilizare in translation_router.py:
from lib.retry import retry_with_backoff
result = retry_with_backoff(urllib.request.urlopen, req, timeout=55)
```

---

### 3. Comparatie vizuala Original vs Traducere in DocumentViewer [v2.0 — NOU]

**Descriere:** Adauga mod "Split View" in DocumentViewer care arata originalul (imaginea incarcata) alaturi de traducere, pagina cu pagina.

**De ce e util:** Cristina trebuie sa verifice ca traducerea e corecta comparand cu originalul. PreviewPanel are acest mod, dar DocumentViewer (care se foloseste 90% din timp) nu.

**Complexitate:** Medie | **Impact:** Mare

**Exemplu implementare:**
```tsx
// DocumentViewer.tsx — adauga prop + state
interface DocumentViewerProps {
  // ... existing props
  originalFiles?: File[];  // NOU
}

const [viewMode, setViewMode] = useState<"single" | "split">("single");

// In toolbar, adauga toggle:
<button onClick={() => setViewMode(v => v === "single" ? "split" : "single")}
  className="px-3 py-2 bg-white/10 text-white rounded-md text-sm">
  {viewMode === "single" ? "Split View" : "Single View"}
</button>

// In render:
{viewMode === "split" ? (
  <div className="grid grid-cols-2 gap-4">
    <div>
      <h4 className="text-sm opacity-60 mb-2">Original</h4>
      {originalFiles?.[pageIdx] && (
        <img src={URL.createObjectURL(originalFiles[pageIdx])}
          alt="Original" className="w-full" />
      )}
    </div>
    <div className="bg-white" style={...}>
      {/* existing page render */}
    </div>
  </div>
) : (
  /* existing single view */
)}
```

---

### 4. Notificare browser la traducere completa [v2.0 — NOU]

**Descriere:** Cand traducerea dureaza mult (>30s) si Cristina a schimbat tab-ul, trimite o notificare browser "Traducerea e gata!".

**De ce e util:** Traducerile de 5+ pagini dureaza 1-3 minute. Cristina asteapta, dar daca schimba tab-ul nu stie cand e gata.

**Complexitate:** Mica | **Impact:** Mediu

**Exemplu implementare:**
```typescript
// frontend/src/app/traduceri/page.tsx — dupa traducere reusita
if (document.hidden && Notification.permission === "granted") {
  new Notification("Traducere reusita!", {
    body: `${files.length} pagini traduse in ${((data.duration_ms || 0) / 1000).toFixed(0)}s`,
    icon: "/icons/icon-192.png",
  });
}
// La mount: request permission
useEffect(() => {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}, []);
```

---

### 5. Statistici cache vizibile [v2.0 — NOU]

**Descriere:** Afiseaza statisticile cache-ului de traduceri: cate intrari, cat spatiu ocupat, buton "Sterge cache".

**De ce e util:** `getCacheStats()` exista deja in `translation-cache.ts` dar nu e apelata nicaieri. Cristina nu stie cat cache s-a acumulat si nu poate curata.

**Complexitate:** Mica | **Impact:** Mic

**Exemplu implementare:**
```tsx
// Adauga in TraduceriPage sau DeeplUsage:
import { getCacheStats, clearTranslationCache } from "@/lib/translation-cache";
const stats = getCacheStats();
// Render:
<div className="text-xs opacity-50 mt-2">
  Cache: {stats.entries} traduceri ({stats.sizeKB} KB)
  <button onClick={() => { clearTranslationCache(); window.location.reload(); }}
    className="ml-2 underline">Sterge</button>
</div>
```

---

### 6. Batch panel cu cache check [v2.0 — NOU]

**Descriere:** BatchPanel sa verifice cache-ul inainte de a traduce fiecare fisier, la fel cum face handleTranslate().

**De ce e util:** Daca Cristina traduce 10 fisiere in batch si 3 sunt deja in cache, salveaza 30% din cota DeepL.

**Complexitate:** Mica | **Impact:** Mediu

**Exemplu implementare:**
```tsx
// BatchPanel.tsx — in bucla de procesare per fisier, inainte de fetch:
const cached = getCachedTranslation([file.name], sourceLang, targetLang);
if (cached) {
  results[i] = { status: "cached", html: cached };
  continue; // skip API call
}
```

---

### 7. Gemini usage tracking [v2.0 — NOU]

**Descriere:** Contor vizibil pentru cota Gemini (250 cereri/zi, 10/min) similar cu DeeplUsage.

**De ce e util:** Daca Cristina traduce 200 pagini intr-o zi, nu stie ca a ramas fara cota Gemini. La cererea 251, primeste eroare fara avertisment.

**Complexitate:** Medie | **Impact:** Mediu

**Exemplu implementare:**
```python
# api/gemini_usage.py — NOU endpoint
# Tine un counter in memorie per zi (reset la miezul noptii)
_daily_count = {"date": "", "count": 0}

def get_usage():
    from datetime import date
    today = date.today().isoformat()
    if _daily_count["date"] != today:
        _daily_count["date"] = today
        _daily_count["count"] = 0
    return {"used": _daily_count["count"], "limit": 250, "remaining": 250 - _daily_count["count"]}

def increment():
    get_usage()  # ensure date is current
    _daily_count["count"] += 1
```

---

### 8. Tab memorat in URL/localStorage [v1.0 — ACTUALIZAT]

**Descriere:** Salveaza ultimul tab activ in localStorage. La refresh, deschide tab-ul unde era utilizatorul.

**De ce e util:** Daca Cristina lucreaza pe Convertor si da refresh, aterizeaza pe Traduceri (default). Pierde contextul.

**Complexitate:** Mica | **Impact:** Mic

**Exemplu implementare:**
```tsx
// frontend/src/app/page.tsx
const [activeTab, setActiveTab] = useState<TabId>(() => {
  if (typeof window !== "undefined") {
    return (localStorage.getItem("activeTab") as TabId) || DEFAULT_TAB;
  }
  return DEFAULT_TAB;
});

const handleTabChange = (tab: TabId) => {
  setActiveTab(tab);
  localStorage.setItem("activeTab", tab);
};
```

---

### 9. Keyboard shortcuts [v2.0 — NOU]

**Descriere:** Scurtaturi de tastatura: Ctrl+Enter = traduce, Ctrl+D = download, Ctrl+P = print.

**De ce e util:** Power user experience. Cristina traduce zeci de documente pe zi — fiecare click salvat conteaza.

**Complexitate:** Mica | **Impact:** Mic

**Exemplu implementare:**
```tsx
// frontend/src/app/traduceri/page.tsx — adauga useEffect
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === "Enter" && files.length > 0 && !isProcessing) {
      e.preventDefault();
      handleTranslate();
    }
  };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}, [files, isProcessing, handleTranslate]);
```

---

### 10. Drag-and-drop reordonare fisiere [v1.0 — NEIMPLEMENTAT]

**Descriere:** Permite reordonarea fisierelor selectate prin drag-and-drop inainte de traducere.

**De ce e util:** Cand Cristina incarca 5 poze de pe telefon, ordinea conteaza (pagina 1, 2, 3...). Acum nu poate reordona fara a sterge si reincarca.

**Complexitate:** Medie | **Impact:** Mediu

**Exemplu implementare:**
```tsx
// FileUpload.tsx — adauga state si handlers
const moveFile = (fromIndex: number, toIndex: number) => {
  const newFiles = [...files];
  const [moved] = newFiles.splice(fromIndex, 1);
  newFiles.splice(toIndex, 0, moved);
  onFilesChange(newFiles);
};

// In lista fisierelor, adauga butoane sus/jos:
<button onClick={() => moveFile(i, Math.max(0, i - 1))} disabled={i === 0}>↑</button>
<button onClick={() => moveFile(i, Math.min(files.length - 1, i + 1))} disabled={i === files.length - 1}>↓</button>
```

---

### 11. Istoric cu engine folosit [v2.0 — NOU]

**Descriere:** Salveaza engine-ul de traducere (DeepL/Gemini) in istoria traducerilor.

**De ce e util:** Cristina poate compara calitatea. "Traducerea asta a fost cu DeepL si e mai buna decat cea cu Gemini."

**Complexitate:** Mica | **Impact:** Mic

**Exemplu implementare:**
```typescript
// frontend/src/lib/storage.ts — adauga in HistoryEntry interface:
engine?: string;  // "deepl" | "gemini"

// frontend/src/app/traduceri/page.tsx — addToHistory():
addToHistory({ ...existing, engine: translateEngine });
```

---

### 12. Export PDF combinat (toate paginile) [v2.0 — NOU]

**Descriere:** Buton "Export PDF" care genereaza un singur PDF din toate paginile traduse (nu doar print din browser).

**De ce e util:** Print → PDF depinde de browser si setari. Un PDF generat server-side e consistent si portabil.

**Complexitate:** Medie | **Impact:** Mediu

**Nota:** Necesita ca backend-ul sa accepte HTML tradus si sa il converteasca in PDF cu figuri incluse. `html_to_pdf()` actual strip-uieste tag-urile — ar trebui extins cu `weasyprint` sau PyMuPDF Story.

---

## PARTEA III — IMBUNATATIRI TEHNICE

---

### 1. Zero teste automate

**Problema:** Proiectul are 0 teste automate. Orice modificare poate sparge ceva fara sa se detecteze. Fisierul `tests/test_e2e.py` exista dar e gol/schitat.
**Solutie:** Adauga cel putin: (1) unit tests pentru `math_protect.py`, `figure_crop.py`, `_validate_bbox()`, (2) integration test pentru pipeline translate complet cu fisier mic, (3) frontend smoke test cu Playwright.
**Complexitate:** Mare | **Impact:** Calitate — previne regresii

---

### 2. Cod duplicat `parse_boundary()` si `_log_to_file()` [v1.0 — ACTUALIZAT]

**Problema:** `parse_boundary()` e identica in `api/translate.py:125` si `api/convert.py:483`. `_log_to_file()` e identica in ambele. Plus, `protect_math()`/`restore_math()` din `translate.py:96-119` duplica `protect_with_placeholders()`/`restore_from_placeholders()` din `lib/math_protect.py`.
**Solutie:** Extrage in `api/lib/utils.py` si importa. Sterge duplicatele.
**Complexitate:** Mica | **Impact:** Mentenanta — un singur loc de modificat

---

### 3. `_sanitize_error` importat ca functie privata

**Problema:** `translate.py` importa `_sanitize_error` din `translation_router.py` (prefix `_` = privat). Conventie incalcata.
**Solutie:** Redenumeste la `sanitize_error` (fara underscore) si adauga in `__all__`.
**Complexitate:** Mica | **Impact:** Calitate cod

---

### 4. `root/package.json` — script `backend` broken

**Problema:** Script-ul `"backend": "cd backend && uvicorn app.main:app --reload --port 8000"` refera directorul `backend/` care e GOL. Backend-ul ruleaza cu `python dev_server.py`.
**Solutie:** Corecteaza: `"backend": "python dev_server.py"` si actualizeaza `dev:full`.
**Complexitate:** Mica | **Impact:** Mentenanta

---

### 5. MathJax CDN vs KaTeX — bundle size

**Problema:** MathJax 3 CDN (~500KB comprimat) se incarca la fiecare preview. KaTeX e ~350KB si randeaza sincron (mai rapid). [CERT — surse: intmath.com, katex.org]
**Solutie:** Evalueaza KaTeX ca alternativa. MathJax 3 a inchis gap-ul de performanta si suporta mai mult LaTeX. **Recomandare: pastreaza MathJax** — suporta mai multe constructii LaTeX necesare in manualele de matematica. Monitoreaza daca devine bottleneck.
**Complexitate:** Mare (migrare) | **Impact:** Performanta — marginal, nu merita effort acum

---

### 6. Service Worker manual vs Serwist/Workbox [v2.0 — NOU]

**Problema:** `frontend/public/sw.js` e scris manual, fara Workbox. Cache invalidation depinde de version string hardcodat. La fiecare deploy trebuie actualizat manual. Workbox/Serwist genereaza automat precache manifest cu hash-uri. [CERT — surse: nextjs.org, Serwist docs]
**Solutie:** Migreaza la Serwist (succesorul next-pwa) pentru: precache automat, invalidare automata, runtime caching strategies.
**Complexitate:** Medie | **Impact:** Mentenanta + Offline reliability

---

### 7. BaseHTTPRequestHandler in productie [v2.0 — NOU]

**Problema:** Backend-ul foloseste `BaseHTTPRequestHandler` (Python built-in) care e **single-threaded** si nu e recomandat pentru productie. Documentatia Python: "http.server is not recommended for production." [CERT — surse: docs.python.org, realpython.com]
**Solutie:** La scara curenta (1 utilizator) e acceptabil. Daca se adauga utilizatori, migreaza la **Gunicorn + Flask** sau **Uvicorn + FastAPI** (ambele gratuite pe Render). Estimare efort: 4-8 ore.
**Complexitate:** Mare | **Impact:** Scalabilitate — OK acum, necesar la crestere

---

### 8. ARIA labels incomplete [v1.0 — ACTUALIZAT]

**Problema:** Majoritatea butoanelor au `aria-label` dar cateva nu: butoanele din DocumentViewer toolbar (HTML, Print), butoanele de reordonare din HistoryList, butoanele de stergere din Dictionary.
**Solutie:** Adauga `aria-label` pe toate elementele interactive.
**Complexitate:** Mica | **Impact:** Accesibilitate

---

### 9. `deepl-usage` lipsa din `next.config.js` rewrites [v2.0 — NOU]

**Problema:** Lista de rewrites din `next.config.js` are 4 rute: translate-text, translate, convert, health. Dar `/api/deepl-usage` lipseste. Frontend-ul apeleaza direct API URL-ul Python, ocolind proxy-ul Next.js. Functioneaza (CORS configurat), dar e inconsistent.
**Solutie:** Adauga `/api/deepl-usage` in rewrites pentru consistenta.
**Complexitate:** Mica | **Impact:** Mentenanta

---

### 10. Rate limiter se reseteaza la redeploy

**Problema:** Rate limiter-ul e in-memory (`dict` in `rate_limiter.py`). La fiecare deploy Render, contoarele se reseteaza. Un abuzator poate trimite cereri inainte de fiecare deploy.
**Solutie:** Acceptabil pentru single-user. Daca devine problema, foloseste Redis (Render ofera Redis gratuit 25MB).
**Complexitate:** Medie | **Impact:** Securitate — LOW risk acum

---

## SUMAR PRIORITATI

| Prioritate | # | Nume | Complex. | Impact | Categorie |
|---|---|---|---|---|---|
| **P0 — URGENT** | N1 | Keep-Alive UptimeRobot | Mica | Maxim | Reliability |
| **P0 — URGENT** | I1 | Diacritice PDF (font DejaVu) | Mica | Mare | Bug fix |
| **P0 — URGENT** | I6 | Keep-alive periodic dupa ready | Mica | Mare | Reliability |
| **P0 — URGENT** | I10 | MathJax nu randeaza in DocumentViewer | Medie | Mare | Bug fix |
| **P1 — IMPORTANT** | I3 | Fix iterare files la PDF expand | Mica | Mediu | Bug fix |
| **P1 — IMPORTANT** | I2 | Fix state global figure pairs | Mica | Mediu | Bug fix |
| **P1 — IMPORTANT** | I8 | Validare server-side dimensiune | Mica | Mediu | Securitate |
| **P1 — IMPORTANT** | I16 | Tab state pierdut la re-mount | Mica | Mare | UX |
| **P1 — IMPORTANT** | I9 | Buton DOCX in DocumentViewer | Mica | Mediu | UX |
| **P1 — IMPORTANT** | I4 | Cache key cu file hash | Mica | Mediu | Bug fix |
| **P1 — IMPORTANT** | N2 | Error retry exponential backoff | Medie | Mare | Reliability |
| **P1 — IMPORTANT** | I12 | PDF mare batching (D16) | Medie | Mare | Stability |
| **P2 — VALOROS** | I7 | DeepL load balancing | Mica | Mediu | Optimizare |
| **P2 — VALOROS** | I5 | Elimina "Poznámka." hardcodat | Mica | Mic | Bug fix |
| **P2 — VALOROS** | I11 | Figure crop vectorizat | Mica | Mediu | Performanta |
| **P2 — VALOROS** | I13 | Progress estimat realist | Mica | Mediu | UX |
| **P2 — VALOROS** | N3 | Split View original vs traducere | Medie | Mare | UX |
| **P2 — VALOROS** | N6 | Batch panel cu cache check | Mica | Mediu | Optimizare |
| **P2 — VALOROS** | N4 | Notificare browser | Mica | Mediu | UX |
| **P2 — VALOROS** | I15 | Retry la JSON malformat OCR | Mica | Mediu | Reliability |
| **P3 — STRATEGIC** | T1 | Teste automate | Mare | Calitate | Tehnic |
| **P3 — STRATEGIC** | T6 | Service Worker Serwist | Medie | Mentenanta | Tehnic |
| **P3 — STRATEGIC** | T7 | BaseHTTPRequestHandler → ASGI | Mare | Scalabilitate | Tehnic |
| **P3 — STRATEGIC** | N7 | Gemini usage tracking | Medie | Mediu | Monitoring |
| **P3 — STRATEGIC** | N12 | Export PDF combinat | Medie | Mediu | Feature |
| **P4 — NICE-TO-HAVE** | T2 | Cod duplicat cleanup | Mica | Mentenanta | Tehnic |
| **P4 — NICE-TO-HAVE** | T3 | Redenumire _sanitize_error | Mica | Calitate | Tehnic |
| **P4 — NICE-TO-HAVE** | T4 | Fix script backend broken | Mica | Mentenanta | Tehnic |
| **P4 — NICE-TO-HAVE** | T8 | ARIA labels incomplete | Mica | Accesibilitate | Tehnic |
| **P4 — NICE-TO-HAVE** | T9 | deepl-usage in rewrites | Mica | Consistenta | Tehnic |
| **P4 — NICE-TO-HAVE** | N5 | Statistici cache vizibile | Mica | Mic | UX |
| **P4 — NICE-TO-HAVE** | N8 | Tab memorat localStorage | Mica | Mic | UX |
| **P4 — NICE-TO-HAVE** | N9 | Keyboard shortcuts | Mica | Mic | UX |
| **P4 — NICE-TO-HAVE** | N10 | Drag-and-drop reorder | Medie | Mediu | UX |
| **P4 — NICE-TO-HAVE** | N11 | Istoric cu engine | Mica | Mic | UX |
| **P4 — NICE-TO-HAVE** | I14 | Preview in convertor | Mica | Mic | UX |
| **P4 — NICE-TO-HAVE** | T5 | MathJax vs KaTeX | Mare | Marginal | Tehnic |
| **P4 — NICE-TO-HAVE** | T10 | Rate limiter persistent | Medie | Securitate | Tehnic |

---

## NOTE IMPLEMENTARE

1. **Constrangere globala:** Toate serviciile GRATUIT (R-COST). Toate recomandarile respecta aceasta regula.
2. **Ordinea recomandata de implementare:**
   - Sprint A (30 min): P0 bug fixes — I1, I2, I3, I10
   - Sprint B (30 min): P0 reliability — N1 (UptimeRobot config), I6 (keep-alive)
   - Sprint C (45 min): P1 UX — I16, I9, I4, I8
   - Sprint D (30 min): P1 reliability — N2 (retry), I12 (batching)
   - Restul: la discretia utilizatorului
3. **Dependinte intre recomandari:**
   - I10 (MathJax) trebuie implementat INAINTE de N3 (Split View)
   - I3 (fix iterare files) trebuie implementat INAINTE de I12 (batching)
   - I1 (diacritice) nu are dependinte — poate fi facut oricand
   - T2 (cod duplicat) e independent — poate fi facut in paralel
4. **Ce NU se schimba:**
   - Pipeline-ul OCR (Gemini 2.5 Flash JSON mode) — functioneaza bine
   - Tema UI (chalkboard verde + creta) — confirmata de utilizator
   - Stack principal (Next.js 14 + Python) — stabil, nu merita migrare
   - Structura de foldere — clara si organizata
5. **Stack detectat:** Next.js 14 + Tailwind 3.4 + Python BaseHTTPRequestHandler + Gemini 2.5 Flash + DeepL Free (2 keys) + Groq + Mistral + Pillow + PyMuPDF + fpdf2

---

## SURSE WEB RESEARCH

- [Next.js PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps) — best practices PWA 2026
- [Serwist (next-pwa successor)](https://javascript.plainenglish.io/building-a-progressive-web-app-pwa-in-next-js-with-serwist-next-pwa-successor-94e05cb418d7) — service worker modern
- [Python HTTP Server Alternatives](https://www.deployhq.com/blog/python-application-servers-in-2025-from-wsgi-to-modern-asgi-solutions) — WSGI/ASGI comparison
- [KaTeX vs MathJax](https://biggo.com/news/202511040733_KaTeX_MathJax_Web_Rendering_Comparison) — bundle size and performance
- [Render Free Tier Keep-Alive](https://sergeiliski.medium.com/how-to-run-a-full-time-app-on-renders-free-tier-without-it-sleeping-bec26776d0b9) — UptimeRobot workaround
