# PLAN ÎN LUCRU — tablou de bord viu

> **Deschide-l oricând, inclusiv în mijlocul unei faze.** Se actualizează la fiecare sub-pas,
> nu la finalul fazei (recomandarea mea la 6b, confirmată de Roland 08.09.2026).
>
> Stări: ⬜ neînceput · 🟡 în lucru · 🟢 gata + dovadă · 🔴 blocat · ⏸️ amânat conștient
>
> **O căsuță devine 🟢 DOAR** dacă execuția e făcută ȘI verificată live ȘI dovada e scrisă în
> dreptul ei. Fără dovadă → rămâne 🟡. (Decizia 6a: „nimic gata fără dovadă live în browser".)

**Ultima actualizare:** 08.09.2026, 05:0x · **Fază activă:** FAZA 2 — remediere după auditori

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
| 🟢  | Pâlnie unică de eșec (`lib/failure.ts`), 22 fluxuri | `jest`, cablare verificată                     |
| 🟢  | 12 coduri noi (catalog 17→29), oglindă anti-drift   | `config/error_codes.json` ↔ `error-catalog.ts` |
| 🟢  | Grupare pe cod în `/diagnostics`                    | `docs/dovada_faza1_grupare_incidente.jpg`      |
| 🟢  | Mesaj onest pe ecran, cu cod vizibil (1b)           | `docs/dovada_faza1_mesaj_onest.jpg`            |
| 🟢  | Erată: 3 „fapte verificate" false, corectate        | `docs/Erata_dovezi_2026-09-08.md`              |

---

## 🟡 FAZA 2 — Bug SK: reparare + posibilitatea de a reîncerca

Decizii: **2a** suport complet, traduce și tabelele · **2b** buton „Încearcă din nou" · **2c** SK+EN+DE
· mențiune: mesaje clare, care spun ce are de făcut Cristina · mențiune 2a: agenți de audit.

|     | Item                                            | Dovadă                                                                                                                                                                                                                                                                                                                                                                              |
| --- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🟢  | **2.A — originalul nu se mai pierde la reload** | **Verificat live pe producție, de două ori independent.** Eu: document RO → SK (tradus corect) → reload → RO → textul românesc revine integral. Auditorul de dovezi, separat, cu propria frază de test + captură: `docs/dovezi/dovada_2A_original_recuperat.png`. „Document nou" șterge corect magazia (`snapshotSters: true`). Cod: `lib/editor-source-store.ts`, 7 teste          |
| 🟢  | **2.B — bug SK reparat la sursă**               | **Prins pe bug-ul REAL, nu pe fixture:** în timpul unei traduceri pe producție s-a logat `warn E-NET-003 · "Unexpected token 'x', \"x-vercel-i\"…" · {recovered:true, trimmedBytes:187, status:200}` — `readJson` a tăiat 187 octeți de framing Vercel și traducerea a ajuns corectă la ecran. 6 teste. Cablat acum în **toate** citirile JSON de la API-ul Python                  |
| 🟢  | **2.C — buton „Încearcă din nou"**              | Eșec forțat prin interceptarea `fetch` → butonul apare; `fetch` restaurat → apăsat → traducerea reușește, eroarea se stinge. Captură: `docs/dovezi/dovada_2C_2E_mesaj_si_retry.png`                                                                                                                                                                                                 |
| 🟢  | **2.D — tabelele, pe SK + EN + DE**             | **Dovada inițială (test unitar) NU susținea afirmația** — nu atingea nicio limbă și niciun `tableHeader`. Dovada reală, live: tabel 3×3 inserat din bară, tradus în SK („Ostrý uhol"), DE („Spitzer Winkel"), EN („Acute angle"), structură intactă (1 tabel, 3 `th`, 6 `td`). Captură: `docs/dovezi/dovada_2D_tabel_tradus_EN.png`. Plus proba mea pe text: SK/EN/DE toate corecte |
| 🟢  | **2.E — mesaje care spun ce are de făcut**      | Text exact pe ecran: _„Traducerea nu a ajuns la server. Așteaptă ~5 secunde și apasă «Încearcă din nou». (cod E-TRANS-001)"_ — cauză + acțiune + cod                                                                                                                                                                                                                                |
| 🟢  | 2.F.1 — poartă completă                         | `tsc 0` · `jest 406/406` · `build OK` · `pytest 83/83`                                                                                                                                                                                                                                                                                                                              |
| 🟡  | 2.F.2 — deploy + verificare live                | Frontend **v60** + backend livrate și verificate live (SK/EN/DE, 2.A). **Reparațiile de după auditori (cache învechit + ultimele 2 citiri JSON) NU sunt încă livrate** — se redeployează acum                                                                                                                                                                                       |

### Remedieri născute din auditul fazei (toate în cod, poartă verde)

|     | Ce                                                                                             | De unde a venit                                                                                                                                                                                                      |
| --- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🟡  | **Cache-ul nu mai servește o traducere învechită** (`lib/translation-cache-guard.ts`, 4 teste) | Defect găsit **live** de auditorul de dovezi: traduci SK → revii pe RO → corectezi → apeși SK ⇒ primeai versiunea de dinainte de corectură, tăcut. ⏳ dovadă live după redeploy                                      |
| 🟢  | **Germana nu mai revine în slovacă** (`NLLB_LANG_MAP` + `nllb_codes()`, 8 teste)               | Auditorul de cerințe, verificând decizia 2c: `de` lipsea din hartă, iar `.get(target, "slk_Latn")` întorcea SLOVACĂ cu status 200. Acum limbile nesuportate **aruncă**, ca lanțul să cadă pe alt provider            |
| 🟢  | **Două tăceri la apăsarea pe SK**                                                              | (1) document fără text traductibil: butonul se aprindea, zero mesaj → acum i se scrie și limba nu se schimbă; (2) eroarea veche + butonul de retry rămâneau lipite de o comutare care reușise → se golesc la intrare |
| 🟢  | R-LANG: identificatori și chei de log în engleză                                               | `recovered`, `trimmedBytes`, `bodyLen`, `purpose`, `hint`, `currentView`, `displayed`, `validSource`                                                                                                                 |

### Limite declarate (NEDOVEDITE, nu ascunse)

- **Documente cu figuri (base64):** magazia scrie o a doua copie în `localStorage`. La
  `QuotaExceededError` se raportează `E-EDIT-003` și originalul **nu** se salvează — adică exact
  documentele care contează cel mai mult sunt cele unde fixul poate să nu țină. Ce ar închide:
  import fișă cu figuri din `Teste_Input` → traducere → reload → RO, fără `E-EDIT-003`. **Intră în Faza 4.**

### O greșeală a mea, consemnată

Am scris în acest fișier că 2.F.2 e **🔴 BLOCAT** și că „producția rulează v58". Era adevărat când
am scris-o, dar **am deployat imediat după și nu am actualizat rândul** — auditorul l-a găsit
spunându-i lui Roland să facă `vercel login` pentru ceva deja livrat. Un tablou „viu" care rămâne
în urmă e exact genul de documentație care minte, împotriva căruia există acest fișier.

---

## 🟢 FAZA 2.5 — Cei trei agenți de audit

|     | Item                                         | Dovadă                                                                                                                                                         |
| --- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🟢  | `auditor-dovezi`                             | A rulat pe Faza 2: 6 CONFIRMAT / 1 INFIRMAT. A prins că dovada lui 2.D nu susținea afirmația și a găsit un defect nou, live                                    |
| 🟢  | `auditor-regresie`                           | A rulat jest **efectiv pe commit-ul anterior** (384) vs. acum (402) — creștere reală, nu aritmetică. Verdict: FĂRĂ REGRESIE. A prins că agenții nu erau comiși |
| 🟢  | `auditor-cerinte`                            | A găsit 4 abateri reale, inclusiv bug-ul `de`→slovacă din backend                                                                                              |
| 🟢  | Regula R-AUDIT-FAZA + agenții, comiși în git | `.claude/agents/*.md`, `.claude/rules/project_rules.md`                                                                                                        |
| 🟡  | Se încarcă sub numele lor ca agenți          | Claude Code îi citește la pornirea sesiunii; în sesiunea care i-a creat au rulat cu instrucțiunile injectate. ⏳ de confirmat la prima sesiune nouă            |

---

## ⬜ FAZA 3 — Caiet de sarcini

Decizii: **3a** doar butoanele de execuție · **3b** inventar + confirmare live · **3c** `.md` **și** `.html`
cu căutare, editabil ca `Fazele.html` · mențiune: **fișier viu, auto-actualizabil**.

## ⬜ FAZA 4 — Auditul real în browser

Decizii: **4a** fișiere reale din `99_Roland_Work\Teste_Input` → rezultate în `Teste_Output` ·
**4b** de la cel mai folosit modul la cel mai rar · **4c** notez și continui, reparăm la final.

## ⬜ FAZA 4.5 — Reparațiile din lista de la 4c

## ⬜ FAZA 5 — Unificarea documentației

## ⬜ FAZA 6 — Automatizarea procesului

---

## Riscuri deschise

| Risc                                                                    | Stare                                           |
| ----------------------------------------------------------------------- | ----------------------------------------------- |
| Traducere + reload = originalul se pierde                               | 🟢 reparat, dovedit live de două ori            |
| Eșec intermitent la traducere (cold start Vercel)                       | 🟢 reparat, prins pe bug-ul real în producție   |
| Germana revenea în slovacă prin NLLB, tăcut                             | 🟢 reparat + 8 teste                            |
| Cache pe limbă servea traducerea de dinainte de corectură               | 🟡 reparat în cod, ⏳ dovadă live după redeploy |
| `QuotaExceededError` pe documente cu figuri → originalul nu se salvează | 🔴 deschis, netestat — intră în Faza 4          |
