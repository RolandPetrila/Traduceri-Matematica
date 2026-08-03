# PLAN — RUNDĂ MODULE (2026-08-04)

> Rundă mare, multi-sesiune. Stabilită integral cu Roland prin AskUserQuestion (sesiune 2026-08-03/04).
> **Sursă de adevăr pt această rundă**; se integrează în `docs/PLAN_MASTER.md` (§5/§6/§7) la final.
> Ritm confirmat: **secvențial, gate după FIECARE item, deploy GRUPAT cu confirmarea Roland**.
> ⚠️ Documentare făcută prin raționament structurat nativ (MCP sequential-thinking era deconectat — R3).

---

## 0. DECIZII CONFIRMATE (Roland, nu se re-întreabă)

| #    | Decizie                                                                                                                            | Stare                                                         |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| M2   | Constructor **recursiv** (nested: √-în-fracție, fracție-în-fracție, Σ cu fracție etc.) — o implementare acoperă toate combinațiile | ✅ DA, acum                                                   |
| M3   | Dark-mode                                                                                                                          | ❌ **RESPINS DEFINITIV** (nu mai revine ca item)              |
| M5   | Figuri **parametrice** (etichete A/B/C + laturi editabile)                                                                         | ✅ DA, acum                                                   |
| P3   | 5 generatoare planșe (numere/integramă/unește/dictare/căutare)                                                                     | ✅ DA, acum                                                   |
| P4   | Istoric planșe → PDF unic + unicitate persistentă                                                                                  | ✅ DA, acum                                                   |
| §7   | **Corectare/Generare teste** — modul nou                                                                                           | ✅ DA, acum                                                   |
| §7   | **Calculator** — modul nou **complet** (științific + evaluare + grafic + matrice/sisteme + integrare editor)                       | ✅ DA, acum                                                   |
| §7   | **Chat AI nativ** — mate + context aplicație + OCR corectare; **înlocuiește Asistentul AI** existent                               | ✅ DA, acum                                                   |
| V5   | Clasa VIII „funcția liniară" = **`a≠0`** (funcția de gradul I strict)                                                              | ✅ decis                                                      |
| GIT  | Merge `faza-g-editor` → `main`                                                                                                     | ✅ DA, acum (fast-forward curat: main 0 în urmă, 230 înainte) |
| Chat | Lanț AI: **Gemini 2.5 Flash → Groq Llama 3.3 70B → OpenRouter** (math premium) + **indicator de stare** per provider               | ✅ decis                                                      |

**Excepție R-COST confirmată:** OpenRouter (plătit, credit unic Roland) permis în lanțul Chat. Restul = free tier.

---

## 1. REGULI DE SIGURANȚĂ (obligatorii la FIECARE item)

1. **Gate non-regresie după fiecare item:** `npx tsc --noEmit` (0) · `npx jest` (toate verzi) · `npx next build` (OK) · `pytest` (dacă atinge backend) · probă live **390px + desktop**.
2. **§17 — mock înainte de cod** pt orice UI nou major: **Calculator**, **Corectare/Generare teste**, **Chat AI**, (M5 figuri parametrice — mock scurt). Arăt mock → confirm Roland → cod.
3. **CORS:** browser → API Python = `text/plain`/`multipart`, NICIODATĂ `application/json`.
4. **R-MATH:** 0% pierdere notație matematică. **R-THEME:** tot pe verde+cretă. **R-EDIT/R-EXPORT:** editabil + în toate exporturile.
5. **Chei noi (Groq, OpenRouter)** → adăugate în env Vercel `traduceri-api` la deploy (Gemini deja acolo). Fără valori în cod/git.
6. **Deploy = DOAR cu confirmarea Roland.** Bump `CACHE_VERSION` în `frontend/public/sw.js` + `vercel deploy --prod` + **verifică ALIASUL**, 2 proiecte (frontend `traduceri-frontend` / backend `traduceri-api`, `.vercelignore` la root).
7. **R-HANDOFF după fiecare fază:** actualizez `HANDOFF_SESIUNE.md` + bifez aici + memoria + commit/push.
8. **Onestitate (R3):** ce n-a fost rulat = declarat nerulat. ID-uri model confirmate la sursă (nu din memorie).

---

## 2. ORDINEA DE EXECUȚIE + CHECKLIST

### Etapa 0 — Baseline git

- [ ] **G0. Merge `faza-g-editor` → `main`** (fast-forward), continui lucrul pe `main` ca să nu re-divergem. ⚠️ Confirmare Roland la momentul merge-ului (outward-facing pe repo). _(Prod se deployează manual, nu e legat auto de branch → merge = igienă git.)_

### Etapa 1 — Câștiguri mici + editor (frontend, self-contained)

