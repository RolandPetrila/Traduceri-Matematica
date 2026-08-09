# Audit complet — Sistem Traduceri Matematica

**Data:** 2026-08-08 · **Locație:** `C:\Proiecte\Traduceri_Matematica` · **Versiune proiect:** v4.1 (PROD v46)

Audit static realizat prin citirea codului (backend Python, frontend Next.js, config, docs). Nu s-au putut rula comenzi (npm/pip/teste) — mediul Linux izolat nu a fost disponibil; concluziile sunt din analiza codului.

---

## 1. Rezumat executiv

Proiect **matur, bine structurat și documentat neobișnuit de onest**. Practicile de securitate sunt solide pentru scara aplicației (un singur utilizator, servicii gratuite, fără autentificare prin design). **Nu am găsit vulnerabilități critice, secrete hardcodate sau bug-uri majore de logică.** Observațiile de mai jos sunt în principal întăriri de configurare și igienă, nu defecte grave.

**Scor pe zone (1–5):**

| Zonă | Scor | Comentariu |
|---|---|---|
| Arhitectură | 5/5 | Coerentă cu constrângerile (serverless, per-pagină, free tier) |
| Securitate | 4/5 | Secrete curate, anteturi bune; câteva fallback-uri permisive |
| Calitatea codului | 4.5/5 | Curat, comentat, ~28 fișiere de test; fără CI |
| Gestionarea erorilor | 5/5 | Coduri de eroare, fail-open, fallback-uri în lanț |
| Documentație | 5/5 | Excelentă, cu slăbiciunile notate explicit |
| Dependențe | 4/5 | Versiuni recente; lipsă audit automat |

---

## 2. Arhitectură și stack

- **Frontend:** Next.js 15.5 + TypeScript + Tailwind + TipTap (editor matematic nativ), PWA instalabil. Deploy pe Vercel.
- **Backend:** Python serverless pe Vercel (`api/*.py`), **stdlib pură** (urllib, fără framework) + bibliotecă partajată `api/lib/`.
- **AI OCR:** Gemini (3.6 Flash) → Flash-Lite → Pro → fallback Mistral OCR; opțional Azure Document Intelligence pentru documente cu tabele.
- **AI traducere:** DeepL Free (2 chei) → NLLB (HF) → OpenRouter → Gemini → Groq (lanț de fallback).
- **Log-uri:** Supabase (service-role, doar server-side), fail-open.
- **Deploy:** două proiecte Vercel separate (frontend + API Python) + Supabase, toate pe free tier.

Fluxul unic în 3 pași (Original → OCR RO editabil → Traducere on-demand) cu protecția formulelor LaTeX și a figurilor este bine gândit și consecvent implementat.

**Dimensiune:** ~125 fișiere `.ts/.tsx` în `frontend/src`, 7 handlere Python + ~13 module `api/lib`, ~28 fișiere de test, documentație extinsă în `docs/`.

---

## 3. Puncte forte (verificate)

1. **Secrete gestionate corect.** Scanare completă a codului — **nicio cheie API hardcodată**. `.gitignore` acoperă temeinic `.env*` (multiple pattern-uri, inclusiv `.env*` global). Cheile stau doar în env. Service-role key Supabase folosit exclusiv server-side (`supabase_client.py`, `api/logs/route.ts`).
2. **Anteturi de securitate complete** (`next.config.js`): CSP, HSTS (`max-age=31536000; includeSubDomains`), `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`. CSP-ul `connect-src` se construiește din env (urmează domeniile deployate).
3. **Protecție anti-abuz pe toate endpoint-urile publice:**
   - Rate-limiting per IP (backend `rate_limiter.py`, proxy `route.ts`, logs `route.ts`).
   - **Cost-cap** pe proxy-ul AI: forțează modelul permis (allowlist per provider) + plafonează `max_tokens`/`max_results` — clientul nu poate cere modele scumpe.
   - Origin allowlist (nivel CSRF) pe proxy.
   - Plafon dimensiune body: 4 MB (OCR/convert), 32 KB (logs).
