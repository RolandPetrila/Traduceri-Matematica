# Regulă locală — Securitate & CDN/SRI

## Chei API

- DOAR server-side, în `pwa/api/proxy.js` (env vars Vercel). **NICIODATĂ** în browser, în cod, sau în fișiere commit-ate.
- Sursă: sistemul central `C:\Users\ALIENWARE\.api-keys`. Nu crea `.env` cu valori. Nu afișa valori.
- Nu strica origin allowlist-ul + rate-limit-ul din proxy (anti-abuz cotă AI).

## CSP (`pwa/vercel.json`)

- `connect-src 'self'` — fetch-urile din app merg doar la origine proprie (`/api/*`). CDN-urile se încarcă via `script-src`/`style-src` (tag-uri directe), NU via fetch.
- `unsafe-eval` e prezent DOAR pentru Tailwind Play CDN. Dacă scoți Tailwind Play CDN (→ CSS static), scoate și `unsafe-eval` + originile Tailwind din CSP.
- Dacă adaugi un origin CDN nou: adaugă-l în CSP **și** pune SRI pe tag (vezi mai jos).

## SRI (Subresource Integrity)

- **Toate librăriile CDN versionate** au `integrity="sha384-…" crossorigin="anonymous"` (immutable → hash stabil).
- **Excepții deliberate (FĂRĂ SRI):** `cdn.tailwindcss.com` (build mutabil — un hash fix s-ar rupe la update) și `pdf.worker` (e URL-string în JS, nu tag).
- **Când adaugi/bumpezi o librărie CDN:** generează hash-ul din fișierul real:
  ```bash
  curl -sL <url> | openssl dgst -sha384 -binary | openssl base64 -A
  ```
  Pune versiune EXACTĂ în URL (nu `@latest`/tag mutabil) + hash + `crossorigin`.

## Output AI → DOM

- Markdown-ul din output AI se randează DOAR prin `DOMPurify.sanitize(marked.parse(...))` (anti-XSS). Ține DOMPurify la zi (acum 3.4.11, jsdelivr).
