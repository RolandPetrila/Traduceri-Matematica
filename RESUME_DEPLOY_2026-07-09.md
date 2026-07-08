# RESUME — Deploy Vercel (checkpoint 2026-07-09)

> **Sesiune nouă: citește acest fișier + `99_Plan_vs_Audit/PLAN_v3.md`, apoi continuă de la „URMĂTORUL PAS".**
> Branch: `faza-g-editor` (tot pushed pe origin). Ultim commit deploy: `942eae2` (REV8).
>
> 🔌 **NOU (2026-07-09): plugin-ul Vercel e instalat în Claude Code** (`vercel-plugin@vercel` v0.45.1, user scope; necesită sesiune nouă ca să se încarce). Sesiunea NOUĂ îl are activ → **folosește agentul `deployment-expert` sau comanda `/vercel-plugin:deploy prod`** (+ skill-urile `deployments-cicd` / `vercel-functions` / `env-vars`) ca să finalizezi deploy-ul cu **expertiză Vercel reală, nu ghicit**. Cel mai probabil acolo se rezolvă corect „Output Directory empty" (config proiect Python-only). Telemetrie off: `setx VERCEL_PLUGIN_TELEMETRY off`.

## STAREA EXACTĂ

**Blocaj unic rămas:** deploy-ul proiectului Vercel **`traduceri-api`** (funcții Python, root `.`). Restul e gata.

**Ce MERGE (verificat live):**

- ✅ Cheie Gemini nouă `GOOGLE_AI_API_KEY` (format `AQ.`, Google AI Studio) — **testată HTTP 200** pe `gemini-2.5-flash`. Procesată în sistemul central (`.api-keys`): master + Windows env vars (length 53) + catalog. INBOX arhivat.
- ✅ DeepL (`DEEPL_API_KEY`) — **testată HTTP 200** (312/500.000 caractere, cotă intactă). `DEEPL_API_KEY_2` există și e setată.
- ✅ Toate env vars setate pe proiectul Vercel `traduceri-api` (production+preview): GOOGLE_AI_API_KEY, DEEPL_API_KEY(+_2), GROQ_API_KEY, MISTRAL_API_KEY, HF_TOKEN, OPENROUTER_API_KEY, ALLOWED_ORIGIN, APP_PUBLIC_URL.
- ✅ `vercel login` funcționează (keyring). Proiectul `traduceri-api` creat + linkat corect.
- ✅ Script `DEPLOY_VERCEL.bat` → `scripts/deploy-all-vercel.ps1` (REV8) — sintaxă validă, curge până la deploy-ul API.

**Ce e BLOCAT:** `vercel --prod` pe `traduceri-api` — ultima eroare: **`Error: The Output Directory "public" is empty.`**

## URMĂTORUL PAS (în ordine)

1. **Re-rulează `DEPLOY_VERCEL.bat`** (confirmă `REV8` în Preflight). Fix-ul REV8 (`vercel.json` buildCommand creează un `public/index.html` ne-gol) ar trebui să treacă de eroarea „Output Directory empty". **NETESTAT de AI** (nu are auth Vercel local) — trebuie rulat de Roland.
2. **Dacă tot pică pe build/output** → soluția „curată" (manuală, în dashboard Vercel, 1 minut):
   - vercel.com → proiect **traduceri-api** → **Settings → Build and Deployment**
   - **Framework Preset = Other**
   - **Build Command:** Override → gol (toggle off / lasă gol)
   - **Output Directory:** Override → gol
   - **Install Command:** Override → `pip install --break-system-packages -r requirements.txt`
   - Salvează, apoi re-rulează scriptul (sau `vercel --prod` din rădăcină).
3. **Dacă build-ul trece dar `/api/health` dă 500** (runtime) → probabil `api/lib/` nu se împachetează. Adaugă în `vercel.json` la funcție: `"includeFiles": "api/lib/**"` (sau verifică `excludeFiles`). Citește build/runtime logs în dashboard.
4. **După ce API-ul e verde** (`https://traduceri-api.vercel.app/api/health` → `{"status":"ok"}`), scriptul continuă automat: creează `traduceri-frontend`, îi setează env (NEXT_PUBLIC_API_URL etc. + chei proxy), deploy Next 15. Apoi verifică fluxul.

## LECȚII DEPLOY (ca să NU repeți cele 8 runde)

| #   | Simptom                                                   | Cauză                                                                                                                                   | Fix                                                                                     |
| --- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | Scriptul murea la `vercel whoami`                         | `.bat` rulează **PowerShell 5.1** (nu 7.6!); stderr-ul vercel sub `$ErrorActionPreference=Stop` = eroare terminatoare                   | `$ErrorActionPreference="Continue"` + `$PSNativeCommandUseErrorActionPreference=$false` |
| 2   | `vercel link` lega proiectul VECHI `traduceri-matematica` | auto-detecție prin git remote                                                                                                           | `vercel link --project <nume> --yes` + verificare nume din `.vercel/project.json`       |
| 3   | `pip install` → `externally-managed-environment`          | Vercel Python = uv-managed (PEP 668)                                                                                                    | `installCommand: "pip install --break-system-packages -r requirements.txt"`             |
| 4   | `npm run build` exited 1                                  | rădăcina n-are `package.json`; Vercel folosea comanda default **salvată în setările proiectului** (vercel.json cu `null` NU suprascrie) | `buildCommand` setat EXPLICIT (non-null) în vercel.json                                 |
| 5   | `Output Directory "public" is empty`                      | `mkdir -p public` crea folder gol; Vercel cere output ne-gol (tratează ca build static)                                                 | REV8: build scrie `public/index.html`. Alt: dashboard Framework=Other                   |

**Regula de aur Vercel aici:** proiectul `traduceri-api` e tratat ca **build static** deși e doar funcții Python. `vercel.json` cu valori `null` NU suprascrie setările salvate ale proiectului — trebuie valori EXPLICITE, sau setezi în dashboard.

**Alt fapt util:** scriptul citește cheile din registry (`GetEnvironmentVariable(...,"User")`) → NU necesită restart terminal după ce se adaugă env vars noi.

## FIȘIERE CHEIE

- `vercel.json` — config funcții Python (buildCommand/installCommand override, maxDuration 60)
- `DEPLOY_VERCEL.bat` + `scripts/deploy-all-vercel.ps1` — orchestrator deploy 2 proiecte (REV8)
- `docs/DEPLOY_VERCEL.md` — ghid manual complet (topologie 2 proiecte)
- `frontend/scripts/set-vercel-env.ps1` — push env din Windows → Vercel (proiect frontend)

## RESTUL SESIUNII (deja gata, pushed pe faza-g-editor)

- Audit complet 83/100 + remediere igienă + suită teste (0→31 teste: 21 pytest + 10 jest)
- M5 retry translate-text · M6 cache SHA-256 · M7 exceptions.py · fix XSS dompurify 3.4.11
- **Next.js 14→15 mergeuit** (PR #1, `61f9b6c`) — vuln HIGH rezolvat, React 18 păstrat
- Snapshot complet: `~/.claude/context-snapshots/Traduceri-Matematica-checkpoint-2026-07-09/snapshot.md`
