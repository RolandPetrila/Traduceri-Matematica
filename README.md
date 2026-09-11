# Sistem Traduceri Matematica

Aplicatie web (PWA) pentru traducerea documentelor matematice cu AI — RO, SK, EN, DE.
Utilizator principal: Cristina (profesoara de matematica la sectia slovaca).

## Live

- **Frontend**: Vercel (Next.js) — vezi dashboard-ul proiectului
- **API**: Vercel (Python serverless, `api/*.py`)
- **Log-uri diagnostic**: Supabase (centralizat, cross-device)

> LIVE pe Vercel + Supabase (v4) — migrat integral de pe Render. Domeniile finale se
> seteaza in variabilele de mediu Vercel (`NEXT_PUBLIC_API_URL`, `ALLOWED_ORIGIN`).

## Stack

- **Frontend**: Next.js 15 + Tailwind CSS + TypeScript (deploy Vercel)
- **Backend**: Python serverless (`api/*.py`, handlere Vercel) + shared lib (`api/lib/`)
- **AI OCR**: Gemini 3.6 Flash → 3.5 Flash-Lite → 2.5 Flash (JSON mode), fallback Mistral OCR
- **AI Traducere**: DeepL Free (principal) → NLLB / OpenRouter / Gemini / Groq (fallback)
- **Figuri**: Crop din original cu Pillow (bbox de la OCR)
- **Log-uri + coduri eroare**: Supabase (tabele `logs`, `gemini_counter`)
- **Deploy**: Vercel (auto-deploy din GitHub, free tier) + Supabase (free tier)
- **Rasterizare PDF**: in browser cu pdf.js (o pagina/invocare → procesare per-pagina, comod sub `maxDuration` 300s)

## Dezvoltare locala

```bash
# 1. Copiaza .env.example in .env si completeaza cheile API
cp .env.example .env

# 2. Instaleaza dependente
cd frontend && npm install
pip install -r requirements.txt

# 3. Porneste serverele
# Terminal 1: Backend Python (harness local — emuleaza rutarea Vercel)
python dev_server.py

# Terminal 2: Frontend Next.js
cd frontend && npm run dev
```

Frontend: http://localhost:3000
Backend API: http://localhost:8000

> `dev_server.py` este DOAR pentru dezvoltare locala. In productie, Vercel invoca
> fiecare `api/*.py` ca functie serverless separata (nu exista proces persistent).

## Structura

```
api/                  Handlere Python serverless (Vercel)
  lib/                Module partajate (OCR, traducere, HTML, crop, Supabase)
  fonts/              DejaVu Sans (pentru PDF diacritice)
frontend/             Next.js 15 app (Vercel)
  src/app/            Pagini + rute API App Router (editor, convertor, diagnostics, api/proxy, api/logs)
  src/components/     Componente React (editor, chat, calculator, teste, scolare, ...)
  src/lib/            Utilitare (cache, monitoring, storage, scolare/, chat-providers, ...)
config/               Configuratie (tab-uri, coduri eroare)
supabase/             schema.sql (referinta tabele logs + contoare)
99_Plan_vs_Audit/     Log decizii tehnice (PLAN_DECISIONS). Sursa unica = docs/Plan_in_Lucru.md + docs/Plan_Finalizat.md
vercel.json           Config functii Python (maxDuration 300s)
```

## API Endpoints

| Endpoint              | Metoda   | Descriere                                     |
| --------------------- | -------- | --------------------------------------------- |
| `/api/health`         | GET      | Health check + versiune                       |
| `/api/ocr`            | POST     | OCR o pagina la import in Editor (F9)         |
| `/api/translate-text` | POST     | Traducere text on-demand la switch limba (F8) |
| `/api/convert`        | POST     | Conversie fisiere (PDF/DOCX/HTML/MD/IMG)      |
| `/api/deepl-usage`    | GET      | Cota DeepL combinata (2 chei)                 |
| `/api/gemini-usage`   | GET      | Cota Gemini (contor Supabase)                 |
| `/api/logs`           | GET/POST | Log-uri diagnostic (via Supabase)             |

> **Notă:** modulele AI (Chat AI / Școlare) folosesc o rută **frontend** App Router
> `frontend/src/app/api/proxy/route.ts` (same-origin, chei server-side, rate-limit + cost-cap) —
> nu handlerul Python de mai sus.

## Module (LIVE)

Convertor · Editor matematic (nativ TipTap, include import/OCR + traducere on-demand F8) ·
Chat AI · Calculator · Teste · Istoric · Planșe (6 generatoare + coș) ·
Școlare 🌐 (fișe curriculare AI, grădiniță→liceu, motor de desen determinist).

> Modulul „Traduceri" original (tab dedicat, viewer 3 pași) a fost retras din UI la F7 —
> funcționalitatea a fost absorbită de Editor. Iframe-ul „Asistent AI" a fost retras la
> /improve #16, 2026-08-07 — Chat AI e azi panou nativ.

## Licenta

Proiect privat — uz intern.