4. **Extragere IP rezistentă la spoofing** — folosește elementul din dreapta al `X-Forwarded-For` (nu cel controlabil de client), cu prioritate `X-Real-IP`. Corect implementat identic în Python și TS.
5. **Sanitizare XSS reală** (`lib/sanitize.ts` cu DOMPurify): allowlist SVG explicit, `ALLOW_DATA_ATTR: false`, `FORBID_ATTR` pe handlerele `on*`. Folosit consecvent cu `dangerouslySetInnerHTML`. Are teste dedicate.
6. **Protecția matematicii la traducere** (`math_protect.py`) — piesa critică de corectitudine: pattern-uri LaTeX/SVG, `<keep>` XML pentru DeepL (single-pass, fără taguri imbricate), placeholders `__MATH_N__` pentru LLM-uri, plus recuperare per-secțiune la desincronizarea separatorului (`|||SEP|||`). Excelent raționat.
7. **Gestionarea erorilor** — coduri `E-<ARIE>-<NNN>` (`config/error_codes.json`), logare fail-open în Supabase, fallback-uri în lanț care nu pică zgomotos.
8. **Suită de teste reală** — ~8 teste backend (rate-limiter, math_protect, html_builder, convert, exceptions, azure_layout, ocr_handler, translate) + ~20 teste frontend (Jest): protecția formulelor, cache traducere, generator teste, calculator, OMML→LaTeX etc.
9. **Documentație onestă** — `CLAUDE.md`, `docs/PLAN_MASTER.md` (sursă unică), `HANDOFF_SESIUNE.md`. Slăbiciunile cunoscute (lipsa CI, erorile de lint, limitele rate-limit-ului serverless) sunt notate explicit în cod și docs.
10. **Foarte puțină datorie tehnică marcată** — doar ~8 apariții TODO/FIXME în tot repo-ul (majoritatea în docs/scratchpad).

---

## 4. Constatări și recomandări

### Prioritate medie

