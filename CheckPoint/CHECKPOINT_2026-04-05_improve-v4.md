# CHECKPOINT — Sesiune /improve v4.0
# Data: 2026-04-05
# Tip: Final sesiune

---

## OBIECTIV SESIUNE

Analiza exhaustiva a proiectului prin `/improve` (complet):
profiling real + explorare codebase + cercetare web 2026.
Reorganizare `RECOMANDARI_IMBUNATATIRI.md` cu faze secventiale de executie.

---

## REALIZAT

### 1. Analiza /improve v4.0 (3 agenti paraleli)
- **Profiling**: Frontend 679 LOC / 34 fisiere, Backend 2995 LOC / 15 fisiere, 63MB build
- **Explorare codebase**: 25 issues CRITIC/HIGH gasite (securitate, performanta, arhitectura, DX)
- **Cercetare web**: versiuni actuale stack, CVE-uri, alternative gratuite, best practices 2026

### 2. Findings cheie
- **CVE-2025-29927** — Next.js 14.x are authorization bypass in middleware [CERT, CRITIC]
- **Gemini Flash 1000 RPD vs Pro 100 RPD** — ordinea fallback e inversa, risc epuizare
- **2 npm HIGH** (picomatch ReDoS) — fix disponibil cu `npm audit fix`
- **MathJax 4.0** — 30% mai rapid, doar schimbare CDN URL
- **Rate limiter** — cod existent dar NICIODATA integrat pe Render (API neprotejat)
- **N+1 traduceri** — 1 fetch per sectiune in loc de batch
- **Memory leak** Object URLs in DocumentViewer
- **import fitz depreciat** → trebuie migrat la `import pymupdf`
- **.env LOCAL** — verificat, NU e in git (OK, in .gitignore)

### 3. RECOMANDARI_IMBUNATATIRI.md actualizat la v4.0
- Reorganizat in **6 faze secventiale** (A → B → C → D → E → F)
- 8 sugestii NOI adaugate (S1-S8 din /improve)
- Fiecare item: fisier exact + cod complet implementare + cum verifici
- Estimari efort per faza

### 4. Memory snapshot salvat
- `memory/imbunatatiri_snapshot_2026_04_05.md` — inlocuieste v3.0 din 2026-04-04
- `memory/MEMORY.md` — index actualizat

---

## FISIERE MODIFICATE

| Fisier | Actiune | Descriere |
|--------|---------|-----------|
| `99_Plan_vs_Audit/RECOMANDARI_IMBUNATATIRI.md` | MODIFICAT (v3.0→v4.0) | Reorganizat pe faze A-F, 8 sugestii NOI |
| `memory/imbunatatiri_snapshot_2026_04_05.md` | CREAT | Snapshot /improve v4.0 |
| `memory/MEMORY.md` | MODIFICAT | Index actualizat (snapshot nou) |

---

## DECIZII TEHNICE SESIUNE

| # | Decizie | Motivare |
|---|---------|----------|
| D-FAZE | Reorganizare pe 6 faze A-F in loc de P0/P1/P2 | Faze secventiale clare, fiecare cu dependinte explicite |
| D-FLASH | Flash primary, Pro fallback | Flash 1000 RPD vs Pro 100 RPD — Pro se epuizeaza la 15+ pagini/zi |
| D-MATHJAX4 | Upgrade MathJax 3→4 recomandat | Performanta +30%, backward compatible, efort minim |
| D-NEXTJS | Upgrade la 15.x (nu 16) | CVE critic fix, React 19 optional — 16 necesita mai mult efort |

---

## STARE PROIECT

- **Faza curenta PLAN_v3**: Faza 2 la 90% (raman: test Android, PDF batching, fallback test, cache test)
- **Problema activa**: Layout deformat (height fix + fitPaperSections) — din sesiunea anterioara
- **Deploy**: LIVE pe Render, functional

---

## FAZE IMBUNATATIRI (sumar)

```
FAZA A — Quick Wins (~3h):
  A1: npm audit fix
  A2: import fitz → pymupdf
  A3: Pin versiuni Python
  A4: Dead code cleanup
  A5: Fix memory leak Object URLs
  A6: MathJax 3 → 4.0
  A7: Inversare Gemini Flash/Pro

FAZA B — Securitate (~4h):
  B1: Rate limiter integrat pe Render
  B2: DOMPurify SVG whitelist
  B3: API keys din URL in header
  B4: Validare dimensiune server-side

FAZA C — Stack upgrade (~8h):
  C1: Next.js 14 → 15 (CVE CRITIC)
  C2: Tailwind v3 → v4
  C3: Next.js output standalone

FAZA D — Performanta (~8h):
  D1: Batch traduceri (elimina N+1)
  D2: AbortController deduplication
  D3: Error retry backoff
  D4: PDF mare batching
  D6: MathJax deduplicare script

FAZA E — UX/Functii noi (~16h):
  E1: Notificari browser
  E2: Gemini usage tracking
  E3: Diacritice PDF (font DejaVu)
  E4: Lazy loading componente
  ...

FAZA F — Teste/Calitate (~12h):
  F1: Unit teste backend (pytest)
  F2: Unit teste frontend (Jest)
  F3: Structured logging JSON
  ...
```

---

## URMATOAREA SESIUNE

**Optiune 1 — Quick Wins (recomandat, ~3h):**
Executa Faza A in ordine: A1→A7, commit+push dupa fiecare item.
Incepe cu: `cd frontend && npm audit fix`

**Optiune 2 — Fix layout activ:**
Rezolva problema din sesiunea anterioara (layout deformat):
- Fix `html_builder.py`: scoate `height:297mm` fix si `fitPaperSections()`
- Foloseste `page-break-after:always` pentru print

**Sursa de adevar progres:** `99_Plan_vs_Audit/PLAN_v3.md`
**Sursa de adevar imbunatatiri:** `99_Plan_vs_Audit/RECOMANDARI_IMBUNATATIRI.md`
