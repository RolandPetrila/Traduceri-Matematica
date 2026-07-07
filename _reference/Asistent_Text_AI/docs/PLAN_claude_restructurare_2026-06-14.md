# PLAN — „Claude complet" + restructurare arhitectură · Asistent Text AI

**Data:** 2026-06-14 · **Status:** DRAFT — aștept confirmare înainte de execuție (R-PLAN)
**Risc global:** HIGH (atinge config + aplicație live pe Vercel) — detaliat pe pași mai jos
**Referințe:** `.claude-outputs/improve/2026-06-14_021033/` (audit securitate) · `C:\Proiecte\Blueprints` · `C:\Users\ALIENWARE\.api-keys` (doar catalog/regulile, fără valori)

> **Regula de aur a acestui plan:** `pwa/` rămâne rădăcina de deploy Vercel. Tot ce e „restructurare" se face ÎN JURUL ei (config + docs), nu prin mutarea fișierelor live — decât în Opțiunea C, confirmată separat. Orice atingere a `pwa/` → redeploy + verificare.

---

## 0. Recomandarea mea (ce să alegi)

1. **Securitate:** Pachetul Săptămâna 1 din raportul /improve (P0-1…P0-4) — **inclus by default** aici.
2. **Restructurare:** **Opțiunea B** (repo curat + arhitectură de foldere Claude, `pwa/` neatinsă) — onorează „restructurează arhitectura de foldere" cu **risc ~zero pe deploy**.
3. **Blueprints:** **cherry-pick manual** doar piesele de governance/config (nu kit_5 întreg — ar intra în conflict cu codul existent).
4. **Curățenie:** șterge `BLUEPRINT_TRANSFER_CLAUDE.md` (obsolet) + `info.md` (stray). Git păstrează istoricul (R-MINIMAL).

---

## 1. Decizia care îmi trebuie de la tine — adâncimea restructurării

### Opțiunea A — Aditiv pur (zero risc)

Adaug doar `.claude/` + `CLAUDE.md` + `docs/`. NU mut/ating nimic existent.

```
Asistent_Text_AI/
├── CLAUDE.md            ← NOU
├── .claude/{rules,hooks}/ ← NOU
├── docs/                ← NOU
├── pwa/                 ← exact ca acum (deploy root)
└── (restul neatins)
```

### Opțiunea B — Repo curat + arhitectură Claude ★ RECOMANDAT

A + consolidez docurile în `docs/`, arhivez raporturile, șterg fișierele obsolete, adaug `.github/` (lint/format/SRI-check, fără build). **Codul `pwa/` rămâne neatins** (deploy root).

```
Asistent_Text_AI/
├── CLAUDE.md                      ← context proiect + „LA START" + capcane
├── RESUME_PUNCT_CURENT.md         ← checkpoint sesiune (skeleton 21)
├── .claude/
│   ├── rules/{01_pwa_deploy, 02_security_cdn_sri, 03_ai_providers}.md
│   ├── hooks/                     ← (opțional auto-push)
│   └── settings.local.json        ← există
├── docs/
│   ├── ARCHITECTURE.md            ← PWA + proxy + SW; capcana SW/CSP cross-origin
│   ├── DEPLOY.md                  ← pași Vercel (din README)
│   ├── SECURITY.md                ← CSP, SRI, origin+ratelimit, sistem central .api-keys
│   └── decisions/0001-no-build-pwa.md
├── .github/workflows/ci.yml       ← lint+format+SRI check (no build) [opțional]
├── pwa/                           ← ★ DEPLOY ROOT, NEATINS (cod) — doar edit-urile de securitate
│   └── index.html, sw.js, manifest.json, vercel.json, api/proxy.js, icons
├── .claude-outputs/               ← păstrat (gitignore opțional)
├── README.md                      ← actualizat
└── .gitignore
```

Șterse: `BLUEPRINT_TRANSFER_CLAUDE.md`, `info.md`.

### Opțiunea C — Adânc (split cod + build) [NU RECOMANDAT acum]

B + sparg `index.html` (2827 linii) în module JS (`pwa/src/*.js`) + eventual build Tailwind static.

- **Pro:** mentenanță mult mai bună pe termen lung; CSP mai strict (fără `unsafe-eval`).
- **Contra:** **rupe filosofia no-build**, necesită pas de build + **reconfigurare deploy Vercel**, risc HIGH de regresie pe o app care merge. Validare obligatorie (dar Playwright MCP e momentan deconectat → verificare manuală/curl).
- **Verdict:** merită ca proiect separat, ulterior, nu în același pas cu securitatea.

