# PLAN — Modul „Planșe" în aplicația Traduceri_Matematica (App 2)

> Versiune plan: 1.0 · 2026-07-21 · Efort: max · Sequential-thinking: folosit (8 pași)
> Sursă (se citește/portează): `G:\My Drive\Roly\4. Artificial Inteligence\Folder_Lucru\Carla\Planse_interactive\`
> Țintă (se scrie): `C:\Proiecte\Traduceri_Matematica\`
> **Implementarea se face dintr-o sesiune deschisă ÎN `C:\Proiecte\Traduceri_Matematica`.** Primul pas al acelei sesiuni: copiază acest plan în `C:\Proiecte\Traduceri_Matematica\docs\PLAN_modul_planse.md`.
>
> ⚠️ **OBLIGATORIU — protocol de implementare (§17):** înainte de a implementa ORICE funcționalitate, rulează runde MULTIPLE de AskUserQuestion cu Roland ca să stabilești EXACT ce implementezi (cu mock-uri/exemple concrete), oferă recomandări adaptate contextului, și obține „da, asta" înainte de a scrie cod. Nimic „pe ghicite". Vezi §17.

---

## 1. Context (de ce)

Roland generează planșe educaționale pentru Carla (și pentru o profesoară de matematică) prin bucla Claude Code (VSCode → terminal → onboard → cerere → așteptare). E lent. Generatoarele însă sunt **cod Python determinist** care produce planșe corecte în milisecunde — AI-ul nu e necesar pentru generare, ba o încetinește.

Obiectiv: un **modul „Planșe" cu sub-taburi** integrat în aplicația web existentă `Traduceri_Matematica` (deja PWA pe Vercel, pe telefonul lui Roland), unde faci **selecții multiple → generare instantă**, funcționează **de pe telefon, offline, zero mentenanță**, și **nu repetă niciodată** o planșă (istoric în cod).

Rezultat vizat: deschizi PWA-ul pe telefon → tab „Planșe" → sub-tab (Numere/Labirint/…) → selecții → Generează (instant) → Print/PDF. Materialele școlare (care chiar au nevoie de AI) vin într-o fază separată, online.

---

## 2. Decizii blocate (stabilite cu userul în sesiunea de proiectare)

| #   | Decizie                   | Valoare aleasă                                                                                  |
| --- | ------------------------- | ----------------------------------------------------------------------------------------------- |
| D1  | Gazdă                     | **App 2 = `Traduceri_Matematica`** (Next.js + Python serverless pe Vercel + Supabase, PWA)      |
| D2  | Formă                     | **Modul „Planșe" cu sub-taburi**, unul per generator + „Școlare" separat                        |
| D3  | Rulare planșe interactive | **JS în browser** (offline, instant), **cu oracol Python** (self-teste portate + PRNG replicat) |
| D4  | Rulare AI                 | Doar pentru **materiale școlare** (serverless), Faza 2                                          |
| D5  | Unicitate                 | **Niciodată exact aceeași planșă** (dedup pe structura exactă)                                  |
| D6  | Istoric                   | **Hibrid**: IndexedDB local + sync Supabase; importat din `istoric_generari.json`               |
| D7  | Output multi-select       | **Coș** → un singur document (print/PDF) cu toate planșele alese                                |
| D8  | Materiale școlare         | **Opțiunea 1: AI la cerere în app** (online), după fix-ul celor 7 regulamente                   |
| D9  | Integrare                 | „Nu contează — cel mai bun rezultat" → aleg **iframe-izolat** (vezi §3)                         |

---

## 3. Arhitectură: modul iframe-izolat (self-contained static)

App 2 folosește deja tiparul **iframe-izolat** pentru module de tip „generator de documente": Editor matematic e un artefact standalone în `frontend/public/editor/index.html`, embedat same-origin (`frontend/src/app/editor/page.tsx`, comentariu: „modul separat, fără a atinge pipeline-ul").

Planșele sunt exact același gen. Deci modulul „Planșe" = o **mini-aplicație statică self-contained** în `frontend/public/planse/`, embedată printr-un wrapper subțire `frontend/src/app/planse/page.tsx` (copie a `editor/page.tsx`).

**De ce iframe-izolat (nu native React):**

- Offline natural — fișiere statice cache-uite de service worker.
- Generare 100% în browser — zero `/api` pentru planșele interactive.
- Risc minim de a strica app-ul (izolare totală, tipar deja adoptat).
- Portabilă (s-ar putea muta și în App 1 sau oriunde).

Alternativă (dacă se dorește integrare mai strânsă ulterior): modul native React sub `src/app/planse/` cu generatoarele ca module TS. Mai multă cuplare + build. **Nu e recomandată acum.**

---

## 4. Integrare în repo App 2 (fișiere exacte + editări)

Toate editările sunt **aditive și izolate**. Confirmat prin citirea fișierelor reale.

### 4.1 Adaugă tabul (DOUĂ fișiere, sincron)

`config/tabs.json` **ȘI** `frontend/config/tabs.json` (identice; `tab-config.ts` importă din `frontend/config/`). Adaugă la finalul array-ului `tabs`:

```json
{ "id": "planse", "label": "Planșe", "icon": "🧩" }
```

### 4.2 Înregistrează modulul în shell

`frontend/src/app/page.tsx` — 3 modificări:

1. Import dinamic (lângă celelalte, ~linia 13):
   ```ts
   const PlansePage = dynamic(() => import("./planse/page"), { ssr: false });
   ```
2. **Extinde array-ul de validare localStorage** (linia 24) — altfel tabul salvat nu se restaurează:
   ```ts
   [
     "traduceri",
     "convertor",
     "editor",
     "asistent",
     "istoric",
     "planse",
   ].includes(saved);
   ```
3. Adaugă panoul (în blocul `<div className="mt-6">`):
   ```tsx
   <div style={{ display: activeTab === "planse" ? "block" : "none" }}>
     <PlansePage />
   </div>
   ```

### 4.3 Wrapper-ul de pagină (NOU)

`frontend/src/app/planse/page.tsx` — copie a `editor/page.tsx`: header `chalk-*` + `<iframe src="/planse/index.html" …>` + buton „Deschide în fereastră nouă" (`/planse/index.html`).

### 4.4 De verificat

- `next.config.js`: iframe same-origin cere `X-Frame-Options: SAMEORIGIN` + CSP `frame-ancestors 'self'` — deja setat pentru editor; `/planse/` moștenește. **Verifică.**
- Temă: folosește clasele `chalk-*` (`chalk-text`, `chalk-btn`, `text-chalk-yellow`, `border-chalk-white/20`) ca modulul să pară nativ.

---

## 5. Structura internă a modulului static

```
frontend/public/planse/
  index.html            # shell: bară sub-taburi + zonă formular + preview + coș
  app.js                # controller UI (sub-taburi, coș, print/PDF)
  style.css             # temă „cretă" (chalk) + @media print A4
  lib/
    prng.js             # MT19937 + shim Python-random (randint/sample/choice/shuffle/randrange)
    signature.js        # semnături canonice per tip (dedup exact)
    history.js          # IndexedDB local + sync Supabase + import istoric_generari.json
    render.js           # compunere pagini + CSS partajat (pt. coș / document combinat)
  generators/
    numere.js  integrama.js  labirint.js  uneste.js  dictare.js  cautare.js
  data/
    banca_cuvinte.json  trasee_catalog.json   # copiate din Carla
  selftest.html         # rulează TOATE self-testele JS în browser (gate corectitudine)
