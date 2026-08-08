# PROMPT SESIUNE NOUĂ — Traduceri Matematică (creat 2026-08-08, dimineață — după F1 Școlare deployat)

> Lipește ACEST fișier (sau doar **PROMPT SCURT** de la final) ca PRIM mesaj în sesiunea nouă, după `/onboard`.
> **Înlocuiește** `docs/PROMPT_SESIUNE_NOUA_2026-08-07c.md` (acela era înainte de F1 + deploy v46). Nu-l șterge (istoric git), dar nu-l folosi ca punct de plecare.
> ⚠️ **Notă naming:** există deja un `docs/PROMPT_SESIUNE_NOUA_2026-08-08.md` din 2026-08-06 (mislabelat, e de fapt istoricul cerințelor A/B/C/D din 2026-08-07 seara — NU-l suprascrie, e referențiat din HANDOFF). Acest fișier e `...2026-08-08b.md`.
> ⚠️ **Verifică data reală** (`date` / `git log --format=%ad`) înainte de a scrie orice dată — un nume de fișier cu dată NU e dovadă (capcană propagată deja o dată în proiect).

## MOD DE LUCRU (obligatoriu, neschimbat)

**UN livrabil câte unul** → (mock §17 unde e UI nou) → cod → **selftest/gate** → **probă live** → commit. **Deploy GRUPAT, DOAR cu confirmarea explicită a lui Roland** (commit/push e automat conform `feedback_auto_push`; deploy-ul NU). R-HANDOFF la zi după fiecare item (HANDOFF + plan + memorie + commit/push). Folosește **advisor** înainte de decizii mari și înainte de „gata" — pe F1 a prins 2 lucruri reale pe care gate-ul nu le vede: (1) fix-ul inițial la `verify-fisa.ts` era prea îngust (acoperea un singur glif Unicode, nu toată clasa de comenzi LaTeX brute — descoperit abia după ce am capturat raw response-ul real `/api/proxy`, nu textul randat vizual), (2) o eroare factuală în regulamentul Clasei 5 (lipsea criteriul de divizibilitate cu 9, verificat contra sursei primare — PDF-ul oficial deja descărcat). **Lecție operațională:** `get_page_text` arată textul RANDAT (KaTeX), NU raw text-ul pe care `verify-fisa.ts` îl scanează — pentru verificări similare, patch-uiește `window.fetch` + citește body-ul răspunsului real `/api/proxy`.

## STAREA LA ZI (2026-08-08 dimineață)

Branch `faza-g-editor`. **Prod = v46-20260808** (F1 Școlare — regulamente Cl. 6/7/8 Matematică — DEPLOYAT+verificat pe alias azi-noapte).

**Coadă activă §6b din `docs/PLAN_MASTER.md`:**

|       | Cerință                       | Status                                       |
| ----- | ----------------------------- | -------------------------------------------- |
| **A** | Integramă multi-formă         | ✅ DEPLOYAT v40                              |
| **B** | Extindere generatoare Planșe  | ✅ DEPLOYAT v41                              |
| **D** | Bug `\lim`                    | ✅ DEPLOYAT v44                              |
| **C** | Modul Școlare full-curriculum | 🔵 **F0+F1 DEPLOYATE (v45, v46)**; F2+ rămân |