- [ ] **V5. Funcția liniară VIII = `a≠0`** — ajustez definiția în `math-data.json` (via `lot_engine`), gate `gate_check` + KaTeX. Efort: mic.
- [ ] **M2. Constructor recursiv** — refac `EditorMathBuilder.tsx`: un câmp poate conține un sub-constructor (compoziție recursivă), la orice adâncime. Persistență schiță + editare la click păstrate. Efort: mediu-mare. Risc: regresie pe constructorul mono-segment care merge → teste + probă live atentă.
- [ ] **M5. Figuri parametrice** — NodeView parametric în `editor-figures.ts` (etichete A/B/C + laturi editabile, export-safe PDF/HTML/DOCX). Mock §17 scurt. Efort: MARE. Risc: export.

_(Checkpoint deploy 1: V5+M2+M5, cu confirmare.)_

### Etapa 2 — Module noi (self-contained)

- [ ] **CALC. Modul Calculator (complet)** — nou `app/calculator` + `CalculatorPanel` + `GraphPlot` + `math.js` (MIT, gratis). Științific + evaluare expresii + grafic funcții (canvas/SVG) + matrice/sisteme + simbolic ușor + **integrare editor** (grafic → figură în document). Tab în `config/tabs.json`, temă verde. Mock §17. 100% client, fără backend. Efort: MARE.

_(Checkpoint deploy 2: Calculator, cu confirmare.)_

- [ ] **TESTE. Modul Corectare/Generare teste** — nou de la zero. Generare fișe/teste (pe clase + teme din biblioteca math) + corectare (poate reutiliza OCR + Chat AI pt analiză). Mock §17 (definire scope exact la start: ce generează, ce corectează). Efort: MARE.

_(Checkpoint deploy 3: Teste, cu confirmare.)_

### Etapa 3 — Chat AI nativ (înlocuiește Asistentul)

- [ ] **CHAT.1** Mock §17 UI — unde stă (panou în tab Matematică vs tab dedicat), cum arată chat + atașare fișier + indicator provideri.
- [ ] **CHAT.2** Backend lanț same-origin (reuse/extind `pages/api/proxy.js` sau endpoint nou): **Gemini 2.5 Flash → Groq Llama 3.3 70B → OpenRouter** (ID-uri confirmate la sursă). Fallback automat la eroare/quota. `text/plain`.
- [ ] **CHAT.3** Punte de context aplicație: injectez biblioteca (337 formule) + lista module + docuri + documentul curent din editor → răspunde „din aplicație".
- [ ] **CHAT.4** OCR corectare: atașezi fișier → `/api/ocr` (Gemini) → text+formule → LLM analizează/corectează.
- [ ] **CHAT.5** **Indicator de stare** per provider (badge tip DeepL: provider activ + punct verde/roșu, health-check).
- [ ] **CHAT.6** System-prompt specializat mate RO/SK + notă „asistent, nu autoritate" + cuplare opțională cu Calculatorul pt calcul exact.
- [ ] **CHAT.7** Retrag iframe-ul **Asistent AI** vechi (păstrez `proxy.js` dacă e reutil). Env Groq+OpenRouter pe Vercel `traduceri-api`.

_(Checkpoint deploy 4: Chat AI + retragere Asistent, cu confirmare.)_

### Etapa 4 — Planșe

- [ ] **P3. 5 generatoare** (numere/integramă/unește/dictare/căutare) + `data/*.json`, reutilizând scheletul `frontend/public/planse/lib/` (prng/render/signature). Precache în `sw.js` (offline). Efort: MARE.
- [ ] **P4. Istoric → PDF unic** (`lib/history.js`): coș de planșe → un singur PDF + unicitate persistentă între sesiuni. Efort: mediu.

_(Checkpoint deploy 5: Planșe P3+P4, cu confirmare.)_

### Etapa 5 — Consolidare

- [ ] **FIN.** Actualizez `PLAN_MASTER.md` (bifez §5/§6/§7), `HANDOFF_SESIUNE.md`, memoria; marchez **M3 RESPINS DEFINITIV** în §5. Verific aliasuri finale.

---

## 3. VERIFICĂRI UMANE (nu se automatizează — ghid livrat separat)

- Roland: eyeball export PDF/docx, OCR e2e din browser, PDF multi-pagină (V1/V3/V4 din §8) + fiecare modul nou pe prod.
- Cristina: corectitudine matematică + plasare pe clasă (M1 teoreme + V5 + eventual conținut generat de modulul Teste) — V2.

---

## 4. JURNAL EXECUȚIE

_(se completează la „execută" — item, commit, gate, deploy, dovadă)_

- _(gol — nu a început execuția)_
