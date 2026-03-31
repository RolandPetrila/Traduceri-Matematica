# Sistem Traduceri Matematica

Aplicatie web (PWA) pentru traducerea documentelor matematice cu AI — RO, SK, EN.
Utilizator principal: Cristina (profesoara de matematica la sectia slovaca).

## Live

- **Frontend**: https://traduceri-matematica-7sh7.onrender.com
- **API**: https://traduceri-api.onrender.com

## Stack

- **Frontend**: Next.js 14 + Tailwind CSS + TypeScript
- **Backend**: Python serverless (api/) + shared lib (api/lib/)
- **AI OCR**: Gemini 2.5 Flash (JSON mode)
- **AI Traducere**: DeepL Free (principal) + Gemini (fallback)
- **Figuri**: Crop din original cu Pillow (bbox de la OCR)
- **Deploy**: Render (auto-deploy din GitHub, free tier, Frankfurt)

## Dezvoltare locala

```bash
# 1. Copiaza .env.example in .env si completeaza cheile API
cp .env.example .env

# 2. Instaleaza dependente
cd frontend && npm install
pip install -r requirements.txt

# 3. Porneste serverele
# Terminal 1: Backend Python
python dev_server.py

# Terminal 2: Frontend Next.js
cd frontend && npm run dev
```

Frontend: http://localhost:3000
Backend API: http://localhost:8000

## Structura

```
api/                  Python API handlers
  lib/                Module partajate (OCR, traducere, HTML, crop)
  fonts/              DejaVu Sans (pentru PDF diacritice)
frontend/             Next.js 14 app
  src/app/            Pagini (traduceri, convertor, diagnostics)
  src/components/     Componente React
  src/lib/            Utilitare (cache, monitoring, storage)
config/               Configuratie (limbi, tab-uri, dictionar)
99_Plan_vs_Audit/     Planificare si tracking
```

## API Endpoints

| Endpoint | Metoda | Descriere |
|----------|--------|-----------|
| `/api/health` | GET | Health check + versiune |
| `/api/translate` | POST | OCR + traducere fisiere (JPEG/PDF/DOCX) |
| `/api/translate-text` | POST | Traducere text (fara OCR) |
| `/api/convert` | POST | Conversie fisiere (PDF/DOCX/HTML/MD/IMG) |
| `/api/deepl-usage` | GET | Cota DeepL combinata (2 chei) |

## Licenta

Proiect privat — uz intern.
