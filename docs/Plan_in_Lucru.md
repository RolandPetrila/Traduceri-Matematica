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

**Ultima actualizare:** ziua livrării Fazei 2 · **Producție:** frontend **v71** · **FAZA 2 ÎNCHISĂ** (5 runde de audit trecute) · **Următoarea:** FAZA 3

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
1. FAZA 2   — riscul „originalul se pierde" ÎNTÂI, apoi bug-ul SK
2. FAZA 2.5 — cei trei agenți de audit
3. FAZA 3   — caietul de sarcini (viu, .md + .html cu căutare)
4. FAZA 4   — auditul real în browser, cu fișierele din Teste_Input
5. FAZA 4.5 — reparațiile din lista strânsă la 4c
6. FAZA 5   — unificarea documentației + memorie + mediu nativ + /onboard
7. FAZA 6   — automatizarea + lista de pornire
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

## ⬜ FAZA 3 — Caiet de sarcini

Decizii: **3a** doar butoanele de execuție · **3b** inventar + confirmare live · **3c** `.md` **și** `.html`
cu căutare, editabil ca `Fazele.html` · mențiune: **fișier viu, auto-actualizabil**.
**Preia:** mesaje acționabile pe toate modulele.

## ⬜ FAZA 4 — Auditul real în browser

Decizii: **4a** fișiere reale din `99_Roland_Work\Teste_Input` → rezultate în `Teste_Output` ·
**4b** de la cel mai folosit modul la cel mai rar · **4c** notez și continui, reparăm la final.
**Preia:** proba pe fișe reale cu figuri (documentele grele ale Cristinei).

## ⬜ FAZA 4.5 — Reparațiile din lista de la 4c

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