```

**Contract uniform per generator JS:**

- `buildOne(params, seed) -> item`
- `render(item) -> { pages: [htmlFragment], css }` ← fragmente + CSS partajat (nu document complet ca în Python) → permite coșul
- `selftest() -> { ok, detalii }`
- `signature(item) -> string`

**⚠️ CONVENȚIE TIPOGRAFICĂ (obligatorie pt. TOATE generatoarele + output-ul de print) — stabilit 2026-07-22:**
Toată aplicația folosește UN singur font — **`Patrick Hand`** (fontul „cretă", deja folosit de shell-ul gazdă: `globals.css` + `tailwind.config.ts` `font-chalk`). Modulul Planșe (preview + document de print) trebuie să folosească ACELAȘI font — NU introduce `Comic Neue`/`Quicksand` sau alte fonturi noi (rup consistența). Regula: `font-family: "Patrick Hand", ui-rounded, "Segoe UI", system-ui, sans-serif`.
Momentan Patrick Hand se încarcă din Google Fonts (online). **Self-hosting (offline complet) = task F5** — descarcă `Patrick Hand` (SIL OFL) în `public/fonts/`, `@font-face` local, precache în `sw.js`, și scoate dependența de CDN. Aplică-l atât shell-ului cât și modulelor.

---

## 6. Contracte parametri (din inventarul generatoarelor Carla)

| Tip       | Sursă port                                  | Parametri UI                                                                                | Note                                                          |
| --------- | ------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Numere    | `Numere_Incrucisate/generator_numere.py`    | nivel {Ușor,Standard,Avansat} · operație (multi) {adunare,scădere,înmulțire,împărțire} · nr | 1 careu per operație selectată × nr                           |
| Integramă | `Numere_Incrucisate/generator_integrama.py` | dificultate → nr_ecuații (Ușor=6/Standard=12/Avansat=18) · nr                               | solver `_propaga` = gate unicitate                            |
| Labirint  | `Labirint/generator_labirint.py`            | nivel → 8/12/16 · nr                                                                        | arbore perfect + BFS                                          |
| Unește    | `Uneste_Punctele/generator_uneste.py`       | nivel (vârfuri 4-10/11-20/21+) SAU formă (27) · nr                                          | **date: `trasee_catalog.json`**; `build(forma_dict)`          |
| Dictare   | `Dictare_Grafica/generator_dictare.py`      | nivel int 2-5 SAU formă · nr                                                                | **date: `trasee_catalog.json`**; `build(forma_dict)`          |
| Căutare   | `Cautare_Cuvinte/generator_cautare.py`      | temă (24) · nivel {Ușor10×10/6,Standard12×12/8,Avansat14×14/10} · nr                        | **date: `banca_cuvinte.json`**; `build(tema_id, nivel, seed)` |

Toate suportă „nr careuri" + seed intern gestionat de istoric (§8).

---

## 7. Corectitudine — gate pe două straturi (bijuteria proiectului)

**Stratul 1 — self-teste portate în JS (garanția reală).** Fiecare generator JS trebuie să treacă aceleași invariante ca `selftest()` din Python:

- Labirint: arbore perfect (muchii == celule−1) + BFS Start→Ieșire + accesibilitate totală.
- Numere: 6 ecuații consistente + `unica()` (soluție unică) + total mereu dat.
- Integramă: `_propaga()` rezolvă forțat 100% (⇒ unicitate) + toate 4 operațiile prezente.
- Căutare: toate cuvintele găsibile pe grilă.
- Unește: vârfuri distincte + contur închis + numerotare secvențială + segmente drepte.
- Dictare: simularea traseului reproduce forma.
  `selftest.html` rulează toate, în browser. **Niciun generator nu se declară gata fără selftest verde.**

**Stratul 2 — oracol Python (recomandat).** `lib/prng.js` implementează **MT19937 + shim Python-`random`** exact ⇒ „același seed → același rezultat" literal. Beneficii: (a) cross-check byte-cu-byte JS vs Python pe N seed-uri; (b) **compatibilitate cu semnăturile deja produse de Python** în `istoric_generari.json`; (c) reproductibilitate. Dacă shim-ul se dovedește costisitor pe un generator, fallback la echivalență-pe-invariante (nu byte-egalitate).

---

## 8. Istoric + unicitate (D5, D6)

**Mecanism (portat în cod — acum istoricul e pasiv):** după `buildOne(seed)` → `signature(item)`; dacă semnătura ∈ set folosit → avansează seed și regenerează; altfel acceptă + persistă.

**Semnături canonice (dedup pe structura exactă):**

- Labirint: `md5(pasaje sortate)` — _există deja în Python_.
- Numere: `operatie|nivel|a,b,c,d` — _există deja_.
- Integramă: `md5(ecuații normalizate + valori)` — _de definit_.
- Căutare: `md5(temă + cuvinte + poziții plasate)`.
- Unește / Dictare: `forma_id (+ nivel)`.

**Stocare hibridă (`history.js`):** IndexedDB local (offline, dedup instant) + sync opțional Supabase când online (comun telefon+PC); import inițial din `Istoric/istoric_generari.json`.

**⚠️ Așteptare corectă despre „niciodată la fel":**

- Labirint / Numere / Integramă / Căutare = spații uriașe → practic inepuizabile.
- **Unește / Dictare sunt MĂRGINITE**: puzzle-ul e determinat de forma din catalog (27 forme; seed alege doar forma). „Exact aceeași" ⇒ fiecare formă apare o dată → se epuizează (~27) → necesită **reset** sau **conținut nou** (forme noi = viitor/AI). De comunicat în UI.

---

## 9. Coș + output (D7)

- Din orice sub-tab: „+ Adaugă în coș" → acumulezi (ex. 2 numere Ușor + 1 labirint + 1 căutare-fructe).
- „Generează coșul" → `render()`-ele întorc fragmente + CSS partajat → `render.js` compune **un singur document** de print.
- **Print / PDF**: `window.print()` pe HTML-ul cu `@media print` (paginile de răspuns deja ascunse la print) — **offline, gratis**. „Salvează ca PDF" din dialogul de print. Opțional server-side PDF (există `fpdf2`/`PyMuPDF` în backend) — **nu e necesar**.
- Preview pe ecran arată puzzle + răspuns; la print răspunsurile dispar.

---

## 10. Faze (0-5, + 6 opțional)

| Fază                                             | Livrează                                                                                                                                                                                      | Fișiere principale                                                                                                                                | Mărime            |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| **F0 Schelet (NATIV)** ✅ 2026-07-22             | Convenția iframe-module (§16.3) + tab „Planșe" deschide shell-ul gol — **LIVE pe prod** (commit f07ef71, deploy dpl_5uss43…)                                                                  | §16.3 (shell nativ, cale primară) — fallback §4 nefolosit; + `IframeModule.tsx` + `copy-tabs.mjs` + `public/planse/{index.html,app.js,style.css}` | **S-M**           |
| **F1 Primul generator (Labirint)** ✅ 2026-07-22 | Labirint cap-coadă: formular (nivel+nr+avansat) → generează (dedup) → preview + toggle soluție → Print/PDF curat. Oracol MT19937 byte-exact vs Python (24/24 semnături) + selftest gate VERDE | `lib/prng.js`, `lib/signature.js` (md5), `generators/labirint.js`, `lib/render.js`, `selftest.html`                                               | **M** (1 ses.)    |
| **F2 Restul generatoarelor**                     | Toate 6 sub-taburile interactive                                                                                                                                                              | `generators/{numere,integrama,uneste,dictare,cautare}.js` + `data/*.json` copiate                                                                 | **L** (2-3 ses.)  |
| **F3 Istoric + coș**                             | „Niciodată la fel" automat + coș → un singur PDF                                                                                                                                              | `lib/signature.js`, `lib/history.js` (+ import json), coș în `app.js`                                                                             | **M** (1-1½ ses.) |
| **F4 Materiale școlare (AI)**                    | Sub-tab „Școlare" (online)                                                                                                                                                                    | fix 7 regulamente (Carla) + `api/planse_scolare.py` + sub-tab                                                                                     | **L** (2-3 ses.)  |
| **F5 PWA / offline / polish**                    | Offline complet, temă consistentă, testat pe telefon                                                                                                                                          | `frontend/public/sw.js` (cache `/planse/*`), QA print A4                                                                                          | **S** (½-1 ses.)  |
| **F6 (opțional) Limbaj natural**                 | Bară „scrie ce vrei" → selecții, via lanț AI existent                                                                                                                                         | `api/planse_nl.py` + input în `app.js`                                                                                                            | backlog           |

**Traseul „instant/offline complet"** (planșe interactive non-repetabile + coș): F0→F1→F2→F3→F5 ≈ 5-7 sesiuni. F4 (școlare/AI) = capitol separat, oricând după.

**Notă faze (confirmat 2026-07-21):** **F0** include convenția iframe-module nativă (§16.3), cu calea manuală §4 ca **fallback** (nu se pierde). **F7** (post-F2) = împachetare blueprint `M_PLANSE` **shared cross-app** (§16.4 / §16.6) — **M**.

**Gate cross-cutting:** `selftest.html` rulat la fiecare fază; niciun generator „gata" fără verde.

---

## 11. Materiale școlare — Faza 4 (detaliu)

Materialele Grădiniță/Primar/Gimnaziu/Liceu = **raționament AI** din `Model/regulament.md` + `Curricula/config_*.json` (nu au cod). App 2 are deja lanț AI (Gemini/Groq/Mistral/OpenRouter) + seif de chei + constructor HTML A4.

- **Pre-condiție obligatorie:** reparat `regulament.md` în **7 foldere** greșite (Gimnaziu Clasa_6/7/8 + Liceu Clasa_9/10/11/12 — copii „Clasa 5" netratate). **S**, dar blochează F4.
- Implementare: `api/planse_scolare.py` (serverless) primește ciclu/clasă/materie → alimentează AI-ul cu regulament+curriculum → întoarce HTML A4. Sub-tab „Școlare" în modul (online, câteva secunde — experiență diferită de planșele instant, marcat vizibil).
- **⚠️ Corectitudine:** fișele AI **nu au** garanția planșelor interactive. Adaugă un **strat de verificare** (ușor pentru exerciții numerice: re-evaluează rezultatele; greu pentru text liber) + marcaj „verifică înainte de tipărire".
- Opțional: rezervor pre-generat pentru clasele cele mai folosite (instant + offline pentru ele).

### 11.1 Sub-tabul „Școlare" — UI & flux (detaliu)

Selectoare în cascadă → generare AI → verificare. Vizual DIFERIT de planșele instant (badge „🌐 online / AI").

```
│Numere│Integramă│Labirint│Unește│Dictare│Căutare│ Școlare 🌐 │
│ ──────────────────────────────────────────────────────────────
│  MATERIALE ȘCOLARE     ⚠ generat de AI — verifică înainte de tipărire
│  Ciclu:   ( Primar ▾ )
│  Clasa:   ( Clasa 1 ▾ )          ← filtrat pe ciclu
│  Materie: ( MEM ▾ )              ← din Curricula/config_primar.json
│  Tip/temă (opțional): [__________]   Cerință specifică: [__________]
│  Nr fișe: ( 1 ▾ )
│                                    [ 🌐 Generează fișa (~5s) ]
│ ──────────────────────────────────────────────────────────────
│  📄 Preview     [ 🖨 Print ] [ ⬇ PDF ]     ⚠ Verifică exercițiile
```

**Flux backend** (`api/planse_scolare.py`, serverless):

1. Primește `{ciclu, clasa, materie, tip?, cerinta?}`.
2. Încarcă `<Clasa>/Model/regulament.md` + `estetica.json` + materiile din `Curricula/config_<ciclu>.json`.
3. Compune promptul pentru lanțul AI existent (Gemini→Groq→…): reguli de conținut (regulament) + estetică A4 (`estetica.json`) + protocol anti-duplicare (istoric).
4. AI → **HTML A4** (respectă `.page-a4` flex + `@media print`, ca restul fișelor).
5. **Strat de verificare:** exerciții numerice → re-evaluate în cod, neconcordanțele marcate; text liber → doar marcaj „verifică".
6. Întoarce HTML → preview + Print/PDF.

**Reguli specifice sub-tabului:**

- **Badge vizibil** „🌐 online — generat de AI, verifică" pe tot sub-tabul (experiență diferită de planșele garantate).
- **Clase BLOCATE:** Gimnaziu 6/7/8 + Liceu 9/10/11/12 → dezactivate cu tooltip „regulament în reparație" până la fix (pre-condiția F4).
- **Istoric:** fișele intră în anti-repetiție cu semnătură pe conținut (temă/exerciții), opțional.
- **Fără chei în client:** apelul AI e pe backend (chei din `.env`/vault App2), NICIODATĂ în browser.
- **Curriculum ca sursă de materii:** dropdown-ul „Materie" se populează din `Curricula/config_<ciclu>.json` (ex. Primar Clasa_1 → CLR/MEM/AVAP), nu hardcodat.

---

## 12. Riscuri & mitigări

| Risc                                                          | Mitigare                                                                                                                |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Corectitudinea portării JS                                    | Self-teste portate (Stratul 1) + oracol MT19937 (Stratul 2); gate `selftest.html` verde obligatoriu                     |
| Fișele AI (F4) fără garanție                                  | Strat de verificare numerică + marcaj „verifică"                                                                        |
| Unește/Dictare mărginite (~27)                                | Documentat ca așteptare; politică reset / conținut nou                                                                  |
| Două `tabs.json` de ținut sincron + array validare `page.tsx` | Checklist în F0; ambele fișiere + linia 24                                                                              |
| Supabase RLS/no-auth pt sync istoric                          | Sync prin `/api` (service key), **oglindind calea prin care App 2 scrie tabelul `logs`** — de verificat, nu anon direct |
| Offline necesită `sw.js` să precache `/planse/*`              | Task F5 dedicat + test „Offline" în DevTools                                                                            |
| „Silent revert" Google Drive pe sursa Carla                   | Sursa se doar CITEȘTE; ținta e pe disc local (C:) — fără risc la scriere                                                |

---

## 13. Verificare end-to-end

1. `selftest.html` → toate generatoarele verzi (invariante) + oracle cross-check pe ≥20 seed-uri/tip.
2. `cd frontend && npm run dev` → deschide app → tab „Planșe" → fiecare sub-tab generează corect → Print/PDF A4 (răspunsurile dispar la print).
3. Coș: adaugă 3-4 tipuri → „Generează coșul" → un singur document multi-pagină.
4. Istoric: generează repetat același tip/parametri → semnături diferite; verifică că nu apar duplicate; verifică importul din `istoric_generari.json`.
5. Offline: DevTools „Offline" → generarea planșelor interactive merge (F4 școlare NU, e online).
6. Telefon: PWA instalat, fără net → deschide „Planșe", generează, Print/PDF.

---

## 14. Workflow — cele două căi

- **Sursă (se citește/portează):** `G:\My Drive\Roly\4. Artificial Inteligence\Folder_Lucru\Carla\Planse_interactive\*\generator_*.py` + `Biblioteca_Trasee\trasee_catalog.json` + `Cautare_Cuvinte\banca_cuvinte.json` + `Istoric\istoric_generari.json`.
- **Țintă (se scrie):** `C:\Proiecte\Traduceri_Matematica\`.
- **Sesiunea de implementare se deschide ÎN `C:\Proiecte\Traduceri_Matematica`** (îi încarcă CLAUDE.md/convențiile). Are acces la Carla prin calea absolută `G:\…` (același calculator).
- **Primul pas al sesiunii de implementare:** copiază acest plan în `C:\Proiecte\Traduceri_Matematica\docs\PLAN_modul_planse.md`.
- **Nu se copiază folderul Carla ca atare** — se portează logica; doar `banca_cuvinte.json` + `trasee_catalog.json` devin active în `public/planse/data/`. Carla rămâne sursa de adevăr / referință.

---

## 15. Anexă — fișiere-cheie App 2 (confirmate)

- `config/tabs.json` + `frontend/config/tabs.json` — array taburi (editează ambele).
- `frontend/src/lib/tab-config.ts` — exportă `TABS`, `DEFAULT_TAB`.
- `frontend/src/components/layout/TabNav.tsx` — randează taburile (auto din TABS).
- `frontend/src/app/page.tsx` — shell (activeTab, dynamic imports, array validare linia 24, display toggle).
- `frontend/src/app/editor/page.tsx` — **tiparul iframe-izolat de copiat** pentru `planse/page.tsx`.
- `frontend/public/editor/index.html` — exemplu de artefact static self-contained.
- `frontend/public/sw.js`, `frontend/public/manifest.json` — PWA (F5).
- `api/*.py`, `api/lib/` (html_builder, lanț AI, translation_router) — pentru F4.
- `supabase/` — migrații (tabel `planse_istoric` pt F3, oglindind `logs`).
- `next.config.js` — headers X-Frame-Options / CSP (verificare iframe).

---

## 16. Portabilitate, adopție nativă & „chimia" cross-proiect

> Adăugat v1.1 (2026-07-21). Scop: modulul Planșe (și viitoare module) să se adopte cât mai NATIV în orice app, cu „chimie completă" între modul ↔ aplicație ↔ sistemul de reutilizare (blueprint/symbiote). **Secțiunile 16.7 sunt decizii deschise, de ajustat împreună.**

### 16.1 Principiul de bază — „livrare" ≠ „legare" (două lucruri distincte)

- **Livrare** = copierea reversibilă a fișierelor modulului în app → o face **blueprint** (`scripts/apply_blueprint.py`, template-vars + `manifest.lock` undo) sau **symbiote installer** (unități mari multi-stack).
- **Legare (wiring)** = modulul se „prinde" în app **fără editări manuale** → o face o **CONVENȚIE de arhitectură** (Module Auto-Discovery / registru de taburi), NU installer-ul. (Symbiote-installer real NU editează config-urile gazdă — vezi §16.7.)
- **„Chimie completă"** = livrare + legare împreună: droppezi folderul modulului ȘI convenția îl auto-înregistrează, totul reversibil.

### 16.2 Modulul Planșe e portabil BY DESIGN

- `frontend/public/planse/` = 100% self-contained (HTML/JS/CSS + date, zero dependențe de app). Se mută în orice app copiind folderul.
- Singurul „wiring" specific app = (a) o intrare de tab + (b) un wrapper de pagină. Exact aceste 2 piese le facem native (16.3) și parametrizabile (16.4).

### 16.3 Convenția „iframe-module" nativă în App 2 (refactor mic la shell)

Azi `page.tsx` are **3 puncte de cuplare manuală per modul** (dynamic import hardcodat, array de validare hardcodat pe linia ~24, div display-toggle) + **două `tabs.json`**. Ca modulele să fie drop-in, standardizează shell-ul:

1. **Sursă unică de taburi** — elimină duplicarea: `config/tabs.json` = canonic, copiat în `frontend/config/tabs.json` printr-un script `prebuild` (nu editezi două fișiere manual).
2. **Derivă validarea din TABS** — în `page.tsx`: `const ids = TABS.map(t => t.id)` și validează `saved` contra `ids`. → adăugarea unui tab nu mai atinge linia 24.
3. **Randor generic de iframe-module** — componentă `<IframeModule tabId={id}/>` (extrasă din `editor/page.tsx`) care randează `<iframe src={\`/${id}/index.html\`}>`. În `tabs.json`, un flag `"kind": "iframe"`; shell-ul randează automat `IframeModule`pentru orice tab`kind:iframe`, **fără fișier `app/<id>/page.tsx` per modul**.

⇒ După refactor: **adăugarea oricărui modul static = (1) drop folder în `public/<id>/` + (2) o intrare în `tabs.json`.** Zero cod React nou, zero editări de shell. **Asta e adopția nativă.**

- **Fallback:** dacă nu vrei refactorul acum, abordarea manuală din §4 (3 editări + wrapper) merge — doar nu e drop-in.
- **Risc:** refactorul atinge shell-ul comun (toate taburile) → test de regresie pe cele 5 taburi existente. Mic și aditiv, dar nu 100% izolat.

### 16.4 Împachetare ca `code-blueprint` (post-Faza 2)

Când `public/planse/` e funcțional, împachetează-l ca blueprint reutilizabil:

- Locație (**SHARED cross-app, decis 2026-07-21**): blueprint reutilizabil în `C:\Proiecte\Blueprints\` (ex. `proiecte\_shared\blueprints\M_PLANSE.md` sau `_skeleton\`), aplicabil în ORICE app conform — nu legat de un singur proiect.
- Frontmatter (schema v2): `type: code-blueprint`; `stack: [nextjs, static]`; `template_vars: [{{TAB_ID}}, {{TAB_LABEL}}, {{TAB_ICON}}]`; `target_paths: [frontend/public/{{TAB_ID}}/**, config/tabs.json (append)]`; `requires: [convenția iframe-module §16.3]`; `smoke_test: selftest.html verde + tab apare`.
- Corp: folderul `public/planse/` (cod real) + intrarea de tab. Pentru că legarea e prin convenție (16.3), blueprint-ul livrează **doar fișierele**; wiring-ul îl face convenția → chimie.
- Aplicare în alt app: `/atasare-blueprint M_PLANSE --var TAB_ID=planse …` → drop + auto-wire (dacă app-ul are convenția). `manifest.lock` → undo garantat.

### 16.5 Standardizarea cross-proiect (răspuns la „fac toate configurările similare")

Ținta ta: orice modul dintr-un app să meargă în oricare altul. Pași incrementali:

- **Contract de modul uniform:** un modul = folder self-contained + un manifest minimal (`MODULE_INFO` la backend Python / o intrare `tabs.json` la frontend static). Orice modul care respectă contractul = drop-in în orice app conform.
- **Convenție de auto-wire uniformă:** App 1 o are deja (backend `module_discovery.py` + `MODULE_INFO`); App 2 o primește prin §16.3 (iframe-module). Skeleton comun: `_skeleton/M16_MODULE_AUTO_DISCOVERY.md` (backend) + convenția iframe-module (frontend).
- **Livrare uniformă:** `code-blueprint` + `manifest.lock` (reversibil), sau symbiote pentru unități mari multi-stack.
- Rezultat: **contract uniform (modul) × convenție uniformă (auto-wire) × livrare uniformă (blueprint) = migrare „drop + o linie".**

### 16.6 Faze în roadmap (extinde §10) — CONFIRMAT 2026-07-21

- **Convenția iframe-module (16.3) → în F0** (decizia 16.7.1). Calea manuală §4 rămâne **fallback documentat** — nu se pierde nimic.
- **F7 (post-F2) — Blueprint `M_PLANSE` SHARED cross-app** (16.4): modulul devine drop-in reutilizabil în orice app conform. Convenția fiind deja în F0, F7 = doar împachetarea + `manifest.lock` undo. | **M** |

### 16.7 Decizii (CONFIRMATE 2026-07-21) + notă onestă

1. ✅ **Convenția iframe-module (16.3) = în F0** (Planșe = primul modul nativ). **ȘI păstrăm calea manuală §4 ca FALLBACK documentat — nu se pierde nimic** (dacă refactorul nativ dă probleme, §4 e planul B care livrează Planșe oricum). **Obligatoriu:** test de regresie pe cele 5 taburi existente după refactorul de shell.
2. ✅ **Blueprint `M_PLANSE` = SHARED cross-app** — reutilizabil în orice app conform (inclusiv App 1). Trăiește în `C:\Proiecte\Blueprints\` (shared), nu legat de un singur proiect.
3. ✅ **App 1 — NU acum:** păstrăm doar **contractul conceptual** („modul = self-contained + manifest"); NU forțăm iframe pe frontend-ul React nativ al App 1 (rămâne pe auto-discovery-ul lui backend).
4. **Onest — symbiote NU e unealta de auto-wire aici:** installer-ul real scrie doar în namespace propriu și NU editează config-urile gazdă (docurile lui promit mai mult decât face codul — de corectat cândva). Pentru Planșe, calea corectă = **`code-blueprint` + convenția din 16.3**, nu symbiote. Symbiote rămâne pentru unități mari multi-stack (gen `diagnostics`).

---

## 17. Protocol de implementare — clarificare prin AskUserQuestion (OBLIGATORIU)

> Cerut explicit de Roland (2026-07-21). Se aplică ÎNTREGII implementări — la fiecare fază ȘI fiecare funcționalitate. Aliniat cu REGULA SUPREMA (clarifică sub 95%) + R1/R2 din regulamentul global.

**Regula de bază:** sesiunea de implementare **NU scrie cod** până nu stabilește cu Roland **EXACT** ce implementează. Buclele de respingere din proiectare au fost de **INTERPRETARE**, nu de cod → clarificarea vizuală, în avans, e obligatorie (altfel se implementează greșit).

1. **AskUserQuestion MULTIPLE, per funcționalitate.** Fiecare piesă (nu doar fiecare fază) se clarifică prin una sau mai multe runde de AskUserQuestion **înainte** de cod. Granularitate fină — ex. în F1: (a) ce parametri expune formularul Labirint, (b) cum arată previzualizarea, (c) cum se face Print/PDF — fiecare clarificat separat.
2. **Recomandări adaptate contextului.** La FIECARE rundă, oferă îmbunătățiri și recomandări utile — nu doar opțiuni seci: unde există o alternativă mai bună, spune-o cu 1 motiv concret și marcheaz-o **[Recomandat]** (R1/R2). Prioritizează valoare/efort.
3. **Mock/exemplu ÎNAINTE de build.** Când forma contează (UI, layout, structură de puzzle), arată un **mock completat / preview concret** în AskUserQuestion, ca Roland să vadă EXACT ce va ieși înainte de a construi. (Lecția integramei: 3 respingeri fiindcă nu s-a confirmat forma întâi.)
4. **Gate de confirmare.** Nu implementa efectiv o piesă fără „da, asta". Nu trece la faza următoare fără confirmare explicită.
5. **Discuție per funcționalitate.** Roland vrea să discute **FIECARE funcționalitate** a fiecărei implementări. Tratează fiecare sub-funcționalitate ca un mic ciclu: **clarifică → recomandă → confirmă → implementează → verifică (selftest) → arată rezultatul.**
6. **Corectitudinea rămâne gate PARALEL:** clarificarea NU înlocuiește self-testele; fiecare piesă de generator trece `selftest.html` verde înainte de „gata".

**Rezumat operațional (per funcționalitate):** `clarifică (AskUserQuestion) → recomandă (adaptat) → confirmă (gate) → implementează → verifică (selftest) → arată`. Repetă. **Fără presupuneri.**

```

```
