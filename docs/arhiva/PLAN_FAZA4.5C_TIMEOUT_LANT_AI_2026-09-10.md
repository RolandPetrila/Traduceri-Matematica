# PLAN — Faza 4.5c: timeout lanț AI la Teste/Școlare mari (P2)

> **STATUS: CONFIRMAT + IMPLEMENTAT + DEPLOYAT (2026-09-10).** Vezi §CONFIRMARE ROLAND și
> §EXECUȚIE mai jos pentru decizia finală și ce s-a livrat efectiv.

> Creat: 2026-09-10. Respectă R-PLAN. Continuă din `docs/HANDOFF_SESIUNE.md` (blocul „De dus
> înapoi la Roland la începutul Fazei 4.5c") și din `docs/PLAN_FAZA4.5B_TRADUCERE_F8_2026-09-10.md` (P3, ÎNCHIS separat, la
> cererea lui Roland — motivul separării: „puse împreună, verdictul auditorilor devine tulbure").

## Scope

**P2** — generările mari din Teste (și, confirmat mai jos, **Școlare** — același cod) eșuează
intermitent prin epuizarea bugetului de timp al lanțului AI. Defect **LATENT**: nu se reproduce
determinist (auditorul din Faza 4 a obținut 3/3 reușite; cele 10 rulări live din acest plan — tot
3/3... 10/10 reușite). Nu se atinge pipeline-ul de traducere (F8) — acela s-a închis separat, în
Faza 4.5b.

## R-DIAG-AUTO — verificat înainte de plan (2026-09-10)

Interogat direct `logs` din Supabase (`tenders-ro`, `ywlykyyivthpsxfkdwzl`) pt `E-TEST-001` /
`E-NET-001`, tot ce a apărut după incidentul cunoscut (2026-09-09 19:36):

- **0 apariții** din 2026-09-09 19:37 până azi (ultimul log general: 2026-09-10 12:15, 179 alte
  evenimente între timp — aplicația e activă, log-ul funcționează, defectul pur și simplu n-a
  recidivat). Asta e o informație, nu o absență de verificare.
- Incidentul original: **două cicluri complete**, la ~1 minut distanță (19:35:05→19:35:12 și
  19:36:45→19:36:51), semnătură identică, temă „Radicali", clasa VII, dificultate „greu".
- `E-SCOL-001` (Școlare, același cod de eșec structural): **0 apariții** în toată istoria logului
  — Școlare nu a lovit încă zidul, dar codul care ar produce-o e identic cu Teste (vezi mai jos).

## Diagnostic de cod — CONFIRMAT, nu presupus

**Fișier:** `frontend/src/lib/chat-providers.ts`.

- `PROVIDER_TIMEOUT_MS = 40000` e default-ul pt **Chat** — NU guvernează Teste/Școlare (infirmă
  ipoteza din memoria de proiect care spunea „a fost ridicat la 40s"; verificat direct în cod, nu
  presupus).
- Teste (`TestePanel.tsx`) ȘI Școlare (`ScolarePanel.tsx`) trimit explicit
  `GENERATION_OPTS = { maxTokens: 16384, timeoutMs: 52000, budgetMs: 58000 }`, setat pe
  2026-08-20 (`git log` confirmă: nicio schimbare de atunci) — **R-EXT: același obiect, aceeași
  expunere, în ambele module.**
- `CHAIN` (gemini → gemini2 → groq → mistral → mistral2) e un **array unic**, partajat de Chat,
  Teste ȘI Școlare — orice schimbare de ordine/conținut acolo atinge toate trei.

**Mecanismul — ARITMETIC, nu statistic** (verificat de Roland pe cifrele din incident):

```
budget total         = 58000 ms
stepTimeout (pas 1)  = 52000 ms
────────────────────────────────
rămas pt restul lanțului = 58000 − 52000 = 6000 ms  (≈ 10.3% din buget)
```

Când gemini (primul pas) atinge propriul timeout de 52000ms, mai rămân ~6000ms din bugetul total
— insuficient matematic pt oricare dintre ceilalți 4 provideri, INDIFERENT dacă ei ar fi fost
rapizi sau nu. Verificat pe cifrele reale din log: `58000 − 52795 = 5205` → gemini2 tăiat la
`5988ms` (ciclul 1); `52747 + 5996 = 58743` (ciclul 2, se închide exact la buget). **Fixul nu
depinde de reproducerea eșecului — e o proprietate a celor două constante, valabilă de fiecare
dată când pasul 1 atinge timeout-ul.**

**Platformă — verificat în cod, nu presupus:**

- `frontend/src/app/api/proxy/route.ts:196`: `export const maxDuration = 60;` — asta guvernează
  ruta `/api/proxy` (Next.js App Router, proiectul **frontend**). Comentariul din cod confirmă:
  păstrat identic cu vechea rută Pages Router, intenționat.
- `vercel.json` (rădăcină, proiectul **API Python**): `functions."api/*.py".maxDuration: 300` —
  se aplică STRICT funcțiilor Python (`api/*.py`). **Nu are nicio legătură cu `/api/proxy`.**
- Zidul dur real: **60s**. `GENERATION_OPTS.budgetMs = 58000` e deja la 2000ms de el — „ridic doar
  bugetul total" nu mai e, practic, o opțiune (vezi Opțiunea A mai jos).

## Măsurători

### A) Istoric Supabase — 163 apeluri reale `/api/proxy?provider=*`, 2026-08-04 → azi

Nu se pot separa perfect pe apelant (Chat vs Teste vs Școlare — log-ul de succes nu duce
`context.flow`), dar se pot separa curat pe **eră** (înainte/după 2026-08-20, când a apărut
`GENERATION_OPTS`) și, pt eșecuri, pe **semnătura duratei** (timeout la ~40000ms = Chat, la
~52000ms = Teste/Școlare — cele două valori nu se suprapun).

Era curentă (post 2026-08-20, `GENERATION_OPTS` activ):

| Provider              | Rezultat | N     | p50     | p90     | max     | min     |
| --------------------- | -------- | ----- | ------- | ------- | ------- | ------- |
| gemini                | succes   | 39    | 21639ms | 41237ms | 51890ms | 1973ms  |
| gemini                | timeout  | 2     | 52771ms | 52790ms | 52795ms | 52747ms |
| gemini2               | timeout  | 2     | 5992ms  | 5995ms  | 5996ms  | 5988ms  |
| gemini2               | succes   | **0** | —       | —       | —       | —       |
| groq/mistral/mistral2 | orice    | **0** | —       | —       | —       | —       |

**Citire:** chiar și pe succese, gemini ajunge la `p90=41237ms` (79% din cap-ul de 52000) și
`max=51890ms` (99.8% din cap) — deci nu doar eșecurile ating limita, o parte semnificativă a
succeselor stă lipită de ea. gemini2, groq, mistral, mistral2 **n-au avut NICIODATĂ un succes
înregistrat** din 20.08 încoace la Teste/Școlare — nu pt că sunt proști, ci pt că bugetul nu-i
lasă niciodată să înceapă cu timp real.

### B) 10 rulări live — cazul exact al incidentului (Radicali, clasa VII, greu, 10 itemi, barem)

Reconstruit fidel din codul real (`buildSystemPrompt`, `buildGeneratePrompt`, `CHAIN`,
`GENERATION_OPTS`), rulat SECVENȚIAL contra producției, identic cu experiența Cristinei.
**Date brute, per rundă, per pas** (nu doar sinteza) în
`99_Roland_Work/Teste_Output/P2_masuratori_lant_teste_2026-09-10T12-55-23-227Z.json`.

10/10 succes pe Gemini Flash, prima încercare: `25050, 25884, 25986, 32862, 36106, 37277, 37655,
38584, 38593, 42961` ms → **p50=36106ms, p90=38593ms, max=42961ms, min=25050ms**.

**Cum se citește (cum a precizat Roland):** 10/10 succes NU infirmă defectul — aritmetica de mai
sus e valabilă indiferent de rezultat. Ce arată aceste cifre e altceva: pt exact acest caz greu,
Gemini stă _constant_ între 63% și 83% din cap-ul de 52000ms — nu e un caz ușor care rar atinge
timeout-ul, e un caz greu care trăiește aproape de el tot timpul. N-am mai forțat rulări
suplimentare ca să „prind" un eșec — ar fi consumat cotă degeaba, aritmetica nu are nevoie de el.

### C) Probă suplimentară — fallback-uri ACTIVE azi (gap de instrumentare umplut, nu presupus)

Modelele Groq/Mistral din istoricul Supabase (era veche) sunt RETRASE din 2026-09-07 (`llama-3.3-
70b`, `mistral-large` → înlocuite cu `gpt-oss-20b`, `mistral-small-latest`) — datele vechi nu
reprezintă configurația curentă. Probă directă, același prompt greu, fără trecere prin Gemini
(cotă separată). Date brute în
`99_Roland_Work/Teste_Output/P2_masuratori_fallback_2026-09-10T12-59-21-105Z.json`.

| Provider                    | Rezultat                                                                                                                                                                               |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Groq (gpt-oss-20b)          | 2/3 succes rapid (**3591ms, 4351ms**), a 3-a: **HTTP 429**, mesaj exact: _„Rate limit reached for model gpt-oss-20b … tokens per minute (TPM): Limit 8000, Used 7117, Requested 3949"_ |
| Mistral Small (ambele chei) | **6/6 = HTTP 429** „Rate limit exceeded" (cod 1300), instant (~400-500ms) — reconfirmat cu un test separat, minimal (20 tokeni), câteva minute mai târziu: **tot 429**                 |

**Descoperire NOUĂ, în afara scope-ului inițial al P2, de raportat, nu de ascuns:**

1. **Groq: plafon confirmat de 8000 TPM.** O SINGURĂ cerere grea (`max_tokens=16384`) poate
   epuiza aproape tot plafonul dintr-o mișcare — a doua cerere grea la scurt timp are șanse reale
   să pice, indiferent de orice fix de timeout.
2. ~~**Mistral (ambele chei) e indisponibil ACUM** — nu un vârf trecător de trafic.~~
   **⚠️ CORECTAT 2026-09-10, DUPĂ închiderea fazei — afirmația de mai sus NU se susține.**
   Catalogul central de chei (`~/.api-keys/catalog.md`) documentează pt Mistral free tier:
   „1 MILIARD tokens/luna, **2 req/min** — fara card". Sonda mea
   (`scratchpad/p2_measure_fallback_providers.mjs`) a tras **6 cereri în ~20 de secunde**, adică de
   câteva ori peste limita documentată — cele 6× 429 se explică integral prin limita pe care am
   încălcat-o EU, nu printr-un cont mort. Reconfirmarea „la distanță de minute" a fost UN SINGUR
   apel, iar cheile sunt partajate cu alte proiecte ale lui Roland (deci un alt proiect putea
   consuma exact atunci cele 2 req/min). **Concluzia corectă: NEDETERMINAT.** Retestarea onestă
   (apeluri spațiate la ≥30s, sub 2/min, pe fiecare cheie separat) e primul lucru din Faza 4.5d.
   Lecția: am tratat un plafon documentat ca pe un defect, fiindcă n-am citit catalogul înainte de
   sondă — exact tiparul „nu confrunta afirmația cu sursa" împotriva căruia are proiectul reguli.

**Consecință pt întrebarea lui Roland „câți provideri REALIST":** răspunsul are două straturi —
(a) _matematic_, prin realocare corectă, pot încăpea 2 încercări reale în cele 58s; (b) _practic,
azi_, doar Gemini + Gemini2 (aceeași infrastructură Google, chei separate) sunt sigur disponibile
pt cereri grele; Groq — ocazional (1 cerere grea/minut, cam); Mistral — deloc, momentan.

## Opțiuni (R2)

### A — Ridic doar bugetul total al lanțului

- **Pro:** schimbare de-o linie.
- **Contra:** practic epuizată — `budgetMs=58000` e deja la 96.7% din zidul dur de 60000ms
  (`maxDuration`, verificat în cod). A-l ridica peste ~58500ms riscă kill silențios de platformă
  (Vercel taie funcția, fără mesajul onest curent — mai rău, nu mai bine). Ar necesita și ridicarea
  `maxDuration` din route.ts — schimbare de platformă cu implicații mai largi (timp de așteptare
  Cristina >60s) și tot NU rezolvă inechitatea: un provider tot poate mânca tot bugetul nou.
- **[NU RECOMANDAT ca soluție de sine stătătoare]**

### B — Realoc timpul: plafonez PRIMUL provider, păstrez bugetul total (direcția semnalată de Roland)

- Scad `timeoutMs` al PRIMEI încercări (gemini) de la 52000 la o valoare care acoperă marea
  majoritate a succeselor grele reale — măsurat: max 42961ms/10 rulări live, p90 istoric
  41237ms — deci **undeva în jur de 42000-45000ms**, NU o tăiere agresivă gen 20-25s (ar sacrifica
  succese legitime confirmate în date, nu doar cazuri agățate).
- Păstrez `budgetMs=58000` (neschimbat — deja aproape de optim, vezi Opțiunea A).
- Rezultat: **~13000-16000ms garantate** pt restul lanțului, în loc de ~6000ms azi. Suficient pt
  UN fallback rapid dovedit (Groq: 3.6-4.3s măsurat), strâns dacă următorul pas e gemini2
  (probabil aceeași distribuție ca gemini, aceeași infrastructură — nu am date curate pe gemini2
  ca să confirm, vezi mai jos).
- **Pro:** singura opțiune care schimbă aritmetica reală (nu doar mută limita mai departe);
  rămâne sub zidul de platformă.
- **Contra:** sacrifică o coadă mică de succese Gemini legitime peste 42-45s (rar, dar existentă —
  1 din 41 succese istorice a fost la 51890ms); e un compromis explicit, nu gratuit.
- **LIMITĂ nouă, descoperită la măsurare:** realocarea garantează o ȘANSĂ reală la fallback, NU
  garantează SUCCESUL lui — Mistral e indisponibil azi, Groq are plafon ușor de atins la a doua
  cerere grea.
- **[RECOMANDAT]** — e singura opțiune care atacă aritmetica; restul (valoarea exactă a pragului,
  ordinea) sunt ajustări fine pe aceeași direcție.

### C — Complementară (NU alternativă): adaptez ordinea/lanțul pt calea GREA (Teste/Școlare)

- Ideea: pe calea `GENERATION_OPTS`, încearcă Groq înaintea lui gemini2 — Groq istoric mult mai
  rapid (3.6-4.3s vs distribuția lentă a lui Gemini), gemini2 fiind aceeași infrastructură/model
  ca gemini (candidat slab pt o fereastră scurtă rămasă).
- **Atenție R-EXT:** `CHAIN` e array UNIC, partajat Chat+Teste+Școlare. O reordonare directă a lui
  ar atinge și Chat. Ar trebui ori un array separat pt calea grea, ori un parametru de ordine în
  `SendChatOptions` — o schimbare de STRUCTURĂ, nu doar de constante.
- Nu am date live suficiente pe gemini2 (doar 2 mostre istorice, ambele tăiate artificial la 6s
  de designul actual — nu știu cât ar dura NATURAL) ca să argumentez ferm reordonarea.
- Complementar: reduc `max_tokens` cerut DOAR la încercările de fallback (nu la gemini) — Groq are
  8000 TPM, cere-i 16384 e risipă/risc; un fallback ar putea cere, de ex., 4096-8192 (un test
  generat de urgență, incomplet dar util, mai bine decât 429 garantat pe a doua încercare).
- **[RELEVANT — decizie a lui Roland dacă intră în scope-ul 4.5c sau se amână separat]**

## Cum se închide P2 (obligatoriu, per cererea lui Roland)

P2 rămâne **LATENT** — nu se reproduce determinist (10/10 reușite acum, dar aritmetica arată
defectul indiferent de rezultatul unei rulări). La închiderea fazei:

- **NU 🟢** pe baza rulărilor reușite din această măsurătoare sau din verificarea post-fix.
- **🟡 sincer**, cu textul explicit: „măsurat + calibrat + monitorizat" — pragul nou (constanta
  aleasă pt Opțiunea B) scris explicit în handoff/plan, cu motivul (aritmetica bugetului).
