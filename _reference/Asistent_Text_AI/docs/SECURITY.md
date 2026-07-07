# Securitate — Asistent Text AI

## Model de amenințare (pe scurt)

App client-side care: (a) cheamă provideri AI plătiți/cu cotă → **cheile nu trebuie expuse**, abuzul de cotă trebuie limitat; (b) randează output AI + parsează fișiere user (PDF/DOCX) → **XSS + cod malițios din fișiere**.

## Chei API

- Server-side DOAR, în `pwa/api/proxy.js` (env vars Vercel). Niciodată în browser/cod/commit.
- Sursă: sistem central `C:\Users\ALIENWARE\.api-keys` (vezi `catalog.md` — nume, fără valori). Regula: `process.env.X`, fără `.env` cu valori.
- Proxy: **origin allowlist** (doar app-ul propriu) + **rate-limit** best-effort (in-memory, per-instanță — se resetează la cold start; pentru durabil cross-instanță: Vercel WAF rate-limit sau Upstash Redis — vezi raport `/improve`).

## Headers (`pwa/vercel.json`) — verificat live

CSP (`default-src 'self'`, `connect-src 'self'`, `frame-ancestors 'none'`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: microphone=(self), camera=(), geolocation=()`, HSTS preload.

- `unsafe-eval` în `script-src` e necesar DOAR de Tailwind Play CDN. Scoaterea Tailwind Play CDN (→ CSS static) permite eliminarea lui.

## SRI (Subresource Integrity)

- Toate librăriile CDN **versionate** au `integrity` (sha384) + `crossorigin` — hash din fișierul real, versiune EXACTĂ în URL.
- Excepții deliberate: `cdn.tailwindcss.com` (mutabil) și `pdf.worker` (URL-string). Documentate inline în `index.html`.
- Adăugare/bump librărie: `curl -sL <url> | openssl dgst -sha384 -binary | openssl base64 -A`.

## XSS

- Output AI → DOM doar prin `DOMPurify.sanitize(marked.parse(...))` (preview Markdown + export PDF). DOMPurify la zi (3.4.11).

## Parsare fișiere

- PDF: `pdf.js` cu `isEvalSupported: false` → blochează CVE-2024-4367 (exec JS dintr-un PDF malițios) pe versiunea 2.16.

## Stare CVE dependențe (snapshot 2026-06-15)

| Librărie      | Versiune     | CVE                                                            | Stare                                                                          |
| ------------- | ------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| DOMPurify     | 3.4.11       | GHSA-cmwh-pvxp-8882 (setConfig), CVE-2025-15599, CVE-2026-0540 | ✅ închis (bump 3.4.11; GHSA cu vector neatins — app fără setConfig/hooks)     |
| diff (jsdiff) | 5.2.2        | CVE-2026-24001 (ReDoS parsePatch)                              | ✅ închis (bump 5.2.2; vector neatins — app folosește doar diffWordsWithSpace) |
| pdf.js        | 2.16.105     | CVE-2024-4367 (RCE)                                            | ✅ mitigat (`isEvalSupported:false`); upgrade 2.x→6.x = strategic              |
| html-docx-js  | @0.3.1 + SRI | supply-chain (URL nepinned)                                    | ✅ închis (pin+SRI)                                                            |
| html2pdf.js   | 0.14.0       | CVE-2026-22787 (XSS)                                           | ✅ închis (bump 0.14.0 = versiunea-fix; + DOMPurify upstream); verificat live  |
| mammoth       | 1.12.0       | CVE-2025-11849 (traversal)                                     | ✅ închis (bump 1.12.0); verificat live                                        |

Detalii + surse GHSA: `.claude-outputs/improve/2026-06-14_021033/improve_report.md`.
