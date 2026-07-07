# Regulă locală — PWA & Deploy

## Rădăcina de deploy = `pwa/`

- Vercel deployează DIN `pwa/` (linkat prin `pwa/.vercel/project.json` — orgId+projectId). NU muta `pwa/` și nu muta `.vercel/`.
- `--scope` la Vercel CLI e ignorat (bug) → bazează-te pe link-ul `.vercel`.
- Tooling-ul de la rădăcină (`package.json`, `tests/`, `vitest.config.js`) **NU se deployează** — Vercel ignoră tot ce e în afara `pwa/`.

## No-build (deliberat)

- Fără bundler/transpiler. `index.html` se servește ca atare; librăriile vin din CDN. Nu introduce Vite/webpack/npm-build pe `pwa/` fără decizie explicită (vezi `docs/decisions/0001-no-build-pwa.md`).

## Service Worker (`pwa/sw.js`)

- **Bump `CACHE`** (`asistent-ai-vN`) la fiecare deploy care schimbă assets.
- SW = network-first pe pagină, cache-first pe assets same-origin, **update opt-in** (toast „Versiune nouă", fără `skipWaiting()` automat).
- **NU intercepta cross-origin** în `fetch` handler. CDN-urile trebuie să se încarce direct; altfel CSP `connect-src 'self'` le blochează → layout rupt.

## După orice schimbare pe `pwa/`

`npm test` → commit → push → deploy → **verificare live** (curl headers + smoke manual: load 200, import PDF/DOCX, preview, export). Validează înainte de deploy.
