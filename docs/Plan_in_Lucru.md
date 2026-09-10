# PLAN ÎN LUCRU — tablou de bord viu

> **Deschide-l oricând, inclusiv în mijlocul unei faze.** Se actualizează la fiecare sub-pas,
> nu la finalul fazei (recomandarea mea la 6b, confirmată de Roland).
>
> Stări: ⬜ neînceput · 🟡 în lucru · 🟢 gata + dovadă · 🔴 blocat · ⏸️ amânat conștient
>
> **O căsuță devine 🟢 DOAR** dacă execuția e făcută ȘI verificată live ȘI dovada e scrisă în
> dreptul ei. Fără dovadă → rămâne 🟡. (Decizia 6a: „nimic gata fără dovadă live în browser".)
>
> **Distincția cerută de auditori:** „exersat live" ≠ „verificat în cod și în pachetul livrat".
> A doua e reală și utilă, dar NU e dovadă live. Fiecare rând spune care dintre ele e.

> ### ⏰ ATENȚIE la datele din acest proiect
>
> **Ceasul laptopului e cu o zi ÎNAINTE.** Verificat cu două surse independente: Google și
> Vercel raportează **07.09.2026 08:17 GMT**, laptopul raportează 08.09.2026. Jurnalul din
> Supabase e corect; laptopul nu. Consecințe: (a) toate datele „08.09.2026" scrise azi în
> documente, comentarii de cod, mesaje de commit și nume de dovezi sunt **greșite cu o zi**;
> (b) R-DIAG-AUTO filtrează „log-uri recente" după un ceas care o ia înainte. **De reparat pe
> laptop** (sincronizare oră Windows), nu în cod.

**Ultima actualizare:** 2026-09-10 (Faza 4.5c ÎNCHISĂ — P2 implementat + deployat + confirmat) · **Producție:** frontend redeploy (Faza 4.5c = realocare buget lanț AI Teste/Școlare, live) · **FAZA 4.5c ÎNCHISĂ** (rămâne 🟡 cu bună știință — defect latent, nu 🟢) · **Următoarea:** de stabilit

> ### 🟡 FAZA 4.5c — ÎNCHISĂ — P2 (timeout lanț AI Teste/Școlare), rămâne 🟡 (NU 🟢, cu bună știință)
>
> Defect **structural, aritmetic**: bugetul total (58000ms) era cu doar 6000ms mai mare decât
> timeout-ul primului provider (52000ms) — de fiecare dată când Gemini atingea propriul timeout,
> restul lanțului (4 din 5 provideri) nu mai avea matematic nicio șansă. Confirmat pe istoricul
> Supabase: 0 succese înregistrate pt gemini2/groq/mistral/mistral2 de la introducerea acestor
> constante (20.08.2026). Plan complet (măsurători, opțiuni R2, verificarea constrângerii de
> platformă, deciziile lui Roland citate exact, verdictele auditorilor):
> `docs/PLAN_FAZA4.5C_TIMEOUT_LANT_AI_2026-09-10.md`.
>
> **Fix:** `GENERATION_CHAIN` (array separat de `CHAIN`-ul Chat, neatins) cu plafon propriu per
> provider (gemini 45000ms / groq 15000ms / gemini2 40000ms / mistral+mistral2 15000ms fiecare),
> buget total ridicat la 110000ms (verificat în cod, nu presupus: bugetul e orchestrat CLIENT-SIDE
> în browser, `maxDuration=60` din `route.ts` mărginește FIECARE apel individual, nu suma lor —
> Roland a contestat corect premisa inițială greșită „zid de 60s pe tot lanțul"). Monitorizare
> nouă (`logGenerationResult`) la toate cele 8 puncte de generare (Teste 5 + Școlare 3) — scrie
> provider+durată+rezultat direct în Supabase `logs`, interogabil, nu mai trebuie reconstruit
> manual din log-uri brute. `config/error_codes.json` (E-NET-001/E-TEST-001/E-SCOL-001) corectat —
> fix-ul vechi recomanda exact opusul („ridică timeout-ul").
>
> Poartă: `tsc 0 · jest 444/444 (28 suite, +6) · build OK · pytest 104/104` — fără regresie
> (reprodusă independent de auditor-regresie, inclusiv un fals-negativ de build cauzat de cache
> `.next` stale, diagnosticat ca atare, nu ca defect real).
>
> **De ce rămâne 🟡, nu 🟢 (formularea precisă a auditorului de dovezi, nu generică):** traseul pe
> care fix-ul îl schimbă de fapt — Gemini eșuează → fallback-ul (Groq) primește o fereastră REALĂ
> de ~15s în loc de ~6s — **n-a fost niciodată exercitat live**. Singura dovadă live (Supabase,
> `teste.generate | provider=Gemini Flash | 30999ms`) e o generare reușită pe PRIMUL provider, care
> ar fi trecut și cu constantele vechi. Mecanismul de realocare are dovadă doar din teste cu `fetch`
> mockuit + aritmetică verificată (inclusiv o contra-probă reprodusă de 2 ori independent: revenire
> la 52000/58000 → 4 teste pică, printre care exact linia „Expected: not 58000"). Rămân deschise,
> descoperite colateral la măsurare, NEinvestigate în această fază (scope, confirmat de Roland):
> **Mistral — NEDETERMINAT** (afirmația „429 persistent" CORECTATĂ 2026-09-10: free tier Mistral e
> „2 req/min" per catalog, iar sonda a tras 6 cereri în ~20s → 429-urile vin de la sondă, nu de la
> cont; retestare corectă = primul task din 4.5d); **Groq — plafon confirmat 8000
> TPM**, o singură cerere grea poate epuiza aproape tot, deci fereastra realocată garantează o
> ȘANSĂ, nu un succes.
>
> **Verdicte auditori (R-AUDIT-FAZA), Școlare + Mistral-ul mort explicit pe listă:**
> **regresie** — FĂRĂ REGRESIE, reprodusă independent (poartă completă rulată de 3 ori, contra-proba
> `git stash`/`pop` reprodusă). Găsit + raportat: fișier orfan `:TEMP` la rădăcină (șters), producția
> era live pe cod necomis (rezolvat prin commit-ul acestei sesiuni). **dovezi** — 6/6 CONFIRMAT, cu
> precizarea de mai sus (dovada acoperă generarea normală, nu traseul de realocare). **cerințe** —
> 7/8 ONORATĂ direct; **1 PARȚIAL, ÎNCHIS prin confirmare explicită**: `budgetMs=110000` vs
> „~90000ms" citat de Roland în chat — dus înapoi la el cu opțiuni explicite (110000 recomandat /
> ~92000 cifra lui exactă / altă valoare) → **a ales explicit „Păstrează 110000ms (Recomandat)"**.
> Cod neschimbat, doar confirmarea lipsea.

> ### ✅ FAZA 4.5b — ÎNCHISĂ
>
> P3 SINGUR (P2 mutat separat în Faza 4.5c, la cererea lui Roland — „puse împreună, verdictul
> auditorilor devine tulbure"). Plan complet (diagnostic, opțiuni R2, cele 8 condiții ale lui
> Roland, dovezi, verdicte auditori): `docs/PLAN_FAZA4.5B_TRADUCERE_F8_2026-09-10.md`.
>
> |     | Item                                                                       | Dovadă                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
> | --- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
> | 🟢  | P3 — traducerea F8 pierdea spații la granița bold/formulă (`priliehavéak`) | Cauză confirmată: `.strip()` necondiționat pe fiecare secțiune tradusă în `_apply_translations_recursive` (`api/translate_text.py`), NU `math_protect.py` (ipoteza inițială a lui Roland, infirmată prin verificare). Fix: `_reattach_boundary_whitespace` — spațiul de graniță vine din SURSĂ, nu din provider. Reprodus 3/3 determinist ÎNAINTE de fix; live pe producție DUPĂ fix, pe document real (bold + formulă + tabel), confirmat independent de `auditor-dovezi` (bold + formulă via Playwright/API separat) + probă API sintetică suplimentară pt tabel |
>
> Poartă: `tsc 0 · jest 438/438 · build OK · pytest 104/104` (+15 teste noi, `test_translate_text_boundary.py`) — fără regresie (baseline consemnat ÎNAINTE de prima modificare: `89/89`, identic cu închiderea 4.5a).
>
> **Verdicte auditori:** regresie FĂRĂ REGRESIE (rulată independent + control negativ: fix revenit temporar → testele pică corect) · dovezi 6/6 puncte cerute CONFIRMAT (reprodus independent bold + formulă) · cerințe 7/8 ONORATĂ direct, 1 corectată imediat. **3 constatări, toate cu aceeași cauză** (probe de diagnostic scrise în scratchpad-ul de sesiune, nu în `scratchpad/` al proiectului) — corectate în aceeași sesiune, înainte de raport. Niciun defect de fix găsit.
>
> Cache invalidat pt traducerile vechi corupte: `translation-cache.ts` v3→v4, `sw.js` v73→v74.

> ### ✅ FAZA 4.5a — ÎNCHISĂ
>
> 6 reparații (P1, riscul „→ Editor", P4, P5, P6, P7), alese de Roland din lista strânsă la Faza 4,
> pe criteriu de risc (contenite, verificabile determinist — P3/P2 amânate la 4.5b). Plan complet:
> `docs/PLAN_FAZA4.5A_REPARATII_2026-09-10.md`.
>
> |     | Item                                     | Dovadă                                                                                                                                             |
> | --- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
> | 🟢  | P1 — Istoric nu se actualiza live        | `storage.ts` dispatch `history-updated` + `HistoryList.tsx` listener; live: conversie reală → Istoric fără reload, intrare instant                 |
> | 🟢  | Riscul „→ Editor" — no-op tăcut          | Coadă defensivă în `editor-commands.ts` (prag 4s, `E-EDIT-004` la expirare); live: click real din Teste → Editor 1→4 pagini, conținut corect       |
> | 🟢  | P4 — popup blocat, telemetrie mincinoasă | Link de rezervă + `reportFailure` obligatoriu; live: banner + `E-HIST-002` confirmat în Supabase (cod dedicat, corectat post-audit — vezi mai jos) |
> | 🟢  | P5 — mesaj Python brut + câmp nereset    | Backend mesaj românesc + frontend reset; live: `curl` direct pe API producție confirmă ambele                                                      |
> | 🟢  | P6 — avertisment lipsă la formă fixă+N>1 | Replicat pe Unește ȘI Dictare; live: avertisment galben înainte de click, pe ambele generatoare                                                    |
> | 🟢  | P7 — bold lângă formulă nerandat         | Placeholdere (tipar `math_protect.py`); live: `**b) $6\sqrt{3}$**` randat corect, specimen salvat în `Teste_Output`                                |
>
> Poartă: `tsc 0 · jest 438/438 · build OK · pytest 89/89` — fără regresie (baseline consemnat
> ÎNAINTE de prima modificare, la cererea lui Roland: `428/428` · `83/83`).
>
> **Verdicte auditori:** regresie FĂRĂ REGRESIE (rulată independent) · dovezi 7/7 CONFIRMAT
> (verificare live proprie, inclusiv `curl` pe API producție) · cerințe: cele 3 corecții explicite
> ale lui Roland ONORATE, dar **1 abatere reală găsită** — P4 reutiliza `E-HIST-001` (catalog scris
> pt DOCX, nu pt popup blocat) → **corectat imediat**, cod nou `E-HIST-002`, redeploy, re-verificat
> live.

> ### ✅ FAZA 2 — ÎNCHISĂ
>
> Trecută prin **5 runde** de audit independent (dovezi + regresie + cerințe). Verdict final:
> dovezi „se susține pe v71", regresie „FĂRĂ REGRESIE". Toate obiectivele 2.A–2.E dovedite live,
> plus defectele găsite pe parcurs (cache învechit, memorie plină, germană→slovacă, mesaje care
> mințeau, regresia mea din Planșe) reparate și verificate. Poartă: `tsc 0 · jest 428/428 ·
build OK · pytest 83/83 · planse sintaxă OK`.
>
> **DECIS de Roland (2026-09-09):** mutarea A5 — „mesaje acționabile pentru orice eroare, pe toate
> modulele" e onorată pe fluxurile centrale (9 locuri); extinderea sistematică pe fiecare buton
> **rămâne în Faza 3+4** (confirmat, nu se implementează separat acum — Faza 3 inventariază fiecare
> buton, Faza 4 îl auditează live; a face treaba acum ar însemna s-o refaci fără caietul de sarcini
> ca ghid). Vezi §„Cerințe MUTATE explicit".
>
> **Notă operațională (nu defect):** un utilizator cu tab-ul deschis din versiunea veche vede
> textul vechi până la reîncărcare (cache-lag normal de PWA). Fix-ul e livrat; propagarea la
> clienți cere un reload.

---

## Ordinea confirmată de Roland

```
1. FAZA 2    — riscul „originalul se pierde" ÎNTÂI, apoi bug-ul SK
2. FAZA 2.5  — cei trei agenți de audit
3. FAZA 3    — caietul de sarcini (viu, .md + .html cu căutare)
4. FAZA 4    — auditul real în browser, cu fișierele din Teste_Input
5. FAZA 4.5a — reparațiile contenite, risc redus (P1, „→ Editor", P4, P5, P6, P7) — ÎNCHISĂ
6. FAZA 4.5b — traducere F8 (P3, R-MATH) — ÎNCHISĂ
7. FAZA 4.5c — timeout lanț AI la Teste mari (P2) — izolată într-o fază proprie (defect LATENT,
   necesită măsurare pe providerul real înainte de fix — vezi Roland, decizia din 4.5b)
8. FAZA 5    — unificarea documentației + memorie + mediu nativ + /onboard
9. FAZA 6    — automatizarea + lista de pornire
```

---

## ✅ FAZA 1 — Repară orbirea diagnostică `ÎNCHISĂ`

|     | Item                                                                                                 | Dovadă                                                            |
| --- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 🟡  | Pâlnie unică de eșec (`lib/failure.ts`), **23 de fluxuri distincte** (26 de apeluri `reportFailure`) | _verificat în cod și prin teste, nu exersat live pe fiecare flux_ |
| 🟢  | 12 coduri noi la Faza 1 (catalog **17→29**; al 30-lea, E-NET-003, e din Faza 2), oglindă anti-drift  | `config/error_codes.json` ↔ `error-catalog.ts`                    |
| 🟢  | Grupare pe cod în `/diagnostics`                                                                     | `docs/dovada_faza1_grupare_incidente.jpg`                         |
| 🟢  | Mesaj onest pe ecran, cu cod vizibil (1b)                                                            | `docs/dovada_faza1_mesaj_onest.jpg`                               |
| 🟢  | Erată: 3 „fapte verificate" false, corectate                                                         | `docs/Erata_dovezi_2026-09-08.md`                                 |

---

## 🟡 FAZA 2 — Bug SK: reparare + posibilitatea de a reîncerca

Decizii: **2a** suport complet, traduce și tabelele · **2b** buton „Încearcă din nou" · **2c** SK+EN+DE
· mențiune: mesaje clare, care spun ce are de făcut Cristina · mențiune 2a: agenți de audit.

### Exersate LIVE pe producție

|     | Item                                                                        | Dovadă live                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🟢  | **2.A — originalul nu se mai pierde la reload**                             | Exersat de **6 ori**, pe v61, v63 și v65 (eu de 3, auditorul de dovezi de 3): document RO → tradus → reload → apăs RO → textul românesc revine integral, inclusiv corecturile. Captură: `docs/dovezi/dovada_2A_original_recuperat.png`                                                                                                                                                                                           |
| 🟢  | **2.B — eșecul de traducere e RECUPERAT automat** _(nu „reparat la sursă")_ | Auditorul a citit rândurile din Supabase: **4 rânduri `warn E-NET-003`**, `status: 200`, `recovered: true`, `trimmedBytes: 187`. **Corecție de formulare:** runtime-ul Vercel Python **scurge în continuare** framing la cold start (auditorul a prins un corp care începe literal cu `x-vercel-internal-timing: bootst…`). Ce funcționează e curățarea client-side din `readJson`. Serverul nu e reparat — clientul nu mai cade |
| 🟢  | **2.C — buton „Încearcă din nou"**                                          | Secvența completă, exersată de două ori independent: rețea tăiată → mesaj + buton; rețea revenită → **apăsat** → traducerea reușește (EN la mine, DE la auditor), eroarea se stinge                                                                                                                                                                                                                                              |
| 🟢  | **2.D — tabelele, pe SK + EN + DE**                                         | Tabel 3×3 inserat live și comutat pe toate trei: SK „Názov uhla" / „Ostrý uhol", DE „Bezeichnung des Winkels", EN „Name of the angle"; structura intactă (**1 tabel, 3 `th`, 6 `td`**). Captură (EN): `docs/dovezi/dovada_2D_tabel_tradus_EN.png`                                                                                                                                                                                |
| 🟢  | **2.E — mesaje care spun ce are de făcut**                                  | Text exact, citit de pe ecran: _„Traducerea nu a ajuns la server. Așteaptă ~5 secunde și apasă «Încearcă din nou». (cod E-TRANS-001)"_; eroarea a ajuns în Supabase la `level=error`, cu `kind`, cauză și fragment                                                                                                                                                                                                               |
| 🟢  | **Cache-ul nu mai servește o traducere învechită**                          | Infirmat o dată, apoi reparat. Auditorul a reprodus pe v65 cu **contra-probă**: cu editare ⇒ pleacă un POST real și corectura apare tradusă; fără editare ⇒ **zero cereri**, instant (cota DeepL protejată). `docs/dovezi/dovada_cache_dupa_reload_v64.jpg` (proba mea, v64) + `docs/dovezi/dovada_cache_dupa_reload_v65_auditor.png` (proba auditorului, v65)                                                                   |
| 🟢  | **Eroarea veche nu mai rămâne lipită de o comutare reușită**                | Exersat live de auditor                                                                                                                                                                                                                                                                                                                                                                                                          |
| 🟢  | 2.F.1 — poartă completă                                                     | `tsc 0` · `jest 428/428` · `build OK` · `pytest 83/83`. Rulată independent și de auditorul de regresie. **Acoperă acum și `public/planse/`**, care era complet în afara ei                                                                                                                                                                                                                                                       |
| 🟢  | 2.F.2 — deploy + verificare live                                            | Frontend **v67**, backend livrat. _(Notă: `/api/health` raportează commit-ul backendului, care rămâne în urmă când modific doar frontendul — `git diff <acel commit>..HEAD -- api/` gol înseamnă că e la zi funcțional.)_                                                                                                                                                                                                        |

### Verificate în cod și în pachetul livrat, NEEXERSATE live

|     | Item                                                  | Ce s-a verificat                                                                                                                                                                                                                                                       |
| --- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🟡  | Germana nu mai revine în slovacă (NLLB)               | `de: "deu_Latn"`; `nllb_codes()` aruncă pe limbi nesuportate; lanțul prinde excepția și trece la providerul următor. **8 teste.** Nedovedibil din exterior: DeepL servește `de`, deci o cerere reală nu ajunge la NLLB. Live s-a confirmat doar că DE întoarce germană |
| 🟡  | Pâlnia nu mai distruge sfatul bun (`UserFacingError`) | 4 teste, inclusiv garda inversă. Cablat în 9 locuri (Teste, Chat, import Editor, Convertor, Istoric). Neexersat live pe o poză prea mare / un format nesuportat                                                                                                        |
| 🟡  | Planșe spune când lotul e incomplet                   | Cablat în toate cele 6 generatoare, cu mesaj și în afara barei ascunse. Lotul incomplet apare doar la un bug de generare — greu de declanșat deliberat                                                                                                                 |

---

## Defecte găsite de auditori și reparate

|     | Ce                                                                         | Cum a fost prins                                                                                                                                                                                                                                                                                     |
| --- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🟢  | **Garda de cache se prăbușea după reload**                                 | Auditorul de dovezi, reprodus de 3 ori live pe v63. Traseul realist: traduci, închizi, revii a doua zi, corectezi, apeși SK ⇒ primeai traducerea veche, tăcut                                                                                                                                        |
| 🟢  | **Document doar cu formule: comuta limba în tăcere ȘI consuma cotă DeepL** | Auditorul a pus o singură formulă și a apăsat SK. Garda se uita la `sections.length`, dar `$x^2$` **e** o secțiune. `hasTranslatableText()` scoate întâi matematica, apoi caută o literă. 4 teste                                                                                                    |
| 🟢  | **Memorie plină: originalul NU se salva, dar scria „✓ salvat"**            | Auditorul a umplut `localStorage`. `E-EDIT-003` ajungea în jurnal, utilizatorul nu afla nimic, iar la reload originalul se pierdea **exact ca înainte de 2.A**. Acum `saveSourceSnapshot` întoarce `false`, iar comutarea de limbă se **refuză** cu mesaj: „Exportă documentul ÎNAINTE de a traduce" |
| 🟢  | **Germana revenea în slovacă (NLLB)**                                      | Auditorul de cerințe, verificând decizia 2c. `.get(target, "slk_Latn")` întorcea slovacă cu status 200. Acum limbile nesuportate aruncă                                                                                                                                                              |
| 🟢  | **Mesaj generic fals pe căile care aruncă deliberat**                      | Auditorul de cerințe, în două runde: prima în Teste/Chat, a doua pe fluxul central al Editorului (import fișier prea mare, eroare OCR de la server, format nesuportat prin drag&drop) + Convertor + Istoric                                                                                          |
| 🟢  | **Istoric: DOCX descărcat fără curățare de framing binar**                 | Auditorul de dovezi. Convertorul curăța, Istoricul nu — același bug, un modul acoperit. Helper-ul e acum în `lib/binary-framing.ts`, folosit de amândouă                                                                                                                                             |
| 🟢  | **Insigna de versiune dădea alarmă falsă permanentă**                      | Compara sha-ul frontendului cu `build_version` al backendului — proiecte livrate independent. Acum semnalul vine din `SW_UPDATED`                                                                                                                                                                    |
| 🟢  | **Sonda de versiune putea inunda jurnalul**                                | Auditorul de regresie: `/api/health` la 30s prin `readJson` ar fi scris un `warn` la fiecare sondă                                                                                                                                                                                                   |
| 🟢  | `de` lipsă la Groq/OpenRouter **și** în `ocr_structured.py`                | Al doilea și al treilea sit al aceleiași capcane                                                                                                                                                                                                                                                     |
| 🟢  | R-LANG: identificatori și chei de log în engleză                           | Migrarea se vede în datele din Supabase: rândurile vechi au `corpLen`/`recuperat`, cele noi `bodyLen`/`recovered`                                                                                                                                                                                    |

---

## 🔴 O regresie introdusă de MINE, livrată în producție

Scriptul cu care am inserat nota de lot incomplet în Planșe a folosit variabila `nr` în toate cele
6 generatoare. `nr` există **doar** în labirint; celelalte cinci folosesc `np`. Rezultat:
`ReferenceError` în 5 din 6, **live pe producție de la v63**. Excepția se arunca înainte de
`actions.style.display = "flex"`, deci planșele apăreau pe ecran dar bara cu „Print / PDF" și
„Adaugă în coș" rămânea ascunsă — inutilizabile.

**Poarta a rămas verde peste tot.** `tsc` nu vede `public/**`, `jest` nu îl vedea, iar
`eslint.config.mjs` îl ignoră explicit. Patru comenzi verzi peste un modul rupt.

|     | Ce am făcut                                                                                                                                                                                                                        |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🟢  | `np` la cele 5 linii; labirintul rămâne `nr`. Verificat pe producție: 1 `nr` + 5 `np`                                                                                                                                              |
| 🟢  | **Poarta vede acum Planșe**: `planse-smoke.test.ts` încarcă modulul în jsdom și apasă „Generează" pe toate cele 6 generatoare (7 teste). **Control negativ rulat:** cu bug-ul reintrodus, testul pică exact pe generatorul stricat |
| 🟢  | Dovadă live pe v66, generator „Căutare" (unul dintre cele rupte): „2 careuri · seed bază 3814030881", butoanele vizibile. `docs/dovezi/dovada_planse_reparat_v66.jpg`                                                              |
| 🟢  | `notaLot`: avertismentul se scria în `meta`, care e **înăuntrul** barei ascunse — deci în cazul cel mai grav (0 din 5) era invizibil. Acum scrie și în afara barei                                                                 |

**Lecția, mai importantă decât bug-ul:** o poartă verde nu înseamnă nimic pentru codul pe care
poarta nu-l vede.

---

## Cerințe MUTATE explicit în faze următoare (nu sărite)

**Mențiunea lui Roland la FAZA 2**, citată exact:

> „pentru orice eroare aparuta sau vreu setare stabilita de noi, cristina cand apasa pe sk de
> exemplu sa ii scrie acolo clar ca trebuie sa mai apese odata, sau ca este o eroare, sau sa
> reincerce in 5 secunde"

- **Exemplul din mențiune (butonul SK)** → ONORAT, dovedit live.
- **Cele 9 locuri unde codul știa ce e greșit** (Teste, Chat, import Editor, Convertor, Istoric)
  → REPARATE aici, nu amânate.
- **„orice eroare / orice setare stabilită de noi", pe TOATE modulele** → rămâne de acoperit
  sistematic în **Faza 3** (caiet de sarcini, buton cu buton) + **Faza 4** (audit modul cu modul).
  _Corecție față de versiunea anterioară a acestui document: motivația scrisă atunci — „decizia 2a
  e delimitată la traducere" — era **falsă**. 2a e despre adâncimea traducerii, nu despre mesaje.
  Motivul real e volumul: mecanismul există, dar parcurgerea tuturor modulelor buton cu buton E
  Faza 3-4._ **Roland a confirmat mutarea (2026-09-09)** — vezi și blocul de sus.

---

## O greșeală a mea, consemnată

Am scris în acest fișier că 2.F.2 e **🔴 BLOCAT** și că „producția rulează v58". Era adevărat când
am scris-o, dar **am deployat imediat după și nu am actualizat rândul** — auditorul l-a găsit
spunându-i lui Roland să facă `vercel login` pentru ceva deja livrat. Apoi s-a repetat, mai mic:
cât a durat un audit, producția a trecut v61→v63 și tabloul a rămas pe v61. Un tablou „viu" care
rămâne în urmă minte la fel de rău ca documentația veche.

---

## 🟢 FAZA 2.5 — Cei trei agenți de audit

|     | Item                                         | Dovadă                                                                                                                                                                                                                                                                                                                                                                                                           |
| --- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🟢  | `auditor-dovezi`                             | Trei rulări. A prins că dovada lui 2.D nu susținea afirmația, a găsit defectul de cache, l-a **infirmat** a doua oară după reload, apoi a găsit încă trei defecte live                                                                                                                                                                                                                                           |
| 🟢  | `auditor-regresie`                           | A rulat jest pe commit-ul anterior vs. acum — creștere reală. A prins că agenții nu erau comiși, riscul de inundare a jurnalului, și **regresia mea din Planșe**, invizibilă pentru poartă                                                                                                                                                                                                                       |
| 🟢  | `auditor-cerinte`                            | A găsit bug-ul `de`→slovacă, cele două tăceri, mesajul fals pe căile care aruncă deliberat (în două runde), și Planșe fără mesaj la lot incomplet                                                                                                                                                                                                                                                                |
| 🟢  | Regula R-AUDIT-FAZA + agenții, comiși în git | `.claude/agents/*.md`, `.claude/rules/project_rules.md`                                                                                                                                                                                                                                                                                                                                                          |
| 🟢  | **Golul de unelte, reparat**                 | Prima versiune le dădea `tools: Read, Grep, Glob, Bash` — adică `auditor-dovezi`, agentul creat ca să impună regula dovezii live în browser, **nu putea deschide un browser**. Găsit de el însuși, la a patra rulare. `auditor-dovezi` și `auditor-cerinte` moștenesc acum toate uneltele sesiunii; `auditor-regresie` păstrează deliberat `Read/Grep/Glob/Bash` — nu are nevoie de browser (poartă + citit cod) |
| 🟡  | Se încarcă sub numele lor ca agenți          | Claude Code îi citește la pornirea sesiunii; aici au rulat cu instrucțiunile injectate. **Condiția nu a fost încă testată** — nu „testată și picată". De confirmat la prima sesiune nouă                                                                                                                                                                                                                         |

---

## 🟢 FAZA 3 — Caiet de sarcini `ÎNCHISĂ (2026-09-09)`

Decizii: **3a** doar butoanele de execuție · **3b** inventar + confirmare live · **3c** `.md` **și** `.html`
cu căutare, editabil ca `Fazele.html` · mențiune: **fișier viu, auto-actualizabil**.
**Preia:** mesaje acționabile pe toate modulele (decizia A5, confirmată 2026-09-09).

**Livrat:** `docs/caiet_de_sarcini/data.json` (sursă unică) → `docs/caiet_de_sarcini.md` +
`docs/caiet_de_sarcini.html`, generate cu `docs/caiet_de_sarcini/generate.mjs`. **104 butoane de
execuție / 38 submodule / 8 module.** Fiecare rând: buton, ce execută, cum se testează, coduri de
eroare posibile, mesaj acționabil la eroare (A5), sursă (fișier:linie), status. Plan complet +
jurnal execuție: `docs/PLAN_FAZA3_CAIET_SARCINI_2026-09-09.md`.

**Metodă:** 8 subagenți secvențiali (unul per modul, nu fan-out paralel), fiecare a citit codul
sursă real și a produs inventarul; asamblat manual în `data.json` după fiecare, validat JSON +
regenerat `.md`/`.html` la fiecare pas. Sanity-check live (Chrome, `traduceri-frontend.vercel.app`)
pe toate cele 8 module — vezi jurnalul din plan pt detalii pe modul.

**`.html` are acum mecanism de adnotare** (cerut explicit de Roland, „exact cum facem in acest
html": Fazele.html) — textarea per buton, autosave `localStorage`, buton „💾 Descarcă mențiunile”
care exportă `caiet_de_sarcini_mentiuni.md` separat (NU modifică `data.json` — sursa de adevăr
rămâne curată). Verificat cu jsdom: search + autosave + restore + clear funcționează corect;
descărcarea (`URL.createObjectURL`) nu se poate simula în jsdom (limitare de mediu de test, nu a
codului — pattern identic cu `Fazele.html`, deja folosit real de Roland).

**Defecte reale găsite în timpul inventarierii** (read-only, nereparate — semnalate, nu e scopul
Fazei 3 să repare): buton „(” din Calculator cu label gol (confirmat live) · Teste: test cu barem
trunchiat livrat ca succes fără cod de eroare + o cale de eșec complet invizibilă pe /diagnostics
· Istoric: „Re-print PDF” loghează succes chiar dacă popup-ul a fost blocat · Planșe: generatoarele
Unește/Dictare cu formă fixă + >1 planșă cerută = lot incomplet GARANTAT (nu doar posibil) · Școlare:
o fișă poate fi livrată ca succes normal chiar dacă e o repetiție deja folosită (reroll epuizat
fără avertisment) + auto-continuare eșuată invizibilă la diagnostics + **cel mai grav: „➕ În
editor” poate pierde COMPLET conținutul fișei, silențios, dacă editorul TipTap nu s-a montat încă
în fereastra de 150ms** — recomandat ca prioritate pt Faza 4.

**Auditori (R-AUDIT-FAZA):**

- `auditor-regresie`: **FĂRĂ REGRESIE** — `tsc 0 · jest 428/428 · pytest 83/83 · build OK`, identic
  cu baseline Faza 2; niciun fișier din `frontend/`/`api/` atins.
- `auditor-dovezi`: **CONFIRMAT** pe eșantion >20 rânduri din toate cele 8 module (surse
  fișier:linie exacte, mesaje de eroare citate cuvânt cu cuvânt) + verificare live proprie pe Chat
  AI/Teste/Planșe/Școlare; **NEDOVEDIT**: submodulele Istoric cu date reale (profil de test fără
  intrări în localStorage) — rămâne `unverified`, de reluat la Faza 4 cu fișiere reale.
- `auditor-cerinte`: a găsit 4 abateri reale, toate corectate în aceeași sesiune, ÎNAINTE de STOP:
  (1) 5 rânduri nu erau butoane de execuție reale (formatare Bold/Italic/Aliniere — exemplul EXACT
  respins de Roland; deschide/închide căutare; selectare/ștergere fișier Convertor) → **eliminate**
  (109→104 butoane); (2) verificarea live 3b nu era scrisă nicăieri → **consemnată** în jurnalul
  planului; (3) lipsea mecanismul de editare cerut explicit („exact cum facem în acest html”) →
  **construit**, cu confirmarea lui Roland; (4) textul „auto-actualizabil” din antet supra-promitea
  → **reformulat onest** (regenerare fără drift ≠ auto-detectare de butoane noi din cod).

**Rămas pentru Faza 4** (nu Faza 3): audit funcțional real, cu fișierele din `Teste_Input`, modul cu
modul — inclusiv verificarea live a Istoricului cu date reale și investigarea riscului de pierdere
silențioasă la „➕ În editor” (Școlare).

## 🟢 FAZA 4 — Auditul real în browser `ÎNCHISĂ (2026-09-10)`

Decizii: **4a** fișiere reale din `99_Roland_Work\Teste_Input` → rezultate în `Teste_Output` ·
**4b** de la cel mai folosit modul la cel mai rar · **4c** notez și continui, reparăm la final.

|     | Ce                                                                                                | Dovadă                                                                                          |
| --- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 🟢  | Toate 8 modulele testate live (Editor în 3 loturi), 104 butoane cu status live în caiet           | `docs/caiet_de_sarcini/data.json` + `.md`/`.html` (câmp dovadă per buton); commit-uri per modul |
| 🟢  | Fișiere reale folosite (4a): 7 din `Teste_Input`, 12 rezultate noi în `Teste_Output`              | `99_Roland_Work/Teste_Output/` (gitignored); confirmat de auditor-cerințe + auditor-dovezi      |
| 🟢  | Ordinea 4b respectată: Școlare→Istoric→Editor→Teste→Chat→Convertor→Calculator→Planșe              | `git log f7ec15d..da3deb9`; confirmat de auditor-cerințe                                        |
| 🟢  | 16 defecte notate (4c, zero reparate), grupate pe cauză în 7 priorități + riscul „→ Editor"       | `docs/PLAN_FAZA4_AUDIT_REAL_2026-09-09.md` §Jurnal defecte + §Sinteză                           |
| 🟡  | Riscul „➕ In editor" (no-op 150ms) — testat 9×, NEREPRODUS; rămâne risc de cod, neconfirmat live | Jurnal #2; recomandare Faza 4.5: fix defensiv indiferent de reproducere                         |
| 🟢  | Cei 3 auditori: regresie FĂRĂ REGRESIE · cerințe TOATE ONORATE (1 abatere proces) · dovezi 12/4/1 | `docs/PLAN_FAZA4_AUDIT_REAL_2026-09-09.md` §Verdictele celor trei auditori                      |

## ⬜ FAZA 4.5 — Reparațiile din lista de la 4c

**Intrare:** lista P1-P7 + riscul „→ Editor" din `docs/PLAN_FAZA4_AUDIT_REAL_2026-09-09.md` §Sinteză.
Roland alege ce se repară și în ce ordine (propunerea e a mea, decizia e a lui).

## ⬜ FAZA 5 — Unificarea documentației

## ⬜ FAZA 6 — Automatizarea procesului

---

## Riscuri deschise

| Risc                                                      | Stare                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Traducere + reload = originalul se pierde                 | 🟢 reparat, exersat live de 6 ori                                                                                                                                                                                                                                                                                                                                                                                         |
| Eșec intermitent la traducere (cold start Vercel)         | 🟢 recuperat client-side, prins pe bug-ul real în producție. **Serverul scurge în continuare** — nu e reparat la sursă                                                                                                                                                                                                                                                                                                    |
| Cache pe limbă servea traducerea de dinainte de corectură | 🟢 reparat în două runde, cu contra-probă                                                                                                                                                                                                                                                                                                                                                                                 |
| Memorie plină → originalul nu se salva, în tăcere         | 🟢 reparat pe calea care contează: comutarea de limbă se refuză cu mesaj, magazia își eliberează întâi propria intrare veche și reîncearcă, iar insigna de salvare devine **alarmă vizibilă** pe desktop ȘI în bara slim de pe telefon (`MobileSaveAlarm`, v70 — auditorul prinsese că insigna mobilă trăia doar în Sheet-ul închis). Autosalvarea rămâne fail-open prin proiectare — dar nu mai e tăcută pe niciun ecran |
| Document doar cu formule → comuta tăcut + consuma cotă    | 🟢 reparat + 4 teste                                                                                                                                                                                                                                                                                                                                                                                                      |
| Germana revenea în slovacă prin NLLB                      | 🟡 reparat + 8 teste; nedovedibil live din exterior                                                                                                                                                                                                                                                                                                                                                                       |
| **Ceasul laptopului e cu o zi înainte**                   | 🔴 deschis — de reparat pe laptop. Afectează R-DIAG-AUTO și toate datele scrise în documentație                                                                                                                                                                                                                                                                                                                           |
| Mesaje neacționabile în modulele neatinse încă            | 🟡 mecanism gata, 9 locuri reparate; restul în Faza 3+4                                                                                                                                                                                                                                                                                                                                                                   |
