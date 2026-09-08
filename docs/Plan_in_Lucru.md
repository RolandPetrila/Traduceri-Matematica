# PLAN ÎN LUCRU — tablou de bord viu

> **Deschide-l oricând, inclusiv în mijlocul unei faze.** Se actualizează la fiecare sub-pas,
> nu la finalul fazei (recomandarea mea la 6b, confirmată de Roland 08.09.2026).
>
> Stări: ⬜ neînceput · 🟡 în lucru · 🟢 gata + dovadă · 🔴 blocat · ⏸️ amânat conștient
>
> **O căsuță devine 🟢 DOAR** dacă execuția e făcută ȘI verificată live ȘI dovada e scrisă în
> dreptul ei. Fără dovadă → rămâne 🟡. (Decizia 6a: „nimic gata fără dovadă live în browser".)
>
> **Distincția pe care o cer auditorii:** „exersat live" ≠ „verificat în cod și în pachetul livrat".
> A doua e reală și utilă, dar NU e dovadă live. Fiecare rând spune care dintre ele e.

**Ultima actualizare:** 08.09.2026, 10:2x · **Producție:** frontend **v66** · **Fază activă:** FAZA 2

---

## Ordinea confirmată de Roland (08.09.2026)

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

|     | Item                                                | Dovadă                                         |
| --- | --------------------------------------------------- | ---------------------------------------------- |
| 🟢  | Pâlnie unică de eșec (`lib/failure.ts`), 22 fluxuri | teste + cablare verificată                     |
| 🟢  | 12 coduri noi (catalog 17→30), oglindă anti-drift   | `config/error_codes.json` ↔ `error-catalog.ts` |
| 🟢  | Grupare pe cod în `/diagnostics`                    | `docs/dovada_faza1_grupare_incidente.jpg`      |
| 🟢  | Mesaj onest pe ecran, cu cod vizibil (1b)           | `docs/dovada_faza1_mesaj_onest.jpg`            |
| 🟢  | Erată: 3 „fapte verificate" false, corectate        | `docs/Erata_dovezi_2026-09-08.md`              |

---

## 🟡 FAZA 2 — Bug SK: reparare + posibilitatea de a reîncerca

Decizii: **2a** suport complet, traduce și tabelele · **2b** buton „Încearcă din nou" · **2c** SK+EN+DE
· mențiune: mesaje clare, care spun ce are de făcut Cristina · mențiune 2a: agenți de audit.

### Exersate LIVE pe producție

|     | Item                                               | Dovadă live                                                                                                                                                                                                                                                                                         |
| --- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🟢  | **2.A — originalul nu se mai pierde la reload**    | Exersat de **5 ori** (eu de 2, auditorul de dovezi de 3, pe v61 și v63): document RO → tradus → reload → apăs RO → textul românesc revine integral, inclusiv corecturile. Captură: `docs/dovezi/dovada_2A_original_recuperat.png`                                                                   |
| 🟢  | **2.B — bug SK reparat la sursă**                  | Prins pe bug-ul REAL: auditorul a citit rândurile din Supabase — **4 rânduri `warn E-NET-003`**, `flow: editor.translate`, `status: 200`, `recovered: true`, `trimmedBytes: 187`, `sample` conținând `x-vercel-internal-timing: bootstrap;dur=…`. Traducerea a ajuns corectă la ecran               |
| 🟢  | **2.C — buton „Încearcă din nou"**                 | Secvența completă, exersată: rețea tăiată → mesaj + buton; rețea revenită → **apăsat** → traducerea EN reușește, eroarea se stinge, limba devine `en`                                                                                                                                               |
| 🟢  | **2.D — tabelele, pe SK + EN + DE**                | Auditorul a inserat live un tabel 3×3 și a comutat pe toate trei: SK „Názov uhla", DE „Bezeichnung des Winkels", EN „Name of the angle"; structura intactă (**1 tabel, 3 `th`, 6 `td`**). Captură (EN): `docs/dovezi/dovada_2D_tabel_tradus_EN.png`. Separat, eu am dovedit SK/EN/DE pe text simplu |
| 🟢  | **2.E — mesaje care spun ce are de făcut**         | Text exact, citit de pe ecran: _„Traducerea nu a ajuns la server. Așteaptă ~5 secunde și apasă «Încearcă din nou». (cod E-TRANS-001)"_                                                                                                                                                              |
| 🟢  | **Cache-ul nu mai servește o traducere învechită** | **Infirmat o dată, apoi reparat.** Vezi secțiunea de mai jos                                                                                                                                                                                                                                        |
| 🟢  | 2.F.1 — poartă completă                            | `tsc 0` · `jest 414/414` · `build OK` · `pytest 83/83` — rulată și de auditorul de regresie, independent                                                                                                                                                                                            |
| 🟢  | 2.F.2 — deploy + verificare live                   | Frontend **v65** + backend, ambele livrate. `/api/health` confirmă backend-ul pe commit-ul curent                                                                                                                                                                                                   |

### Verificate în cod și în pachetul livrat, NEEXERSATE live

|     | Item                                                  | Ce s-a verificat                                                                                                                                                                                                                                                                            |
| --- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🟡  | Germana nu mai revine în slovacă (NLLB)               | `de: "deu_Latn"` în hartă; `nllb_codes()` aruncă pe limbi nesuportate; lanțul prinde excepția și trece la providerul următor. **8 teste.** Nedovedibil din exterior: DeepL servește `de`, deci o cerere reală nu ajunge la NLLB. Live s-a confirmat doar că DE întoarce germană, nu slovacă |
| 🟡  | Cele două tăceri la apăsarea pe SK                    | Textul „Nu am ce traduce…" e prezent în pachetul livrat în producție; golirea erorii la intrarea în `switchLanguage` e verificată în cod. Niciuna dintre cele două situații nu a fost declanșată live                                                                                       |
| 🟡  | Pâlnia nu mai distruge sfatul bun (`UserFacingError`) | 4 teste, inclusiv garda inversă (o eroare neprevăzută folosește în continuare mecanismul). Neexersat live pe o poză prea mare / ilizibilă                                                                                                                                                   |
| 🟡  | Planșe spune când lotul e incomplet                   | Cablat în toate cele 6 generatoare. Lotul incomplet apare doar la un bug de generare — greu de declanșat deliberat                                                                                                                                                                          |

---

## Defectul pe care auditorul l-a găsit și m-a infirmat

Marcasem 🟢 rândul „cache-ul nu mai servește o traducere învechită". Auditorul de dovezi l-a
**INFIRMAT live pe v63**, reproducându-l de trei ori.

Fixul era real, dar **se oprea la reload** — adică exact pe drumul pe care tocmai îl deschisese
reparația 2.A. După reload, provenienţa traducerii afișate era necunoscută, garda ieșea imediat,
iar vederea tradusă restaurată din autosalvare intra în cache ca valabilă pentru orice sursă:

```
reload (documentul afișat în SK) → apăs RO (originalul revine ✓)
→ adaug o corectură → apăs SK
⇒ traducerea VECHE, instant, fără cerere, fără mesaj. Corectura pierdută tăcut.
```

Traseul realist al Cristinei: traduce, închide, revine a doua zi, corectează o formulă, apasă SK.
Cele 4 teste treceau pentru că acopereau doar cazul din aceeași sesiune.

**Reparat și dovedit live pe v64**, cu exact scenariul lui: „Cercul are o raza." → SK → reload → RO
→ adaug „Diametrul este dublul razei." → SK ⇒ **„Kruh má polomer. / Priemer je dvojnásobok
polomeru."** Corectura ajunge în traducere. Captură: `docs/dovezi/dovada_cache_dupa_reload_v64.jpg`.
2 teste noi, pe scenariul de după reload.

---

## Alte remedieri născute din audit

|     | Ce                                                                                               | De unde a venit                                                                                                                                                                                                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🟢  | Ultima citire JSON care ocolea curățarea de framing (`convertor/page.tsx`, corpul de **eroare**) | Auditorul de dovezi. Fără ea se pierdea mesajul real al serverului și nu se scria niciun `E-NET-003`                                                                                                                                                                                                                          |
| 🟢  | Sonda de versiune nu mai poate inunda jurnalul                                                   | Auditorul de regresie: `/api/health` la 30s prin `readJson` ar fi scris un `warn` la fiecare sondă, în fiecare filă                                                                                                                                                                                                           |
| 🟢  | **Insigna de versiune nu mai dă alarmă falsă**                                                   | Auditorul de dovezi: compara sha-ul FRONTENDULUI cu `build_version` al BACKENDULUI — două proiecte livrate independent, care diverg normal ⇒ insignă roșie „reîncarcă" permanentă, pe care reload-ul nu o stingea. Acum semnalul vine de la service worker (`SW_UPDATED`), adică exact când reîncărcarea chiar aduce ceva nou |
| 🟢  | `de` adăugat și la Groq/OpenRouter                                                               | Auditorul de cerințe: aceeași formă cu bug-ul NLLB; acolo benign (prompt degradat), dar capcana rămânea armată                                                                                                                                                                                                                |
| 🟢  | R-LANG: identificatori și chei de log în engleză                                                 | Migrarea se vede în datele din Supabase: rândurile vechi au `corpLen`/`recuperat`, cele noi `bodyLen`/`recovered`                                                                                                                                                                                                             |

---

## Cerințe MUTATE explicit în faze următoare (nu sărite)

**Mențiunea lui Roland la FAZA 2**, citată exact:

> „pentru orice eroare aparuta sau vreu setare stabilita de noi, cristina cand apasa pe sk de
> exemplu sa ii scrie acolo clar ca trebuie sa mai apese odata, sau ca este o eroare, sau sa
> reincerce in 5 secunde"

- **Exemplul din mențiune (butonul SK)** → ONORAT în Faza 2, dovedit live.
- **„orice eroare / orice setare stabilită de noi", pe TOATE modulele** → decizia 2a e delimitată
  la traducere, deci nu încape aici. Mecanismul există acum (`UserFacingError`) și primele trei
  locuri au fost reparate (Teste OCR, Chat poză prea mare). Restul se face în **Faza 3** (caiet de
  sarcini, buton cu buton) + **Faza 4** (audit modul cu modul). Roland decide dacă acceptă mutarea.

---

## Limite declarate (NEDOVEDITE, nu ascunse)

- **Documente cu figuri (base64):** magazia scrie o a doua copie în `localStorage`. La
  `QuotaExceededError` se raportează `E-EDIT-003` și originalul **nu** se salvează — exact
  documentele care contează cel mai mult sunt cele unde fixul poate să nu țină. Ce ar închide:
  import fișă cu figuri din `Teste_Input` → traducere → reload → RO, fără `E-EDIT-003`. **Faza 4.**

---

## 🔴 O regresie introdusă de MINE, livrată în producție — și ce am schimbat ca să nu se repete

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
| 🟢  | `notaLot`: avertismentul se scria în `meta`, care e **înăuntrul** barei ascunse — deci în cazul cel mai grav (0 din 5) era invizibil. Acum scrie și în afara barei, și se șterge când lotul e complet                              |

**Lecția, mai importantă decât bug-ul:** o poartă verde nu înseamnă nimic pentru codul pe care
poarta nu-l vede. Auditorul de regresie a prins-o rulând el însuși generatoarele — exact ce nu
făcea niciun pas automat.

---

## O greșeală a mea, consemnată

Am scris în acest fișier că 2.F.2 e **🔴 BLOCAT** și că „producția rulează v58". Era adevărat când
am scris-o, dar **am deployat imediat după și nu am actualizat rândul** — auditorul l-a găsit
spunându-i lui Roland să facă `vercel login` pentru ceva deja livrat. Apoi s-a repetat, mai mic:
cât a durat auditul, producția a trecut v61→v63 și tabloul a rămas pe v61. Un tablou „viu" care
rămâne în urmă minte la fel de rău ca documentația veche.

---

## 🟢 FAZA 2.5 — Cei trei agenți de audit

|     | Item                                         | Dovadă                                                                                                                                                                                   |
| --- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🟢  | `auditor-dovezi`                             | Două rulări. A prins că dovada lui 2.D nu susținea afirmația, a găsit defectul de cache **și** l-a infirmat a doua oară, live                                                            |
| 🟢  | `auditor-regresie`                           | A rulat jest pe commit-ul anterior (384) vs. acum — creștere reală. A prins că agenții nu erau comiși și riscul de inundare a jurnalului                                                 |
| 🟢  | `auditor-cerinte`                            | A găsit bug-ul `de`→slovacă, cele două tăceri, mesajul fals pe căile care aruncă deliberat, și Planșe fără mesaj la lot incomplet                                                        |
| 🟢  | Regula R-AUDIT-FAZA + agenții, comiși în git | `.claude/agents/*.md`, `.claude/rules/project_rules.md`                                                                                                                                  |
| 🟡  | Se încarcă sub numele lor ca agenți          | Claude Code îi citește la pornirea sesiunii; aici au rulat cu instrucțiunile injectate. **Condiția nu a fost încă testată** — nu „testată și picată". De confirmat la prima sesiune nouă |

---

## ⬜ FAZA 3 — Caiet de sarcini

Decizii: **3a** doar butoanele de execuție · **3b** inventar + confirmare live · **3c** `.md` **și** `.html`
cu căutare, editabil ca `Fazele.html` · mențiune: **fișier viu, auto-actualizabil**.
**Preia:** mențiunea A5 (mesaje acționabile pe toate modulele).

## ⬜ FAZA 4 — Auditul real în browser

Decizii: **4a** fișiere reale din `99_Roland_Work\Teste_Input` → rezultate în `Teste_Output` ·
**4b** de la cel mai folosit modul la cel mai rar · **4c** notez și continui, reparăm la final.
**Preia:** limita `QuotaExceededError` pe documente cu figuri.

## ⬜ FAZA 4.5 — Reparațiile din lista de la 4c

## ⬜ FAZA 5 — Unificarea documentației

## ⬜ FAZA 6 — Automatizarea procesului

---

## Riscuri deschise

| Risc                                                                    | Stare                                                                                                                                        |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Traducere + reload = originalul se pierde                               | 🟢 reparat, exersat live de 5 ori                                                                                                            |
| Eșec intermitent la traducere (cold start Vercel)                       | 🟢 reparat, prins pe bug-ul real în producție                                                                                                |
| Cache pe limbă servea traducerea de dinainte de corectură               | 🟢 reparat în două runde, dovedit live pe v64                                                                                                |
| Germana revenea în slovacă prin NLLB                                    | 🟡 reparat + 8 teste; nedovedibil live din exterior                                                                                          |
| `QuotaExceededError` pe documente cu figuri → originalul nu se salvează | 🔴 deschis, netestat — Faza 4                                                                                                                |
| **Marcajele de timp din jurnal sunt cu ~24h în urmă**                   | 🔴 deschis, semnalat de auditor. Ordinea relativă e corectă, data absolută nu. Contează pentru R-DIAG-AUTO, care filtrează „log-uri recente" |
| Mesaje neacționabile în restul modulelor (mențiunea A5)                 | 🟡 mecanism gata, 3 locuri reparate; restul în Faza 3+4                                                                                      |
