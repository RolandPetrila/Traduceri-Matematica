# Sistem Traduceri

Aplicatie web (PWA) pentru traducerea documentelor de matematica cu AI.

## Functionalitati

- **Traducere documente**: Foto/PDF -> OCR AI -> Markdown+LaTeX -> Traducere -> HTML A4 printabil
- **Limbi**: Romana, Slovaca, Engleza (extensibil)
- **Figuri geometrice**: SVG inline cu constructii precise
- **Convertor fisiere**: PDF, DOCX, IMG, MD, HTML — merge, split, compress
- **Dictionar terminologic**: Invata din corectii, asigura consistenta
- **PWA**: Instalabil pe Windows, Android, iPhone

## Stack

- **Frontend**: Next.js 14, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI (Python)
- **AI**: Google Gemini (primar), Groq + Mistral (fallback)
- **Deploy**: Vercel (auto-deploy din GitHub)

## Setup local

```bash
# 1. Clone
git clone https://github.com/RolandPetrila/Traduceri-Matematica.git
cd Traduceri-Matematica

# 2. Configureaza API keys
cp .env.example .env
# Editeaza .env cu cheile tale

# 3. Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# 4. Frontend (alt terminal)
cd frontend
npm install
npm run dev
```

Deschide http://localhost:3000

## Tema UI

"Tabla verde + creta" — interfata cu aspect de tabla scolara, dedicata matematicii.