- Cod de eroare rămâne vizibil pe `/diagnostics` dacă reapare. **`E-NET-001` din
  `config/error_codes.json` are azi un `fix` STALE** — spune „ridică timeout-ul (făcut 20s→40s
  2026-08-20)", exact opusul recomandării de mai sus (Opțiunea B reduce, nu ridică, primul
  timeout). Se actualizează `cause`/`fix` pt `E-NET-001`, `E-TEST-001`, `E-SCOL-001` odată cu
  fixul, ca diagnosticul viitor să nu re-propună soluția infirmată azi.
- Descoperirea Mistral (429 persistent) intră în handoff ca problemă ADIACENTĂ deschisă, cu
  decizia lui Roland (mai jos) despre scope.

## De decis de Roland înainte de implementare

1. **Opțiunea B** ca direcție confirmată — și valoarea exactă a noului `timeoutMs` pt gemini
   (propunere: 42000-45000ms; Roland poate ajusta compromisul).
2. **Opțiunea C** (ordine adaptată pt calea grea) — da/nu acum, și dacă da: array separat sau
   parametru de ordine în `SendChatOptions`?
3. **Mistral 429 persistent** — se investighează acum (în 4.5c) sau se documentează separat
   (handoff) și se amână? (Nu e parte din P2 — e o disponibilitate de provider, descoperită
   colateral.)
