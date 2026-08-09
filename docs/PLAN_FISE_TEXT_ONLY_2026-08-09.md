# PLAN — Fișe Școlare 100% autonome prin text (fără dependență de imagini) · 2026-08-09

> Bug arhitectural: modulul „Școlare 🌐" generează DOAR text+LaTeX (fără motor de desen), dar
> fișele conțin exerciții care operează pe un vizual inexistent („Privește fluturele din imagine",
> „Colorează căsuța din imagine respectând codul de culori"). Repro confirmat pe Grădiniță/Grupa
> Mijlocie/Educație Plastică (screenshot Roland, 5 exerciții, toate cu referință la imagine).
>
> Cauză dublă (verificată în cod):
>
> 1. `frontend/src/lib/scolare/prompt.ts` (`buildScolareSystemPrompt`/`buildScolarePrompt`) NU are
>    nicio interdicție legată de imagini.
> 2. Multiple regulamente (`frontend/public/scolare/regulamente/*.md`) MODELEAZĂ acest tip de
>    exercițiu — nu doar în „Exemple concrete de format", ci și în **Domenii de conținut**, **Tipuri
>    de exerciții acceptate** și chiar în **Interdicții** (care uneori _mandatează_ bug-ul, ex.
>    „NU se cer compoziții proprii — doar completare/colorare de modele date") + secțiunea **Notă de
>    generare** (ex. `grupa-mare`: „chenare... generate prin CSS" — FALS, nu există așa ceva în
>    render; confirmat prin grep: 0 canvas/svg/chenar/figure în codul Școlare).
>    Renderul e `dangerouslySetInnerHTML(renderMathText(...))` — text + KaTeX, atât.

## REGULA DE TRANSFORMARE (principiul unic al fix-ului)

**Copilul CREEAZĂ vizualul din instrucțiunea text — nu OPEREAZĂ pe un vizual tipărit care nu există.**

- ✅ Permis: „Desenează un fluture cu aripile identice (simetrice)." / „Desenează 3 flori, apoi
  încă 2. Câte sunt? Scrie cifra." / „Desenează o casă și coloreaz-o: acoperișul roșu, pereții
  galbeni, ușa albastră."
- ❌ Interzis: orice referință la un vizual pre-existent — „din imagine/desen/tablou/figură/hartă/
  chenar", „de mai jos" (când arată spre un vizual), „privește/observă [imaginea]", „completează
  cealaltă jumătate a [obiectului deja desenat]", „decupează [forma] din chenarul alăturat",
  „numără [obiectele] din desen".
- **HARD CONSTRAINT:** se schimbă DOAR _modul de livrare_ al sarcinii (elimină dependența de
  vizual). NU se schimbă conceptul curricular predat (simetrie, numărare, amestec culori, motricitate
  fină rămân). NU se inventează domenii/concepte/intervale numerice/teme noi. (Repo-ul a ars deja o
  sesiune pe curriculum fabricat — vezi Carla.)

## Fișiere & faze

- [x] F0 — Orientare: handoff + prompt.ts + render path + grep offenders (DONE)
- [x] F1 — `prompt.ts`: `IMAGE_AUTONOMY_RULE` (ban+redirect) în `buildScolarePrompt` ULTIMA (după
      regulament → recency+override) + linie condensată în `buildScolareSystemPrompt`; 2 teste noi
      în `content.test.ts` (prezență + ordine după regulament). (DONE)
- [x] F2 — Audit complet 112 regulamente (4 subagenți read-only per ciclu). REZULTAT: **~26
      infractori pe exerciții** (Grădiniță 9, Primar 10 incl. borderline, Gimnaziu 5, Liceu 2) +
      afirmații false „prin CSS" în Notă/layout (Grădiniță 1, Primar ~17, Gimnaziu 3). Delta vs „34":
      criteriu strict — date-în-text și elev-desenează-singur = CURAT (grep-ul larg supra-numărase).
      Bug-ul NU e doar în „Exemple": și Domenii/Tipuri/Interdicții(care _mandatau_ bug-ul)/Notă. (DONE)
- [x] F3 — Rewrite APLICAT: **37 fișiere, 145 Edit-uri, 0 eșecuri** (Grădiniță 10 fișiere/92 edit,
      Primar 17/41, Gimnaziu 8/9, Liceu 2/3). Toate cele 4-5 secțiuni per fișier (Domenii/Tipuri/
      Exemple/Interdicții/Notă). Blocul anti-aritmetic (mare_matematica) verificat manual = interdicții
      „+/=" INTACTE, doar livrarea schimbată. Citate OMEN păstrate. (DONE)
- [x] F4 — Gate: **`tsc 0 · jest 332/332 (+2) · next build OK`** (pytest neafectat — frontend-only). (DONE)
- [x] F5 — Verificare prin REGENERARE REALĂ (`scratchpad/text_only_live.mjs`, /api/proxy prod):
  - **Control negativ (regex are dinți):** regexul (scris ÎNAINTE de output) a PRINS bug-ul pre-fix
    pe nodul repro (ed-plastică: „Privește ... din imagine" + „completează cealaltă jumătate", 3 ref/2
    mostre). Pe alte 2 noduri NEG (grădiniță-mică-mate, primar-arte) NU a prins — dar eyeball pe raw
    dump: conținutul OLD era deja curat acolo (AI folosea emoji inline / „desenează pe caiet"), NU
    gaură de regex. Regexul e bine calibrat (fire pe ref real, tăcut pe curat).
  - **Pozitiv (fixat):** **32/32 mostre CURATE** (0 referințe la imagini) pe 8 noduri × toate 4
    ciclurile + nodul EXACT din screenshot (6 mostre). Eyeball uman + grep-sweep pe toate dump-urile:
    fiecare substantiv-vizual e text-autonom (elevul desenează / date-în-text). Repro before→after:
    „Privește fluturele din imagine" → „Desenează un fluture întreg cu aripile simetrice".
  - **DECIZIE (nu bug): emoji/Unicode inline = text-autonom.** AI-ul redă uneori obiectele ca glife
    („🍎🍎🍎", „◯ □ △", „MELC — 🐌") — acestea SE randează ca text, deci „numără merele de mai jos"
    urmat de emoji NU e o referință moartă. Permis deliberat (util la preșcolar/CP) și NEdetectat
    deliberat de regex (`merele`/`formele` nu-s în lista de substantive-vizuale). Sesiunea următoare:
    NU trata `🍎🍎🍎 de mai jos` ca bug — vizualul EXISTĂ ca glifă.
  - Reziduu onest: 1 eveniment stocastic izolat (exit 1 la prima rulare combinată, nereprodus în
    32 mostre) — plasa de siguranță rămâne bannerul „verifică înainte de tipărire". (DONE)
- [~] F6 — Handoff + PLAN_MASTER + memorie la zi; commit + push. **Deploy = confirmare Roland** (NEDEPLOYAT).

## Non-regresie / capcane

- NU șterge secțiunile — le REFORMULEAZĂ (păstrează structura regulamentului: Domenii/Tipuri/
  Exemple/Interdicții/Notă/Densitate).
- `regulament-files.test.ts` verifică ref→fișier există/ne-gol/sub 8000 char — nu depăși plafonul.
- Densitatea (ex. „EXACT 3 exerciții") NU e treaba acestui fix (UI-ul suprascrie oricum nr.
  exercițiilor) — nu o atinge.
- `verify-fisa.ts` / `sanitize.ts` neatinse (nu e bug de aritmetică/runaway).
- Verificarea vizuală reală (print pe hârtie) rămâne eyeball Roland; noi dovedim text-autonomia.
