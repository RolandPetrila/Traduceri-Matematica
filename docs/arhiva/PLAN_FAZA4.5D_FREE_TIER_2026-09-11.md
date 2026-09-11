# PLAN FAZA 4.5d — trecere în siguranță pe free tier (chei Google, OCR, Chat, Groq)

> Stare: 🟢 IMPLEMENTAT + DEPLOYAT + verificat live. Roland a decis §1 (selector de tier, nu
> migrare globală), §1b (migrează și `GOOGLE_AI_API_KEY`), §4 (șterge CHAIN, cu înlocuire de
> teste) și §5 (Groq 6000). Context complet: `docs/OPTIUNI_API_AI_2026-09-10.html` + memoria
> `project_chei_api_si_free_tier_2026_09_11`. Cerința inițială: mesajul lui Roland din 2026-09-11
> care deschide Faza 4.5d.
>
> **§7 — CORECTAT (runda 3, verificat de Roland independent):** documentul suna ca și cum ar descrie
> o „sesiune paralelă" separată — GREȘIT. `docs/PLAN_FAZA4.5D_FREE_TIER_SIGURANTA_2026-09-11.md` a
> fost scris de ACEEAȘI sesiune coordonatoare care a deschis Faza 4.5d (a stat blocată pe un fork
> lansat inițial strict pt testul A/B OCR); acel fork a fost reluat extern (probabil de Roland, de
> la distanță) și a devenit acest commit (`ba08994`) — nu există o a doua sesiune. Coliziunea de
> nume era în capul fork-ului la momentul scrierii §7 original, nu în realitate. Documentul
> SIGURANTA rămâne comis ca înregistrare a analizei (testul A/B, diagnosticul RECITATION, diagnosticul
> bbox cu dovadă vizuală) — conține raționamentul care a produs fixurile de mai jos, absorbite aici.
> **Important, scris direct (cerut de Roland):** faza s-a închis fără ca Roland să confirme, ÎN
> CONVERSAȚIA COORDONATOARE, niciuna din întrebările din SIGURANTA — confirmarea a venit prin
> reluarea externă a fork-ului. Detalii: `docs/HANDOFF_SESIUNE.md`. Vezi §8 mai jos pt fixuri + dovadă live.

## §8 — Fixuri absorbite din planul paralel (RECITATION + scară bbox), confirmate de Roland

**RECITATION** (`api/lib/ocr_structured.py`): bucla `for model_name in MODELS` verifică acum
explicit, ÎNAINTE de a ieși din buclă ca succes, dacă `candidates[0].content.parts` există. Un
răspuns 200 cu `finishReason` non-`STOP`/`MAX_TOKENS` (RECITATION/SAFETY/PROHIBITED_CONTENT) și
`content: {}` e tratat ca tranzitoriu — cascadează la modelul următor, exact ca 429/5xx. La
epuizarea tuturor modelelor: fallback Mistral pe tier free (ca înainte), eroare vizibilă pe tier
plătit (consistent cu §2 — Mistral e free terț, incompatibil cu confidențialitatea lucrării unui
elev). **Dovadă live**: documentul real care bloca în testul A/B
(`1.0_Analyse CettaClear 2026_page1.png`) → `HTTP 200, status: success, 12 sections, title:
"Chemische Untersuchung von Produkt"` — script `scratchpad/verify_recitation_fix_2026-09-11.py`,
rulat pe `traduceri-api.vercel.app` după redeploy. 3 teste noi (`test_recitation_*`) în
`api/tests/test_ocr_structured_fallback.py`.

**Scară bbox** (`_validate_figures`, `ocr_structured.py`): per câmp (x/y/w/h independent), dacă
valoarea > 1.0, împarte la 1000 (constantă fixă — scala nativă Gemini de "grounding", nu
dimensiunea imaginii) ÎNAINTE de clamp-ul 0-1 existent, care rămâne ca plasă de siguranță finală.
**Dovadă**: test unitar reproduce EXACT valoarea de referință (551.0 → 0.551, identic cu bbox-ul
independent al lui 3.6-flash pe aceeași figură) — `test_bbox_y_on_native_1000_scale_is_normalized`

