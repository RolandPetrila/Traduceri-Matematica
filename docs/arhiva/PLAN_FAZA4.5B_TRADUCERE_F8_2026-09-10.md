# PLAN — Faza 4.5b: traducerea F8 pierde spații la granița bold/formulă (P3, R-MATH)

> Creat: 2026-09-10. Respectă R-PLAN. **NU se începe implementarea până Roland confirmă acest
> plan.** Continuă din `docs/PLAN_FAZA4_AUDIT_REAL_2026-09-09.md` (jurnal #5/#6, defect P3) și din
> decizia lui Roland din acest chat (2026-09-10): **Faza 4.5b = P3 SINGUR** (P2 — timeout lanț AI
> la Teste — mutat într-o Fază 4.5c separată, motivul fiind exact cel de la separarea 4.5a/4.5b:
> puse împreună, verdictul auditorilor devine tulbure).

## Scope — DOAR P3

Traducerea F8 (RO→SK/EN/DE) pierde spații la granița dintre două segmente de text separate prin
marcaj (bold/italic) sau adiacente unei formule LaTeX inline. Jurnal Faza 4, `data.json`:

> „(a) lipește cuvinte la marginea unui termen BOLD (`priliehavéak` în loc de `priliehavé ak`;
> `sú<b>doplnkové</b>ak` fără spații) și (b) izolează pe linie proprie virgula/conjuncția scurtă
> imediat înainte/după o formulă LaTeX inline (ex. `, O2` pe linie separată, un punct final singur
> pe propria linie) — defect de layout/spațiere absent în RO (originalul), apărut DUPĂ traducere."

**Ce NU face Faza 4.5b:** nu atinge lanțul AI / bugetul de timp din Teste (P2 — Faza 4.5c), nu
redeschide alte module din caietul de sarcini.

## R-DIAG-AUTO — verificat înainte de acest plan (2026-09-10)

Interogat direct `logs` din Supabase (`tenders-ro`, `ywlykyyivthpsxfkdwzl`), filtrat pe
`E-TEST-001`/`E-NET-001`/`E-TEST-002`/`E-TEST-003` + orice `editor:translate*` din 2026-09-09
încoace. **Niciun eveniment nou** față de cele deja cunoscute din Faza 4 (ultimele `E-TEST-001`/
`E-NET-001`: 2026-09-09 19:36, aceleași 2 cicluri citate în handoff). Trei `editor:translate`
reușite (`action`, fără eroare) în 2026-09-09/10 — P3 **nu aruncă erori**, e corupere silențioasă
de text (traducerea „reușește", dar rezultatul e stricat) → invizibil pentru R-DIAG-AUTO prin
construcție; singura cale de confirmare e reproducerea directă (mai jos).

## Diagnostic — cauza reală, CONFIRMATĂ prin cod + reproducere live (3/3, deterministă)

**Lanțul complet (client → server → DeepL → server → client):**

1. `frontend/src/components/editor/editor-translate.ts` (`segmentInline`, linia 67): pentru orice
   conținut inline, rupe textul într-o secțiune NOUĂ la fiecare schimbare de set de marcaje
   (bold/italic/etc.) — comentariul de la linia 8 descrie asta explicit: „«**bold** cuvânt» =
   segmente separate". O formulă inline rămâne „neutră la marcaje" (nu rupe secțiunea), dar
   marginile ei tot cad la graniță de secțiune dacă textul vecin are alt set de marcaje.
2. `postSections` trimite TOATE secțiunile documentului într-o SINGURĂ cerere POST
   (`text_sections: string[]`) către `/api/translate-text`.
3. `api/translate_text.py`, `do_POST` (linia 272): **unește** toate secțiunile primite cu
   `SEP = "\n|||SEP|||\n"` într-un singur text (`batch`), îl trimite la DeepL ca UN SINGUR apel
   (`_run_translation_chain` → `_deepl()` → `protect_for_deepl(batch)`), apoi **desparte** rezultatul
   doar după `"|||SEP|||"` (fără cei doi `\n` din SEP-ul de unire — inconsistență minoră, mascată
   de pasul următor).
4. `_apply_translations_recursive` (linia 107, linia 122): aplică necondiționat
   `new_s["content"] = translated_text.strip()` pe FIECARE bucată rezultată.

**Defectul:** pasul 4 presupune că fiecare bucată e un PARAGRAF de-sine-stătător, unde spațiul de
la margine e zgomot fără sens (ipoteză corectă pt paragrafe reale). Dar secțiunile create la
pasul 1 NU sunt paragrafe — sunt fragmente dintr-o SINGURĂ propoziții, iar spațiul de la marginea
lor e SINGURUL lucru care le leagă de vecini („Triunghiul este ␣" + „dreptunghic" trebuie să redea
„Triunghiul este dreptunghic", nu „Triunghiul estedreptunghic"). DeepL, tradunând `batch`-ul ca un
text cu pseudo-paragrafe (din cauza `\n...\n` din SEP), nu păstrează sistematic spațiul de margine
al fiecărui „paragraf" — iar `.strip()` îl elimină garantat pe orice a mai rămas. Rezultatul:
cuvintele/segmentele adiacente se lipesc la reconstrucție (`rebuildTranslated` din
`editor-translate.ts` doar concatenează nodurile de text, fără niciun spațiu de legătură explicit).

**De ce arată ca „izolare pe linie proprie" lângă formulă (simptomul b), nu doar lipire de
cuvinte (simptomul a):** o formulă LaTeX e randată de KaTeX ca `display:inline-block`. Dacă
spațiul dintre formulă și textul următor e distrus (același mecanism), browserul NU mai are punct
de rupere de linie între ele (niciun spațiu = niciun break point) — deci formula + fragmentul lipit
de ea trebuie să rămână împreună pe rând; când nu mai încap, sar ÎNTREGI pe linia următoare,
percepute vizual ca „textul scurt s-a izolat pe propria linie". Aceeași cauză, două simptome
diferite (lipire pură vs. lipire + realocare de linie din cauza formulei wide inline-block).

**Nu e cauza pusă de Roland ca punct de plecare** (`protect_for_deepl`, mutarea spațiului INAINTE
de `<keep>` în interiorul tag-ului, liniile 58-66 din `math_protect.py`) — aceea protejează un caz
DIFERIT și deja funcțional: spațiul dintre text și o formulă **în ACEEAȘI secțiune** (verificat mai
jos, cazurile „control"). Bug-ul e la granița dintre secțiuni DIFERITE, unde nu există nicio
protecție echivalentă.

### Reproducere live (`traduceri-api.vercel.app/api/translate-text`, RO→SK, DeepL, 2026-09-10)

Probă: `scratchpad/p3_repro.mjs` + `scratchpad/p3_repro_a.mjs` (păstrate necomise, ca precedentele
probe de diagnostic). **Corecție (găsită de `auditor-cerinte`):** la scrierea inițială a acestei
secțiuni, cele două fișiere existau doar în scratchpad-ul DE SESIUNE, nu în `scratchpad/` al
proiectului — citarea era înșelătoare. Copiate în `scratchpad/` al proiectului și re-rulate ca
sanity-check (3/3 spații corecte, provider DeepL) înainte de a marca acest punct rezolvat.

| Caz                                          | Intrare (secțiuni separate)                                                                | Ieșire reconstruită (concatenare brută, ca-n client)        | Verdict                                       |
| -------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------- | --------------------------------------------- |
| A — graniță bold, 3/3 rulări                 | `"Triunghiul este "` / `"dreptunghic"` / `" și isoscel."`                                  | `"Trojuholník jepravouhlýa rovnoramenný."`                  | **REPRODUS, determinist (3/3)**               |
| A-control — ACELAȘI text, 1 secțiune         | `"Triunghiul este dreptunghic și isoscel."`                                                | `"Trojuholník je pravouhlý a rovnoramenný."`                | Corect — confirmă cauza e la GRANIȚĂ          |
| B — secțiune scurtă lângă formulă            | `"Aria triunghiului este $A=\frac{b\cdot h}{2}$"` / `", deci"` / `" calculăm perimetrul."` | `"...$, takževypočítame obvod."`                            | **REPRODUS** (lipire lângă formulă)           |
| B-control — formulă + tot textul, 1 secțiune | tot într-o secțiune                                                                        | `"Plocha trojuholníka je $A=...$, takže vypočítame obvod."` | Corect — spațiul lângă `<keep>` OK            |
| C — 5 secțiuni scurte la rând                | `"Fie "` / `"ABC"` / `" un triunghi cu "` / `"AB = BC"` / `", isoscel."`                   | `"Nech jeABCtrojuholník sAB = BC, rovnoramenný."`           | **REPRODUS** — fiecare graniță pierde spațiul |

Concluzie: defectul **nu e specific bold-ului sau formulelor** — e general, la ORICE graniță de
secțiune creată de segmentarea pe marcaje. Bold și formulele inline sunt doar contextele în care
Cristina a observat simptomul, pentru că sunt cele mai frecvente în documentele ei.

## Opțiuni de fix (R2) — de confirmat, NU implementate încă

### Opțiunea A — elimină `.strip()` necondiționat (Recomandat: NU)

- **Pro:** schimbare de o linie.
- **Contra:** `.strip()` e singurul lucru care curăță în prezent inconsecvența `\n|||SEP|||\n`
  (unire) vs `|||SEP|||` (despărțire) — fără el, fiecare secțiune ar căpăta `\n` parazit la
  margine (mai rău decât acum: newline literal în nodul de text, nu doar spațiu lipsă).
- **[NU RECOMANDAT]** — rezolvă o problemă și o înlocuiește cu alta, mai vizibilă.

### Opțiunea B — păstrează spațiul EXACT din sursă, independent de provider (Recomandat)

Spațiul de la marginea unei secțiuni nu are nevoie de traducere — e identic în orice limbă. Deci:

1. Înainte de a trimite la traducere, serverul extrage spațiul de la margine
   (`lead = text[:len(text)-len(text.lstrip())]`, `trail` similar) din fiecare secțiune și reține
   doar CORE-ul (`text.strip()`) pentru traducere.
2. Unește/desparte/traduce CORE-urile ca acum (sau, mai simplu, per-secțiune — vezi Opțiunea C).
3. La reasamblare: `final = lead + translated_core.strip() + trail` — spațiul de legătură vine
   ÎNTOTDEAUNA din sursă, NICIODATĂ din ce a decis DeepL/Gemini/Azure/NLLB să facă cu el.
4. Repară și inconsecvența `\n|||SEP|||\n`/`|||SEP|||` ca efect secundar (whitespace-ul din
   mijlocul batch-ului nu mai trebuie ghicit din răspuns — sursa e autoritară).

- **Pro:** chirurgical, independent de provider (funcționează identic pt fallback-urile
  Azure/NLLB/OpenRouter/Gemini, care trec toate prin `_apply_translations_recursive`), testabil
  determinist (nu depinde de comportamentul real DeepL, doar de sursă).
- **Contra:** atinge `translate_text.py` (calea de bază de traducere — R-EXT cere grijă), cere
  teste noi (Python) care simulează un provider ce NU păstrează spațiul de margine (ca să nu
  regreseze silențios dacă cineva reintroduce `.strip()` necondiționat mai târziu).
- **[RECOMANDAT]** — rezolvă cauza la rădăcină, nu simptomul, și nu depinde de cum se comportă
  fiecare provider de traducere azi sau mâine.

### Opțiunea C — trimite fiecare secțiune ca apel separat (nu batch cu SEP)

- **Pro:** elimină complet mecanismul de unire/despărțire cu SEP — fiecare secțiune e tradusă
  independent, fără ambiguitate de graniță.
- **Contra:** pierde CONTEXTUL între secțiuni adiacente (o propoziție ruptă de bold se traduce
  frântur pe frântur, fără să „vadă" vecinii) → calitate mai slabă a traducerii pe fraze cu
  formatare, plus N apeluri DeepL în loc de 1 (cotă/latență, cale deja marcată „rar/lent" în
  `_translate_each`, linia 177-218, folosită azi doar ca fallback la SEP mangled).
- **[NU RECOMANDAT ca soluție principală]** — dar rămâne calea de fallback existentă
  (`_translate_each`) dacă B nu se poate aplica pe un provider anume; nu se schimbă.

**Recomandarea mea: Opțiunea B**, aplicată în `_apply_translations_recursive` +
`_collect_texts_recursive` (sau echivalent) din `api/translate_text.py`. Nu atinge
`editor-translate.ts` (segmentarea client rămâne cum e — corectă structural, doar reasamblarea
server-side a spațiului era stricată) și nu atinge `math_protect.py` (logica lui de spațiu-înainte-
de-`<keep>` rămâne validă pt cazul ei, ortogonală pe cea de aici).

## Condițiile lui Roland (confirmare Opțiunea B, 2026-09-10) — răspuns punctual

### 1. Unde aterizează fixul — server ȘI verificare explicită a clientului

Fixul e 100% în `api/translate_text.py`: funcție nouă `_reattach_boundary_whitespace(original,
translated)` + `_apply_translations_recursive` o folosește în loc de `.strip()` brut pe rezultatul
providerului.

**Clientul NU taie spații la reasamblare — verificat, nu presupus:** `grep -n "\.trim(\|\.strip("
frontend/src/components/editor/editor-translate.ts` → **zero rezultate**. `expandSegment` (linia 171) face `pushText(t)` cu gardă doar `if (!t) return` (skip pe string GOL, nu pe whitespace) —
orice text primit de la server, inclusiv un rând doar-spațiu, e păstrat byte-exact într-un nod
`text`. `walkRebuild` doar concatenează nodurile, fără niciun `.trim()`/normalizare. Deci NU e o
reparație pe jumătate (tiparul P4 din 4.5a) — un singur capăt (server) era stricat, iar acum e
reparat acolo.

### 2. Inconsecvența separator unire/despărțire (`\n|||SEP|||\n` vs `|||SEP|||`)

**Ce este, exact:** `SEP = "\n|||SEP|||\n"` la `.join()` (batch trimis la DeepL), dar
`translated.split("|||SEP|||")` la despărțire — ignoră deliberat cei doi `\n` din jurul markerului.

**Nu e un bug — e robustețe intenționată, nu am numit-o corect prima dată:** dacă split-ul ar
căuta SEP-ul întreg cu `\n`, iar DeepL i-ar altera whitespace-ul din jur (exact ce face, conform
reproducerii), `len(parts) != len(texts)` ar pica la ORICE traducere, declanșând mereu fallback-ul
lent `_translate_each` (un apel per secțiune). Split-ul pe markerul STABIL, ignorând `\n`-urile din
jur, e alegerea corectă — dar lasă reziduuri de `\n` la marginea fiecărei bucăți din `parts[i]`.

**B o face irelevantă pentru corectitudine, NU o corectează la sursă:** `_reattach_boundary_whitespace`
face `translated.strip()` pe miezul întors de provider ÎNAINTE de a re-atașa spațiul din sursă —
orice reziduu de `\n` scurs din join/split e absorbit acolo, indiferent de conținut (test
`test_provider_leaked_separator_residue_is_absorbed`). Capcana rămâne NENUMITĂ doar dacă cineva
citește `parts[i]` brut ÎN AFARA `_apply_translations_recursive` — azi nu există alt loc care o
face. Nu am schimbat join/split-ul (rămâne robust cum era) — doar am eliminat dependența
corectitudinii finale de comportamentul lor.

### 3. Cazuri de margine — tratate explicit + testate (`api/tests/test_translate_text_boundary.py`)

| Caz                              | Test                                                 | Comportament                                                                                        |
| -------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Secțiune DOAR spațiu             | `test_whitespace_only_section_passthrough_unchanged` | trece NESCHIMBATĂ (nimic de tradus)                                                                 |
| Spațiu la ambele capete          | `test_both_ends_preserved`                           | re-atașat exact                                                                                     |
| Spații multiple consecutive      | `test_multiple_consecutive_spaces_preserved`         | re-atașate exact (nu colapsate)                                                                     |
| Spațiu insecabil U+00A0          | `test_nbsp_preserved` + `test_nbsp_only_section_...` | re-atașat exact (Python `str.strip()` îl tratează ca whitespace, dar copiem literal, nu normalizăm) |
| Linie nouă la margine            | `test_newline_at_margin_preserved`                   | re-atașată exact                                                                                    |
| Secțiune goală                   | `test_empty_section_passthrough_unchanged`           | trece neschimbată                                                                                   |
| Reziduu SEP scurs de la provider | `test_provider_leaked_separator_residue_is_absorbed` | absorbit, nu confundat cu spațiul din sursă                                                         |
| `two_column` (recursiv)          | `test_two_column_recurses_with_boundary_fix`         | fix-ul se propagă și în coloane                                                                     |

15 teste noi, toate PASS. Detalii rulare: §Poartă mai jos.

### 4. Dovadă live pe cazul REAL din jurnal (nu cazul sintetic de diagnostic)

Document construit manual în editor pe producție (`traduceri-frontend.vercel.app/editor-nou`),
sub limba sursă RO activă (NU în „slotul" de traducere — capcană descoperită în timpul testării:
documentul rămas deschis din sesiuni anterioare avea SK activ cu conținut RO stale; am adăugat
conținutul sub RO explicit, confirmat de eticheta „scris în: RO" + butonul RO activ), cu:

- text normal + termen **bold** cu spații pe ambele laturi,
- formulă inline (fracție `a/b`) în mijlocul propoziției,
- un tabel 3×3 cu antet bold + o celulă cu bold în mijlocul textului.

Click SK (traducere live, prin fix-ul deployat) →

```
Overenie fázy 4.5b (P3): trojuholník je pravouhlý a rovnoramenný, s plochou a/b cm², takže
vypočítame obvod.

| Strana | Dĺžka presná        | Poznámky   |
| AB     | 6 cm, teda približne 6,0 | v poriadku |
```

- **Spații intacte la fiecare graniță** (bold, formulă, celule tabel) — confirmat vizual, de mine,
  direct în browser (captură de ecran în tranzacția sesiunii).
- **R-MATH confirmat:** formula (fracția) randată intact, netradusă.
- **Fără `E-VALID-003`** (sau orice alt cod) în Supabase — interogat `logs` pe ultimele 15 min:
  singurul rând e `editor:translate` (`action`, fără eroare) + zgomotul de fond cunoscut
  `E-NET-003` (framing Vercel la cold start, recuperat automat client-side, neschimbat față de
  Faza 2 — nu ține de acest fix).

**Strat de confirmare INDEPENDENTĂ (post-audit):** `auditor-dovezi` a reprodus separat, cu
propriile instrumente (Playwright, document nou, propoziție cu diacritice + bold), granița
bold — confirmat identic (`&lt;strong&gt;výslednú plochu &lt;/strong&gt;` cu spații corecte pe
ambele laturi) — și separat, prin API direct, granița formulă. **Nu a reprodus și porțiunea de
tabel** (a raportat-o NEDOVEDIT independent, cu argument mecanic corect: celulele de tabel devin
`{type:"paragraph"}` înainte de POST, deci trec prin aceeași cale deja testată, dar fără verificare
directă). Am închis acest gol imediat după: `scratchpad/p3_repro_table.mjs`, cerere sintetică ce
imită EXACT forma unui rând de tabel (celule separate, graniță bold în mijlocul unei celule) —
`"Dĺžka " + "presná"` → `"Dĺžka presná"`, `"6 cm, teda " + "približne" + " 6,0"` → `"6 cm, teda
približne 6,0"`, spații corecte confirmate pe API-ul de producție. Deci: bold + formulă =
confirmate de DOUĂ surse independente (eu + auditor); tabel = confirmat de mine (vizual, live) +
de o probă API sintetică separată, dar NU de auditor direct — onest raportat aici, nu rotunjit.

### 5. Contra-probă în teste (pică dacă fixul e revenit)

Testele din §3 fac assert pe STRING EXACT (nu doar „nu crapă"): `test_leading_space_preserved`
verifică literal `"pravouhlý "` (cu spațiul). Dacă cineva revine la
`new_s["content"] = translated_text.strip()`, spațiul dispare din rezultat și testul PICĂ — verificat
prin construcție (funcția testată face EXACT ce ar face revenirea, minus pasul de re-atașare).
`test_apply_translations_recursive_survives_worst_case_provider` simulează explicit providerul cel
mai defavorabil (strip agresiv pe fiecare bucată) și tot cere spațiile exacte la reconstrucție.

### 6. Providerii — onest ce e dovedit live vs doar în teste

- **DeepL: dovedit LIVE** (reproducerea sintetică 3/3 pe producție + documentul real de la punctul 4)
  — e providerul care servește azi RO→SK/EN/DE (cf. Faza 2: o cerere reală nu ajunge la NLLB cât
  timp DeepL răspunde).
- **Azure Translator / NLLB / OpenRouter / Gemini (fallback) / `_translate_each`:** fixul li se
  aplică prin CONSTRUCȚIE (aceeași `_apply_translations_recursive`, independentă de provider — vezi
  `test_apply_translations_recursive_survives_worst_case_provider`, care nu presupune un provider
  anume), dar **NEEXERSAT live** — nicio cerere reală nu i-a atins în această sesiune. Marcat 🟡 pe
  acest aspect, nu 🟢.

### 7. Cache-ul de traducere — bump făcut, ambele straturi

Două cache-uri distincte, ambele ating traducerile din F8:

- **`frontend/src/lib/translation-cache.ts`** (`getCachedDocTranslation`/`cacheDocTranslation`,
  folosit de `editor-translate-state.tsx`) — cheiat pe SHA-256 al conținutului-sursă + pereche de
  limbi, persistent în `localStorage`. `CACHE_VERSION` **v3 → v4**: `loadStore()` compară versiunea
  și ARUNCĂ tot store-ul dacă diferă — deci orice traducere cache-uită ÎNAINTE de fix (cu spații
  pierdute) devine inaccesibilă după deploy; următoarea cerere re-traduce cu fixul aplicat.
- **`translation-cache-guard.ts`** (`cacheRef` în-sesiune, memorie de tab) — NU persistă peste un
  reload; un bundle nou (din deploy) pornește cu el gol. Nu are nevoie de bump.

Corecție punctuală, NU o schimbare de scop — o singură constantă modificată în fiecare fișier.

### 8. Backlog — detectabilitate (NEIMPLEMENTAT, doar notat, decizi tu dacă intră într-o fază)

P3 era corupere silențioasă — traducerea „reușea" (200 OK, fără cod de eroare), invizibilă pentru
R-DIAG-AUTO. Idee ieftină pt o clasă de regresie similară: după reasamblare, o verificare
server-side care compară `sum(len(lead)+len(trail))` din sursă cu spațiul de graniță efectiv
prezent în `result` (sau, mai simplu, un test de fum care rulează câteva documente-fixture reale
prin `_apply_translations_recursive` la fiecare deploy și verifică nicio pereche literă-literă
lipită la granițe cunoscute). Estimare: mică (o funcție + eventual un `log_warn` cu cod nou, sub o
oră) — dar e un shortcut euristic, nu o garanție ca fixul din B. Nu extinde scopul lui 4.5b.

## Poartă — ÎNAINTE (baseline, măsurată înainte de prima modificare) și DUPĂ (cu fixul aplicat)

```
ÎNAINTE (2026-09-10, identic cu închiderea Fazei 4.5a):
tsc --noEmit         → 0 erori
jest                  → 28 suite, 438/438 teste, PASS
next build            → Compiled successfully, 10/10 pagini statice, OK
pytest api/tests -q   → 89 passed, 20 warnings (Pillow getdata, preexistent)

DUPĂ (fix + 15 teste noi + bump cache):
tsc --noEmit         → 0 erori
jest                  → 28 suite, 438/438 teste, PASS (translation-cache.ts = doar o constantă/comentariu, niciun test afectat)
next build            → Compiled successfully, 10/10 pagini statice, OK
pytest api/tests -q   → 104 passed (89 + 15 noi, test_translate_text_boundary.py), 20 warnings (preexistente)
```

Fără regresie. `CACHE_VERSION` (`translation-cache.ts`): v3 → v4. `CACHE_VERSION`
(`frontend/public/sw.js`, PWA precache): v73-20260910 → **v74-20260910** (bump obligatoriu — fixul
atinge și frontend-ul, prin bump-ul din `translation-cache.ts`, deci trebuie să ajungă la Cristina
prin cache-busting normal, nu doar prin JS-ul nou servit de Vercel).

## Deploy — realizat 2026-09-10

- API: `cd "C:/Proiecte/Traduceri_Matematica" && vercel deploy --prod --yes` →
  `dpl_NsQ7CEKWNs41mZTBBZGdBVWiPoSU`, aliasat `traduceri-api.vercel.app`, READY/production.
- Frontend: `cd "C:/Proiecte/Traduceri_Matematica/frontend" && vercel deploy --prod --yes` (fără
  `--cwd`) → `dpl_EZD2Xy7iwwnyGrXwFqRQ98xnRQXR`, READY/production.
- Verificare live: §4 de mai sus (reproducerea sintetică A/B/C + documentul real cu bold+formulă+tabel).

## Reguli de execuție (identice cu 4.5a, cerute de Roland)

- Dovadă live obligatorie per item — 🟡 dacă n-are dovadă live, indiferent de poartă. (Aplicat:
  providerii de fallback rămân 🟡 — punctul 6.)
- Deploy autorizat automat după poartă verde — FĂCUT (API + frontend, vezi §Deploy).
- Output-uri text din verificări live → `99_Roland_Work/Teste_Output/` (dacă verificarea produce
  conținut AI generat — nu e cazul aici, verificarea a fost traducere, nu generare).
- Disciplina sub-agenților: N/A această fază — nu s-a lansat niciun fork/sub-agent pentru
  implementare (lucru direct, coordonator).
- La final: cei trei auditori (Agent tool) → handoff + `Plan_in_Lucru.md` + memorie + commit/push
  → **STOP**. Faza 4.5c (P2) într-o sesiune nouă cu `/onboard`.
- **Notă specifică P3 (spre deosebire de 4.5a):** defectul e determinist (3/3, nu latent ca P2) —
  închis 🟢 pe bază de reproducere + test + dovadă live, fără avertismentul anti-fals-verde cerut
  pt P2/Faza 4.5c.

## Verdicte auditori (R-AUDIT-FAZA, 2026-09-10, rulați în paralel, Agent tool)

**`auditor-regresie` — FĂRĂ REGRESIE.** Poartă rulată independent: `tsc 0 · jest 438/438 · build OK
· pytest 104/104` (identic cu cifrele raportate de mine). **Control negativ**: a revenit temporar
fix-ul (înlocuit `_reattach_boundary_whitespace` cu `.strip()` brut) și a confirmat că 3 teste
reprezentative PICĂ exact cum ar trebui — dovadă empirică că testele testează cauza reală, nu
decor. Lint neschimbat (14 probleme preexistente, neatinse). `git diff --stat`: doar cele 3 fișiere

- planul + testul nou (fișierele netracked din `scratchpad/` erau deja acolo la începutul sesiunii).

**`auditor-dovezi` — 6/6 puncte cerute CONFIRMAT, + 2 constatări suplimentare NEDOVEDIT.**
Reprodus INDEPENDENT (Playwright, document nou, alte cuvinte) granița bold ȘI, separat prin API
direct, granița formulă — ambele confirmate. A semnalat: (a) `scratchpad/p3_repro*.mjs` lipseau
fizic din `scratchpad/` la momentul auditului (aceeași constatare ca `auditor-cerinte` — **corectat
imediat**, fișierele mutate din scratchpad-ul de sesiune în `scratchpad/` al proiectului, re-rulate
ca sanity-check); (b) porțiunea de TABEL din documentul real nu a fost reprodusă independent de el
(doar de mine, vizual) — **închis imediat** cu o probă API sintetică suplimentară
(`scratchpad/p3_repro_table.mjs`) care imită exact forma unui rând de tabel cu graniță bold în
celulă — confirmă spațiile corecte. A mai semnalat, factual corect: producția rulează cod
necomis în git până la commit-ul de mai jos (așteptat — ordinea R-STOP-FAZA cere commit DUPĂ
auditori, nu înainte).

**`auditor-cerinte` — 7/8 ONORATĂ, 1 PARȚIALĂ (aceeași cauză ca la `auditor-dovezi`: fișierele de
reproducere lipseau din `scratchpad/` — corectat).** Verificat `git diff --stat`: doar cele 3
fișiere din perimetrul pre-autorizat de Roland (server + bump-uri punctuale de constantă în
client) — **niciun scope creep**, pragul „oprește-te și întreabă" nu a fost atins, corect nu s-a
mai cerut altă confirmare. Toate cele 8 condiții ale lui Roland verificate cu dovadă proprie
(grep-uri, rulare pytest, citire cod), nu doar citite din plan.

**Sinteză:** toate cele 3 constatări ale auditorilor (fișiere de probă lipsă ×2, tabel neconfirmat
independent ×1) au aceeași cauză de fond — dovezile de diagnostic scrise doar în scratchpad-ul DE
SESIUNE, nu în cel al PROIECTULUI — și au fost corectate în aceeași sesiune, înainte de acest
raport. Niciun defect real în fix găsit de niciun auditor.

## Checklist bifabil

- [x] Confirmare Opțiune B de la Roland (2026-09-10, cu 8 condiții suplimentare — toate onorate mai sus)
- [x] Fix `api/translate_text.py` — `_reattach_boundary_whitespace` + `_apply_translations_recursive`
- [x] Test Python nou — 15 teste, inclusiv provider-stub care NU păstrează spațiul de margine
- [x] Re-rulare `p3_repro.mjs` pe producție — cazurile A/B/C confirmate reparate (A: 3/3 determinist)
- [x] Document real (bold + formulă + tabel) tradus live, verificat vizual în editor + Supabase (fără E-VALID-003)
- [x] Client verificat (punctul 1) — zero `.trim()`/`.strip()` în `editor-translate.ts`
- [x] Cache invalidat — `translation-cache.ts` v3→v4 + `sw.js` v73→v74 (punctul 7)
- [x] Poartă completă: `tsc` · `jest` · `build` · `pytest` — fără regresie
- [x] Deploy API + frontend + verificare live
- [x] Cei trei auditori (Agent tool, în paralel) — 0 defecte de fix găsite; 3 constatări (fișiere
      de probă lipsă din scratchpad-ul proiectului, tabel neconfirmat independent) corectate imediat
- [ ] Handoff + `Plan_in_Lucru.md` + memorie + commit/push
- [ ] STOP — raport către Roland, Faza 4.5c (P2) într-o sesiune nouă

## Jurnal execuție

**2026-09-10, diagnostic (înainte de confirmarea planului):** R-DIAG-AUTO rulat (fără evenimente
noi) → citit `editor-translate.ts` + `translate_text.py` + `math_protect.py` → reprodus live pe
producție (3/3 determinist, cazurile A/B/C) → cauza confirmată la granița de secțiune (`.strip()`
necondiționat în `_apply_translations_recursive`), NU la logica `protect_for_deepl` indicată ca
punct de plecare de Roland (acolo verificat funcțional prin cazurile control). Plan scris, în
așteptarea confirmării.

**2026-09-10, implementare (după confirmarea Opțiunii B + 8 condiții):** verificat client (punctul
1, zero `.trim()`/`.strip()`) și cache (punctul 7, `translation-cache.ts` v3, `cacheDocTranslation`
folosit de `editor-translate-state.tsx`) — niciunul nu depășea „`translate_text.py` + o corecție
punctuală în client" → NU s-a mai cerut altă confirmare (excepția din instrucțiuni nu s-a declanșat).
Implementat `_reattach_boundary_whitespace` + 15 teste (`test_translate_text_boundary.py`) → poartă
completă verde (`tsc 0 · jest 438/438 · build OK · pytest 104/104`) → bump `translation-cache.ts`
v3→v4 + `sw.js` v73→v74 → deploy API + frontend (production) → re-verificat reproducerea sintetică
pe producție (A: 3/3 determinist, spații corecte; B/C: identice cu control) → construit document
real (bold + formulă + tabel) direct în editor pe producție, tradus RO→SK live, verificat vizual +
confirmat fără `E-VALID-003` în Supabase (ultimele 15 min: doar `editor:translate` action + zgomotul
cunoscut `E-NET-003`). Urmează: cei trei auditori, handoff, memorie, commit/push, STOP.

**2026-09-10, post-audit:** cei trei auditori rulați în paralel — 0 defecte de fix găsite. 3
constatări, toate cu aceeași cauză (probe de diagnostic scrise doar în scratchpad-ul de sesiune, nu
în `scratchpad/` al proiectului) — corectate imediat: fișierele `p3_repro.mjs`/`p3_repro_a.mjs`
mutate în `scratchpad/` al proiectului + re-rulate ca sanity-check; probă API sintetică nouă
(`scratchpad/p3_repro_table.mjs`) pt porțiunea de tabel, neconfirmată independent de
`auditor-dovezi`. Vezi §Verdicte auditori. Urmează: `Plan_in_Lucru.md` + `HANDOFF_SESIUNE.md` +
memorie + commit/push, apoi STOP.