- ✅✅ **C/F0 (skeleton 16 nivele + pilot Gimnaziu Clasa 5 Matematică)** — DEPLOYAT v45-20260807d.
- ✅✅ **C/F1 (regulamente proprii Gimnaziu Clasa 6/7/8 Matematică)** — DEPLOYAT v46-20260808. Rezolvă bug „7 regulamente" pentru aceste 3 clase (aveau `regulament.md` copiat byte-identic din Clasa 5). 3 fișiere noi `frontend/public/scolare/regulamente/gimnaziu_clasa{6,7,8}_matematica.md`, sursate direct din PDF-ul oficial OMEN 3393/2017 (`ise.ro`, același `sursa_url` din skeleton) + `regulament_ref`+`capitole` cablate pe `frontend/src/lib/scolare/curriculum/gimnaziu.ts`. **Verificat LIVE cu generare AI reală** (nu mock) pe toate 3 clasele, atât în dev cât și DIRECT pe alias-ul de producție — conținut exact aliniat capitolelor din programă (Cl.6: mulțimi/divizibilitate/rapoarte/întregi/raționale/unghiuri/Pitagora; Cl.7: radicali/sisteme ecuații/trapez/Thales/trigonometrie; Cl.8: inecuații/factor comun/ecuație gradul II/statistică/geometrie spațiu), **0 fals-pozitive**. Gate `tsc 0 · jest 207/207 · build OK`. Commit-uri `98d0da5`→`e8326b2` pe `faza-g-editor` (8 commit-uri, toate push-uite).

**Capcane de sesiune noi (de reținut):**

1. **`get_page_text` ≠ raw text scanat de `verify-fisa.ts`.** `get_page_text` extrage textul RANDAT (post-KaTeX) dintr-o pagină — un lanț ca „2^1⋅3^1⋅5^1" poate apărea acolo cu glife Unicode chiar dacă raw text-ul AI (`r.reply`, ce scanează efectiv `verifyArithmetic`) conține LaTeX brut (`\cdot`). Pentru orice bug de verificare text, capturează raw response-ul (`window.fetch` patch temporar + `read_network_requests` sau citire body direct din pagină) înainte de a scrie un fix bazat pe ce vezi vizual.
2. **PDF-uri oficiale cu diacritice pierdute la `pdftotext`.** PDF-ul OMEN 3393/2017 (Matematică gimnaziu) pierde ț/ș/ă/â/î la extragere text (font fără ToUnicode complet) — pentru conținut cu diacritice corecte, folosește Read tool pe imaginea paginii (nu `pdftotext`), care randează corect. `pdftotext` rămâne util DOAR pt localizarea rapidă a paginilor/secțiunilor (căutare de text ASCII-safe).
3. **`npx next dev` pornit cu `(cmd &)` (subshell backgrounding manual) poate fi omorât de un timeout al altei comenzi din aceeași sesiune shell** — folosește `run_in_background: true` pe Bash tool direct (nu backgrounding manual în shell), și oricum verifică portul cu `netstat`/`taskkill` dacă un build ulterior dă `EPERM` pe `.next/trace` (proces `next dev` zombie ținând lock-ul).
4. **Pipe-ul `npm run build | tail -N` maschează exit code-ul real** (raportează exit code-ul lui `tail`, nu al build-ului) — la verificarea gate-ului, rulează build-ul FĂRĂ pipe (redirect la fișier + `echo EXITCODE=$?`) și confirmă și artefactul (`.next/BUILD_ID` există).

## ▶️ URMĂTORUL PAS ÎN C (decizie/execuție următoarei sesiuni)

**F2 — Gimnaziu, toate materiile** (7-11 materii/clasă la Cl. 5-8, dincolo de Matematică) — necesită regulamente scrise de la zero pentru fiecare materie (Limba Română, Engleză, Istorie, Geografie, Biologie, Fizică, Chimie, Educație Tehnologică, Informatică/TIC, Educație Socială), pe modelul Matematicii (sursă = programa oficială pe materie, verificată la sursa primară ca la F1, NU manuale). E o fază **mult mai mare** decât F1 (multe materii × 4 clase) — recomand să NU se pornească direct pe toate, ci să se aleagă un pilot (ex. o singură materie nouă, ca Limba Română sau Istorie, pe toate 4 clasele) și să se confirme cu Roland înainte de a scala.

**Alternativ**, dacă Roland preferă altă direcție: **F3** (Primar, Clasa 0-4 — testează schema dual-shape) / **F4** (Grădiniță, domenii de dezvoltare) / **F5** (Liceu — atenție: reformă activă, re-verifică rocnee.eu LIVE înainte de orice conținut).