- 2 teste de contra-probă (valoare deja validă neatinsă; valoare absurdă tot cade pe clamp-ul
  final). NU exercitat live end-to-end (Lite nu e atins decât la eșecul lui 3.6-flash) — onest, ca
  Groq din §5: dovedit prin test + aritmetică, nu prin trafic real pe calea de fallback.

## §0 — Rezultatul testului A/B OCR (punctul 1, EXECUTAT)

`gemini-3.6-flash` vs `gemini-3.5-flash-lite`, 7 fișiere reale din `99_Roland_Work/Teste_Input/`,
14 apeluri directe (prompt+schema byte-identice cu `api/lib/ocr_structured.py`), cheie
`GOOGLE_AI_API_KEY_TRADUCERI_2` (proiect liber, neatins de producție). Rezultate brute:
`99_Roland_Work/Teste_Output/ocr_ab_2026-09-11/`. Script: `scratchpad/ocr_ab_test_2026-09-11.py`.

**Verdict: Lite PICĂ — nu devine model principal.**

1. **Bbox `y` NU e fracție 0-1, e pixel brut** — reprodus pe 2/2 fișiere cu figuri geometrice
   (`1.2_Unghiuri.Bisectoare.pdf`: `y=551.0` în loc de `0.551`; `20_test_page_1.jpeg`: 4/6 bbox-uri
   cu același defect). În producție, `ocr_structured.py` clampează bbox la `[0,1]` — figura s-ar
   decupa greșit/gol. Verificat vizual pe PNG-ul rasterizat, nu doar pe cifre.
2. **A corectat silențios un typo din sursă** (`"Lucare de control"` din PDF-ul original →
   `"Lucrare de control"` la Lite), încălcând regula 4 a prompt-ului ("preserve EXACT text").
   `gemini-3.6-flash` a transcris fidel typo-ul sursei.
3. Diacriticele RO sunt **egale și perfecte pe ambele modele** — nu asta desparte modelele.

**Rămâne model principal: `gemini-3.6-flash`** (deja primul în `MODELS` din `ocr_structured.py`,
neschimbat). Lite rămâne al doilea în lanțul de fallback existent (deja acolo, neschimbat).

**Descoperire colaterală (separat de A/B, relevantă pentru siguranța OCR):**
`gemini-3.6-flash` a întors `finishReason: RECITATION` (conținut GOL, HTTP 200) pe ambele PDF-uri
germane de laborator din setul de test — filtrul de copyright al Google, nu o eroare de rețea.
Lanțul de fallback din `ocr_structured.py` (liniile 133-183) **NU prinde acest caz**: bucla
`for model_name in MODELS` prinde doar `HTTPError`/excepții de rețea; un 200 cu `content: {}` iese
din buclă cu succes aparent, iar parsarea de mai jos (`data["candidates"][0]["content"]["parts"]`)
aruncă `KeyError` neprins de niciun fallback → pagina ar eșua pentru utilizator fără să încerce
Lite/Mistral. **Nu inclus în scope-ul Fazei 4.5d** (Roland nu l-a cerut) — semnalat aici ca
"Necesar pentru corectitudine" (R5), propun un punct separat, mic, dacă Roland vrea să-l trateze.

## §1 — CHESTIUNE CRITICĂ, de rezolvat ÎNAINTE de §2 (cod pt cheia plătită)

Citat exact: _"De ce există cheia plătită: ... Fluxul Teste → Corectare trimite poze cu teme de
copii."_ Punctul 2 cerut: _"Provider nou ... folosit doar de fluxul de corectare din
TestePanel.tsx (correctText)."_

**Verificat în cod, nu presupus** (`frontend/src/components/teste/TestePanel.tsx:533-577`):
fluxul e **poză → `/api/ocr` (Python, `GOOGLE_AI_API_KEY`, cheia FREE) → text → `correctText(text)`
→ `sendChat(..., GENERATION_OPTS)`**. `correctText` primește TEXT deja extras, nu poza.

