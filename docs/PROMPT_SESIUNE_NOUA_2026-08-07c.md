# PROMPT SESIUNE NOUĂ — Traduceri Matematică (creat 2026-08-07, seara — runda 3, DUPĂ C/F0)

> ⚠️ **ÎNLOCUIT COMPLET de `docs/PROMPT_SESIUNE_NOUA_2026-08-08b.md`** (creat 2026-08-08): C/F0 DEPLOYAT v45 ȘI C/F1 (regulamente proprii Gimnaziu Cl. 6/7/8 Matematică) DEPLOYAT v46-20260808 (Roland a confirmat „Deploy grupat acum" de 2 ori) — bug „7 regulamente" rezolvat pt aceste 3 clase, verificat LIVE cu generare AI reală DIRECT pe alias, gate `tsc 0 · jest 207/207 · build OK`. **Folosește fișierul `...2026-08-08b.md` ca punct de plecare pt sesiunea nouă, NU pe acesta.**
>
> Lipește ACEST fișier (sau doar **PROMPT SCURT** de la final) ca PRIM mesaj în sesiunea nouă, după `/onboard`.
> **Înlocuiește** `docs/PROMPT_SESIUNE_NOUA_2026-08-07b.md` (acela era înainte de C). Nu-l șterge (istoric git), dar nu-l folosi ca punct de plecare.
> ⚠️ **Verifică data reală** (`date` / `git log --format=%ad`) înainte de a scrie orice dată — un nume de fișier cu dată NU e dovadă (capcană propagată deja o dată în proiect).

## MOD DE LUCRU (obligatoriu, neschimbat)

**UN livrabil câte unul** → (mock §17 unde e UI nou) → cod → **selftest/gate** → **probă live** → commit. **Deploy GRUPAT, DOAR cu confirmarea explicită a lui Roland** (commit/push e automat conform `feedback_auto_push`; deploy-ul NU). R-HANDOFF la zi după fiecare item (HANDOFF + plan + memorie + commit/push). Folosește **advisor** înainte de decizii mari și înainte de „gata" — pe C/F0 a prins 3 lucruri reale pe care gate-ul nu le vede (banner nod ne-ghidat, fals-pozitiv verificare, guard defensiv).

## STAREA LA ZI (2026-08-07 seara, runda 3)

Branch `faza-g-editor`. **Prod = v44-20260807c** (D `\lim` + #7/#8/#26b, DEPLOYAT+verificat pe alias azi).

**NEDEPLOYAT pe prod — C/F0 (modul „Școlare 🌐"), commit-urile `8c3e82a` (plan) + `7916156` (F0) + `942dd19` (fix-uri advisor):**

- ✅✅ **C / F0 LIVRAT** — modul nativ React „Școlare 🌐" (tab `scolare`, `kind:"react"`).
  - **6A Skeleton 100%** (`frontend/src/lib/scolare/curriculum/*.ts`): 4 cicluri / **16 nivele / 112 noduri** (Grădiniță „domenii" cod DLC/DS/DEC/DOS + școală „materii"; liceu marcat `in_reforma`). Verificator de completitudine **INDEPENDENT** (`verifier.ts`, oracol verbatim inline) — gate verde cu controale negative (nod șters/typo/nivel șters → FAIL). **Aici trăiește „acoperirea 100%", bifabil.**
  - **6B Pilot Gimnaziu Clasa 5 Matematică**: `ScolarePanel.tsx` (selectoare din skeleton + „Cerință specifică") → `prompt.ts` (din regulament + capitole programa oficială **OMEN 3393/2017**) → `sendChat`/`api/proxy` → `history.ts` (anti-repetare) → `verify-fisa.ts` (verificare aritmetică + banner „verifică înainte de tipărire") → preview A4 print-izolat + „➕ În editor".
  - **Gate: `tsc 0 · jest 205/205 (+24) · next build OK`.** **Dovadă LIVE:** 2 fișe reale prin `/api/proxy` PROD (script Node) + verificare în app (Chrome dev :3341): generare reală Gemini Flash aliniată curricular (KaTeX), banner de verificare (0 fals-pozitive), banner „nod ne-ghidat" confirmat.
  - **Onest (R3):** doar **Clasa 5 Matematică e cablat complet** (are regulament). Celelalte 111 noduri au skeleton dar conținut ne-ghidat — bannerul albastru le marchează. Anti-repetarea = dedup semnătură exactă + avoid-list + re-roll (re-roll = plasă; la temp 0.3 dublura byte-identică ~imposibilă; avoid-list netestat izolat live).

**Capcane de sesiune (de reținut):** (1) SW stale servea bundle vechi în dev → curăță cu `serviceWorker.getRegistrations().unregister()` + `caches.delete` + reload; (2) `target:es5` → fără spread pe string / `for...of` pe `matchAll` (folosește `.split`/`exec`-while); (3) `.env` e la root, dar Next rulează din `frontend/` — pt dev cu chei reale: `cd frontend; set -a; source ../.env; set +a; next dev`.

## ▶️ COADĂ ACTIVĂ §6b (execuție OBLIGATORIE — semnalează la fiecare onboard)

|       | Cerință                       | Status                                   |
| ----- | ----------------------------- | ---------------------------------------- |
| **A** | Integramă multi-formă         | ✅ DEPLOYAT v40                          |
| **B** | Extindere generatoare Planșe  | ✅ DEPLOYAT v41                          |
| **D** | Bug `\lim`                    | ✅ DEPLOYAT v44                          |
| **C** | Modul Școlare full-curriculum | 🔵 **F0 LIVRAT (NEDEPLOYAT)**; F1+ rămân |

### PRIMUL PAS: decizie Roland (rămasă deschisă)

Deploy grupat C/F0 **acum** (bump `CACHE_VERSION` v44→v45 în `frontend/public/sw.js`, `vercel deploy --prod --yes` din `frontend/`, verifică ALIASUL `traduceri-frontend.vercel.app` — `sw.js`=v45 + tab Școlare live; backend `traduceri-api` NEATINS) **SAU** întâi eyeball Roland pe telefon (fișă + print real) și deploy după. **Cere confirmarea.**

### URMĂTORUL în C: F1 — Gimnaziu Matematică Clasa 6/7/8

**Blocaj real confirmat (bug „7 regulamente"):** `Gimnaziu/Clasa_6/7/8` + `Liceu/Clasa_9-12` din folderul-sursă Carla au `regulament.md` **copiat byte-identic din Clasa 5** (nu au reguli proprii). Deci F1 = **scrie regulamente proprii** per clasă (conținut nou aliniat la programa oficială pe clasă — modelul `project_curriculum_audit_2026_07_28`), ca asset în `frontend/public/scolare/regulamente/` (ȘI/SAU în Carla-sursă). Adaugă `regulament_ref` + `capitole` pe nodurile respective din skeleton. Vezi `docs/PLAN_SCOLARE_2026-08-07.md` §7/§8.

## REGULI FERME

- **R-COPYRIGHT (Școlare):** sursa de conținut/aliniere = **programa oficială aprobată** (rocnee.eu / ise.ro / OMEN — public). **Manualele MEN NU se stochează/committează.** Dacă Roland re-cere „manuale în folder" (a mai cerut la startul F0), **reamintește decizia** înainte de a proceda diferit; manuale ca referință dev = DOAR local gitignored. Vezi memoria `project-scolare-curriculum-scope`.
- **Liceu = țintă mișcătoare:** reformă activă (175 programe noi, clasa IX din 2026-2027). Re-verifică LIVE rocnee.eu la orice atingere de conținut liceu. Nodurile au deja `in_reforma:true`.
- Gate frontend = `tsc --noEmit` + `jest` + `next build`. Gate skeleton = verificatorul de completitudine (`checkCompleteness`) verde pe 16 nivele.
- R-COST (tot gratis), R-THEME (tablă verde + cretă, Patrick Hand), R-EXT (modul separat, nu atinge pipeline-ul Traduceri).
- NU deploya fără confirmare explicită Roland.

## Fișiere de referință C

- `docs/PLAN_SCOLARE_2026-08-07.md` v1.1 — planul complet (skeleton/conținut, F0-F6, decizii D1-D9, reguli).
- `docs/Export_chat_sesiune_Carla.md` — exportul sesiunii de design (D1-D9), UNTRACKED (nu committed — clasificatorul a blocat; e doar referință locală).
- Folder-sursă: `G:\My Drive\Roly\4. Artificial Inteligence\Folder_Lucru\Carla\` (regulamente + `Curricula/config_*.json`).

## PROMPT SCURT

> `/onboard`. Continuăm Traduceri Matematică. Coada §6b: **A/B/D DEPLOYATE (v40/v41/v44)**; **C are F0 LIVRAT dar NEDEPLOYAT** (modul „Școlare 🌐": skeleton 100% pe 16 nivele + verificator independent + pilot Gimnaziu Clasa 5 Matematică generat AI din regulament + programa oficială OMEN 3393/2017, cu verificare aritmetică + anti-repetare; gate `tsc 0·jest 205/205·build OK`, verificat LIVE în Chrome). Commit-uri `7916156`+`942dd19` pe `faza-g-editor`. **PRIMUL PAS: cere confirmarea Roland — deploy grupat C/F0 (bump CACHE_VERSION v44→v45) SAU eyeball telefon întâi.** Apoi **F1** = Gimnaziu Mate Cl. 6/7/8, care cere SCRIEREA regulamentelor proprii (bug „7 regulamente": acele clase + tot liceul au regulament copiat din Clasa 5). R-COPYRIGHT: programa oficială publică, NU manuale committate — dacă Roland re-cere manuale, reamintește decizia. Efort: **xhigh**. Advisor înainte de „gata".
