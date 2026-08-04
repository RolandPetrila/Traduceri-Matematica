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

- [x] **G0. Merge `faza-g-editor` → `main`** (fast-forward) — DONE 2026-08-04, commit `9926ae1`. main local+remote = starea prod v28. Continui lucrul pe `faza-g-editor`, sincronizez `main` la fiecare checkpoint de deploy verificat (refinare: tooling/handoff referă faza-g-editor). Reversibil (`git reset`).

### Etapa 1 — Câștiguri mici + editor (frontend, self-contained)

- [x] **V5. Funcția liniară VIII = `a≠0`** — DONE 2026-08-04, **0 modificări**: biblioteca definește deja `f(x)=ax+b, (a≠0)` „Funcția de gradul I" în `math-data.json` clasa 8. Alegerea = status quo. (Nuanță denumire „liniară" vs „gradul I" = domeniu Cristina.)
- [x] **M2. Constructor recursiv** — DONE 2026-08-04. NOU `math-builder-tree.ts` (model recursiv pur `BNode` + `nodeToLatex`, 0 cod per combinație) + `math-builder-tree.test.ts` (14 teste, incl. √-în-fracție/fracție-în-fracție/Σ-cu-fracție/√-în-sistem/nesting adânc, toate KaTeX-valide) + rescris `EditorMathBuilder.tsx` (SlotEditor recursiv: butoane „a/b √ Σ ∫ lim" per câmp → convertesc textul în structură; „×" revine la text; persistă arborele per tip). `math-input.ts` NEATINS (norm+MATH_CONSTRUCTIONS). Matricea = celule text ca înainte (curat). Gate: **tsc 0 · jest 129/129 (+14) · build OK**. **LIVE desktop:** √-în-fracție → preview `\dfrac{\sqrt{6x+3}}{\square}` → inserat în doc (data-latex corect), 0 erori consolă, 0 overflow. 390 real = eyeball Roland (resize_window nu forțează viewport).
- [x] **M5. Figuri parametrice** — DONE 2026-08-04. Mock §17 aprobat (edit după inserare + etichete+laturi opționale). `editor-figures.ts` parametrizat (`renderFigure(labels,sides)`, backward-compat: default==SVG-ul vechi, dovedit în test) + `FigureEditDialog.tsx` (oglindă `math:edit` → event `figure:edit`) + `image-resize.ts` (atribute `figKey`/`figParams` = `data-fig-*`, export-safe; click pe figură cu debounce vs dblclick-reset; imaginile OCR neatinse) + `EditorMathMenu` inserează cu params + wiring în `EditorTiptap`. Gate: **tsc 0 · jest 136/136 (+7, incl. backward-compat) · build OK**. **LIVE:** inserat figură → click → dialog „Editează figura — Romb" (4 vârfuri+4 laturi) → A→M + AB=5 → Salvează → SVG regenerat (`>M<`,`>5<`, fără `>A<`), export rămâne `<img>` SVG; dialog se închide; 0 erori M5 (doar SW-noise local). 390 real = eyeball Roland.

_(Checkpoint deploy 1: V5+M2+M5, cu confirmare.)_

### Etapa 2 — Module noi (self-contained)

- [x] **CALC. Modul Calculator (complet)** — DONE 2026-08-04. Mock §17 aprobat. `lib/calculator-eval.ts` (math.js: `normalizeExpr` notație școlară √/π/ln/tg, `evaluateExpr`, `samplePoints`, `plotToSvg` SVG export-safe) + `components/calculator/CalculatorPanel.tsx` (3 sub-taburi Științific/Grafic/Matrice-Sisteme, temă verde) + tab în `config/tabs.json` ×2 (kind:"react") + wiring `page.tsx` (component dinamic, NU rută App-Router — capcană PageProps) + punte `editor-commands.ts` `insertEditorImage` + inserter în `EditorTiptap`. `mathjs ^15.2.0`. Gate: **tsc 0 · jest 145/145 (+9) · build OK**. **LIVE:** `2^10+√16+sin(π/6)=1028.5` · grafic x²−3 (parabolă+axe) · **grafic→editor** (comută tab + inserează figura SVG). Matrice = teste (det=−2/inv). ⚠️ Capcană: `app/*/page.tsx` cu props custom rupe build-ul (PageProps) → import component, nu rută.

_(Checkpoint deploy 2: Calculator, cu confirmare.)_

- [ ] **TESTE. Modul Corectare/Generare teste** — nou de la zero. Generare fișe/teste (pe clase + teme din biblioteca math) + corectare (poate reutiliza OCR + Chat AI pt analiză). Mock §17 (definire scope exact la start: ce generează, ce corectează). Efort: MARE.

_(Checkpoint deploy 3: Teste, cu confirmare.)_

### Etapa 3 — Chat AI nativ (înlocuiește Asistentul)

- [x] **CHAT.1–CHAT.7 DONE (2026-08-04).** Mock §17 aprobat (înlocuiește tab Asistent). Reuse `pages/api/proxy.js` (securizat) + lanț CLIENT `lib/chat-providers.ts` (**Gemini Flash → Groq 70B → OpenRouter free 70B**, fallback la eroare, `parseReply` per format); extins `MODEL_ALLOW.groq` → 70b. `lib/chat-context.ts` (system-prompt mate RO/SK + index bibliotecă/clase + module + notă „verifică cu Calculatorul"). `components/chat/ChatPanel.tsx` (mesaje KaTeX, **indicator provider+stare 🟢/🔴** + buton „Testează", 📎 atașare→OCR corectare). `page.tsx`: tab „Asistent AI" randează `ChatPanel` (iframe retras; `/asistent`+`public/asistent` rămân, curățare la FIN). Gate: **tsc 0 · jest 152/152 (+7) · build OK**. **LIVE:** `/api/proxy?provider=gemini` → 200; UI: „2x+3=11" → **x=4** cu KaTeX, indicator „Gemini Flash". ⚠️ OCR-attach netestat local (backend absent) → eyeball prod. Env Groq/OpenRouter/Google pe **traduceri-frontend** (verific la deploy — Asistentul vechi le folosea deja).

_(Checkpoint deploy 3: Calculator+Chat, cu confirmare + env keys.)_

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
