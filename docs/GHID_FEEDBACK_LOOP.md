# Ghid Feedback Loop — Sistem Traduceri Matematica

## Ce este si de ce exista

Cand tu testezi aplicatia (local sau pe Vercel), tot ce faci se logheaza automat.
La sesiunea urmatoare, eu (Claude) citesc logul si stiu EXACT ce a mers, ce a picat,
si ce trebuie reparat — fara sa imi explici nimic.

---

## Cele 10 componente (toate active)

| # | Componenta | Ce capteaza | Unde se salveaza |
|---|---|---|---|
| 1 | Error Capture | Erori JavaScript neprinde | localStorage + local_debug.log |
| 1b | Console Interception | React warnings, MathJax errors | localStorage + local_debug.log |
| 2 | Action Tracker | Toate actiunile tale (click-uri, selectii) | localStorage + local_debug.log |
| 3 | API Interceptor | Fiecare apel API cu status + durata | localStorage + local_debug.log |
| 4 | Data Validator | Verifica calitatea output-ului (LaTeX, SVG, headings) | localStorage + local_debug.log |
| 5 | Session Context | Device, browser, rezolutie, PWA | localStorage + local_debug.log |
| 6 | Server Logging | Pipeline OCR + traducere detaliat | local_debug.log (doar local) |
| 7 | File Writer | Scrie logurile client in fisier local | data/logs/local_debug.log |
| 8 | ISSUES.md | Probleme vizuale raportate manual | ISSUES.md |
| 9 | DEV_LOCAL.bat | Pornire mediu local cu cleanup | DEV_LOCAL.bat |
| 10 | Export Loguri | Buton "Copiaza loguri" pe /diagnostics | Clipboard |

---

## Cum folosesti — 3 scenarii

### SCENARIU 1: Testare LOCALA (cel mai frecvent)

```
PAS 1: Dublu-click pe DEV_LOCAL.bat
       → Opreste procese vechi
       → Curata cache
       → Porneste server
       → Deschide browser automat

PAS 2: Testezi in browser (localhost:3000)
       → Traduci imagini, convertesti fisiere
       → Totul se logheaza automat in data/logs/local_debug.log

PAS 3: Deschizi Claude Code si scrii:
       "Citeste logul"
       sau
       "Citeste data/logs/local_debug.log"

PAS 4: Eu citesc logul si vad:
       → Ce ai facut (fisiere, limba, format)
       → Ce a mers (OCR OK, traducere OK)
       → Ce a picat (API 500, timeout, LaTeX lipsa)
       → Corectez imediat

PAS 5: Tu retestezi → totul OK → "Push"
```

### SCENARIU 2: Testare pe VERCEL LIVE (telefon/tablet)

```
PAS 1: Deschizi https://traduceri-matematica.vercel.app pe telefon
PAS 2: Testezi traduceri, conversii
PAS 3: Daca ceva nu merge:
       → Deschizi /diagnostics pe telefon
       → Apesi butonul "Copiaza loguri"
       → Lipesti logurile in Claude Code chat

PAS 4: Eu citesc logurile si corectez
```

### SCENARIU 3: Probleme VIZUALE (ce logurile nu pot captura)

```
PAS 1: Scrii in ISSUES.md:
       ## 2026-03-24
       - Formula de pe pagina 2 e taiata pe jumatate
       - Pe iPhone butonul PDF nu apare
       - SVG-ul cu triunghiul e prea mic

PAS 2: La sesiunea urmatoare, eu citesc ISSUES.md si corectez
```

---

## Cum arata logul — exemplu real complet

### LOCAL (data/logs/local_debug.log)