**Recomandare sesiune nouă:** deschide cu `/onboard`, apoi cere-i lui Roland să aleagă explicit între F2 (pilot 1 materie nouă) / F3 / F4 / F5, cu opțiunile prezentate clar (AskUserQuestion) — nu porni cod fără alegerea lui, la fel ca la fiecare fază anterioară din C.

## REGULI FERME (neschimbate)

- **R-COPYRIGHT (Școlare):** sursa de conținut/aliniere = **programa oficială aprobată** (rocnee.eu / ise.ro / OMEN — publică). **Manualele MEN NU se stochează/committează.** Dacă Roland re-cere „manuale în folder", **reamintește decizia** înainte de a proceda diferit; manuale ca referință dev = DOAR local gitignored. Vezi memoria `project-scolare-curriculum-scope`.
- **Liceu = țintă mișcătoare:** reformă activă (175 programe noi, clasa IX din 2026-2027). Re-verifică LIVE rocnee.eu la orice atingere de conținut liceu.
- Gate frontend = `tsc --noEmit` + `jest` + `next build` (**fără pipe la `tail`** — vezi capcana #4 de mai sus). Gate skeleton = verificatorul de completitudine (`checkCompleteness`) verde pe 16 nivele.
- R-COST (tot gratis), R-THEME (tablă verde + cretă, Patrick Hand), R-EXT (modul separat, nu atinge pipeline-ul Traduceri).
- NU deploya fără confirmare explicită Roland (a fost respectată de 2 ori consecutiv la F0 și F1 — continuă la fel).

## Fișiere de referință

- `docs/PLAN_SCOLARE_2026-08-07.md` v1.1 — planul complet (skeleton/conținut, F0-F6, decizii D1-D9, reguli, jurnal de execuție la zi cu F1).
- `docs/PLAN_MASTER.md` §6b — status coadă A/B/C/D.
- `docs/HANDOFF_SESIUNE.md` — istoricul complet, secțiunea cea mai recentă = F1 + deploy v46.
- `docs/Export_chat_sesiune_Carla.md` — exportul sesiunii de design (D1-D9), UNTRACKED (nu committed — clasificatorul a blocat; e doar referință locală).
- Folder-sursă: `G:\My Drive\Roly\4. Artificial Inteligence\Folder_Lucru\Carla\` (regulamente + `Curricula/config_*.json`).
- PDF oficial Matematică gimnaziu (V-VIII), deja descărcat/analizat: `https://www.ise.ro/wp-content/uploads/2017/01/Matematica.pdf` (același folosit la F0+F1; pt alte materii, caută echivalentul pe ise.ro/rocnee.eu).

## PROMPT SCURT

> `/onboard`. Continuăm Traduceri Matematică. Coadă §6b: **A/B/D DEPLOYATE (v40/v41/v44)**; **C are F0+F1 DEPLOYATE (v45, v46)** — modul „Școlare 🌐" cu skeleton 100% (16 nivele) + regulamente proprii pe Gimnaziu Clasa 5/6/7/8 Matematică, toate verificate LIVE cu generare AI reală pe alias-ul de producție, 0 fals-pozitive. Commit-uri `98d0da5`→`e8326b2` pe `faza-g-editor`. **PRIMUL PAS: cere-i lui Roland să aleagă următoarea fază C — F2 (pilot 1 materie nouă la Gimnaziu, dincolo de Matematică) SAU F3 (Primar) SAU F4 (Grădiniță) SAU F5 (Liceu, atenție reformă activă)** — nu porni cod fără alegerea lui (AskUserQuestion), la fel ca la F0/F1. R-COPYRIGHT: programa oficială publică, NU manuale committate — dacă Roland re-cere manuale, reamintește decizia. Capcane de reținut: `get_page_text` arată text RANDAT, nu raw text-ul scanat de `verify-fisa.ts` (patch `window.fetch` pt debugging real); PDF-uri oficiale pot pierde diacritice la `pdftotext` (folosește Read tool pe imaginea paginii); NU pipe build-ul la `tail` (maschează exit code-ul real). Efort: **xhigh**. Advisor înainte de „gata".
