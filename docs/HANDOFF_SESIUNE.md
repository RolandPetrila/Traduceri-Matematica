# HANDOFF SESIUNE — reluare context 100% (editor TipTap + stare proiect)

> Ultima actualizare: 2026-09-11/12 (Faza 6 — automatizarea procesului, ULTIMA fază din program).
> Scop: o sesiune NOUĂ reia exact de unde am rămas, cu tot contextul operațional — fișier SCURT,
> nu jurnal. **Istoricul complet al implementărilor (toate fazele, de la migrarea Vercel v4.0
> până azi, cronologic + index pe module, cu linkuri la commit-uri reale) e în
> `docs/Plan_Finalizat.md`** — acolo cauți „ce s-a făcut la X", nu aici.

---

## ▶️ REIA DE AICI — FAZA 6 ÎNCHISĂ (automatizarea) · PROGRAMUL DE REPARAȚIE E COMPLET ÎNCHIS

**Nu există o „Faza 7".** Faza 6 a fost ultima din `§ORDINEA FAZELOR`
(`99_Roland_Work/Fazele_mentiuni_Roland.md`). O sesiune nouă NU deschide automat o fază nouă —
continuă ca mentenanță normală, pornind cu pasul 🟡 de mai jos.

**🟡 PRIMUL ACT AL SESIUNII URMĂTOARE (obligatoriu, înainte de orice altceva) — actualizat
2026-09-12, cauză identificată + fix aplicat, NEDOVEDIT ÎNCĂ LIVE:**

