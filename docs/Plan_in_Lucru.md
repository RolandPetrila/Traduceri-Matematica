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
>
> **Acest fișier ține DOAR ce rămâne de făcut** (Faza 5, decizia proprie §0: itemii deja închiși
> migrează în `docs/Plan_Finalizat.md`, rezumat + link la commit-uri, nu ținuți și aici — evită
> dublura pe care Faza 5 o interzice explicit). Istoricul complet al fazelor închise, cu tabelele
> de dovadă live: `docs/Plan_Finalizat.md`.

> ### ⏰ ATENȚIE la datele din acest proiect
>
> **Ceasul laptopului e cu o zi ÎNAINTE.** Verificat cu două surse independente: Google și
> Vercel raportează **07.09.2026 08:17 GMT**, laptopul raportează 08.09.2026. Jurnalul din
> Supabase e corect; laptopul nu. Consecințe: (a) toate datele „08.09.2026" scrise azi în
> documente, comentarii de cod, mesaje de commit și nume de dovezi sunt **greșite cu o zi**;
> (b) R-DIAG-AUTO filtrează „log-uri recente" după un ceas care o ia înainte. **De reparat pe
> laptop** (sincronizare oră Windows), nu în cod.

**Ultima actualizare:** 2026-09-11 (Faza 5 ÎNCHISĂ — unificarea documentației: `docs/arhiva/` +
`docs/Plan_Finalizat.md` noi, `PLAN_MASTER.md`+`CHANGELOG.md` absorbite+arhivate, referințe fixate
în memorie/CLAUDE.md, cele 3 datorii tehnice + backlogul amânat migrate mai jos, ACEST fișier
golit de fazele închise — vezi mai jos) · **Producție:** `traduceri-frontend.vercel.app` +
`traduceri-api.vercel.app` (neschimbată de Faza 5 — nu s-a touch-uit cod de aplicație) ·
**Următoarea:** Faza 6, vezi `docs/HANDOFF_SESIUNE.md`

---

## ✅ Faze 1 → 4.5e — ÎNCHISE (istoric complet migrat)

Faza 1 (orbirea diagnostică), Faza 2 (bug SK + 5 runde audit), Faza 2.5 (cei trei auditori
instituiți), Faza 3 (caiet de sarcini, 104 butoane), Faza 4 (audit real în browser, 16 defecte),
Faza 4.5a (6 reparații contenite), Faza 4.5b (P3 traducere F8), Faza 4.5c (P2 timeout lanț AI,
rămas 🟡 — traseul de realocare Groq neexercitat live), Faza 4.5d→4.5e (free tier + siguranță
OCR + reparație de proces) — toate cu dovadă live, verdicte ale celor trei auditori și hash-uri
de commit reale. **Detaliul complet, per fază, cronologic: `docs/Plan_Finalizat.md`.**

