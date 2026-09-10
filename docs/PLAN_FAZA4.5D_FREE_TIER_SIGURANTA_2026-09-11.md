# PLAN FAZA 4.5d — Trecere în siguranță pe free tier (chei dedicate + provider plătit corectare + Chat eliminat + Groq)

> **🔴 ABSORBIT — NU mai e documentul activ. CORECȚIE (nu „sesiune paralelă" — propriul fork al
> acestei sesiuni).** Un fork lansat de sesiunea asta pt testul A/B OCR (strict scope: „NU implementa
> nimic din codul sursă"), a fost RELUAT ulterior (probabil direct de Roland, la distanță — sesiunea
> curentă n-a văzut acel schimb) cu scope extins la toată Faza 4.5d. Confirmat prin
> `Claude-Session: session_01JhN32vRThSWeBWB71rovra` pe commit-ul `ba08994` — exact ID-ul acestei
> sesiuni, nu al unei sesiuni separate (`traduceri-matematica-b0` era doar o sesiune idle de-a lui
> Roland, neimplicată — atribuire greșită într-o notă anterioară, corectată aici). Rezultat:
> **IMPLEMENTAT + COMMIT + PUSH + DEPLOY live** (`ba08994`, 2026-09-11 02:06), inclusiv cele două
> descoperiri de aici (fix `RECITATION` + fix scară bbox ÷1000). Document canonic acum:
> `docs/PLAN_FAZA4.5D_FREE_TIER_2026-09-11.md`. Nu implementa nimic din documentul de față —
> verificarea/analiza rămâne validă și citată acolo (§7/§8), dar codul e deja scris, testat și
> deployat. Sesiunea curentă (turul principal, nu fork-ul) nu a atins niciun fișier de cod.
>
> **Rămân neconfirmate din propunerile de mai jos** (fork-ul le-a lăsat deschise, nu le-a implementat):
> mesajul de cotă OCR îmbunătățit (secțiunea „Capacitate OCR") și propunerea de split 4.5d/4.5e —
> fork-ul a implementat totul unificat, fără split.
>
> **Rolul documentului acum (decizia lui Roland, 2026-09-11): rămâne, comis explicit, ca
> înregistrare a analizei** — conține raționamentul (testul A/B, diagnosticul bbox cu dovadă
> aritmetică+vizuală, diagnosticul RECITATION) care a PRODUS deciziile deja livrate în
> `PLAN_FAZA4.5D_FREE_TIER_2026-09-11.md`. NU e un document „mort" — secțiunea „Capacitate OCR" de
> mai jos conține concluzia finală (cerută de Roland) + o propunere de mesaj de cotă, ambele încă
> deschise pt confirmare.
>
> **Corecție de proces, scrisă direct, nu îmbrăcată (cerută de Roland):** faza s-a închis FĂRĂ
> confirmarea lui pe niciuna din cele trei întrebări din runda anterioară a acestui document (fixul
> de bbox, migrarea `traduceri-api`, split-ul propus) — via reluarea externă a fork-ului, nu prin
> răspunsul lui în conversația coordonatoare. Codul livrat nimerește exact opțiunile pe care Roland
> le-ar fi ales, dar asta e confirmat A POSTERIORI (verificare independentă de el, cod+poartă+teste),
> nu procesul „fără cod până nu confirm" pe care el însuși l-a stabilit. Detalii complete:
> `docs/HANDOFF_SESIUNE.md`.

> **Stare originală (istoric, sub această notă e depășită): 🟡 ÎN LUCRU — runda 2.**
> Context complet (tabele, tarife, limite măsurate): `docs/OPTIUNI_API_AI_2026-09-10.html`.
> Decizii + ce s-a executat deja (3 chei create, billing dezactivat, chei expuse șterse):
> memoria `project_chei_api_si_free_tier_2026_09_11`.
> Regulă de proces (identică 4.5a/b/c): R-DIAG-AUTO → măsurători → plan cu opțiuni R2 → **STOP, fără
> cod până Roland nu confirmă fiecare punct** → abia apoi implementare.

## R-DIAG-AUTO (făcut la start, 2026-09-11)

Supabase `logs`, ultimele 72h: **zero ERROR/WARN.** Fix-ul Faza 4.5c e curat de la deploy. Traficul
real de generare arată doar pasul `gemini` (primul din `GENERATION_CHAIN`) servind cereri — traseul
de fallback (Groq/gemini2/Mistral) tot nu a fost exercitat live, ca și înainte.

Infrastructură verificată în cod, nu presupusă: cele 3 chei (`GOOGLE_AI_API_KEY`,
`_TRADUCERI_2`, `_TRADUCERI_PAID`) SET în env vars (lungime 53 = auth), Vercel CLI instalat local
(v59.11.7 — contrar mesajului de sesiune), două proiecte Vercel separate confirmate (`traduceri-api`
= `api/`, `traduceri-frontend` = `frontend/`).

---

## PUNCTUL 1 — Testul A/B OCR (`gemini-3.6-flash` vs `gemini-3.5-flash-lite`) — ÎNCHIS

**Metodă:** prompt + schema JSON byte-identice cu `api/lib/ocr_structured.py:57-104`, apelate direct
(nu prin lanțul de producție, ca să testăm fiecare model izolat), cheie `GOOGLE_AI_API_KEY_TRADUCERI_2`
(proiect liber, neatins de producție). 14 apeluri (7 fișiere reale din `99_Roland_Work/Teste_Input/` ×
2 modele), pacing 15s, 7 din 20 cote zilnice pe 3.6-flash consumate. Rezultate brute + PNG-uri
rasterizate: `99_Roland_Work/Teste_Output/ocr_ab_2026-09-11/`. Script: `scratchpad/ocr_ab_test_2026-09-11.py`.

**Tabel comparativ** (verificat direct în JSON-urile brute de sesiunea principală, nu doar raportat):

| Fișier                                   | `gemini-3.6-flash`                                                                                       | `gemini-3.5-flash-lite`                                                                                                                           |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0/1.1 Analize laborator (PDF, tabele)  | **EȘUAT** — `finishReason: RECITATION`, `content: {}` (filtru copyright Google)                          | OK — tabel complet, diacritice germane corecte                                                                                                    |
| 1.2 Unghiuri.Bisectoare (PDF, geometrie) | OK — bbox `{x:0.392,y:0.551,w:0.273,h:0.103}` plauzibil · titlu fidel sursei (inclusiv typo-ul original) | bbox **`y: 551.0`** — pixel brut, NU fracție 0-1 (confirmat direct în JSON) · a corectat silențios typo-ul sursei (încalcă regula 4 a promptului) |
| 20_test_page_1 (JPEG, 6 figuri)          | 6/6 bbox valide                                                                                          | **4/6 bbox cu `y` ca pixel brut** — defect reprodus pe al doilea fișier                                                                           |
| 2.1 romana.png (diacritice)              | Diacritice perfecte, titlu corect, ierarhie heading corectă                                              | Diacritice perfecte (egalitate) · titlu greșit (etichetă UI generică) · heading aplatizat                                                         |
| IMG-20250914-WA0001 (poză telefon)       | OK (1 retry, 503 tranzitoriu) — 32 formule                                                               | OK — 24 formule, `\dfrac` (echivalent)                                                                                                            |
| limite_matematica.jpeg                   | OK — 9/9 limite                                                                                          | OK — 9/9 limite, identice                                                                                                                         |

**Verdict: Lite PICĂ — nu se comută.** Motiv, pe dovadă nu impresie: bbox `y` neconform fracției
0-1, reprodus pe 2 din 2 fișiere cu figuri geometrice. În producție (`ocr_structured.py:214-216`)
acest lucru s-ar clampa automat la `1.0` → figura decupată (crop bbox, R-MATH) ar ieși complet
greșit poziționată/goală, exact pe conținutul central pt Cristina. Diacriticele — întrebarea ta
centrală — sunt egale pe ambele modele, deci NU ele despart modelele.

**Decizie aplicată:** `MODELS = ["gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash"]`
din `ocr_structured.py:130` **rămâne neschimbată** — 3.6-flash primar, lite doar fallback (cum e azi).

**Rămâne deschisă (nu era în scope-ul testului, dar decurge direct din el):** cota de 20/zi pe
3.6-flash tot există și tot e reală pt PDF-uri multi-pagină — testul confirmă doar că NU putem
rezolva asta trecând pe lite ca prim model. Opțiuni pt sesiunea viitoare, dacă vrei să le discutăm
separat (nu le implementez acum, doar le numesc): (a) accept status-quo — Mistral OCR + Azure
Document Intelligence (500 pagini/lună × 2 chei, nefolosite azi) sunt deja rezerve în cod pt cazul
în care cota zilnică se epuizează; (b) altceva, la alegerea ta.

**Descoperire colaterală, defect REAL în producție azi, separat de întrebarea A/B:**
`ocr_structured.py`, bucla `for model_name in MODELS` (liniile 133-183) prinde `HTTPError` și
`Exception` — dar un răspuns `RECITATION` vine cu **HTTP 200** (`urlopen` reușește, niciun exception
în buclă → `break` la linia 147, tratat ca succes). Parsarea de la linia 189
(`data["candidates"][0]["content"]["parts"][0]["text"]`) explodează OUTSIDE buclă, pe un `content: {}`
fără `parts` — nicio cascadă spre `gemini-3.5-flash-lite`, pagina eșuează direct pt utilizator.
Confirmat live cu ambele PDF-uri de laborator (documente reale, nu artificiale) — deci orice document
al Cristinei care atinge filtrul de copyright al Google azi produce o eroare dură, nu un fallback.
**Decizie (Roland):** intră în Faza 4.5d, nu separat. Fix propus: tratează `finishReason`
non-`STOP`/`MAX_TOKENS` (inclusiv `RECITATION`, `SAFETY`, `PROHIBITED_CONTENT`) ca tranzitoriu →
cascadează la modelul următor, exact ca la 429/5xx — verificare explicită `candidates[0].get("content",
{}).get("parts")` înainte de indexare, nu doar try/except pe `KeyError` (mai clar la citire + nu
maschează alte bug-uri de parsare).

---

## URMĂRIRE — cota Lite pe lanțul de OCR (deschisă la punctul 1, evaluată acum)

Roland: „Lite e AL DOILEA în lanțul de OCR. Verdictul «nu comutăm» nu închide problema: când
3.6-flash își epuizează cele 20/zi, lanțul cade automat pe modelul cu bbox-uri stricate — tăcut,
pt Cristina."

**Confirmat, e exact ce se întâmplă azi** — `MODELS = ["gemini-3.6-flash", "gemini-3.5-flash-lite",
"gemini-2.5-flash"]` (`ocr_structured.py:130`), fallback automat pe 429 (cotă epuizată). Fără fix,
al doilea model din lanțul de siguranță e chiar cel cu bug-ul de bbox.

### Fixul propus de Roland — EVALUAT, TESTAT, verdict: mecanismul propus nu funcționează, dar am găsit unul care funcționează

**Propunerea ta:** dacă vreo valoare x/y/w/h > 1.0, tratează ÎNTREGUL bbox ca pixeli, împarte la
dimensiunile paginii, în `figure_crop.py` (linia 104 documentează formatul, liniile 130-133 fac
clamp-ul azi).

**Am citit `figure_crop.py` integral și am testat propunerea pe datele reale ale defectului.
Verdict: NU funcționează, din DOUĂ motive independente, ambele verificate, nu presupuse:**

**1. Locația greșită — datele sunt deja distruse înainte să ajungă acolo.** `figure_crop.py` nu e
primul loc unde bbox-ul e clampat. `ocr_structured.py:207-229` (`_validate_figures`) rulează ÎNAINTEA
lui, chiar la returnarea din `ocr_structured()`, și clampează DEJA `y: 551.0 → 1.0` — ireversibil,
valoarea originală (551.0) se pierde. Confirmat și traseul de apel: `api/ocr.py:69-74` cheamă
`ocr_structured()` (clamp aplicat) ÎNAINTE de `api/ocr.py:206`, care abia apoi cheamă
`embed_crops_in_sections()` din `figure_crop.py` — pe bbox-ul deja clampat la 1.0. Orice fix pus
DOAR în `figure_crop.py` ar primi mereu `y: 1.0`, niciodată `551.0` — nu are ce normaliza.

**2. Mecanismul greșit — nu sunt pixeli ai paginii, sunt coordonate pe scala nativă 0-1000 a Gemini.**
Am catalogat programatic toate cele 14 răspunsuri din testul A/B (`scratchpad/bbox_scale_check.py`):
**exact 5 valori** ies din intervalul 0-1, **toate `y`, niciodată x/w/h** — deci corupția NU e „tot
bbox-ul e în pixeli" (asta ar strica și x/w/h, care sunt corecte). Împărțite la 1000 (nu la
dimensiunea paginii în pixeli), toate 5 devin fracții plauzibile:

| Fișier                    | `y` brut | ÷1000     | `y` de referință (`3.6-flash`, aceeași figură) |
| ------------------------- | -------- | --------- | ---------------------------------------------- |
| 1.2_Unghiuri (fig. unică) | 551.0    | **0.551** | **0.551 — potrivire EXACTĂ**                   |
| 20_test_page_1 fig.3      | 651.0    | 0.651     | 0.63                                           |
| 20_test_page_1 fig.4      | 648.0    | 0.648     | 0.63                                           |
| 20_test_page_1 fig.5      | 751.0    | 0.751     | 0.74                                           |
| 20_test_page_1 fig.6      | 748.0    | 0.748     | 0.74                                           |

(Împărțit la dimensiunea reală a paginii în pixeli — 1584px pt PDF, 2048px pt JPEG — rezultatul ar
fi 0.318, complet nepotrivit cu 0.63. Am verificat asta primul, e ce m-a condus la ÷1000: Gemini are
o convenție internă documentată de bounding-box pe scală 0-1000, folosită de „grounding"/detecție
obiecte — Lite pare să revină la ea pe coordonata `y`, ignorând instrucțiunea explicită din prompt
de fracție 0.0-1.0.)

**Verificare vizuală, nu doar aritmetică** (cerința ta explicită): am rulat `crop_figure()` din
`figure_crop.py` pe pagina reală (`1.2_Unghiuri...page1.png`) cu bbox-ul Lite BRUT (`y:551.0`) și cu
bbox-ul CORECTAT (`y:0.551`), plus referința `3.6-flash` (`y:0.551` independent).

