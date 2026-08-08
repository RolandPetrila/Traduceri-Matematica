# Deploy Vercel + Supabase — Ghid (v4)

Migrare de pe Render pe **Vercel** (frontend + backend Python serverless) + **Supabase** (log-uri).
Tot pe **free tier**. Deploy-ul real necesita conturile tale — pasii de mai jos ii faci tu (Roland).

## Arhitectura: DOUA proiecte Vercel (din acelasi repo)

| Proiect              | Root Directory | Ce e                                          |
| -------------------- | -------------- | --------------------------------------------- |
| `traduceri-frontend` | `frontend/`    | Next.js 15 (preset Next.js, auto-detectat)    |
| `traduceri-api`      | `.` (radacina) | Functii Python `api/*.py` (via `vercel.json`) |

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

## Pas 3b — Chei AI pentru Asistent Text AI (ruta `/api/proxy`)

Modulele AI (Asistent/Chat/Școlare) folosesc o **ruta App Router** `frontend/src/app/api/proxy/route.ts` (migrata din Pages Router, 2026-08-07)
care traieste in **proiectul frontend** (same-origin cu iframe-ul). Deci cheile AI ale proxy-ului se
seteaza pe proiectul **frontend**, nu pe cel Python. Fara ele, `/api/proxy` intoarce `500 Server key missing`
si Asistentul e nefunctional (restul aplicatiei merge normal).

Chei asteptate de `api/proxy.js` (env vars pe proiectul frontend):

```
GROQ_API_KEY, GOOGLE_API_KEY, MISTRAL_API_KEY, DEEPL_API_KEY,
TAVILY_API_KEY, CEREBRAS_API_KEY, OPENROUTER_API_KEY, BRAVE_SEARCH_API_KEY   (primari)
GOOGLE_API_KEY_2, MISTRAL_API_KEY_2, DEEPL_API_KEY_2                         (failover, optional)
UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN                            (rate-limit persistent, optional)
```

Codul tolereaza cheile lipsa (un provider fara cheia lui → 500 → lantul de fallback continua).
Cost-cap + origin allowlist + rate-limit sunt in proxy (nu depind de cheile de mai sus).

**Automatizare** — din `frontend/`, dupa `vercel login` + link:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\set-vercel-env.ps1
```

Scriptul citeste cheile din **Windows User env vars** (sistemul central `.api-keys`) si le impinge in
proiectul linkat pe `production` + `preview`. Valorile trec doar local env→Vercel (nu apar nicaieri).
Apoi `vercel --prod` pentru redeploy. Alternativ: adauga-le manual in dashboard-ul Vercel.

## Pas 4 — Verificare live

- Deschide frontend-ul → upload o poza/PDF → vezi progresul real per-pagina.
- Switch RO → SK → editeaza un text → re-export PDF/DOCX → editarea e prezenta.
- `/diagnostics` → sursa "Toate dispozitivele" arata log-urile din Supabase (cross-device).
- Provoaca o eroare (ex. fisier invalid) → apare cu cod (`E-OCR-001` etc.) in diagnostics.

## Note free-tier

- **Marime functii Python**: dependentele native ocupa ~**78 MB** dezarhivat
  (PyMuPDF ~62MB + Pillow ~7MB + fpdf ~3MB + pypdf ~3MB + python-docx ~3MB) — sub
  limita Vercel de **250 MB**/functie. PyMuPDF nu poate fi scos (folosit de `_pdf_to_images` pt rasterizare PDF server-side; `figure_crop.py` foloseste Pillow, nu PyMuPDF).
- Vercel Hobby: functii max **300s** `maxDuration` (setat in `vercel.json`). OCR ruleaza oricum **o pagina/apel**
  (rasterizare pdf.js in browser). Nu procesa zeci de pagini intr-un singur apel.
- Supabase free se **suspenda dupa ~1 saptamana** de inactivitate. Codul e **fail-open**: daca
  Supabase e jos, OCR/traducerea merg normal, doar logarea se degradeaza.
- Retentie log-uri: ruleaza periodic `delete from logs where created_at < now() - interval '30 days';`
- `keepalive.py` a fost eliminat (serverless nu are cold-start-idle de pingat).