4. **`max_tokens` redus la fallback** (Opțiunea C, complementară) — da/nu?

## Proces (identic 4.5a/4.5b — a funcționat de două ori)

1. Acest plan → **aștept confirmarea lui Roland**. Fără cod până atunci.
2. Baseline poartă ÎNAINTE de prima modificare (`tsc`/`jest`/`build`/`pytest`), consemnat în plan.
3. Implementare (doar `frontend/src/lib/chat-providers.ts` + `config/error_codes.json` +
   `frontend/src/lib/error-catalog.ts`, în funcție de deciziile de mai sus).
4. Dovadă LIVE pe producție per item (nu doar teste unitare) — inclusiv o rulare reală a cazului
   greu, cu constanta nouă, confirmată în Supabase.
5. `CACHE_VERSION` bump în `sw.js` (v74→v75) dacă se ating fișiere frontend servite din bundle
   (probabil da — `chat-providers.ts` e cod client). `translation-cache.ts` NEATINS (nu ține de F8).
6. Deploy: `vercel deploy --prod --yes` din folderul corect (`frontend/` pt frontend, rădăcină pt
   API) — fără `--cwd` (capcană cunoscută din memorie).
7. Cei trei auditori (`auditor-dovezi`, `auditor-regresie`, `auditor-cerinte`) — **inclusiv
   Școlare** explicit în checklist-ul lor (R-EXT: același cod, aceeași expunere), nu doar Teste.