**M1. Divergență de nume de variabile de mediu între cele două proiecte Vercel.**
Backend-ul Python (OCR/traducere) citește `GOOGLE_AI_API_KEY`, în timp ce proxy-ul frontend (`frontend/src/app/api/proxy/route.ts`, modulele Chat/Asistent) citește `GOOGLE_API_KEY` / `GOOGLE_API_KEY_2`. Sunt proiecte Vercel separate, deci tehnic e valid, dar **aceeași cheie Google trebuie introdusă sub două nume diferite** — footgun clasic de configurare; dacă unul lipsește, providerul pică silențios pe fallback.
*Recomandare:* documentează explicit maparea (ex. tabel „env var per proiect") în `docs/DEPLOY_VERCEL.md` și verifică setările reale în ambele proiecte Vercel.
*Notă pozitivă:* pentru DeepL, backend-ul acceptă deja **ambele** nume (`DEEPL_API_KEY_2` OR `DEEPL_API_KEY2`) — robustețe bună; același tratament ar ajuta la Google.

**M2. `ALLOWED_ORIGIN` cade pe `*`.** Toate handlerele Python trimit `Access-Control-Allow-Origin: *` dacă env-ul nu e setat. Fără cookies/auth impactul e limitat, dar înseamnă CORS deschis.
*Recomandare:* setează explicit `ALLOWED_ORIGIN` la domeniul frontend în producție; opțional, refuză request-urile cu origine necunoscută în loc de `*`.

**M3. CSP conține `'unsafe-inline'` și `'unsafe-eval'` în `script-src`.** Probabil necesare pentru MathJax/KaTeX/TipTap/pdf.js, dar lărgesc suprafața XSS. Risc atenuat (un singur utilizator, fără auth, fără date sensibile).
*Recomandare:* datorie tehnică — de investigat trecerea la nonce/hash CSP dacă bibliotecile permit.

**M4. `/diagnostics` și `GET /api/logs` sunt publice.** Orice vizitator poate citi log-urile diagnostice din Supabase (mesaje de eroare, context, stack, info device). Nu sunt secrete, dar e o divulgare de informații interne pe o aplicație fără auth.
*Recomandare:* protejează diagnosticele cu un token simplu (query param secret) sau restricționează la un IP; alternativ, plafonează câmpurile de context expuse.

### Prioritate scăzută

**L1. Rate-limiting in-memory best-effort pe serverless** — starea e per instanță warm, deci slabă împotriva abuzului distribuit. Upstash Redis e integrat opțional (fallback in-memory dacă lipsește). Deja documentat onest.
*Recomandare:* activează Upstash dacă apar abuzuri reale ale cotei AI gratuite.

**L2. Fără CI/CD gate.** Nu există GitHub Actions sau pre-push hooks; lint e `ignoreDuringBuilds: true` cu ~12 erori preexistente. Gate-ul real (`tsc --noEmit` + `jest` + `next build`) rămâne manual.
*Recomandare:* un workflow minim care rulează `tsc` + `jest` la push (curăță întâi cele 12 erori de lint).

**L3. Parsere multipart scrise de mână** (`ocr.py`, `convert.py`) în loc de bibliotecă. Funcționale și cu body plafonat la 4 MB, dar mai fragile la edge-cases (boundary-uri neobișnuite, câmpuri lipsă).
*Recomandare:* opțional, unifică într-un singur parser testat în `api/lib/multipart.py`.

**L4. `Content-Disposition` cu nume de fișier necurățat** (`convert.py`, linia ~669): `filename="{result['filename']}"` derivă din numele încărcat de utilizator. Un nume cu `"` sau CRLF ar putea rupe/injecta antetul.
*Recomandare:* sanitizează numele (elimină `"`, `\r`, `\n`, path separators) înainte de a-l pune în antet.

**L5. `public/planse/app.js` folosește `innerHTML` extensiv** cu conținut generat local (planșe offline). Ocolind React, dar datele sunt auto-generate (nu vin din surse externe) → risc XSS minim.
*Recomandare:* de reținut; menține conținutul strict auto-generat.

**L6. Fără audit automat de dependențe.** Versiunile sunt recente (Next 15.5, React 18.3, dompurify 3.3.3, pdfjs-dist 4.10.38; Python: pypdf 6.15, PyMuPDF 1.28.2, Pillow 12.3) și fără CVE-uri cunoscute la aceste versiuni, dar nu există `npm audit`/`pip-audit` în flux.
*Recomandare:* rulează periodic `npm audit` și `pip-audit`; adaugă Dependabot.

**L7. `scratchpad/` conține scripturi de probă** (folosesc `eval`, `subprocess`, `innerHTML`). Nu fac parte din bundle-ul aplicației, dar unele sunt comise în repo.
*Recomandare:* mută-le sub `.gitignore` sau șterge-le pentru curățenie.

### De verificat manual (nu am putut din mediul curent)

- **Istoricul git** — confirmă că `.env` nu a fost niciodată comis accidental (`.gitignore` e corect *acum*, dar nu pot inspecta istoricul). Rulează: `git log --all --full-history -- .env`.
- **RLS Supabase** — `CLAUDE.md` menționează „Supabase fără auth, RLS strict". Verifică în dashboard-ul Supabase că politicile RLS pe tabelele `logs`/`gemini_counter` chiar restricționează scrierile la service-role (cheia anon publică nu trebuie să poată insera/citi liber).
- **Rularea testelor** — `cd frontend && npm test` și testele Python; nu le-am putut executa.

---

## 5. Concluzie

Aplicația este **solidă, curată și sigură pentru contextul ei** (un singur utilizator, uz intern, servicii gratuite). Nu există probleme critice. Prioritatea imediată recomandată: **M1** (maparea env între cele două proiecte Vercel, cauza cea mai probabilă de „un provider nu merge") și **M2** (setează `ALLOWED_ORIGIN`). Restul sunt îmbunătățiri de igienă și robustețe.

> **Notă:** pentru configurarea finală de securitate în producție (CORS, CSP, RLS Supabase), confirmarea de către un specialist este recomandată — evaluarea de mai sus e din analiză de cod, nu din testare live.