- BRUT: clamp la `y:1.0` → regiune de 8px la marginea paginii → „Bbox too small" → placeholder gol.
  Exact eșecul tăcut pe care l-ai semnalat.
- CORECTAT (÷1000): crop 301×172px, **vizual identic** cu crop-ul din bbox-ul independent al lui
  `3.6-flash` — ambele arată corect figura „unghiuri coliniare în jurul punctului O". Confirmat direct
  (am comparat cele două PNG-uri, nu doar dimensiunile).
- Script + imagini: `scratchpad/bbox_fix_verify.py`,
  `99_Roland_Work/Teste_Output/ocr_ab_2026-09-11/crop_*.png`.

### Fix propus (înlocuiește propunerea inițială, nu-l implementez fără confirmarea ta)

În `ocr_structured.py:_validate_figures` (liniile 207-229), ÎNAINTE de clamp-ul 0-1 existent:
per câmp (nu tot bbox-ul deodată), dacă valoarea > 1.0, împarte la 1000 (constantă fixă — scala
nativă Gemini, nu dimensiunea imaginii, care nici nu e disponibilă în acest punct al codului fără
s-o transmit suplimentar). Clamp-ul 0-1 existent rămâne ca ultimă plasă de siguranță (pt orice altă
anomalie, nu doar scala 0-1000).

**Beneficiu dublu, exact cum ai anticipat:** dacă asta ține și pe alte fișiere (nu doar cele 2
testate), lanțul de fallback OCR redevine sigur ȘI recuperăm cele 500 cereri/zi ale lui Lite ca
plasă de siguranță reală, nu una care produce figuri goale.