8. Handoff + `Plan_in_Lucru.md` (🟡, nu 🟢) + memorie + commit/push.
9. **STOP** — o fază per sesiune (R-STOP-FAZA).

## Disciplină sub-agenți (dacă se folosesc forkuri la implementare)

Fiecare prompt de fork: „Commit/push e EXCLUSIV treaba coordonatorului. Dacă simți nevoia să
comiți, OPREȘTE-TE și raportează." Verificare `git log` după fiecare fork.

## Fișiere de probă — în scratchpad-ul PROIECTULUI (nu al sesiunii)

- `scratchpad/p2_measure_teste_chain.mjs` — simulare fidelă a lanțului (10 rulări)
- `scratchpad/p2_measure_fallback_providers.mjs` — probă directă Groq/Mistral/Mistral2
- Date brute: `99_Roland_Work/Teste_Output/P2_masuratori_lant_teste_*.json`,
  `99_Roland_Work/Teste_Output/P2_masuratori_fallback_*.json`

---

## §CONFIRMARE ROLAND (2026-09-10, în chat) — verificarea constrângerii + cele 4 decizii

**Roland a contestat premisa Opțiunii A** ("zidul real e 60s"), pe motiv că `maxDuration=60`
mărginește FIECARE apel `/api/proxy`, nu lanțul orchestrat. Cerut: verifică (a) unde se
orchestrează lanțul și cine ține bugetul; (b) dacă există un AbortController exterior care
plafonează tot lanțul la 60s.

