# CHANGELOG — Traduceri Matematica

> **Istoric detaliat pe runde/versiuni (v5→v46):** vezi `docs/HANDOFF_SESIUNE.md` (jurnal per sesiune)
>
> - `docs/PLAN_MASTER.md` + `git log`. Acest CHANGELOG ține doar reperele majore de versiune.

## v4.x (LIVE pe Vercel + Supabase, 2026-07 → 2026-08; PROD curent `CACHE_VERSION v46`)

Module majore livrate peste v4.0 (rezumat; detaliu în HANDOFF/git):

- **Editor matematic nativ TipTap** (F1-F9): 334+ formule V-XII, DOCX OMML→LaTeX, import OCR în editor, traducere-în-editor (F8), command palette Ctrl+K, figuri redimensionabile. Iframe-ul vechi retras la F6.
- **Module noi:** Chat AI, Calculator, Teste (Corectare/Generare) — v30/v31/v32.
- **Planșe** (fișe interactive offline): 6/6 generatoare (labirint/căutare/unește/dictare/numere/integramă) + coș multi-fișă + integramă multi-formă + varietate extinsă — v39/v40/v41.
- **Școlare 🌐** (fișe curriculare AI, grădiniță→liceu): F0 (skeleton 16 nivele + pilot) v45, F1 (regulamente Gimnaziu Mate 6/7/8) v46, F3 (Primar Cl.0-4) livrat.
- **OCR upgrade (R7/R8):** Azure layout (tabele/figuri) + Gemini math rutat pe tip; fidelitate export.
- **Infra:** migrare proxy Pages→App Router, `maxDuration` 300s, CI GitHub Actions, curățenie cod mort.

## v4.0.0

- Migrare Render → Vercel (frontend + backend Python serverless)
- Supabase pentru log-uri diagnostic + coduri de eroare centralizate (cross-device)
- OCR per-pagina (rasterizare pdf.js in browser) — procesare per-pagina, comod sub `maxDuration` 300s
- Progres real la upload (inlocuieste progresul simulat)
- Editare inline persistenta (editarile supravietuiesc la switch limba + export)
- Export PDF vectorial (print + MathJax typeset), DOCX/HTML din continut editat
- Sistem unificat de butoane cu contrast WCAG AA pe tabla verde
- Contoare Gemini + rate limiting adaptate la mediul serverless stateless

## v2.0.0 (istoric)

- Refactorizare pipeline multi-pas (OCR structurat + crop figuri + DeepL)
- Language toggle RO/SK/EN
- Engine selector DeepL/Gemini
- Editare inline (contentEditable)
- Export HTML + DOCX + PDF
- Batch processing
- Diagnostics extins (DeepL usage, API health, notificari)

## v1.0.0 (2026-03-23)

- Pipeline: imagine → Gemini OCR → Markdown → traducere → HTML A4
- Convertor fisiere (PDF, DOCX, HTML, merge, split, compress)
- Editare PDF (rotate, delete, reorder, watermark)
- Dictionar terminologic RO-SK (100 termeni)
- Istoric traduceri + conversii
- PWA instalabil
- Monitoring complet (10 componente feedback loop)