- **Verificare:** la pornire, caută în context un mesaj `SessionStart hook success:` cu conținut
  JSON de forma `{"scanate":N,"de_revizuit":M,"detalii":[...]}`. Dacă apare → mecanismul
  funcționează, fix confirmat, poți bifa 🟢 în `docs/Plan_in_Lucru.md` și șterge acest bloc. Dacă
  NU apare din nou → fixul de mai jos n-a rezolvat-o, revino cu alt diagnostic (nu repeta „nu știm
  de ce" — pornește de la ce s-a exclus deja, vezi mai jos).
- Dacă `de_revizuit > 0` în acel output → `AskUserQuestion` cu Roland ÎNAINTE de orice altă acțiune
  (`CLAUDE.md` pasul 2).

**Diagnostic făcut 2026-09-12 (sesiune de mentenanță, nu fază nouă) — verificat cu documentația
oficială Claude Code (`code.claude.com/docs/en/hooks.md`), NU presupus:**

- **EXCLUS:** `matcher: ""` la `SessionStart` — confirmat în documentație ca echivalent cu
  omiterea câmpului ("match all"). Nu era cauza.
- **EXCLUS:** shell-ul pe Windows — Claude Code folosește Git Bash (îl avem instalat), unde `;`
  e separator valid. Nu era cauza (ipoteză proprie, infirmată).
- **CAUZA PROBABILĂ:** comanda folosea o cale RELATIVĂ (`node .claude/scripts/check-docs-classification.mjs`)
  fără `${CLAUDE_PROJECT_DIR}`. Documentația spune explicit că astfel de căi se rezolvă față de
  `cwd` la momentul lansării hook-ului (nu garantat = rădăcina proiectului) și recomandă
  `${CLAUDE_PROJECT_DIR}` tocmai pentru acest caz. Dacă `cwd` la lansarea automată a hook-ului nu
  era rădăcina proiectului, `node` ar fi eșuat cu `MODULE_NOT_FOUND` pe stderr, cu stdout GOL — iar
  `; exit 0` (adăugat ca să nu blocheze sesiunea la `de_revizuit>0`) ar fi mascat exit code-ul,
  explicând tăcerea completă (nici succes, nici eroare vizibilă) observată la pornirea sesiunii
  Fazei 6 următoare. **Nu s-a putut testa direct** — Bash tool-ul folosit pt diagnostic NU are
  `${CLAUDE_PROJECT_DIR}` în mediul lui (verificat: variabilă goală), deci nu e un mediu echivalent
  cu cel în care Claude Code lansează hook-urile; testul acolo ar fi fost fals.
- **FIX APLICAT:** `"command": "node \"${CLAUDE_PROJECT_DIR}/.claude/scripts/check-docs-classification.mjs\"; exit 0"`.
- **Migrare confirmată de Roland (AskUserQuestion, 2026-09-12):** hook-ul mutat din
  `.claude/settings.local.json` (negit-uit) în **`.claude/settings.json` (nou, versionat)** —
  motiv: declanșatorul gărzii R-DOCS-GUARD trebuie să supraviețuiască unei clonări noi/migrări de
  laptop, nu doar scriptul. Confirmat sigur: hook-urile din cele două fișiere SE COMBINĂ (merge),
  nu se exclud — documentat oficial. `settings.local.json` păstrează doar `permissions`. La
  auditul de dovezi (2026-09-12): fișierul era încă `??` (netracat) la momentul auditului, deci
  „versionat" devine adevărat abia după commit-ul acestei sesiuni.

**A doua reparație de mentenanță, aceeași sesiune (2026-09-12) — `E-PLAN-001` la modulul Planșe
(`dictare`, `uneste`):** diagnosticat complet (bucla e CORECTĂ, catalogul de erori era imprecis,
mesajul din UI era înșelător la epuizare totală de catalog), corectat + 3 teste noi de
non-regresie + `CACHE_VERSION` bump-uit (`v77-20260911`→`v78-20260912`, altfel PWA-urile deja
instalate nu ar fi văzut fixul, prins de `auditor-regresie`). Detaliu complet, verdictele ambilor
auditori și gate-ul final: `docs/Plan_in_Lucru.md` §🔧 Mentenanță (2026-09-12).

**Ce a livrat Faza 6 (2026-09-11/12), pe scurt — detaliu complet + verdicte auditori:
`docs/Plan_Finalizat.md` §„Faza 6":**

- **R-DOCS-GUARD** — mecanism verificabil (`.claude/scripts/check-docs-classification.mjs` +
  hook `SessionStart` local, ZERO modificări la `~/.claude/`) împotriva re-acumulării `docs/`,
  extins și la `.html`. Auto-consistent: la închidere, s-a arhivat pe el însuși
  (`docs/PLAN_FAZA6_AUTOMATIZARE_2026-09-11.md` → `docs/arhiva/...`) — proba live e în plan.
- **`docs/MEDIU_CLAUDE_CODE.md`** — mediul Claude Code nativ al acestui proiect (nou).
- **Memorie unică** — `.claude/memory/` arhivat (`.claude/memory/arhiva/`), pointer scris spre
  memoria canonică (`~/.claude/projects/.../memory/MEMORY.md`). **Întrebare nedecisă, pentru
  Roland:** memoria canonică nu e în git — risc la o viitoare migrare de laptop. Recomandare (nu
  decizie impusă): acceptă riscul conștient, nu export manual periodic — vezi
  `docs/Plan_Finalizat.md` §Faza 6 pentru motivare completă.
- **R-DIAG-AUTO lărgit** la toate nivelele de log (nu doar `ERROR`/`WARN`) — motivul exact: regula
  veche a ratat bug-ul SK (Faza 1), logat la nivel `action` cu `error_code=null`. Probă live pe
  Supabase: 846 rânduri anterior invizibile.
- **Zero cod de aplicație atins.** Gate identic cu baseline: `tsc 0 · jest 447/447 · build OK ·
pytest 121/121` (confirmat de `auditor-regresie`).

**Verdicte auditori (complete în `docs/Plan_Finalizat.md` §Faza 6):** regresie → FĂRĂ REGRESIE.
dovezi → 6 CONFIRMAT, 2 PARȚIAL (o referință moartă nouă + o imprecizie de citare, ambele
corectate), 1 INFIRMAT-onest (auto-consistența nefăcută LA MOMENTUL auditului, corect marcată
`[ ]`, făcută imediat după). cerințe → toate cele 4 completări obligatorii onorate.

**3 datorii tehnice deschise, NEATINSE intenționat** (rămân în `docs/Plan_in_Lucru.md` §amânat
conștient): retestare onestă Mistral „2 req/min", risc 429 Groq pe auto-continuare, opțiunea B de
capacitate OCR (~1040/zi).

**Plan complet + jurnal execuție:** `docs/arhiva/PLAN_FAZA6_AUTOMATIZARE_2026-09-11.md`.

**⚠️ PROTOCOL PERMANENT (R-STOP-FAZA):** sesiunea se oprește AICI. Programul de reparație e
complet închis — nu deschide o fază nouă din inerție.

---

## 🔑 CONTEXT OPERAȚIONAL (ce NU se vede din cod — CRITIC)

1. **URL canonic = `traduceri-frontend.vercel.app`** (proiectul NOU, iulie). Există și
   `traduceri-matematica.vercel.app` (VECHI, martie) — ambele rulează codul nou, dar canonic e
   `traduceri-frontend`. NU le confunda.
2. **Deploy:** din `frontend/`, `vercel deploy --prod --yes --token="$VERCEL_API_KEY"` (Vercel
   CLI global, token în env `VERCEL_API_KEY`). Deploy = outward-facing → confirmare scurtă de
   intenție de la Roland, apoi îl rulez EU. Backend (`traduceri-api`) se deployează SEPARAT, din
   rădăcină.
3. **Testare mobil:** `resize_window` din Chrome MCP NU emulează viewportul. Metoda care merge:
   iframe de 390px cu pagina în el (same-origin), via `javascript_tool` → screenshot.
4. **Matematică: KaTeX** (migrat 2026-07-26, M1-M5 — răstoarnă decizia veche „fără LaTeX/KaTeX
   în editor" din §17 inițial; NU Unicode+HTML cum spunea o versiune și mai veche a acestui
   fișier). Vezi `docs/Plan_Finalizat.md` §„Matematică academică KaTeX".
5. **Toolbar mobil = bară slim sus + bottom Sheet** (ca Google Docs, decizie §17 originală, încă
   validă azi) — desktop-ul folosește toolbar complet; tema „cretă" tokenizată, NU neutral.
6. **Preferință Roland:** rulez EU tot ce se poate automatiza (deploy/push/CLI); manual doar
   login/2FA/aprobări. Execuție autonomă cu tracking clar + commit/push după fiecare fază.
7. **Workflow per fază:** cod → gate (`tsc`/`jest`/`build`/`pytest`) → verificare LIVE → cei trei
   auditori (R-AUDIT-FAZA) → commit+push → deploy (cu confirmare) → raport → **STOP, o fază per
   sesiune** (R-STOP-FAZA).
8. **Commit:** mesajul de commit se scrie într-un fișier (`scratchpad/commit_msg_*.txt`) +
   `git commit -F` — heredoc cu diacritice/emoji pică pe hook-ul de siguranță (recurent, 3+ ori).
9. **Fork-uri/subagenți NU comit, NU fac push** — comitul e exclusiv al coordonatorului
   (recurență de 2 ori altfel: Faza 4, Faza 4.5d).

---

## 🧭 CUM RELUEZI (pas cu pas, în sesiunea nouă)

1. Deschide Claude Code ÎN `C:\Proiecte\Traduceri_Matematica` (sau `/onboard`).
2. Citește `docs/Plan_in_Lucru.md` (ce rămâne de făcut) + `99_Roland_Work/Fazele_mentiuni_Roland.md`
   - `docs/completari_pt_reparatie.md`.
3. Verifică: `git branch --show-current` = `faza-g-editor`; `git log -1` = ultimul commit al
   fazei precedente (vezi blocul „REIA DE AICI" de mai sus pt care).
4. Verifică 🟡-ul din blocul de mai sus (trigger automat gardă `docs/`). Programul de reparație
   e închis — nu deschide o fază nouă; continuă ca mentenanță normală sau la cererea lui Roland.

> Notă: acest fișier + `Plan_in_Lucru.md` + `Plan_Finalizat.md` + memoria + git = „creierul"
> transferabil. Actualizează-le la fiecare fază (așa rămâne handoff-ul mereu valid) — dar
> ACEST fișier rămâne SCURT (stare curentă + operațional), nu jurnal; jurnalul e în
> `Plan_Finalizat.md`.