**Confirmă înainte să scriu codul propriu-zis:** ești de acord cu locația nouă
(`ocr_structured.py`, nu `figure_crop.py`) și mecanismul nou (÷1000 per câmp, nu ÷dimensiune pagină
pe tot bbox-ul)? Diferă de ce ai scris tu, dar am dovada (aritmetică + vizuală) că varianta ta
literală n-ar fi funcționat.

---

## PUNCTUL 2 — Provider plătit pt corectare — GOL GĂSIT înainte de a scrie codul

Cererea ta: „provider nou în `/api/proxy` ... folosit doar de fluxul de corectare din
`TestePanel.tsx` (`correctText`)". Am verificat traseul complet al datelor unui elev, nu doar funcția
numită — și `correctText` e DOAR jumătate din traseu.

**Ce am găsit, verificat în cod:**

`TestePanel.tsx` are DOUĂ etape separate pt lucrarea unui elev:

1. **`onFile`** (linia 527) — trimite POZA lucrării la `/api/ocr` (proiectul **`traduceri-api`**,
   Python) → `api/lib/ocr_structured.py:39`, care citește azi `GOOGLE_AI_API_KEY` **direct, fără nicio
   opțiune de tier**. Rulează pe alt proiect Vercel decât `/api/proxy`.
2. **`correctText`** (linia 485) + **`continueCorrect`** (linia 609, continuă ACEEAȘI conversație,
   `history` include textul original al elevului) — trimit TEXTUL deja OCR-uit la `sendChat(...,
GENERATION_OPTS)`, pe **`traduceri-frontend`**.

Dacă implementez EXACT ce ai cerut (doar `correctText` pe cheia plătită), **poza propriu-zisă a
temei copilului tot trece prin tier-ul free/human-reviewed la pasul 1 (OCR)** — exact ce voiai să
eviți. Și `continueCorrect` (linia 609) NU e menționat explicit de tine, dar duce mai departe
ACELAȘI text de elev — dacă rămâne pe `GENERATION_OPTS` normal, jumătate din conversația de
corectare ar fi pe plătit și jumătate pe free, inconsistent.

### Opțiuni

**A — Plătit end-to-end pe tot traseul elevului (Recomandat)** — cheia plătită acoperă și OCR-ul
pozei (pas 1), și `correctText`+`continueCorrect` (pas 2).

