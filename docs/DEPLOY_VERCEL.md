# Deploy Vercel + Supabase — Ghid (v4)

Migrare de pe Render pe **Vercel** (frontend + backend Python serverless) + **Supabase** (log-uri).
Tot pe **free tier**. Deploy-ul real necesita conturile tale — pasii de mai jos ii faci tu (Roland).

## Arhitectura: DOUA proiecte Vercel (din acelasi repo)
| Proiect | Root Directory | Ce e |
|---------|----------------|------|
| `traduceri-frontend` | `frontend/` | Next.js 14 (preset Next.js, auto-detectat) |
| `traduceri-api` | `.` (radacina) | Functii Python `api/*.py` (via `vercel.json`) |

Motiv: ruta Next `frontend/src/app/api/logs` s-ar ciocni cu functiile Python `api/*` intr-un singur proiect.

## Pas 1 — Supabase
1. Creeaza un proiect nou pe [supabase.com](https://supabase.com) (free).
2. SQL Editor → ruleaza continutul din `supabase/schema.sql` (tabele `logs`, `gemini_counter`, functia `increment_gemini`, RLS).
3. Project Settings → API → noteaza:
   - `Project URL` → `SUPABASE_URL` si `NEXT_PUBLIC_SUPABASE_URL`
   - `service_role` key (secret!) → `SUPABASE_SERVICE_KEY` (DOAR server-side, niciodata in browser)

## Pas 2 — Proiect API (Python)
1. Vercel → New Project → importa repo-ul, **Root Directory = `.`** (radacina).
2. Framework Preset: **Other** (vercel.json seteaza deja functiile).
3. Environment Variables:
   ```
   GOOGLE_AI_API_KEY, DEEPL_API_KEY, DEEPL_API_KEY2, GROQ_API_KEY,
   MISTRAL_API_KEY, HF_TOKEN, OPENROUTER_API_KEY   (cele pe care le folosesti)
   SUPABASE_URL, SUPABASE_SERVICE_KEY
   ALLOWED_ORIGIN      = https://<domeniul-frontend>.vercel.app
   APP_PUBLIC_URL      = https://<domeniul-frontend>.vercel.app
   ```
4. Deploy. Noteaza URL-ul (ex. `https://traduceri-api.vercel.app`).
5. Verifica: `GET https://traduceri-api.vercel.app/api/health` → `{"status":"ok"}`.

## Pas 3 — Proiect Frontend (Next.js)
1. Vercel → New Project → acelasi repo, **Root Directory = `frontend/`**.
2. Environment Variables:
   ```
   NEXT_PUBLIC_API_URL       = https://traduceri-api.vercel.app   (URL-ul de la Pas 2)
   PYTHON_API_URL            = https://traduceri-api.vercel.app
   NEXT_PUBLIC_SUPABASE_URL  = https://<proiect>.supabase.co      (doar pt CSP)
   SUPABASE_URL              = https://<proiect>.supabase.co      (ruta /api/logs)
   SUPABASE_SERVICE_KEY      = <service_role key>                 (ruta /api/logs, server-side)
   ```
3. Deploy. Dupa deploy, intoarce-te la proiectul API si seteaza `ALLOWED_ORIGIN`/`APP_PUBLIC_URL`
   la domeniul real al frontend-ului, apoi redeploy API.

## Pas 4 — Verificare live
- Deschide frontend-ul → upload o poza/PDF → vezi progresul real per-pagina.
- Switch RO → SK → editeaza un text → re-export PDF/DOCX → editarea e prezenta.
- `/diagnostics` → sursa "Toate dispozitivele" arata log-urile din Supabase (cross-device).
- Provoaca o eroare (ex. fisier invalid) → apare cu cod (`E-OCR-001` etc.) in diagnostics.

## Note free-tier
- Vercel Hobby: functii max **60s** (setat in `vercel.json`). De aceea OCR ruleaza **o pagina/apel**
  (rasterizare pdf.js in browser). Nu procesa zeci de pagini intr-un singur apel.
- Supabase free se **suspenda dupa ~1 saptamana** de inactivitate. Codul e **fail-open**: daca
  Supabase e jos, OCR/traducerea merg normal, doar logarea se degradeaza.
- Retentie log-uri: ruleaza periodic `delete from logs where created_at < now() - interval '30 days';`
- `keepalive.py` a fost eliminat (serverless nu are cold-start-idle de pingat).