**Verificat în cod, NU presupus — Roland avea dreptate, premisa inițială era greșită:**

- `sendChat` (`chat-providers.ts`) rulează CLIENT-SIDE — fișierul n-are `"use client"` propriu
  (nu are nevoie, nu e o componentă), dar e importat DOAR din componente marcate `"use client"`
  (`TestePanel.tsx`, `ScolarePanel.tsx`), deci se bundle-uiește și rulează în BROWSER-UL Cristinei.
- Fiecare `fetch('/api/proxy?provider=X')` e o invocare serverless SEPARATĂ. `maxDuration=60`
  mărginește FIECARE invocare în parte — nu suma lor. Bugetul total (`chainStart`, `Date.now()`,
  `AbortController` per pas) e stare JS ținută în TAB-UL browserului, fără nicio legătură cu
  `maxDuration`.
- Confirmare independentă: mesajul de eroare din incident, `"signal is aborted without reason"`,
  e textul EXACT al `DOMException` pe care browserul îl aruncă la `AbortController.abort()` fără
  argument — un kill de platformă (Vercel) ar fi produs altceva (504/conexiune resetată), nu asta.
  Sursa log-ului `"API | POST ..."` e `monitoring.ts`, marcat explicit „Client-side monitoring
  service" (`navigator`/`window`), deci și traseul de logare confirmă: totul rulează în browser.
