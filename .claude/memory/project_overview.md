---
name: Context proiect Sistem Traduceri
description: Decizii tehnice confirmate, provideri AI alesi, constrangeri, arhitectura v4
type: project
---

Sistem web (PWA) pt traducere documente matematica RO->SK/EN.
**Why:** Cristina (sotia lui Roland) preda matematica in Slovacia, are nevoie de manuale traduse cu figuri geometrice.
**How to apply:** Prioritizeaza calitatea traducerii matematice si fidelitatea figurilor geometrice.

## Decizii confirmate 2026-03-22 (istoric)
- AI primar: Google Gemini Free Tier (vision + traducere)
- Fallback: Groq (traducere), Mistral (vision)
- UI: tema "tabla verde + creta"
- Extensibilitate: limbi noi + module functionale separate
- Istoric: complet cu detalii, preview, re-download
- Dictionar: panel pliabil in tab Traduceri
- Convertor: tab separat, toate formatele, merge/split/compress, PDF editing
- PWA: instalabil Windows/Android/iPhone cu iconita matematica

## Decizii confirmate v4 (2026-07-07) — SUPRASCRIU cele vechi unde difera
- **Deploy: Vercel** (frontend Next.js + backend Python serverless `api/*.py`) — migrare FULL de pe Render.
  Motiv Render→Vercel: user a cerut Vercel; OCR rearhitecturat per-pagina ca sa respecte limita 60s serverless.
- **Supabase** (free tier): DOAR log-uri diagnostic + coduri de eroare centralizate (cross-device) + contorul Gemini.
  FARA autentificare. FARA stocare documente (istoricul ramane localStorage).
- **Stack**: Next.js 14 + Tailwind + TypeScript; Python serverless stdlib (fara framework, apeluri urllib).
- **OCR**: Gemini 2.5 Flash → Flash-Lite → Pro (JSON mode), fallback Mistral OCR. Bbox + crop Pillow pt figuri.
- **Traducere**: DeepL Free → NLLB / OpenRouter / Gemini / Groq (lanturi fallback in endpoint-uri).
- **Rasterizare PDF in browser** (pdf.js) — o pagina/invocare, progres real.
- **Editare live persistenta** (contentEditable → cacheRef) — supravietuieste switch limba + toate export-urile.
- **Export**: PDF vectorial (print + MathJax typeset), DOCX (backend /api/convert), HTML — toate din continut editat.
- **Butoane**: un singur sistem vizual, contrast WCAG AA pe tabla verde (#2d5016).
- **Module noi (planificate)**: Editor matematic (gimnaziu+liceu) + logica din Asistent_Text_AI — module separate (R-EXT).

## Provenienta cod
- Proiect originar CLI: C:\Users\ALIENWARE\Desktop\Cristina\Extragere_Traducere_HTML_Codex
- Editor matematic + Asistent_Text_AI: din C:\Proiecte (se aduc pe branch git, nu sunt inca in repo).