**Consecință:** dacă rutez DOAR `correctText` pe cheia plătită (exact litera cererii), **poza
copilului tot trece prin OCR pe cheia FREE** — exact tier-ul pe care Google spune explicit că
"human reviewers may read, annotate, and process your API input and output". Motivul pt care ai
cerut cheia plătită (nicio poză de-a unui minor pe un tier citit de oameni) **nu s-ar atinge** —
doar corecția text→text ar fi protejată, nu poza însăși.

**DECIS de Roland: Opțiunea B (și poza, ȘI corecția, pe cheia plătită), cu o corecție a mea de
design.** Citat: _"`/api/ocr` e folosit de DOUĂ fluxuri... Lucrările elevilor (Teste → Corectare)
și documentele Cristinei (import în Editor)... ai nevoie de un selector de tier per cerere pe
`/api/ocr`, pe care doar calea de corectare îl setează. Altfel importurile Cristinei încep să
coste bani degeaba."_

**Design confirmat — selector de tier per cerere, NU migrare globală a OCR-ului:**

- `frontend/src/components/teste/TestePanel.tsx`, `onFile` (linia ~527): `FormData` primește un
  câmp nou, `fd.append("tier", "paid")` — DOAR pe această cale (poza elevului pt corectare).
  `frontend/src/components/editor/editor-import.tsx` (import Editor, documentele Cristinei) NU
  trimite acest câmp → rămâne implicit pe cheia free, fără nicio schimbare de comportament.
- `api/ocr.py`, `_parse_multipart`/handler-ul POST: citește câmpul `tier` din form-data (implicit
  `"free"` dacă lipsește) și îl trece mai departe la `_ocr_page` → `ocr_structured(...)`.
- `api/lib/ocr_structured.py`, `ocr_structured()`: parametru nou opțional, ex. `key_env: str =
"GOOGLE_AI_API_KEY"` — apelantul (`api/ocr.py`) trece `key_env="GOOGLE_AI_API_KEY_PAID"` DOAR
  când `tier == "paid"`. Restul funcției (prompt, schema, lanțul `MODELS`) neatins — doar sursa
  cheii se schimbă. `api/translate_text.py` (F8) nu trimite acest parametru → neatins, cum ai
  cerut explicit ("Nu atinge pipeline-ul de traducere F8").

## §1b — DESCOPERIRE NOUĂ la proiectare, nu era în cererea ta: `GOOGLE_AI_API_KEY` e o cheie SEPARATĂ

Verificat în cod (`grep` pe `api/`), nu presupus: backend-ul Python (`ocr_structured.py`,
`translate_text.py`) NU citește `GOOGLE_API_KEY`/`GOOGLE_API_KEY_2` (cele din §3, pt proxy-ul
JS/`route.ts`) — citește **`GOOGLE_AI_API_KEY`, un nume DIFERIT**, folosit de DOUĂ fluxuri simultan:
OCR (Editor import + Teste-corectare, înainte de selectorul de tier de mai sus) ȘI **traducerea F8
(RO→SK/EN/DE)**, fluxul central al Cristinei, pe care mi-ai cerut explicit să nu-l ating.

Mesajul tău original migra doar `GOOGLE_API_KEY`/`GOOGLE_API_KEY_2`/`GOOGLE_API_KEY_PAID` (cheile
proxy-ului JS) — nu menționează `GOOGLE_AI_API_KEY` deloc. Nu știu dacă asta a fost intenționat
(poate nu știai de această a doua cheie, complet separată) sau dacă ai vrut-o inclusă. Contează
mult: dacă `GOOGLE_AI_API_KEY` de pe Vercel e ÎNCĂ cheia veche (proiectul plătit "Traduceri", cea
descoperită rulând accidental producția), atunci **traducerea F8 rulează ACUM pe tier-ul plătit,
neconfidențial** — exact opusul „trecere pe free tier" pt un flux care NU e corectare de teme (deci
n-ar trebui să fie pe plătit din motive de confidențialitate, doar din inerție). Nu pot verifica
valoarea curentă din Vercel fără CLI (§3) — te întreb direct:

