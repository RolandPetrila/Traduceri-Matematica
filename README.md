# Sistem Traduceri Matematica

Aplicatie web (PWA) pentru traducerea documentelor matematice cu AI — RO, SK, EN.
Utilizator principal: Cristina (profesoara de matematica la sectia slovaca).

## Live

- **Frontend**: Vercel (Next.js) — vezi dashboard-ul proiectului
- **API**: Vercel (Python serverless, `api/*.py`)
- **Log-uri diagnostic**: Supabase (centralizat, cross-device)

> Migrare in curs Render → Vercel + Supabase (v4). Domeniile finale se seteaza in
> variabilele de mediu Vercel (`NEXT_PUBLIC_API_URL`, `ALLOWED_ORIGIN`).

## Stack

- **Frontend**: Next.js 15 + Tailwind CSS + TypeScript (deploy Vercel)
- **Backend**: Python serverless (`api/*.py`, handlere Vercel) + shared lib (`api/lib/`)
- **AI OCR**: Gemini 2.5 Flash → Flash-Lite → Pro (JSON mode), fallback Mistral OCR
- **AI Traducere**: DeepL Free (principal) → NLLB / OpenRouter / Gemini / Groq (fallback)
- **Figuri**: Crop din original cu Pillow (bbox de la OCR)
- **Log-uri + coduri eroare**: Supabase (tabele `logs`, `gemini_counter`)
- **Deploy**: Vercel (auto-deploy din GitHub, free tier) + Supabase (free tier)
- **Rasterizare PDF**: in browser cu pdf.js (o pagina/invocare → respecta limita 60s serverless)

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
  src/app/            Pagini (traduceri, convertor, diagnostics)
  src/components/     Componente React
  src/lib/            Utilitare (cache, monitoring, storage)
config/               Configuratie (limbi, tab-uri, dictionar, coduri eroare)
supabase/             schema.sql (referinta tabele logs + contoare)
99_Plan_vs_Audit/     Planificare si tracking (PLAN_v3 = sursa unica)
vercel.json           Config functii Python (maxDuration 60s)
```

## API Endpoints

| Endpoint              | Metoda   | Descriere                                      |
| --------------------- | -------- | ---------------------------------------------- |
| `/api/health`         | GET      | Health check + versiune                        |
| `/api/ocr`            | POST     | OCR o pagina (fara traducere) — pas 2 din flow |
| `/api/translate-text` | POST     | Traducere text on-demand (fara OCR) — pas 3    |
| `/api/convert`        | POST     | Conversie fisiere (PDF/DOCX/HTML/MD/IMG)       |
| `/api/deepl-usage`    | GET      | Cota DeepL combinata (2 chei)                  |
| `/api/gemini-usage`   | GET      | Cota Gemini (contor Supabase)                  |
| `/api/logs`           | GET/POST | Log-uri diagnostic (via Supabase)              |

## Licenta

Proiect privat — uz intern.
