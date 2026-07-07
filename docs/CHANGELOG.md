# CHANGELOG — Traduceri Matematica

## v4.0.0 (in curs)
- Migrare Render → Vercel (frontend + backend Python serverless)
- Supabase pentru log-uri diagnostic + coduri de eroare centralizate (cross-device)
- OCR per-pagina (rasterizare pdf.js in browser) — respecta limita 60s serverless
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