- **(Recomandat) Migrează și `GOOGLE_AI_API_KEY` ← `GOOGLE_AI_API_KEY` (proiectul free "Traduceri
  Matematica")** — a 4-a comandă în §3, același pattern pipe. Editor-import (OCR) și F8
  (traducere) trec amândouă pe free, coerent cu scopul întregii faze — F8 nu trimite date de
  minori, n-are nevoie de plătit, doar de cotă suficientă (1000 req/zi pe modelul principal).
- **Las-o neatinsă acum** — dacă preferi să verifici tu întâi ce valoare are azi în Vercel
  (`vercel env ls` după instalare CLI) înainte să decizi, sau dacă ai un motiv să n-o schimbi
  acum. Risc: dacă e încă pe cheia plătită, rămâne exact discrepanța pe care ai vrut s-o închizi.

Aștept răspunsul pe §1b înainte de cod — schimbă a câta variabilă se migrează în §3 și dacă
`ocr_structured.py` are nevoie de un al doilea env var nou (`GOOGLE_AI_API_KEY_PAID`, Python) sau
poate refolosi ce există deja.

## §2 — Provider nou `gemini_paid` (design, în așteptarea §1)

**`frontend/src/app/api/proxy/route.ts`** — adaugă în `PROVIDERS`:

```ts
gemini_paid: { url: GEMINI_URL, env: "GOOGLE_API_KEY_PAID", auth: "query" },
```

(reutilizează `GEMINI_URL` = `gemini-3.6-flash`, doar cheia/proiectul diferă — modelul e IDENTIC,
confirmat în memorie: "Free tier are ACELAȘI model... diferă doar plafoanele.")

**`frontend/src/lib/chat-providers.ts`** — lanț NOU, separat de `CHAIN` și `GENERATION_CHAIN`:

```ts
export const CORRECTION_CHAIN: ProviderStep[] = [
  {
    id: "gemini_paid",
    label: "Gemini Flash (plătit)",
    format: "gemini",
    timeoutMs: 45000,
  },
  {
    id: "gemini_paid",
    label: "Gemini Flash (plătit, retry)",
    format: "gemini",
    timeoutMs: 45000,
  },
];
export const CORRECTION_OPTS: SendChatOptions = {
  maxTokens: 16384,
  timeoutMs: 45000,
  budgetMs: 95000,
  chain: CORRECTION_CHAIN,
};
```

**Deliberat FĂRĂ Groq/Mistral în acest lanț** — ar trimite lucrarea elevului către alți procesatori
free (aceeași problemă de confidențialitate pe care cheia plătită trebuie s-o evite). Dacă
`gemini_paid` eșuează de 2 ori, corectarea eșuează vizibil (mesaj de eroare), nu cade silențios pe
un tier neconfidențial. Al doilea pas repetă `gemini_paid` (nu un provider diferit) — singura
rezervă compatibilă cu scopul de confidențialitate.

**`TestePanel.tsx`** — cele 2 apeluri din fluxul de corectare (nu generare) trec pe
`CORRECTION_OPTS`: linia 485 (`correctText`, corectarea inițială) și linia 609
(`teste.correct.continua`, continuarea conversației de corectare). Liniile 153/177/260
(`teste.generate*`) și cele 3 din `ScolarePanel.tsx` **RĂMÂN pe `GENERATION_OPTS`** (nu ating date
de elevi, R-EXT — nu modific pipeline-ul de bază).

## §3 — Migrare env vars Vercel (proiect `traduceri-frontend`)

Comenzile tale, neschimbate (valoarea curge prin pipe, linia de comandă are doar nume):

```
powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable('GOOGLE_AI_API_KEY','User')" | vercel env add GOOGLE_API_KEY production
powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable('GOOGLE_AI_API_KEY_TRADUCERI_2','User')" | vercel env add GOOGLE_API_KEY_2 production
powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable('GOOGLE_AI_API_KEY_TRADUCERI_PAID','User')" | vercel env add GOOGLE_API_KEY_PAID production
```

`vercel env rm <nume> production` întâi, dacă variabila există deja (`GOOGLE_API_KEY`/`_2` există,
`GOOGLE_API_KEY_PAID` e nouă). **Prerechizit constatat acum**: Vercel CLI NU e instalat în acest
mediu (`npm i -g vercel` întâi) — semnalat, nu e un blocaj, doar un pas în plus înainte de rulare.
Cod: NU se schimbă pt `GOOGLE_API_KEY`/`GOOGLE_API_KEY_2` (`route.ts` citește aceleași nume).

**În funcție de răspunsul tău la §1b**, se mai adaugă:

```
powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable('GOOGLE_AI_API_KEY','User')" | vercel env add GOOGLE_AI_API_KEY production
```

(migrează cheia Python de OCR+F8 pe proiectul free) și, pt selectorul de tier din §1, o variabilă
NOUĂ `GOOGLE_AI_API_KEY_PAID` (Python) cu valoarea din `GOOGLE_AI_API_KEY_TRADUCERI_PAID` — separată
de `GOOGLE_API_KEY_PAID` (JS) din motive de nume (Python citește alt nume de env var azi), deși
poate fi aceeași VALOARE de cheie.

## §4 — Eliminare Chat AI + întrebarea despre `CHAIN` orfan

**De șters:** intrarea `{"id":"asistent",...}` din `frontend/config/tabs.json` +
`frontend/src/components/chat/ChatPanel.tsx` + referința din `frontend/src/app/page.tsx`
(blocul `activeTab === "asistent"`, linia 114). **Verificat, sigur**: `page.tsx:64` deja
validează `activeTab` salvat în `localStorage` față de `TABS.some(t => t.id === saved)` — un
utilizator cu `"asistent"` vechi în localStorage cade automat pe `DEFAULT_TAB` ("editor"), fără
cod nou de migrare.

**DECIS de Roland: șterge-le** (R-MINIMAL), cu o condiție explicită: _"verifică după curățenie că
testele din 4.5c... încă păzesc ceva real... Testul 'CHAIN rămâne neatins' devine fără obiect
odată ce Chat dispare — înlocuiește-l, nu-l șterge pur și simplu."_

**Verificat în `frontend/src/lib/chat.test.ts` — 3 zone afectate, plan exact de înlocuire:**

1. **`describe("chat-providers · payloads")`, testul `"CHAIN = Gemini → Gemini2 → ..."` (liniile
   66-91)** — testează EXCLUSIV forma lui `CHAIN` (ordine/modele pt Chat). Fără obiect odată ce
   Chat dispare → **ȘTERS complet**, nu înlocuit (nu mai există ce să protejeze).
2. **`describe("sendChat · fallback + instrumentare")` (liniile 94-157)** — 4 teste care apelează
   `sendChat(q, "SYS")` FĂRĂ `chain` explicit, bazându-se pe default-ul `CHAIN`. Testează
   mecanismul GENERIC de fallback al `sendChat` (primul răspuns câștigă, sare peste eșec, colectează
   toate erorile) — valoare reală, ÎNCĂ necesară cât timp `GENERATION_CHAIN`/`CORRECTION_CHAIN`
   folosesc același mecanism. **PĂSTRATE, dar rescrise să treacă `chain` explicit** — propun un
   fixture local mic în test (`const TEST_CHAIN = GENERATION_CHAIN.slice(0, 2)` sau similar), ca
   testele să nu depindă de conținutul exact al `GENERATION_CHAIN`/`CORRECTION_CHAIN` de producție.
3. **Testul `"CHAIN (Chat) rămâne complet NEATINS..."` (linia 228 și continuarea)** — înlocuit cu
   un test care verifică EXACT ce a cerut Roland: `GENERATION_CHAIN` și `CORRECTION_CHAIN` nu se
   amestecă (id-uri disjuncte pe partea `gemini_paid` vs `gemini`/`gemini2`/`groq`/`mistral*`,
   plus `GENERATION_OPTS.chain !== CORRECTION_OPTS.chain`) — păstrează spiritul gărzii originale
   (2 lanțuri independente, nu unul care „scurge" în celălalt), mutat pe cele 2 lanțuri VII.

Nu ating aceste teste acum (fac parte din implementare, nu din plan) — le notez aici ca listă
exactă de modificat, ca faza de implementare să nu le descopere din mers.

## §5 — Groq: `max_tokens` redus pe pașii de fallback

**Cauza confirmată** (citat tu, corect): Groq are plafon **8000 TPM**; `GENERATION_OPTS`/
`CORRECTION_OPTS` cer uniform `maxTokens: 16384` pe TOATE pașii lanțului (`sendChat`, un singur
`maxTokens` pt tot lanțul) — de 2× plafonul Groq, deci 429 aproape garantat când Groq e atins.

**Fix necesar:** `ProviderStep` nu are azi un `maxTokens` propriu (are doar `timeoutMs` per pas,
de la Faza 4.5c) — trebuie adăugat, cu fallback la `maxTokens` global dacă pasul nu-l suprascrie.

**DECIS de Roland: 6000.** Confirmat: „6000 + ~1200 tokeni de prompt = 7200, sub plafonul de 8000
TPM, într-o singură cerere." Se aplică DOAR pasului `groq` din `GENERATION_CHAIN` (Gemini rămâne
la 16384 — cerința ta explicită "nu pentru Gemini").

**Risc rezidual semnalat de Roland, notat aici (nu rezolvat automat — decizi tu dacă și cum):**
_"auto-continuarea ar face un al doilea apel Groq în același minut și ar lovi iar plafonul."_
Verificat: `teste.generate.continue`/`scolare.generate.continua` (continuarea unei generări
trunchiate) refac un `sendChat(..., GENERATION_OPTS)` complet nou — dacă Gemini eșuează din nou
(ex. supraîncărcare persistentă câteva minute), acest al doilea apel ar cascada la Groq DIN NOU,
în aceeași fereastră de 60s ca primul (6000+6000=12000 tokeni ceruți în <60s, tot peste 8000 TPM,
chiar dacă fiecare cerere individuală respectă plafonul de 6000). Nu propun fix acum (ai cerut să
notez, nu să rezolv) — variante posibile de discutat la implementare: caz `maxTokens` mai mic pe
Groq DOAR pt pasul de continuare, sau sări peste Groq la a doua trecere prin lanț dacă a fost deja
folosit o dată recent. Fluxul de corectare (`CORRECTION_CHAIN`, §2) NU are Groq deloc — riscul nu
se aplică acolo.

## §6 — Ordinea de execuție propusă (după răspunsul tău pe §1b — restul e deja confirmat)

1. Poartă baseline (`tsc`/`jest`/`build`/`pytest`) ÎNAINTE de prima modificare — referință pt
   auditor-regresie.
2. §2 (`gemini_paid` + `CORRECTION_CHAIN`, cu selectorul de tier pe `/api/ocr` din §1/§1b) + §5
   (`ProviderStep.maxTokens`, Groq 6000) + §4 (teste înlocuite, cele 3 zone identificate) — ating
   `chat-providers.ts`/`route.ts`/`api/ocr.py`/`api/lib/ocr_structured.py`/`chat.test.ts` împreună,
   fiindcă se ating reciproc (`ProviderStep` capătă `maxTokens` ȘI dispare `CHAIN` în același loc).
3. §3 (migrare env vars, inclusiv a 4-a variabilă dacă răspunzi Recomandat la §1b) — DOAR după ce
   pasul 2 e testat cu cheile vechi, ca să nu combin cod nou + variabile noi simultan. Verificare
   live: o corectare reală pe `traduceri-frontend.vercel.app`, confirmată cu `provider=gemini_paid`
   în `logGenerationResult`/Supabase, ȘI un import Editor obișnuit (dovadă că tier-ul free n-a fost
   afectat).
4. Eliminare Chat (partea din §4 independentă de teste) — independent, oricând, risc minim.
5. `CACHE_VERSION` bump în `sw.js` → `vercel deploy --prod --yes` (fără `--cwd`, din
   `frontend/`) → dovadă live per item → cei trei auditori (Școlare explicit pe listă, deși
   neatinsă direct) → handoff + `Plan_in_Lucru.md` + memorie + commit/push → STOP (o fază/sesiune).

## Ce NU se atinge (confirmat din cererea ta)

Generatorul offline de teste (backlog) · pipeline-ul de traducere F8 · bugetul lanțului peste
110000ms (neatins, `GENERATION_OPTS`/`CORRECTION_OPTS` sunt entități separate).
