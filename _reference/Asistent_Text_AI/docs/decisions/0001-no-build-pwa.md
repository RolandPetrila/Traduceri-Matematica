# 0001 — PWA no-build (HTML/JS servit static)

- **Status:** Acceptat · **Data:** 2026-06 (consemnat 2026-06-15)

## Context

Aplicație personală de procesare text AI, instalabilă pe telefon, pe Vercel Hobby. Prioritate: simplitate de deploy, zero infra, portabilitate.

## Decizie

Fără bundler/transpiler/build step. `pwa/index.html` se servește ca atare; librăriile vin din CDN (cu SRI). Logica testabilă e extrasă în `pwa/lib/llm.js` (UMD), testată cu Vitest la rădăcină (tooling-ul de test NU se deployează).

## Consecințe

**Pro:** deploy trivial (Vercel servește `pwa/`), zero `node_modules` în producție, debugging direct în browser, fără pași de build care pot rupe.

**Contra / limite:**

- `index.html` e mare (~2830 linii) — mentenanța scade pe măsură ce crește (parțial atenuat prin extracția `lib/llm.js`).
- Tailwind via Play CDN = engine la runtime (warning „not for production", impune `unsafe-eval` în CSP).
- Dependență de uptime-ul CDN-urilor (atenuat: SRI + fallback offline din SW pentru shell).

## Când se reevaluează

- Dacă `index.html` devine ingestionabil → split în module (`pwa/src/*.js`) — vezi Opțiunea C din planul de restructurare.
- Dacă vrem CSP fără `unsafe-eval` / control pe CSS → Tailwind v4 Standalone CLI (generează CSS static, rămâne „no node_modules"). Vezi raport `/improve`.
