# PLAN — Matematică la nivel academic (KaTeX) în editor

> Versiune 1.0 · 2026-07-26 · Efort: xhigh · Cerut de utilizatorul real (Cristina, prof. matematică)
> Referință-standard: `Downloads/limite_matematica.jpeg` (TEST XI — limite cu fracții-bară, `lim` cu x→a dedesubt, radicali cu linie deasupra).
> Proof of quality (KaTeX = 1:1 cu poza) făcut și confirmat cu Roland înainte de cod.

## 1. De ce (problema)

Editorul randa matematica „ieftin": `<sup>/<sub>` + fracții inline `a/b` + `lim (x→0) …` pe un rând. Cristina cere **nivel academic**: fracții reale cu bară (NU `/`), `lim` cu x→a dedesubt, radicali cu overline (inclusiv ordin n). Decizia §17 veche „fără LaTeX în editor" e **răsturnată de utilizatorul real** — calitatea primează.

## 2. Decizii (confirmate Roland, 2026-07-26)

| #   | Decizie       | Valoare                                                                                                                            |
| --- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Motor randare | **KaTeX** (npm, self-contained, sincron, rapid) — NU CDN                                                                           |
| D2  | Nod editor    | **`@tiptap/extension-mathematics` v3.29** (oficial, aliniat cu TipTap 3.28) — nod math KaTeX, editabil                             |
| D3  | UX autor      | **Constructor cu câmpuri** (numărător/numitor/„x→∞"/radicand) → generează LaTeX; Cristina **NU tastează LaTeX**                    |
| D4  | Export        | **AMBELE**: PDF (KaTeX fidel, CSS+fonturi inline) **+** Word .docx (matematică ca **imagine** SVG/PNG — fidel, needitabil în Word) |
| D5  | Bibliotecă    | **Re-randez TOATE cele 214 formule** (V–XII) academic (câmp `latex` per formulă)                                                   |

## 3. Faze (checklist) + gate

- [x] **M1 — Fundație KaTeX + randare editor** ✅ 2026-07-26: `katex@0.16.11` + `@tiptap/extension-mathematics@3.28.0` (aliniat cu core 3.28; peer katex ^0.16) + `@types/katex`; `Mathematics.configure({katexOptions:{throwOnError:false,strict:false}})` în `extensions.ts`; `import "katex/dist/katex.min.css"` în `EditorTiptap.tsx` (fonturi bundle-uite de Next). Gate: tsc 0 · build OK · **verificat LIVE**: fracție randată academic în editor + în `getHTML` + KaTeX re-randează după reload (round-trip R-MATH OK).
- [~] **M2 — Constructor** (parțial ✅ 2026-07-26): `EditorMathBuilder.tsx` — tab „Construiește" în meniul Matematică, segmente **Fracție / Limită / Radical**, câmpuri prietenoase (norm: x²→x^2, √()→\sqrt{}, ∞/π/·) + **previzualizare KaTeX live** → `insertInlineMath({latex})`. Verificat live: fracție `(1+2x+x²)/(1+3x+x²)` construită + inserată + randată academic. RĂMAS: matrice/Σ/∫, editare la click (re-deschide constructorul), nested radical-în-fracție mai fluid.
- [ ] **M3 — Export**: (a) **PDF** — `buildDocumentHtml` include CSS KaTeX + fonturi base64 (altfel glife rupte la `window.open`). (b) **Word** — fiecare nod math: LaTeX → SVG (MathJax `tex2svg`, deja în proiect) → PNG (canvas) → embed în .docx (turbodocx acceptă imagini, ca la figuri). Gate: PDF cu fracții/limite corecte (eyeball) + DOCX dezarhivat conține imaginile math.
- [ ] **M4 — Re-encodare bibliotecă (214 formule)** ⚠️ **cel mai riscant (R-MATH)**: adaug câmp `latex` la fiecare formulă în `math-data.json`, **pe clase, în loturi mici, fiecare verificat vizual** (o formulă greșită = bug critic pt un prof). Randare: dacă `latex` există → KaTeX; altfel fallback pe `html` vechi (migrare graduală, fără regresie). Gate: fiecare clasă re-randată e verificată; niciun fallback rupt.
- [ ] **M5 — Non-regresie + export re-test + deploy**: G1–G9 rămân verzi; export PDF/DOCX/HTML re-testat cu math nou; telemetrie `editor:math_insert` extinsă (kind: fraction/limit/root/…). Deploy prod (confirmare Roland).

## 4. Riscuri & mitigări

| Risc                                             | Mitigare                                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| **R-MATH: formulă greșită la re-encodare (214)** | Lot mic per clasă + verificare vizuală fiecare; fallback pe `html` vechi până e verificată; NU regex orb |
| KaTeX fonturi lipsă la PDF (`window.open`)       | CSS KaTeX + fonturi **base64 inline** în documentul de print                                             |
| turbodocx nu știe KaTeX                          | Word = math-ca-**imagine** (SVG→PNG), calea dovedită de figuri (add_picture)                             |
| Extensia v3.29 vs TipTap 3.28                    | Același major; verific la M1 (tsc + render); dacă rupe → community `@aarkue/tiptap-math-extension`       |
| Efort mare / multi-sesiune                       | Faze mici livrabile; M1–M3 dau valoare (constructor + export) chiar înainte de M4 (biblioteca)           |

## 5. Ce NU se atinge

Pipeline traducere (MathJax overlay), Convertor, Planșe, Asistent — neatinse. Fallback `html` vechi rămâne până fiecare formulă are `latex` verificat.