- Concluzie: bugetul total NU are plafon de platformă — doar de UX (cât așteaptă Cristina).
  Exemplul lui Roland (gemini 45s + groq 4s + gemini2 40s, fiecare fetch individual sub 60s) e
  arhitectural valid.

**Cele 4 decizii confirmate de Roland, citate:**

1. „Opțiunea B — DA, prag gemini 45000ms... Dacă bugetul E ridicabil (varianta probabilă):
   B + buget ridicat la ~90000ms." → confirmat ridicabil → implementat: gemini 45000ms,
   `budgetMs` 110000 (acoperă gemini+groq+gemini2 ÎNTREG: 45000+15000+40000=100000, plus marjă).
   **`auditor-cerinte` a prins abaterea de cifră** (110000 vs „~90000" citat) — dus înapoi la
   Roland cu opțiuni explicite (110000 recomandat / ~92000 cifra lui exactă / altă valoare) →
   **a ales explicit „Păstrează 110000ms (Recomandat)"**, prin `AskUserQuestion`. Închis.
2. „Opțiunea C — DA, acum, dar NU prin mutarea array-ului CHAIN... reordonarea doar pentru calea
   de generare, transmisă ca opțiune per-apel, prin același mecanism prin care Teste trimite deja
   GENERATION_OPTS. Chat rămâne neatins." → implementat: `GENERATION_CHAIN` (array SEPARAT) +
   `SendChatOptions.chain` (opt-in), `CHAIN` (Chat) complet neatins — confirmat prin test dedicat.
3. „(A) scrie un test care... verifică că providerul următor primește ≥ Z ms reali — și care PICĂ
   dacă cineva readuce raportul de azi (52000/58000)." → implementat: `chat.test.ts`, describe
   „GENERATION_CHAIN · realocarea bugetului" — verificat EMPIRIC (nu presupus) că testul chiar
   pică pe constantele vechi: `git stash` pe `chat-providers.ts` → 4/18 teste pică, inclusiv
   exact contra-proba (`Expected: not 58000`) → `git stash pop` → 18/18 din nou.
4. „(B) Monitorizat trebuie să existe în cod... Loghează, pe calea de generare, ce provider a
   servit + durata + rezultatul." → implementat: `logGenerationResult` (`chat-providers.ts`),
   apelat la toate cele 8 puncte de apel `sendChat(..., GENERATION_OPTS)` din `TestePanel.tsx`
   (5) + `ScolarePanel.tsx` (3). Dovadă live pe producție (vezi §EXECUȚIE): rând real în
   Supabase `logs`, `teste.generate | provider=Gemini Flash | 30999ms | truncated=false`.
5. „(C) E-NET-001 din catalog — bine prins, corectează-l odată cu fixul... error-catalog.ts e
   GENERAT... schimbi sursa și regenerezi, nu editezi oglinda." → `config/error_codes.json`
   actualizat (E-NET-001, E-TEST-001, E-SCOL-001) + regenerat `error-catalog.ts` — generatorul
   lipsea fizic din `scratchpad/` (referit în header, nu exista) → recreat
   `scratchpad/gen-error-catalog.mjs`, verificat cu `error-catalog.test.ts` (anti-drift, PASS).

## §EXECUȚIE — ce s-a livrat efectiv (2026-09-10)

**Fișiere atinse:**

- `frontend/src/lib/chat-providers.ts` — `ProviderStep.timeoutMs` (opțional, per pas),
  `SendChatOptions.chain` (opțional), `GENERATION_CHAIN` (nou, array separat de `CHAIN`),
  `GENERATION_OPTS` (`budgetMs` 58000→110000, `chain: GENERATION_CHAIN`), bucla din `sendChat`
  folosește `opts.chain ?? CHAIN` și `step.timeoutMs ?? stepTimeout`, plus `logGenerationResult`
  (funcție nouă, import dinamic al `monitoring.ts` — nu atinge comportamentul testat al
  `sendChat` propriu-zis, deci testele vechi pe `CHAIN`/Chat rămân neschimbate).
- `frontend/src/components/teste/TestePanel.tsx` — `logGenerationResult` la toate cele 5 puncte
  de apel (`generate` inițial + continuare auto, `continueGenerate`, `correctText`,
  `continueCorrect`); (1c) fără `sample` la `teste.correct*` (lucrare elev).
- `frontend/src/components/scolare/ScolarePanel.tsx` — `logGenerationResult` la toate cele 3
  puncte de apel (`generate` inițial + continuare auto, `continueGenerate`).
- `frontend/src/lib/chat.test.ts` — 6 teste noi: arimetica live + contra-probă + neatingere CHAIN
  - ordine `GENERATION_CHAIN` + 2 teste `sendChat` cu `GENERATION_OPTS` (succes prim provider,
    fallback la Groq nu la gemini2).
- `config/error_codes.json` — `E-NET-001`/`E-TEST-001`/`E-SCOL-001` (cauza reală + fix-ul corect,
  nu „ridică timeout-ul").
- `frontend/src/lib/error-catalog.ts` — REGENERAT (nu editat manual) din JSON-ul de mai sus.
- `scratchpad/gen-error-catalog.mjs` — generatorul lipsă, recreat (era doar referit în comentariu).
- `frontend/public/sw.js` — `CACHE_VERSION` v74→v75.

**Poartă (ÎNAINTE de prima modificare, consemnat):** `tsc 0 · jest 438/438 (28 suite) · pytest
104/104` — identic cu închiderea 4.5b, nicio schimbare între timp (verificat explicit).

**Poartă (DUPĂ):** `tsc 0 · jest 444/444 (28 suite, +6) · build OK · pytest 104/104` — fără
regresie.

**Contra-probă rulată efectiv** (nu doar scrisă): `git stash` pe `chat-providers.ts` → jest
`4 failed, 14 passed` (din 18 din noul describe) — inclusiv linia exactă „Expected: not 58000" —
→ `git stash pop` → `18/18` din nou. Testul chiar prinde regresia, verificat empiric.

**Deploy:** `cd frontend && vercel deploy --prod --yes` — `traduceri-frontend.vercel.app`,
`readyState: READY`, aliasat. `sw.js` confirmat v75 pe producție (`curl` direct).

**Dovadă live pe producție (browser real, Claude in Chrome, profil de automatizare izolat):**
click real pe „Generează testul" în Teste, EXACT cazul greu (clasa VII, tema Radicali, greu, 10
itemi: 5 grilă+3 completare+2 probleme, cu barem) — succes, „Generat cu Gemini Flash.", conținut
LaTeX randat corect. Confirmat în Supabase `logs` (nu doar pe ecran):
`teste.generate | provider=Gemini Flash | 30999ms | truncated=false`, context structurat
`{ms, diff, flow, tema, clasa, provider, truncated}` — dovada că `logGenerationResult` scrie
REAL, nu doar compilează.

**NEATINS confirmat:** Mistral 429 persistent — NU investigat (era în afara scope-ului P2,
Roland nu l-a inclus în cele 4 decizii); rămâne problemă adiacentă deschisă pt handoff. Reducerea
`max_tokens` la fallback (Opțiunea C complementară din propunerea inițială) — NU implementată
(Roland n-a confirmat-o explicit, doar reordonarea prin `chain`).

**Închidere P2:** 🟡 — „măsurat + calibrat + monitorizat", NU 🟢. Pragurile noi sunt scrise
explicit mai sus; codurile de eroare (E-TEST-001/E-SCOL-001/E-NET-001) rămân vizibile pe
`/diagnostics` dacă defectul reapare, iar `logGenerationResult` face recidiva vizibilă direct în
Supabase, fără arheologie manuală.

## §ÎNCHIDERE FINALĂ (2026-09-10, după auditori)

Singura abatere găsită (`auditor-cerinte`, `budgetMs=110000` vs „~90000ms" citat de Roland) —
dusă înapoi la el cu 3 opțiuni explicite (110000 recomandat / ~92000 cifra lui exactă / altă
valoare, prin `AskUserQuestion`) → **a ales explicit „Păstrează 110000ms (Recomandat)"**. Codul
n-a necesitat nicio schimbare (era deja deployat corect); doar confirmarea lipsea. Fișier orfan
`:TEMP` găsit de `auditor-regresie` — șters. Commit `08de211` (branch `faza-g-editor`), push
confirmat. **FAZA 4.5c ÎNCHISĂ** — rămâne 🟡 CU BUNĂ ȘTIINȚĂ (defect latent, traseul de realocare
n-a fost exercitat live), nu din lipsă de confirmare.