- Pro: onorează literal motivul deciziei tale („datele minorilor", nu doar jumătate din ele).
- Contra: mai mult cod — `/api/ocr` (Python, `traduceri-api`) are nevoie de o cale să aleagă cheia
  plătită DOAR pt acest apel (parametru nou, ex. `tier=paid` din `onFile`, propagat până în
  `ocr_structured.py`) — `ocr_structured.py` azi n-are NICIUN mecanism de selecție tier (verificat,
  `engine` alege doar azure/gemini).
- Limite: `GOOGLE_AI_API_KEY_TRADUCERI_PAID` trebuie prezentă și pe `traduceri-api` (env var nou
  acolo), nu doar pe `traduceri-frontend`.

**B — Plătit doar pe `correctText`+`continueCorrect`, exact cum ai scris** — OCR-ul pozei rămâne pe
cheia free (OCR generic, nu doar cel al elevului).

- Pro: mai puțin cod, mai aproape de mesajul tău original.
- Contra: **nu rezolvă motivul pt care ai vrut cheia plătită** — poza (materialul sensibil propriu-zis)
  tot trece prin human-review. Textul corectat fără poza care l-a generat e o protecție parțială.
- [NU RECOMANDAT] dacă scopul e chiar confidențialitatea datelor minorilor, nu doar a rezultatului.

**C — Plătit doar pe `correctText`, `continueCorrect` rămâne pe free** — varianta ta literală,
fără să ating linia 609.

- [NU RECOMANDAT] — `continueCorrect` duce mai departe ACELAȘI text de elev din `history`; a-l lăsa
  pe free ar însemna jumătate din corectarea aceleiași lucrări trece prin tier-uri diferite, fără
  niciun motiv funcțional, doar pt că funcția are alt nume.

**Implementare tehnică comună (indiferent de opțiune A/B/C), dacă alegi să atingi `/api/proxy`:**
adaug `gemini_paid: { url: GEMINI_URL, env: "GOOGLE_API_KEY_PAID", auth: "query" }` în `PROVIDERS`
(`route.ts:36-80`) + un `ProviderStep` nou + un lanț dedicat (NU `GENERATION_CHAIN` — dacă paidul
eșuează, NU cade pe free automat, altfel garanția de confidențialitate dispare silențios la primul
timeout). Fallback în interiorul plătitului: doar între chei/proiecte plătite, dacă there's vreuna,
altfel eroare clară către Cristina/elev ("încearcă din nou", nu o scurgere tăcută spre free).

**Decizie (Roland): Opțiunea A, cu o precizare care schimbă implementarea.** `/api/ocr` e folosit de
DOUĂ fluxuri, nu unul — verificat, corect: (1) Teste → Corectare (`TestePanel.tsx:onFile`, poza
lucrării elevului) ȘI (2) import în Editor (documentele Cristinei — fișe de matematică, conținut
neutru, trebuie să RĂMÂNĂ gratuit). Deci nu se mută tot OCR-ul pe plătit — `/api/ocr` are nevoie de
un **selector de tier per cerere**, pe care DOAR calea de corectare îl setează.

**Implementare rezultată:** `api/ocr.py` primește un parametru nou (`tier`, din form-data, alături
de `source_lang`/`engine`, citit la linia ~156/260 unde se citesc parametrii curenți) → propagat în
`ocr_structured(..., api_key_env="GOOGLE_AI_API_KEY" | "GOOGLE_AI_API_KEY_PAID")` (azi hardcodat la
linia 39). `TestePanel.tsx:onFile` (linia 527-544) adaugă `fd.append("tier", "paid")` — SINGURUL
apelant care o face; importul din Editor (`editor-import.tsx`) nu trimite parametrul → rămâne pe
cheia free implicită.

---

## PUNCTUL 3 — Migrare env vars Vercel — GOL GĂSIT: cheia de OCR nu e în lista ta

Cererea ta acoperă 3 env vars pe **`traduceri-frontend`**: `GOOGLE_API_KEY`, `GOOGLE_API_KEY_2`,
`GOOGLE_API_KEY_PAID` (nou). Verificat cu `vercel env ls production` (doar nume, fără valori):

- `traduceri-frontend`: are azi `GOOGLE_API_KEY` + `GOOGLE_API_KEY_2`, ambele setate acum 64 zile.
- `traduceri-api`: are azi `GOOGLE_AI_API_KEY` (nume DIFERIT, proiect DIFERIT), tot 64 zile — **asta
  e cheia pe care o citește `ocr_structured.py:39`, deci tot OCR-ul de azi.**

64 de zile = dinainte de descoperirea din memorie („producția rula pe cheia de facturare" —
Faza 4.5d, secțiunea de descoperiri). E foarte probabil ca **`traduceri-api`/`GOOGLE_AI_API_KEY` să
fie TOT cheia veche plătită** — nu pot confirma fără să citesc valoarea (R-SEC, nu fac asta), dar
lista ta de migrare, așa cum e scrisă, **nu o atinge deloc**. Dacă o las neschimbată, OCR-ul
(inclusiv pagini neutre de manual) continuă să coste bani pe cardul tău, indiferent ce facem la
punctele 2 și 3.

### Opțiune propusă (nu e cu adevărat un A/B — e un pas lipsă, nu o alegere de design)

Adaug la lista ta un al 4-lea transfer, pe proiectul **`traduceri-api`**, nu `traduceri-frontend`:

```
# traduceri-api (Python OCR) — completare, nu în lista ta originală
powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable('GOOGLE_AI_API_KEY','User')" | vercel env add GOOGLE_AI_API_KEY production
```

(rulat din rădăcina proiectului, unde e `.vercel/` legat de `traduceri-api` — NU din `frontend/`).
Dacă alegi Opțiunea A la punctul 2 (plătit pe tot traseul elevului), `traduceri-api` are nevoie și de
un `GOOGLE_AI_API_KEY_PAID` propriu, separat.

Restul migrării (cele 3 vars pe `traduceri-frontend`, cu `vercel env rm` înainte dacă hei var
există deja) rămâne exact cum ai scris — cod neschimbat pt `GOOGLE_API_KEY`/`_2`, `route.ts` citește
aceleași nume.

**Confirmă:** vrei și completarea de mai sus (migrare `traduceri-api`), sau ai alt motiv să lași
`GOOGLE_AI_API_KEY` neatins pe care nu-l cunosc?

---

## PUNCTUL 4 — Eliminare Chat AI

Verificat: `CHAIN`/`PROVIDER_TIMEOUT_MS`/`CHAIN_BUDGET_MS` din `chat-providers.ts` au un singur
apelant real de producție — `ChatPanel.tsx` (prin `sendChat(messages, system)` fără `chain` explicit
→ default intern `CHAIN`). Un grep pe „CHAIN" mai apare în `verify-fisa.ts` (constantă LOCALĂ,
coliziune de nume, string de caractere pt verificare matematică — NU are nicio legătură cu
chat-providers) și în `error-catalog.ts` (doar text descriptiv în mesaje de eroare) — confirmate
neрелevante, nu le ating.

De șters: `config/tabs.json` **ȘI** `frontend/config/tabs.json` (există DOUĂ copii identice, ambele
cu intrarea `"asistent"` — trebuie șterse din amândouă, altfel una rămâne stale) + `ChatPanel.tsx`

- referințele din `page.tsx`, `CommandPalette.tsx`, `chat-context.ts`.

### Opțiuni pt constantele orfane (întrebarea ta explicită)