```
========================================================
SESSION START | 24.03.2026, 15:30:00
Device: desktop | Windows | Chrome | 1920x1080
========================================================

[15:30:01] INFO   | App loaded | Device: desktop/Windows/Chrome | Page: /
[15:30:01] INFO   | API | GET /api/health | 200 | 85ms | OK

[15:30:05] ACTION | Navigare: /traduceri
[15:30:08] ACTION | Limba sursa schimbata | from: ro, to: ro
[15:30:09] ACTION | Limba tinta schimbata | from: sk, to: en
[15:30:12] ACTION | Fisiere selectate (click) | count: 2, names: foto1.jpg, foto2.jpg

[15:30:15] ACTION | Traducere pornita | fileCount: 2, sourceLang: ro, targetLang: en
[15:30:15] INFO   | API | POST /api/translate | ... sending
[15:30:15] ACTION | Traducere initiata | 2 fisier(e) | ro -> en | Tipuri: jpeg, jpeg
[15:30:16] INFO   | Fisier 1/2: image/jpeg | 245000 bytes
[15:30:23] OK     | OCR complet | Provider: Gemini | Durata: 7.2s | Chars: 450
[15:30:23] INFO   | Math protejat: 5 placeholders
[15:30:29] OK     | Traducere completa | Provider: Gemini | Durata: 6.1s
[15:30:30] INFO   | Fisier 2/2: image/jpeg | 198000 bytes
[15:30:36] OK     | OCR complet | Provider: Gemini | Durata: 5.8s | Chars: 320
[15:30:36] INFO   | Math protejat: 3 placeholders
[15:30:37] WARN   | Traducere Gemini esuata: 429 rate limit | Fallback: Groq
[15:30:41] OK     | Traducere completa | Provider: Groq | Durata: 4.2s
[15:30:41] INFO   | Pagina 1 output: LaTeX=5 | SVG=2 | Headings=4 | Chars=820
[15:30:41] INFO   | Pagina 2 output: LaTeX=3 | SVG=0 | Headings=2 | Chars=510
[15:30:42] OK     | SUCCES TOTAL | 2 pagini | Durata: 26200ms
[15:30:42] INFO   | API | POST /api/translate | 200 | 26500ms | OK

[15:30:42] INFO   | VALIDATE | Traducere output: LaTeX=8 | SVG=2 | Headings=6 | Text=1330 chars
[15:30:42] INFO   | Traducere reusita | pages: 2, duration_ms: 26200

[15:30:50] ACTION | Download HTML | format: html
[15:30:55] ACTION | Print/PDF | format: pdf

[15:31:00] ACTION | Convertor: operatie schimbata | operation: convert
[15:31:02] ACTION | Convertor: format selectat | format: docx
[15:31:05] ACTION | Conversie pornita | operation: convert, targetFormat: docx
[15:31:05] INFO   | API | POST /api/convert | 200 | 1200ms | OK
[15:31:05] INFO   | VALIDATE | Conversie convert: traducere.docx | 45 KB | OK
[15:31:06] INFO   | Conversie reusita | duration_ms: 1200

--- EROARE: exemplu ce ar aparea daca ceva pica ---

[15:32:00] ACTION | Traducere pornita | fileCount: 1, sourceLang: ro, targetLang: sk
[15:32:00] INFO   | API | POST /api/translate | ... sending
[15:32:55] WARN   | API | POST /api/translate | 504 | 55000ms | FAIL
[15:32:55] ERROR  | Traducere esuata | Gateway Timeout
[15:32:55] ERROR  | Server error 504: Function timed out

--- EROARE: output slab ---

[15:33:00] INFO   | VALIDATE | Traducere output: LaTeX=0 | SVG=0 | Headings=0 | Text=45 chars
[15:33:00] WARN   | VALIDATE | Text foarte scurt (<50 chars) — posibil OCR esuat
[15:33:00] WARN   | VALIDATE | Nicio formula LaTeX detectata — posibil math pierdut
[15:33:00] WARN   | VALIDATE | Niciun heading detectat — structura posibil pierduta

--- EROARE: React/MathJax warning ---

[15:33:10] WARN   | MathJax: Unknown control sequence \triangleABC | source: console
[15:33:10] WARN   | Each child in a list should have a unique "key" prop | source: console
```

### Ce vad EU din acest log (fara sa imi explici nimic):

1. Ai tradus 2 JPEG-uri RO→EN: OK, 26s, Gemini a dat rate limit pe traducerea #2 dar Groq a preluat
2. Output: 8 formule LaTeX, 2 SVG, 6 headings — calitate buna
3. Ai descarcat HTML si PDF — OK
4. Ai convertit in DOCX — OK, 45KB
5. A doua traducere (1 fisier): TIMEOUT la 55s — fisierul probabil prea mare
6. A treia traducere: OCR a returnat doar 45 chars, fara LaTeX/SVG/headings — OCR a esuat complet
7. MathJax nu recunoaste `\triangleABC` — trebuie `\triangle ABC` cu spatiu

---

## Fisiere create/modificate

| Fisier | Ce s-a schimbat |
|---|---|
| `frontend/src/lib/monitoring.ts` | +Console interception, +API interceptor global |
| `frontend/src/lib/validator.ts` | NOU — validare output traduceri/conversii |
| `frontend/src/app/api/logs/route.ts` | Rescris — scrie in fisier local (dev mode) |
| `frontend/src/app/traduceri/page.tsx` | +Validator call dupa traducere |
| `frontend/src/app/convertor/page.tsx` | +Validator call, +logAction operatie/format |
| `frontend/src/components/traduceri/LanguageSelector.tsx` | +logAction limba schimbata/inversata |
| `frontend/src/components/traduceri/FileUpload.tsx` | +logAction fisiere selectate |
| `frontend/src/components/traduceri/Dictionary.tsx` | +logAction termen adaugat/sters |
| `frontend/src/components/traduceri/PreviewPanel.tsx` | +logAction editor toggle |
| `frontend/src/app/diagnostics/page.tsx` | +Buton "Copiaza loguri" |
| `api/translate.py` | +Logging per-pas OCR/traducere/output stats |
| `api/convert.py` | +Logging conversie initiata/completa/eroare |
| `data/logs/local_debug.log` | Fisierul de log (creat automat, gitignored) |
| `ISSUES.md` | Template probleme vizuale |
| `DEV_LOCAL.bat` | Script pornire mediu local |

---

## Comenzi rapide pentru Claude

| Ce vrei | Ce scrii in chat |
|---|---|
| Verifica logurile locale | "Citeste data/logs/local_debug.log" |
| Verifica probleme vizuale | "Citeste ISSUES.md" |
| Porneste server local | "Ruleaza DEV_LOCAL.bat" sau dublu-click |
| Commit + push | "Push" |
