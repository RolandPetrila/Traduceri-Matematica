# PLAN ÎN LUCRU — tablou de bord viu

> **Deschide-l oricând, inclusiv în mijlocul unei faze.** Se actualizează la fiecare sub-pas,
> nu la finalul fazei (recomandarea mea la 6b, confirmată de Roland 08.09.2026).
>
> Stări: ⬜ neînceput · 🟡 în lucru · 🟢 gata + dovadă · 🔴 blocat · ⏸️ amânat conștient
>
> **O căsuță devine 🟢 DOAR** dacă execuția e făcută ȘI verificată live ȘI dovada e scrisă în
> dreptul ei. Fără dovadă → rămâne 🟡. (Decizia 6a: „nimic gata fără dovadă live în browser".)

**Ultima actualizare:** 08.09.2026, 04:1x · **Fază activă:** FAZA 2 — cod gata, **deploy blocat pe `vercel login`**

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

|     | Item                                            | Dovadă                                        |
| --- | ----------------------------------------------- | --------------------------------------------- |
| 🟢  | Pâlnie unică de eșec (`lib/failure.ts`)         | 22 fluxuri cablate, `jest 384/384`            |
| 🟢  | 12 coduri noi (catalog 17→29), oglindă generată | `config/error_codes.json`, `error-catalog.ts` |
| 🟢  | Grupare pe cod în `/diagnostics`                | `docs/dovada_faza1_grupare_incidente.jpg`     |
| 🟢  | Mesaj onest pe ecran, cu cod vizibil (1b)       | `docs/dovada_faza1_mesaj_onest.jpg`           |
| 🟢  | Deploy v57/v58 + verificare live pe producție   | `docs/dovada_faza1_diagnostics.jpg`           |
| 🟢  | Erată: 3 „fapte verificate" false, corectate    | `docs/Erata_dovezi_2026-09-08.md`             |

---

## 🟡 FAZA 2 — Bug SK: reparare + posibilitatea de a reîncerca `ÎN LUCRU`

Deciziile lui Roland: **2a** suport complet, traduce și tabelele · **2b** buton „Încearcă din nou"
· **2c** SK + EN + DE · mențiune: mesaje clare, care spun ce are de făcut Cristina.

|     | Item                                                                                                                | Stare / dovadă                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🟡  | **2.A — Originalul nu se mai pierde la reload** (prioritatea 1, mai grav decât SK: pierdere de muncă, ireversibilă) | Cod scris: `lib/editor-source-store.ts` salvează separat documentul-SURSĂ + limba lui, exact în momentul în care se pleacă din limba-sursă. La reload, originalul se repune în cache → butonul RO îl readuce instant. Șters la „Document nou"/înlocuire. **7 teste** în `editor-source-store.test.ts`, inclusiv scenariul real RO→SK→reload. ⏳ rămâne dovada live                                                                                                                                                                     |
| 🟡  | 2.B — Bug SK: curăț framing-ul Vercel scurs în corpul JSON                                                          | Cod scris: `lib/json-response.ts` (`readJson`) taie gunoiul dinaintea primului `{`/`[` și reia parsarea; recuperarea se logează la `warn` cu **E-NET-003** (cod nou, catalog 29→30). Cablat în traducere + OCR (import, Teste, Chat) + cota DeepL. **6 teste**, unul reproducând corpul real observat pe producție. ⏳ rămâne dovada live                                                                                                                                                                                              |
| 🟡  | 2.C — Buton „Încearcă din nou" pe eșecul de traducere                                                               | Cod scris: contextul reține `failedTarget`, butonul reia exact limba care a picat. **Rupe lanțul cu 2.A**: înainte, singura reîncercare era reîncărcarea paginii — iar reload-ul pierdea originalul. ⏳ rămâne dovada live                                                                                                                                                                                                                                                                                                             |
| 🟢  | 2.D — Traducerea acoperă și tabelele, pe SK + EN + DE                                                               | **Mergea deja** — dovedit, nu presupus: `editor-translate-tables.test.ts` (5 teste) arată că textul din celule intră la traducere, structura tabelului se păstrează (R-LAYOUT) și formulele rămân intacte (R-MATH). Comentariul din cod susținea contrariul → **era fals, l-am corectat**                                                                                                                                                                                                                                              |
| 🟡  | 2.E — Mesaje care spun ce are de făcut, nu doar că a eșuat                                                          | Cod scris: mesaj per cauză reală — „serverul a pornit greu… apasă Încearcă din nou", „așteaptă ~5 secunde", „documentul e mare… împarte-l în două". Codul erorii rămâne vizibil (1b). ⏳ rămâne dovada live                                                                                                                                                                                                                                                                                                                            |
| 🟢  | 2.F.1 — Poartă completă                                                                                             | `tsc 0` · `jest 402/402` (+18 teste noi) · `build OK` · `pytest 75/75`                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 🔴  | 2.F.2 — Deploy + verificare live pe producție                                                                       | **BLOCAT — are nevoie de Roland.** Codul e pe GitHub (`576ff5a`, ramura `faza-g-editor`), dar CLI-ul Vercel nu mai are credențiale în terminal: `No existing credentials found`. Auto-deploy din GitHub NU s-a declanșat (livrările anterioare erau tot prin CLI, cu `actor: claude-code…agent`). **Deblocare:** Roland rulează `! vercel login` în sesiune, apoi reiau `vercel deploy --prod` + verificarea live. Producția rulează în continuare **v58** (Faza 1) — nimic stricat, doar reparațiile Fazei 2 nu sunt încă la Cristina |

---

## ⬜ FAZA 2.5 — Cei trei agenți de audit `NEÎNCEPUTĂ`

|     | Item                                                                               |
| --- | ---------------------------------------------------------------------------------- |
| ⬜  | `auditor-dovezi` — respinge orice bifă fără dovadă reală                           |
| ⬜  | `auditor-regresie` — rulează poarta completă, verifică că nu s-a stricat ce mergea |
| ⬜  | `auditor-cerinte` — compară livrarea cu deciziile din `Fazele_mentiuni_Roland.md`  |
| ⬜  | Rulează automat la finalul fiecărei faze, înainte de raportul către Roland         |

---

## ⬜ FAZA 3 — Caiet de sarcini `NEÎNCEPUTĂ`

Decizii: **3a** doar butoanele de execuție · **3b** inventar + confirmare live · **3c** `.md` **și**
`.html` cu căutare și editabil ca `Fazele.html` · mențiune: **fișier viu, auto-actualizabil**.

## ⬜ FAZA 4 — Auditul real în browser `NEÎNCEPUTĂ`

Decizii: **4a** fișiere reale din `99_Roland_Work\Teste_Input` → rezultate în `Teste_Output` ·
**4b** de la cel mai folosit modul la cel mai rar · **4c** notez și continui, reparăm la final.

## ⬜ FAZA 4.5 — Reparațiile din lista de la 4c `NEÎNCEPUTĂ`

## ⬜ FAZA 5 — Unificarea documentației `NEÎNCEPUTĂ`

Decizii: **5a** documentele vechi în `docs/arhiva/` · **5b** rezumat per fază cu linkuri ·
**5c** cronologic + index pe module · mențiune: memorie anti-recidivă + mediu nativ Claude Code +
`/onboard` cu sesiuni AskUserQuestion.

## ⬜ FAZA 6 — Automatizarea procesului `NEÎNCEPUTĂ`

Decizii: **6a** nimic gata fără dovadă live · **6b** raport după fiecare fază + acest tablou live ·
**6c** listă de pornire.

---

## Riscuri deschise, transmise între faze

| Risc                                                                                   | Stare                                         |
| -------------------------------------------------------------------------------------- | --------------------------------------------- |
| Traducere + reload = originalul se pierde definitiv                                    | 🟡 în reparație (2.A)                         |
| Eșec intermitent la traducere (~1 din 5, toate limbile, din 20.08) — cold start Vercel | 🟡 în reparație (2.B)                         |
| Documentul „POMPE DOZATOARE" rămas în slovacă, varianta română nerecuperabilă          | ⏸️ artefact de test, nu material al Cristinei |
