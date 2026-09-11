# MEDIU CLAUDE CODE — cum funcționează, în acest proiect

> Omologul local al `~/.claude/PROTOCOL_ACTUALIZARE.md` (care descrie mediul GLOBAL, valabil în
> toate proiectele lui Roland), dar scris pentru ACEST proiect: ce reguli/agenți/mecanisme sunt
> specifice `Traduceri_Matematica` și de ce există. Creat la Faza 6 (2026-09-11), la cererea
> explicită a lui Roland („documentația necesară pt a întocmi un mediu nativ Claude Code").
>
> **Nu duplică** `CLAUDE.md` (regulile propriu-zise) sau `.claude/rules/project_rules.md` (textul
> lor complet) — trimite spre ele și explică CUM se leagă între ele și DE CE au apărut.

---

## 1. Cei trei auditori (`.claude/agents/*.md`)

Rulați prin `Agent` tool, la finalul FIECĂREI faze, ÎNAINTE ca raportul să ajungă la Roland
(§R-AUDIT-FAZA). Read-only — nu repară nimic, doar verifică:

| Agent              | Verifică                                                                                                                      | NU verifică                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `auditor-dovezi`   | fiecare item declarat 🟢 în `Plan_in_Lucru.md` are dovadă REALĂ, verificabilă                                                 | completitudinea internă a `Plan_Finalizat.md` — vezi lecția de mai jos |
| `auditor-regresie` | poarta completă (`tsc`/`jest`/`build`/`pytest`) + că n-a picat ceva ce mergea                                                 | conținutul deciziilor, doar codul                                      |
| `auditor-cerinte`  | livrarea vs. deciziile scrise ale lui Roland (`99_Roland_Work/Fazele_mentiuni_Roland.md` + `docs/completari_pt_reparatie.md`) | dovada tehnică sau poarta                                              |

**Gol de acoperire găsit la Faza 6** (motivul pentru care există acest tabel): niciunul din cei
trei nu verifică dacă `docs/Plan_Finalizat.md` chiar are o secțiune pentru o fază declarată
închisă — Faza 5 a rămas fără secțiune o fază întreagă, nedescoperită de auditori, prinsă abia la
cererea explicită a lui Roland. Verifică manual asta la fiecare închidere de fază (checklist în
R-HANDOFF).

## 2. Reguli active (`.claude/rules/project_rules.md`)

O linie pe regulă — textul complet e în fișier:

- **R-COST** — zero costuri, doar free tier, fără excepție.
- **R-MATH** — pipeline-ul de traducere păstrează 100% notația matematică (LaTeX, figuri, bbox).
- **R-LAYOUT** — figurile rămân exact unde sunt în original, nu se regrupează.
- **R-LANG** — UI/documentație în română, cod în engleză.
- **R-THEME** — tema „tablă verde + cretă", contrast WCAG AA.
- **R-SEC** — chei API doar în `.env`; alertă imediată la expunere accidentală.
- **R-EXT** — funcționalități noi = module separate, nu modifici pipeline-ul de bază.
- **R-DEPLOY** — Vercel + Supabase, free tier, `maxDuration` 300s → procesare per-pagină.
- **R-EDIT** — conținutul e editabil live în orice limbă (cacheRef persistent).
- **R-EXPORT** — exportul (PDF/DOCX/HTML) reflectă conținutul EDITAT, nu OCR-ul brut.
- **R-DIAG** — fiecare eroare are un cod (`E-<ARIE>-<NNN>`), logat în Supabase, vizibil pe `/diagnostics`.
- **R-DIAG-AUTO** — la fiecare sesiune, verific proactiv log-urile de eroare pe TOATE nivelele
  (corectat la Faza 6 — vezi §4 mai jos, era limitat la `ERROR`/`WARN` și a ratat bug-ul SK).
- **R-DOCS-GUARD** (nou, Faza 6) — mecanism verificabil împotriva re-acumulării `docs/` — §3 mai jos.
- **R-AUDIT-FAZA** — cei trei auditori, obligatoriu, la finalul fiecărei faze.
- **R-STOP-FAZA** — o fază pe sesiune; se oprește explicit după handoff, nu continuă „din inerție".
- **R-HANDOFF** — handoff + plan + memorie + commit/push, sincrone cu realitatea, la fiecare fază.

## 3. Garda `docs/` (R-DOCS-GUARD, mecanism din Faza 6)

**Problema:** înainte de Faza 5, `docs/` avea 36+ fișiere, o parte stale/mințind. Faza 5 a curățat
o dată; fără un mecanism, s-ar repeta.

**Mecanism:** `.claude/scripts/check-docs-classification.mjs` (Node, zero dependențe) scanează
`docs/*.md` + `docs/*.html` de top-level (nu `docs/arhiva/`, nu `docs/dovezi/`) și clasifică:

- **allowlist explicit** (nume stabile, în cod, ~12 fișiere de sistem) → legitim;
- **`PLAN_FAZA<n>_*.md`** → legitim DOAR cât faza `<n>` are un titlu H2 DESCHIS (nu `✅`) în
  `docs/Plan_in_Lucru.md`; STALE dacă titlul ei H2 e `✅` (închisă) — ar trebui în `docs/arhiva/`;
  necunoscută (nu apare în niciun titlu) → legitim implicit, nu se raportează fals-pozitiv;
- **`.html` companion** al unui `.md` alowlistat (același nume de bază) → legitim;
- **altfel** → NECLASIFICAT.

De ce pattern/titlu-H2, nu un fișier-manifest cu listă: un manifest e el însuși un fișier care
poate derivă (cineva adaugă un doc și uită să-l actualizeze). Regula citește starea direct din
titlurile H2 ale `Plan_in_Lucru.md` — fișierul pe care procesul ÎL CERE deja ținut la zi, nu o
sursă nouă de întreținut. **Capcană găsită empiric la prima rulare** (nu doar scrisă, ci
verificată): o scanare care citește PROZA de sub un titlu (nu doar titlul) confundă o simplă
mențiune în treacăt a unei faze („...arhivat la Faza 6...", scris în secțiunea Faza 5) cu o
declarație de stare — de-acolo regula finală: DOAR titlul H2 contează, ancorat la începutul lui.

**Declanșare:** hook `SessionStart` local (`.claude/settings.local.json`, NU global) rulează
scriptul la fiecare pornire de sesiune; output-ul intră în context. `CLAUDE.md` §PRIMA ACȚIUNE
pasul 2 instruiește reacția: dacă `de_revizuit > 0` → `AskUserQuestion` cu Roland înainte de orice
altă acțiune.

**Global vs local (decizie Faza 6, §4.3):** mecanismul e 100% local acestui proiect — zero
modificări la `~/.claude/`. Motiv: `CLAUDE.md` per-proiect e citit automat la fiecare sesiune ȘI
e prima sursă citită de `/onboard` global — punând regula aici, se declanșează oricum la
`/onboard`, fără risc pe celelalte proiecte ale lui Roland. Varianta globală (bloc condiționat în
`~/.claude/commands/onboard.md`, după modelul „Native Workspace v2" deja existent acolo) rămâne
posibilă mai târziu, ca decizie separată — nu strecurată aici.

**Rulare manuală:** `node .claude/scripts/check-docs-classification.mjs` — exit 0 dacă nimic de
revizuit, exit 1 altfel (util pt verificare manuală la finalul unei faze, înainte de închidere).

## 4. Memoria proiectului — un singur sistem canonic (fix Faza 6)

Există DOUĂ locații posibile de memorie — până la Faza 6 erau folosite inconsecvent:

- **Canonică, activă:** `~/.claude/projects/C--Proiecte-Traduceri-Matematica/memory/MEMORY.md` —
  auto-încărcată la FIECARE sesiune (inclusiv aceasta), ținută la zi prin fiecare fază. Aici se
  scrie orice decizie tehnică confirmată sau bug SEV1/SEV2 rezolvat.
- **`.claude/memory/` (în repo, versionată în git)** — arhivată la Faza 6
  (`.claude/memory/arhiva/`), conținut pre-2026-07, NU se mai citește automat. Motivul păstrării
  (nu ștergerii): memoria canonică trăiește ÎN AFARA repo-ului, deci NU e sub control de versiune
  — dacă s-ar șterge complet `.claude/memory/`, proiectul ar rămâne fără nicio memorie versionată.
  Fișierul-pointer `.claude/memory/MEMORY.md` explică asta pe loc.
- **Întrebare deschisă, adusă lui Roland la Faza 6, nedecisă unilateral:** riscul unei migrări
  viitoare de laptop (memoria canonică nu e în git → nu migrează automat) — propunere: export
  versionat periodic vs. acceptarea conștientă a riscului. Vezi raportul de închidere al Fazei 6.

## 5. Fluxul de fază (R-STOP-FAZA + R-HANDOFF, pe scurt)

```
citește handoff+plan+completari_pt_reparatie → (NOU, Faza 6) garda docs/ →
execuție pas cu pas, cu Plan_in_Lucru.md actualizat LIVE →
baseline gate înainte de prima modificare →
dovadă live pe fiecare livrabil (6a: nimic gata fără dovadă) →
cei trei auditori (§1) →
transfer bifate → Plan_Finalizat.md + handoff rescris + memorie + commit/push →
STOP — o fază pe sesiune, următoarea începe cu /onboard într-o sesiune NOUĂ
```

## 6. Capcane operaționale de mediu (de reținut, nu re-descoperit)

- **`pytest.exe` direct NU adaugă rădăcina proiectului în `sys.path`** — dă
  `ModuleNotFoundError: No module named 'api'` pe testele cu import absolut
  (`from api.lib... import ...`), deși testele sunt corecte. Fix: rulează cu
  **`python -m pytest api/tests/`** din rădăcină (adaugă `cwd` în `sys.path` automat), nu
  `.venv/Scripts/pytest.exe api/tests/` direct. Găsit empiric la baseline-ul Fazei 6
  (2026-09-11): 113/121 teste colectate cu invocarea greșită — fals-negativ de INVOCARE, nu
  regresie de cod.
- **Commit cu diacritice/emoji prin heredoc pică hook-ul de siguranță** — scrie mesajul într-un
  fișier (`scratchpad/commit_msg_*.txt`) + `git commit -F`, nu heredoc inline.
- **Fork-uri/subagenți NU comit, NU fac push** — exclusiv coordonatorul sesiunii principale.
- **Ceasul laptopului e cu o zi înainte** (deschis, vezi `Plan_in_Lucru.md` §Riscuri) — afectează
  orice filtrare „log-uri recente" pe bază de dată locală.
