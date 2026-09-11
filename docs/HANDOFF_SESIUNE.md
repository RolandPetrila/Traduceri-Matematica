# HANDOFF SESIUNE — reluare context 100% (editor TipTap + stare proiect)

> Ultima actualizare: 2026-09-11 (Faza 5 — unificarea documentației, ULTIMUL pas al fazei).
> Scop: o sesiune NOUĂ reia exact de unde am rămas, cu tot contextul operațional — fișier SCURT,
> nu jurnal. **Istoricul complet al implementărilor (toate fazele, de la migrarea Vercel v4.0
> până azi, cronologic + index pe module, cu linkuri la commit-uri reale) e în
> `docs/Plan_Finalizat.md`** — acolo cauți „ce s-a făcut la X", nu aici.

---

## ▶️ REIA DE AICI — FAZA 5 ÎNCHISĂ (unificarea documentației) · urmează FAZA 6 (automatizarea)

**Ce s-a livrat (2026-09-11):** `docs/` a avut 36+ fișiere de nivel top, o parte stale/mințind
(`CHANGELOG.md` zicea PROD v46 și „Chat AI livrat" — modul ȘTERS la 4.5d; `PLAN_MASTER.md` era
numit „sursă unică" dar stale din 2026-08-09). Faza 5 a restructurat:

- **`docs/Plan_Finalizat.md`** — NOU. Istoricul complet, cronologic + index pe module, cu
  hash-uri de commit reale (verificate în `git log`, nu inventate).
- **`docs/arhiva/`** — NOU. 21 documente vechi mutate aici verbatim (`git mv`, istoric git
  păstrat), inclusiv `PLAN_MASTER.md` și `CHANGELOG.md` (absorbite: §7 backlog → `Plan_in_Lucru.md`
  §⏸️ amânat conștient, §9 decizii valabile → `CLAUDE.md`, restul → rezumat în `Plan_Finalizat.md`).
- **3 poze `dovada_faza1_*.jpg`** mutate în `docs/dovezi/` (consistență de loc).
- **Referințe fixate** — 24 fișiere de memorie + `CLAUDE.md` (6 locuri) actualizate să nu mai
  arate spre căi moarte; 7 referințe DEJA moarte găsite (dinainte de Faza 5, din curățenia din
  iulie) corectate/adnotate pe loc.
- **Acest fișier** — trimis de la >1800 la <100 linii; istoricul detaliat migrat în
  `Plan_Finalizat.md`.
- **Linia F5/F6, confirmată de Roland:** F5 = structura de mai sus. F6 (următoarea) =
  automatizarea — regula ca `docs/` să nu re-acumuleze fișiere necategorizate, documentația pt
  un mediu nativ Claude Code, trigger `/onboard`→`AskUserQuestion` la modificări în proiect.
  Vezi `docs/PLAN_FAZA5_UNIFICARE_DOCUMENTATIE_2026-09-11.md` §1.1.
- **NU s-a touch-uit niciun cod de aplicație** — poarta e identică cu baseline-ul de
  dinainte de fază (`tsc 0 · jest 447/447 · build OK · pytest 121/121`).
- **3 datorii tehnice deschise, migrate în `docs/Plan_in_Lucru.md`** (nerezolvate cu bună
  știință, nu sărite): retestare onestă Mistral „2 req/min", risc 429 Groq pe auto-continuare,
  opțiunea B de capacitate OCR (~1040/zi, amânată conștient).

**Plan complet + listă exactă de fișiere + cei trei auditori:**
`docs/PLAN_FAZA5_UNIFICARE_DOCUMENTATIE_2026-09-11.md`.

**⚠️ PROTOCOL PERMANENT (R-STOP-FAZA):** sesiunea se oprește AICI. Deschide o sesiune nouă cu
`/onboard` pentru Faza 6.

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
4. Continuă cu Faza 6 (sau prima fază neînchisă din `docs/Plan_in_Lucru.md`).

> Notă: acest fișier + `Plan_in_Lucru.md` + `Plan_Finalizat.md` + memoria + git = „creierul"
> transferabil. Actualizează-le la fiecare fază (așa rămâne handoff-ul mereu valid) — dar
> ACEST fișier rămâne SCURT (stare curentă + operațional), nu jurnal; jurnalul e în
> `Plan_Finalizat.md`.