Rămân deschise din acest istoric (nu sărite — vezi §„Datorii tehnice deschise" mai jos):
retestarea onestă Mistral „2 req/min", riscul Groq de 429 pe auto-continuare, opțiunea B de
capacitate OCR.

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
8. FAZA 5    — unificarea documentației + memorie + mediu nativ + /onboard — ÎNCHISĂ
9. FAZA 6    — automatizarea + lista de pornire
```

---

## ✅ FAZA 5 — Unificarea documentației `ÎNCHISĂ (2026-09-11)`

Decizii: **5a** documente vechi → `docs/arhiva/` · **5b** rezumat per fază/sesiune cu linkuri la
commit-uri în `docs/Plan_Finalizat.md` · **5c** cronologic + index pe module · linia F5/F6:
structura (arhivă+`Plan_Finalizat.md`+`CLAUDE.md` la zi) în F5, automatizarea (regulă de
curățenie, mediu nativ Claude Code, `/onboard`→`AskUserQuestion`) în F6. Plan complet + listă
exactă de fișiere + jurnal execuție: `docs/PLAN_FAZA5_UNIFICARE_DOCUMENTATIE_2026-09-11.md`.

**Ce s-a livrat:** `docs/Plan_Finalizat.md` (nou) + `docs/arhiva/` (nou, 21 fișiere) +
`PLAN_MASTER.md`/`CHANGELOG.md` absorbite (backlog → mai jos, decizii → `CLAUDE.md`) +
`docs/HANDOFF_SESIUNE.md` redus de la >1800 la <100 linii + 24 fișiere de memorie și `CLAUDE.md`
cu referințe fixate (7 erau deja moarte dinainte de Faza 5) + **acest fișier golit de fazele
închise** (vezi secțiunea de mai sus). Zero cod de aplicație touch-uit. Poartă identică cu
baseline: `tsc 0 · jest 447/447 · build OK · pytest 121/121`.

**Verdicte auditori:** regresie — FĂRĂ REGRESIE de cod; a găsit 5 referințe suplimentare deja-
moarte în fișiere neatinse de Faza 5 (`.claude/agents/auditor-dovezi.md`,
`docs/PROMPT_SESIUNE_NOUA.md`, `README.md`, `99_Plan_vs_Audit/PLAN_DECISIONS.md`,
`docs/Fazele.md`) — corectate imediat, înainte de commit. dovezi — 6 CONFIRMAT, 1 PARȚIAL (o
referință ratată în sampling, corectată), 1 CONFIRMAT-cu-rezervă (2 puncte operaționale minore,
necritice, absente din noul HANDOFF — nu redate, notă rămasă în plan). cerințe — a găsit o
**abatere reală majoră**: acest fișier NU fusese încă golit de fazele închise cum promitea §0 al
planului (dublură cu `Plan_Finalizat.md`) — **corectată imediat, ÎNAINTE de commit** (trimiterea
de mai sus); + `CLAUDE.md` mai avea Chat AI listat ca modul livrat, la 14 linii de propria notă
că a fost eliminat — **corectat**.

---

## ⬜ FAZA 6 — Automatizarea procesului

Preia din linia F5/F6 confirmată de Roland (2026-09-11): regula ca `docs/` să nu re-acumuleze
fișiere necategorizate, documentația pentru un mediu nativ Claude Code, și trigger-ul
`/onboard` → `AskUserQuestion` la modificări în proiect. Vezi
`docs/PLAN_FAZA5_UNIFICARE_DOCUMENTATIE_2026-09-11.md` §1.1 pt raționament.

---

## ⏳ Datorii tehnice deschise (identificate 4.5c-4.5e, NEREZOLVATE, cu bună știință)

- 🟡 **Mistral OCR/traducere — retestare ONESTĂ a limitei „2 req/min" NEFĂCUTĂ**: cereri
  spațiate ≥30s (sub 2/min), testate separat pe fiecare cheie a proiectului. Afirmația „429
  persistent" a fost infirmată ANALITIC în Faza 4.5c (sonda anterioară trăsese 6 cereri în
  ~20s — 429-urile veneau de la sondă, nu de la cont) — dar testul EMPIRIC, promis ca „primul
  task al fazei următoare" (commit `605d4f8`), nu s-a făcut nici la 4.5d, nici la 4.5e.
  Disponibilitatea reală a Mistral ca fallback rămâne NEDETERMINATĂ.
- 🟡 **Groq — risc de 429 pe auto-continuare în aceeași fereastră de 60s**: `maxTokens:6000`
  (4.5d/4.5e) e dovedit sub plafonul de 8000 TPM pt O SINGURĂ cerere (live, `total_tokens`
  ~2500-2800). Dar `continueGenerate`/`continueCorrect` pot declanșa un AL DOILEA apel Groq în
  același minut (auto-continuare pe răspuns trunchiat) → cele două cereri se cumulează pe
  aceeași fereastră → al doilea apel poate lovi din nou plafonul, chiar dacă fiecare cerere
  individuală respectă limita. Cunoscut, lăsat deliberat nerezolvat
  (`docs/arhiva/PLAN_FAZA4.5D_FREE_TIER_SIGURANTA_2026-09-11.md`, PUNCTUL 5).
- ⏸️ **OCR — capacitate opțiunea B, amânată conștient**: cablarea `GOOGLE_AI_API_KEY_
TRADUCERI_2` ca a doua cheie liberă în `ocr_structured.py` ar duce capacitatea de la ~520 la
  ~1040 pagini/zi. Marcată [RELEVANT, nu necesar] — 520/zi e deja confortabil pentru o singură
  utilizatoare. De reconsiderat doar la un motiv concret de volum mai mare.

---

## ⏸️ Amânat conștient (migrat din `PLAN_MASTER.md` §7/§8 la Faza 5, 2026-09-11)

Backlog confirmat de Roland (2026-08-07, „nu acum, fără cerere nouă") — nu redeschide fără
cerere explicită:

| Item                                                             | Stare azi                                         | Efort     |
| ---------------------------------------------------------------- | ------------------------------------------------- | --------- |
| Next 15 → 16                                                     | `next: ^15.5.20`                                  | mare      |
| Tailwind v3 → v4                                                 | `tailwindcss: ^3.4.0`                             | mediu     |
| Quota hard-cap + Upstash (rate-limit distribuit)                 | `rate_limiter.py` e in-memory per-instanță        | mediu     |
| PDF >20 pagini în loturi                                         | azi = plafonare la 20 cu mesaj onest, nu batching | mediu     |
| Export HTML interactiv multi-limbă                               | `data-i` = 0 hituri                               | mediu     |
| SW auto-versioning                                               | `sw.js` `CACHE_VERSION` încă manual               | mic       |
| Logging JSON structurat / bundle analyzer / dicționar math în UI | —                                                 | mic-mediu |

**Verificări umane (Roland), nu se automatizează** — nefăcute încă, cu bună știință:

- ⬜ V1 — Eyeball PDF + .docx real cu o formulă ȘI o figură redimensionată
- ⬜ V2 — Verificare de domeniu **Cristina**: corectitudinea matematică/notațională a formulelor
- ⬜ V3 — OCR real end-to-end din browser pe prod cu o poză de manual
- ⬜ V4 — PDF multi-pagină scanat (bucla per-pagină + plafon 20 + marcaj eșec onest per pagină)

---

## Riscuri deschise (genuine — cele rezolvate au migrat în `Plan_Finalizat.md`)

| Risc                                      | Stare                                                                                                                                                                                                       |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Germana revenea în slovacă prin NLLB      | 🟡 reparat + 8 teste; nedovedibil live din exterior (DeepL servește `de` direct, nu ajunge la NLLB într-o cerere reală)                                                                                     |
| Mesaje neacționabile în modulele neatinse | 🟡 mecanism gata, 9 locuri centrale reparate la Faza 2; acoperirea sistematică pe fiecare buton a trecut prin Faza 3 (inventar) + Faza 4 (audit live) — de reconfirmat dacă a mai rămas vreun gol la Faza 6 |
| **Ceasul laptopului e cu o zi înainte**   | 🔴 deschis — de reparat pe laptop (sincronizare oră Windows). Afectează R-DIAG-AUTO și toate datele scrise în documentație                                                                                  |