---

## 2. Checklist execuție (bifabil) — pe baza Opțiunii B

### Faza 0 — Siguranță

- [ ] `git switch -c chore/claude-restructure` (branch dedicat, nu pe main direct)
- [ ] Commit checkpoint gol / snapshot stare curentă
- [ ] Confirm că `pwa/.vercel/project.json` NU se mută (deploy link)

### Faza 1 — Securitate (Săptămâna 1 din /improve) — atinge `pwa/`

- [ ] `pdf.js`: `isEvalSupported:false` în `getDocument` (`index.html:1918`) — oprește CVE-2024-4367
- [ ] DOMPurify 3.1.6 → 3.4.9 (URL CDN) + `integrity`
- [ ] html-docx-js: pin `@0.3.1` + `integrity`
- [ ] SRI (`integrity`+`crossorigin`) + pin pe toate cele 9 tag-uri CDN (generez hash-urile cu `curl|openssl`)
- [ ] (opțional) html2pdf 0.14.0 + mammoth 1.12.0
- [ ] **Redeploy + verificare:** `curl` headers + load homepage 200 + smoke manual (PDF import, preview, export)

### Faza 2 — Config Claude (governance) — aditiv, risc LOW

- [ ] `CLAUDE.md` root: identitate proiect, stack, arhitectură, env vars consumate, „LA START SESIUNE", capcane (SW/CSP, deploy Vercel `--scope` ignorat, CACHE bump)
- [ ] `.claude/rules/01_pwa_deploy.md`, `02_security_cdn_sri.md`, `03_ai_providers.md`
- [ ] `RESUME_PUNCT_CURENT.md` (skeleton 21)
- [ ] (opțional) `.claude/hooks/` auto-push — DOAR dacă nu e deja global (vezi memory `user-auto-push-deploy`)

### Faza 3 — Docs + arhitectură foldere — aditiv, risc LOW

- [ ] `docs/ARCHITECTURE.md`, `DEPLOY.md`, `SECURITY.md`, `decisions/0001-no-build-pwa.md`
- [ ] Mut conținut relevant din README în docs; README devine sumar + linkuri
- [ ] Șterg `BLUEPRINT_TRANSFER_CLAUDE.md` (obsolet) + `info.md`
- [ ] `.github/workflows/ci.yml` (Prettier check + SRI presence check) [opțional]

### Faza 4 — Integrare .api-keys (referință, FĂRĂ valori)

- [ ] În `CLAUDE.md` + `docs/SECURITY.md`: documentez cele 5 env vars + `VERCEL_API_KEY`, link la sistemul central, regula „server-side only, niciodată .env cu valori"
- [ ] Notez providerii free în plus din catalog (Cerebras/OpenRouter/etc.) ca opțiune viitoare de fallback

### Faza 5 — Închidere

- [ ] Update memory (proiect) + MEMORY.md
- [ ] Commit + (conform `user-auto-push-deploy`) push + deploy, cu validare înainte
- [ ] Jurnal execuție mai jos

---

## 3. Reguli de siguranță

- Lucrez pe branch `chore/claude-restructure`, nu direct pe `main`.
- `pwa/` (cod app + `.vercel/`) NU se mută în Opțiunea A/B. Singurele edituri în `pwa/` sunt cele de securitate (Faza 1), fiecare urmată de redeploy+verificare.
- Re-citesc după fiecare edit critic (capcana Google Drive silent-revert — dar acest proiect e pe `C:\Proiecte`, nu sub `G:\`, deci risc redus).
- Nu ating `C:\Users\ALIENWARE\.api-keys` (doar citire catalog deja făcută). Nu copiez valori nicăieri.
- Blueprint-uri: cherry-pick manual; dacă alegi sistemul oficial, înregistrez în `.blueprints-manifest.lock` pentru undo.

## 4. Ce NU fac (critici de consultant — R-COLLAB)

- NU aplic kit_5 întreg (conflicte cu codul existent).
- NU urmez `BLUEPRINT_TRANSFER_CLAUDE.md` (obsolet, direcție abandonată).
- NU introduc Vite/pnpm/FastAPI (contrazice no-build + nu există backend Python aici).
- NU sparg `index.html` decât dacă alegi explicit Opțiunea C.

## 5. Jurnal execuție

_(se completează pe parcurs)_