**A — Las `CHAIN` ca default inofensiv (Recomandat)** — `sendChat` păstrează `opts.chain ?? CHAIN`
ca fallback intern; nimeni nu-l mai apelează din UI, dar rămâne testat (`chat.test.ts`) și disponibil
dacă reapare vreodată un consumator (ex. un buton „întreabă AI" pe alt modul, în viitor).

- Pro: zero risc de regresie, zero cod atins în plus față de eliminarea propriu-zisă a Chat-ului.
- Contra: cod mort în producție (nu grav — 3 constante + un array, ~30 linii cu comentarii).

**B — Curăț și `CHAIN`/`PROVIDER_TIMEOUT_MS`/`CHAIN_BUDGET_MS`** — șterg constantele + testele lor
din `chat.test.ts`, `sendChat` devine `opts.chain` obligatoriu (fără default).

- Pro: fără cod mort.
- Contra: dacă cineva vrea vreodată chat/asistent AI înapoi (nu e în backlog azi, dar nici exclus
  explicit), reconstruiește lanțul de la zero — ai renunțat la comentariile cu istoricul „de ce
  Cerebras/OpenRouter au fost scoase" (linii 1-52), context greu de recuperat.
- [RELEVANT] dacă ești sigur că Chat nu revine niciodată; altfel [NU RECOMANDAT] — riscul de a
  arunca istoric util e mai mare decât beneficiul de a șterge 30 de linii moarte.

**Decizie (Roland): Opțiunea B — R-MINIMAL.** `SendChatOptions.chain` devine `chain: ProviderStep[]`
obligatoriu (fără `?`), `sendChat` pierde fallback-ul intern `?? CHAIN` — TypeScript prinde orice
apel viitor care omite `chain`, exact câștigul pe care l-ai numit.

**Testele afectate în `chat.test.ts`, verificate una câte una (nu doar „le curăț pe toate"):**

- Linia 66, `"CHAIN = Gemini → Gemini2 → Groq → Mistral → Mistral2..."` — testează COMPOZIȚIA lui
  `CHAIN`, care dispare. **Șterg** — n-are ce să mai verifice.
- Linia 228, `"CHAIN (Chat) rămâne complet NEATINS..."` — asta e testul pe care l-ai numit tu:
  devine fără obiect (nimic de „neatins" odată ce nu mai există). **NU doar șterg — înlocuiesc** cu
  un test care păzește invariantul NOU, real: că `chain` e obligatoriu la nivel de tip. Practic, un
  test `// @ts-expect-error` în `chat.test.ts` care apelează `sendChat(msgs, sys, {})` (fără `chain`)
  și așteaptă o eroare de compilare — verificat de gate-ul `tsc`, nu de `jest` runtime (un câmp
  obligatoriu lipsă nu e o eroare de execuție, e una de tip) — deci testul chiar pică dacă cineva
  face din nou `chain` opțional, exact ce ceri.
- Linia 239, `"GENERATION_CHAIN reordonează Groq..."` — testează `GENERATION_CHAIN`, care rămâne.
  **Neatins.**

---

## PUNCTUL 5 — Groq: `max_tokens` redus pe fallback

Confirmat în cod: `ProviderStep` (`chat-providers.ts:26-36`) are azi DOAR `timeoutMs` per pas — NU
și `maxTokens` per pas. `sendChat` calculează un singur `maxTokens = opts.maxTokens ?? DEFAULT_MAX_TOKENS`
(linia 277) aplicat IDENTIC la toți pașii din lanț, inclusiv Groq. Cu `GENERATION_OPTS.maxTokens = 16384`,
Groq primește aceeași cerere de 16384 — de 2× plafonul lui documentat (8000 TPM) — exact cauza pe
care ai identificat-o corect.

### Opțiune (una singură, e o completare mecanică a unui pattern deja existent, nu o alegere de design)

Adaug `maxTokens?: number` pe `ProviderStep` (paralel cu `timeoutMs`, deja acolo de la Faza 4.5c),
folosesc `step.maxTokens ?? maxTokens` la construcția payload-ului (liniile ~298-301), setez
`maxTokens: 6000` doar pe pasul `groq` din `GENERATION_CHAIN`. Gemini/Mistral rămân la 16384
(Mistral n-are semnalat un plafon TPM strict ca Groq — doar 2 req/min, o limită diferită, deja
respectată de pacing-ul lanțului).

**Decizie (Roland): 6000, nu 7000.** Motivul: fișele Școlare tipice măsurate ajung la ~4000 tokeni
(`token_probe.mjs`, 2026-08-20) — 4000 ar trunchia exact cazul normal, nu doar cazurile extreme.
6000 + ~1200 tokeni de prompt = 7200, sub plafonul de 8000 TPM, **într-o singură cerere**.

**De ce contează „într-o singură cerere" — notă pt cod/comentariu:** plafonul Groq e per MINUT
(8000 TPM), nu per cerere. Dacă `continueGenerate`/`continueCorrect` declanșează un al doilea apel
Groq în ACELAȘI minut (auto-continuare pe un răspuns trunchiat), cele două cereri se cumulează pe
aceeași fereastră de 60s → al doilea apel ar lovi din nou plafonul, chiar dacă fiecare cerere
individuală respectă 6000. Marja de 6000 (nu 7999) există tocmai ca o singură cerere să nu consume
tot plafonul minutului, lăsând loc unei eventuale a doua.

---

## Capacitate OCR + ce vede Cristina la epuizarea cotei (cerut de Roland) — CONCLUZIE

**Corectat față de prima rundă a acestui document** (unde spuneam „~2 documente/zi" — scris ÎNAINTE
ca fixul de bbox să facă Lite un fallback SIGUR, nu doar teoretic; cifra veche era prea pesimistă).

**Cifrele reale, re-derivate din codul CHIAR LIVE azi (`ocr_structured.py:137/195`), nu presupuse:**
bucla `for model_name in MODELS` (liniile 140-236) cascadează `gemini-3.6-flash` →
`gemini-3.5-flash-lite` → `gemini-2.5-flash` pe ACEEAȘI cheie/proiect — linia 195,
`if e.code in (429, ...) and model_name != MODELS[-1]: continue`, confirmă: un 429 (cotă epuizată)
pe 3.6-flash NU oprește pagina, cade automat pe Lite. Cu fixul de bbox live (÷1000, `_validate_figures`,
liniile 281-285), acele crop-uri sunt acum corecte, nu goale.

**Capacitate reală per proiect Google: 20 (3.6-flash, calitate mai bună) + 500 (Lite, acum SIGUR) =
520 pagini/zi.** Un PDF de 10 pagini = 10 cereri → **~52 documente de 10 pagini/zi**, nu ~2. Cu
ambele proiecte gratuite (`GOOGLE_AI_API_KEY` + `_TRADUCERI_2`) cablate ca fallback suplimentar —
NU implementat azi, ar fi cod nou în `ocr_structured.py` — teoretic **~1040/zi**.

**520/zi RĂSPUNDE DECISIV la „ajunge free tier-ul" pt un instrument de o singură profesoară** — nu
mai e o presupunere fără date, e concluzia care justifică toată strategia de trecere pe free tier
(exact observația lui Roland). Cablarea celei de-a doua chei (opțiunea B de mai jos) devine
opțională, nu necesară — capacitatea de bază e deja confortabilă.

**Ce se întâmplă azi, verificat în cod, la epuizarea TUTUROR celor 3 modele Gemini (429 pe toate,
peste cele 520/zi):** NU e o eroare — `ocr_structured.py:209-211` cade automat pe **Mistral OCR**
(1 mld tokeni/lună, deja în cod). Rezultatul e marcat `"source": "mistral-ocr"`, iar pe calea de
import în Editor există DEJA un banner onest (`ocr-map.ts:326`, `editor-import.tsx:399`, NEATINS de
implementarea 4.5d — verificat, nu e în lista celor 18 fișiere din `ba08994`): _„OCR de rezervă
(Mistral) — fără figuri/LaTeX."_ — infrastructură bună, deja acolo, nu trebuie construită de la zero.

**Gol rămas — SINGURUL lucru din cererea inițială a lui Roland încă nefăcut:** mesajul spune CE s-a
întâmplat, dar nu DE CE (cotă epuizată vs. alt motiv) și nu e acționabil. `ocr_structured.py` nu
păstrează motivul căderii pe Mistral (429 vs 5xx vs RECITATION vs timeout) — doar îl loghează în
stderr, pierdut la returnare.

### Propunere concretă (NEIMPLEMENTATĂ — doar propusă, cum a cerut Roland)

**1. Backend (`ocr_structured.py`):** în bucla `for model_name in MODELS`, acumulează motivul
fiecărui eșec într-o listă locală (`fail_reasons: list[str]`, ex. `"429"`/`"5xx"`/`"RECITATION"`).
La apelul spre `_ocr_with_mistral_structured`, trece lista; funcția derivă un singur
`fallback_reason` categoric: `"quota"` dacă TOATE eșecurile au fost 429, altfel `"unavailable"`
(acoperă 5xx/RECITATION/timeout — problemă tranzitorie a providerului, nu cotă). Adaugă
`result["fallback_reason"] = fallback_reason` lângă `result["source"] = "mistral-ocr"` existent.

**2. Cod de eroare nou — `E-OCR-004`** (`config/error_codes.json`, pattern existent `E-<ARIE>-<NNN>`,
severity `"warn"` — nu `"error"`, fiindcă tehnic cererea REUȘEȘTE, doar degradat):

```json
"E-OCR-004": {
  "message": "OCR cazut pe rezerva Mistral - fara figuri/LaTeX",
  "cause": "Toate cele 3 modele Gemini au esuat pe aceasta pagina (cota zilnica epuizata, sau providerul temporar indisponibil). Continutul text a fost extras cu Mistral OCR, dar fara figuri geometrice/formule LaTeX (Mistral nu le genereaza).",
  "fix": "Daca fallback_reason=quota: asteapta reinnoirea cotei zilnice (miezul noptii, ora Pacific) sau reincearca maine. Daca fallback_reason=unavailable: reincearca in cateva minute.",
  "severity": "warn",
  "area": "ocr"
}
```

(oglindit în `frontend/src/lib/error-catalog.ts`, ca `E-OCR-001/002/003` — testul anti-drift
`error-catalog.test.ts` prinde orice discrepanță.)

**3. Frontend (`ocr-map.ts` → `MappedContent`):** adaugă `fallbackReason?: "quota"|"unavailable"`
lângă `mistralFallback` existent (linia 317), populat identic (linia 326:
`if (page.fallback_reason) fallbackReason = page.fallback_reason`).

**4. Mesaj (`editor-import.tsx`, lângă linia 399, înlocuiește linia fixă cu ramură pe motiv):**

- `quota`: _„Cota gratuită zilnică Gemini s-a epuizat azi (E-OCR-004) — am folosit OCR de rezervă
  (Mistral), document fără figuri/formule LaTeX. Reîncearcă mâine pentru rezultat complet, sau
  adaugă figurile manual acum."_
- `unavailable`: _„Providerii Gemini sunt temporar indisponibili (E-OCR-004) — am folosit OCR de
  rezervă (Mistral), document fără figuri/formule LaTeX. Reîncearcă în câteva minute."_

**5. Diagnostic:** `E-OCR-004` logat în Supabase (`logWarn`, pattern existent din alte coduri) →
vizibil pe `/diagnostics`, nu doar în bannerul din editor.

**Notă de scope:** fluxul de corectare (`TestePanel.tsx`, tier=paid) NU ajunge niciodată aici — la
epuizarea modelelor plătite, codul ridică explicit o eroare vizibilă în loc să cadă pe Mistral
(`ocr_structured.py:175-180/201-208`, „fallback Mistral OMIS pt confidențialitate") — deja tratat
corect, fără gol.

### B — a doua cheie liberă ca fallback de capacitate (devenită opțională, nu necesară)

Cablare `GOOGLE_AI_API_KEY_TRADUCERI_2` ca al 4-lea pas în `MODELS` (sau ca retry complet al
lanțului pe a doua cheie) — cod nou în `ocr_structured.py`. Cu 520/zi deja confortabil pt un singur
utilizator, marchez asta [RELEVANT] doar dacă Roland are un motiv concret (volum real mai mare
decât presupun) — nu propun implementarea acum.

## Cele două 🟡 rămân 🟡 — propuneri ieftine/sigure de verificare live (NEEXECUTATE)

Cerut explicit de Roland: nu rotunjesc niciunul la 🟢, dar dacă există o cale ieftină și sigură de
verificare live, o propun — fără să consum cele 20 cereri/zi ca s-o forțez.

**Fix scară bbox Lite — propunere:** un script mic care importă `ocr_structured` direct (nu prin
`/api/ocr`, deci fără să treacă prin `gemini-3.6-flash` deloc) și îl apelează cu
`key_env="GOOGLE_AI_API_KEY_TRADUCERI_2"` (cheia liberă folosită și la testul A/B — ZERO risc pt
cota de producție) + `MODELS` suprascris temporar la `["gemini-3.5-flash-lite"]` (patch de modul,
doar în script, codul de producție neatins) — pe o pagină reală cu figuri (ex. din nou
`1.2_Unghiuri...` sau o pagină nouă, ca să nu repete exact același caz). Asta rulează codul
DEPLOYAT, cu fixul de ÷1000 live, capăt-la-capăt (inclusiv `figure_crop.crop_figure` pe rezultat),
fără să atingă `GOOGLE_AI_API_KEY` (producție) sau vreo cerere reală a Cristinei.

**Groq `maxTokens:6000` — propunere:** o singură cerere reală către `/api/proxy?provider=groq`
(endpoint-ul DEPLOYAT, nu o reimplementare), cu `model: "openai/gpt-oss-20b"`, `max_tokens: 6000`
și un prompt realist (reutilizează `buildSystemPrompt()`/un prompt de generare Teste existent ca
fixture) — confirmă empiric că 6000 e acceptat de Groq azi, fără 429, sub plafonul TPM. O singură
cerere, respectă limita documentată, nu afectează alt trafic (R-DIAG-AUTO arată 0 trafic Groq în
72h). Nu testează bucla de cascadare din `sendChat` (deja acoperită de teste unitare) — doar forma
reală a cererii către Groq cu noua limită.

**Nu execut niciuna fără confirmarea ta** — sunt propuneri, cum ai cerut.

## Capcane de reamintit (ca să nu le redescopăr)

- Ștergere cheie Google: doar din Cloud Console → Credentials, NU din AI Studio („Failed to delete
  API key", reprodus de 2 ori).
- Cotele Gemini sunt per PROIECT Google Cloud, nu per cheie — contează ce proiect e în spatele
  fiecărui env var, nu doar numele lui.
- Limitele: citite din `~/.api-keys/catalog.md` + memoria `_TRADUCERI_2`/`_TRADUCERI_PAID` ÎNAINTE
  de orice sondă (lecția Mistral din 4.5c — 2 req/min, nu „provider mort").
- NU șterg cheile Google vechi (`...OXSA`, `...CGPw`) — `GOOGLE_API_KEY` (numele generic, alt sistem)
  e partajat cu alte proiecte ale tale.

## Ce NU fac

Generator offline de teste (backlog, decis). Nu ating pipeline-ul de traducere F8. Nu ridic bugetul
lanțului peste 110000ms (neatins — punctele 2-5 nu ating `GENERATION_OPTS.budgetMs`).

## Propunerea de split (istoric — depășită de eveniment)

Runda anterioară a acestui document propunea separarea `api/` (OCR) de `frontend/` (corectare/Chat)
în două faze (4.5d/4.5e), ca să nu se strângă prea mult într-o singură sesiune. Fork-ul reluat a
implementat totul UNIFICAT, într-un singur commit (`ba08994`) — split-ul nu s-a mai întâmplat.
Rămâne aici doar ca raționament (de ce ar fi fost o tăietură naturală), nu ca propunere activă.

## Ce mai e deschis — starea finală (2026-09-11, runda 3)

Confirmate/închise (nu se mai reconfirmă): fixul de scală bbox (÷1000, `ocr_structured.py`, implementat

- deployat + dovadă vizuală/aritmetică), migrarea `traduceri-api`/`GOOGLE_AI_API_KEY` (făcută, 5 env
  vars pe cele 2 proiecte), RECITATION (implementat + dovadă LIVE), Punctul 2 (selector de tier,
  implementat), Punctul 4 (Chat șters, teste înlocuite), Punctul 5 (Groq 6000, implementat).

**Rămân deschise, pt runda următoare cu Roland:**

1. Propunerea de mesaj de cotă OCR (`E-OCR-004` + `fallback_reason` + textele din secțiunea
   „Capacitate OCR" de mai sus) — de confirmat înainte de implementare.
2. Cele două propuneri de verificare live ieftină/sigură pt cele două 🟡 (bbox Lite, Groq 6000) —
   de confirmat înainte de rulare.
3. Opțiunea B de capacitate (a doua cheie liberă cablată în `ocr_structured.py`, ~1040/zi) — rămâne
   [RELEVANT, nu necesar] cu 520/zi deja confortabil; nu se implementează fără un motiv concret.

Niciun cod nu se scrie din cele de mai sus până Roland nu confirmă explicit — de data asta prin
răspunsul lui direct în conversație, nu presupus.
