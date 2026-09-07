# PROMPT DE PORNIRE — sesiune nouă, context curat (program de reparație)

> **Cum se folosește:** deschizi un terminal nou în `C:\Proiecte\Traduceri_Matematica` și lipești
> textul din blocul de mai jos. (Sau, mai scurt: „citește `docs/PROMPT_SESIUNE_NOUA_REPARATIE.md`
> și execută protocolul de pornire".)

---

```
Ești în proiectul C:\Proiecte\Traduceri_Matematica (PWA de matematică; utilizator real: Cristina,
profesoară la secția slovacă; owner: Roland).

PROTOCOL DE PORNIRE — execută în ordine, apoi OPREȘTE-TE și raportează:

1. Citește, în ordine:
   - docs/completari_pt_reparatie.md   ← cerințele lui Roland (8 puncte). Fișierul în care EL scrie
                                         problemele găsite și erorile mele. Se citește la FIECARE sesiune.
   - docs/HANDOFF_SESIUNE.md           ← blocul de sus (2026-09-08): ce s-a întâmplat, cele 2 bug-uri deschise
   - docs/Fazele.md                    ← cele 6 faze explicate + cele 18 puncte de decizie (1a…6c)
   - docs/RAPORT_F5_AUDIT_2026-09-07.md ← ATENȚIE: e INVENTAR de butoane cu verdicte NEVERIFICATE,
                                          NU audit terminat. Nu te baza pe „✓"-urile din el.
   - CLAUDE.md + .claude/rules/project_rules.md + memoria proiectului

2. Verifică dacă Roland a livrat deciziile lui:
   - caută un fișier de forma Fazele_mentiuni_Roland.md (în docs/, în rădăcină sau în Downloads),
     SAU mențiuni lipite de el direct în chat.
   - DACĂ EXISTĂ → deciziile lui au prioritate absolută asupra oricărei recomandări din docs/Fazele.md.
   - DACĂ NU EXISTĂ → **NU începe execuția fazelor**. Întreabă-l: vrea să-i folosim variantele marcate
     „[recomandat]" din docs/Fazele.md, sau completează întâi mențiunile în docs/Fazele.html?

3. Afișează-i o „listă de pornire" scurtă: ce ai citit, care e starea (live/gate), care sunt bug-urile
   deschise, ce urmează. Apoi așteaptă confirmarea lui înainte de a executa.

STAREA ADEVĂRATĂ LA PORNIRE (nu o re-descoperi, dar verific-o dacă ceva pare schimbat):
- LIVE: frontend v55 (traduceri-frontend.vercel.app) + backend a7304a2 (traduceri-api.vercel.app)
- Gate ultima oară: tsc 0 · jest 357/357 · build OK · pytest 75/75
- Sesiunea 2026-09-07 a remediat 12 reziduuri (R1-R12) și le-a deployat — vezi handoff.

CELE 2 BUG-URI DESCHISE (confirmate live, NEREPARATE):

BUG #1 — Traducerea SK eșuează (funcția CENTRALĂ pentru Cristina)
  - eșuează ÎNAINTE de orice apel de rețea (0 cereri /api/translate-text în network panel)
  - mesajul „Traducerea a eșuat. Verifică internetul" e ÎNȘELĂTOR — nicio cerere n-a plecat
  - după eșec butonul SK rămâne DEZACTIVAT → fără reload nu se poate reîncerca
  - document declanșator: import OCR cu TABEL + întrerupere de pagină + „[Pagina 1: OCR eșuat]"
  - suspecți: extractTranslatable / editor-translate.ts pe noduri table/pageBreak; sau starea care
    blochează limba după eșec. EN/DE folosesc același cod → verifică-le și pe ele.

BUG #2 — Orbire diagnostică (o clasă întreagă de erori invizibile)
  - eroarea SK s-a logat ca level='action', error_code=null, context={"to":"sk"} — fără status/cauză/stack
  - deci invizibilă pe /diagnostics, la gruparea pe cod ȘI la verificarea automată R-DIAG-AUTO
    (care filtrează doar level in ('error','warn')) → s-a raportat „zero erori" în timp ce eroarea
    lui Roland era în log de 3 ori.
  - R-DIAG-AUTO trebuie extinsă să citească TOATE nivelele de log.

REGULA DE VERIFICARE CARE A LIPSIT (cea mai importantă din tot documentul):
  O funcție se declară „verificată" DOAR după click REAL în browser, pe CONȚINUT REALIST, cu dovadă
  (captură de ecran / consolă / network / log). Probele pe endpoint cu payload minimal NU sunt dovadă:
  proba mea a trimis un paragraf (200 OK, „merge"), Roland a apăsat pe un document cu tabel (crăpat).
  Nu scrie „end-to-end" pentru două jumătăți verificate separat.

DECIZII DEJA LUATE DE ROLAND (valabile, nu le re-întreba):
  - Agenți: subagenți SECVENȚIALI per modul (NU fan-out paralel).
  - Plan_in_Lucru.md: sesiunea PROPUNE itemii găsiți; ROLAND aprobă; se execută doar ce confirmă el.
  - Deploy: autorizat automat după fiecare fază verde („întotdeauna live").

CAPCANE DE EXECUȚIE DOVEDITE (nu le repeta — au costat timp real):
  - GATE: rulează `npm run typecheck`, `npm test`, `npm run build` din frontend/ și
    `./.venv/Scripts/python.exe -m pytest api/tests/ -q` din rădăcină. Citește valoarea EXIT_* DIN
    OUTPUT — un pipe (`| tail`) MASCHEAZĂ exit code-ul, iar exit-ul raportat de harness e al ultimului
    `echo`. Așa a apărut un „gate verde" fals.
  - DEPLOY: SECVENȚIAL, niciodată două în paralel (coliziune de configurație, dovedită).
    Frontend: `cd frontend` ÎNTÂI (vercel citește vercel.json din process-cwd, nu din --cwd), apoi
    `npx vercel deploy --prod --yes --token="$VERCEL_API_KEY"`. Backend: aceeași comandă din rădăcină.
    Bump CACHE_VERSION în frontend/public/sw.js la fiecare deploy frontend. Verifică pe ALIAS.
  - COMMIT: mesaje ASCII-only (hook-ul guard respinge diacriticele) + trailer Co-Authored-By/Claude-Session.
  - Browser: extensia Chrome funcționează (a fost folosită cu succes). Input-ul de import OCR din editor
    e `#editor-ocr-import-input` (al 3-lea input[type=file] din pagină) — folosește file_upload pe ref-ul lui,
    nu click (clickul deschide un dialog nativ care blochează extensia).

SCRIPTURI DE DIAGNOSTIC deja scrise (în scratchpad/, necomise — refolosește-le, nu le rescrie):
  chat_providers_probe.mjs · provider_health.mjs · ocr_fidelity_probe.mjs · ocr_figure_dump.mjs ·
  f5_live_probe.mjs · convert_verify.mjs · convert_binary_check.mjs

DUPĂ FIECARE FAZĂ (obligatoriu): raport scurt (ce s-a făcut, ce s-a verificat LIVE cu dovada, ce a
picat, ce urmează) + actualizează handoff + memoria + commit/push. Nimic „verde" fără dovadă live.
```

---

## Anexă — starea documentelor la momentul transferului (2026-09-08)

| Document                             | Rol                                                                                                                                                   |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/completari_pt_reparatie.md`    | **Caietul lui Roland** — el scrie aici problemele/erorile găsite. Se citește la fiecare sesiune. NU se șterge.                                        |
| `docs/Fazele.md`                     | Cele 6 faze explicate + 18 puncte de decizie. **DRAFT neconfirmat.**                                                                                  |
| `docs/Fazele.html`                   | Pagină interactivă (local) pentru mențiunile lui Roland: notiță per fază/punct, bifă pe variantă, dictare vocală, export `Fazele_mentiuni_Roland.md`. |
| `docs/HANDOFF_SESIUNE.md`            | Starea de adevăr, cronologic. Blocul de sus = 2026-09-08.                                                                                             |
| `docs/RAPORT_F5_AUDIT_2026-09-07.md` | Inventar de butoane + R1-R12 remediate. **Verdictele „✓" = NEVERIFICATE live.**                                                                       |
| `docs/PLAN_PROGRAM_2026-09-07.md`    | Programul F0-F6 al sesiunii precedente (limite AI, OCR, audit) — istoric.                                                                             |
| `docs/PLAN_MASTER.md`                | Sursa istorică de adevăr a proiectului (pre-reparație).                                                                                               |

**Ce urmează, la alegerea lui Roland:** fie completează mențiunile în `Fazele.html` și le dă sesiunii
noi, fie îi spune sesiunii noi să pornească pe variantele `[recomandat]`. În ambele cazuri, prima
execuție recomandată este **Faza 1** (repară orbirea diagnostică), fiindcă fără ea auditul de la
Faza 4 nu poate ști ce anume pică — urmată imediat de **Faza 2** (bug-ul SK, funcția centrală).
