# Deploy — Asistent Text AI

Hosting: **Vercel** (Hobby). Rădăcina de deploy: **`pwa/`** (linkat prin `pwa/.vercel/project.json`).

## Pre-deploy (checklist)

1. `npm test` → 52 teste verzi.
2. Dacă ai schimbat assets în `pwa/` → **bump `CACHE`** în `pwa/sw.js` (`asistent-ai-vN`).
3. Dacă ai adăugat/bumpat o librărie CDN → SRI pus (vezi `.claude/rules/02`).
4. Commit (Conventional) → push.

## Deploy (Vercel CLI)

Din folderul `pwa/`, cu `VERCEL_API_KEY` din env (sistem central `.api-keys`):

```bash
# din C:\Proiecte\Asistent_Text_AI\pwa
vercel deploy --prod --yes --token $VERCEL_API_KEY
# (sau calea directă către vc.js, dacă CLI-ul global nu e în PATH)
```

> `--scope` e ignorat (bug Vercel CLI) → proiectul e identificat prin `.vercel/project.json` (orgId+projectId). Nu șterge `.vercel/`.

## Env vars (setate în Vercel project settings, NU în repo)

`GROQ_API_KEY`, `MISTRAL_API_KEY`, `GOOGLE_API_KEY`, `DEEPL_API_KEY`, `TAVILY_API_KEY`. Lipsă → proxy întoarce 500 „Server key missing".

## Post-deploy (verificare)

```bash
curl -sI https://asistent-text-ai.vercel.app/ | grep -iE 'content-security|x-frame|strict-transport'
curl -s -o /dev/null -w '%{http_code}\n' https://asistent-text-ai.vercel.app/    # 200
```

Smoke manual: load → import PDF/DOCX → o acțiune AI → preview/export PDF. (Web Speech doar pe Android Chrome; iOS = fallback tastatură.)

## Workflow proiect

Auto-push + deploy după commit (preferință user), **cu validare înainte** (`npm test` + scope diff). Branch `main` (proiect solo).
