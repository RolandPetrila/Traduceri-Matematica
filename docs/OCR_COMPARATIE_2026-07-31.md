# R7 — OCR: comparație calitate ÎNAINTE / DUPĂ (pe 3 fișiere reale)

> Data: 2026-08-01 · Cerință: `PLAN_MASTER.md §1 R7` · Dovadă: `finding_ocr_test_scorecard_2026_07_31` + `finding_azure_layout_r7_2026_07_31`.
> Provider nou: **Azure Document Intelligence `prebuilt-layout`** (documente business) + **Gemini** (math), rutat pe forma fișierului, cu gardă R-MATH.

## Scorecard

| Fișier                           | Tip                            | ÎNAINTE    | DUPĂ                   | Ce s-a schimbat                                                                                                                                                            |
| -------------------------------- | ------------------------------ | ---------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `limite_matematica.jpeg`         | imagine math                   | **10/10**  | **10/10** [CERT]       | Neatins prin construcție — imaginile merg pe Gemini (calea de math n-a fost modificată).                                                                                   |
| `IMG-20250914-WA0001.jpg`        | poză rotită, grile a)–f)       | **8.5/10** | **~9.5/10** [PROBABIL] | R7.3: ordinea multi-coloană reparată `a,d,b,c,e,f → a,b,c,d,e,f`. Tot pe Gemini. Verificat pe structura REALĂ (unit test); eyeball final pe prod.                          |
| `1.1_Analyse Filtrasan 2026.pdf` | PDF lab (Mösslein), tabel+logo | **3/10**   | **~8.5/10** [PROBABIL] | R7.1+R7.2+R7.4: tabelul reconstruit, text curat (re-OCR), logo+sigiliu prezente. Dovedit pe fișierul real la SURSĂ (vezi mai jos); render+export în editor = eyeball prod. |

## Ce am confirmat, cu dovadă (nu presupus)

### Filtrasan (3/10 → ~8.5/10)

Rulat `azure_layout()` pe pagina 1 rasterizată reală (1 pagină Azure F0 consumată):

- **22 secțiuni · 5 tabele · 2 figuri.**
- **Tabelul de rezultate RECONSTRUIT** (7×4, `headerRows=1`): `Parameter | Einheit | Untersuchungs-erg | Untersuchungs-ver` + `pH (im Labor)`, `Säurekapazität`, `Aluminium`, `Chlorid`, `Kieselsäure`, `Dichte`. **Înainte: PIERDUT complet** (→ un paragraf).
- **Text CURAT** (re-OCR pe pixeli, nu stratul-text prost): „Institut Dr. Nuss" (nu „lnstitut"), „Bad Kissingen" (nu „8ad"), numere de telefon corecte. **Cauza scorului 3/10 = euristica veche dumpa stratul-text OCR-prost** — reparată (R7.2).
- **Figuri decupate corect** (verificat vizual, salvate PNG): logo-ul „Institut Dr. Nuss" + sigiliul „ilac-MRA / DAkkS D-PL-14084-01-00". **Înainte: absente.**

### IMG-WA0001 (8.5 → ~9.5)

Diagnostic pe OCR-ul REAL Gemini (advisor: „diagnostichează întâi"): problema 9 iese ca `two_column` cu **stânga=[a, d]**, **dreapta=[b, c, e, f]** → aplatizarea naivă dădea `a,d,b,c,e,f`. **Cauza = aplatizarea, nu promptul** (în interiorul fiecărei coloane ordinea era corectă). Fix în `ocr-map.ts`: reordonez itemii etichetați `a)/b)/…` în ordine naturală. Unit test pe structura reală → `a,b,c,d,e,f`.

### limite_matematica (10 → 10)

Calea imaginilor (Gemini) **nu a fost atinsă**. Prin construcție, math rămâne 10/10 (R-MATH).

## Cum funcționează rutarea (R7.5)

- **Imagine (jpg/png)** → Gemini (math — Cristina fotografiază fișele).
- **PDF trimis la OCR** → Azure `prebuilt-layout` (tabele/layout/figuri — Mösslein, documente business).
- **Gardă R-MATH:** dacă Azure găsește **0 tabele** pe o pagină → revin automat la Gemini (nu pierd matematica pe un PDF scanat-math). La orice eroare Azure → tot Gemini (pagina nu se pierde niciodată).
- **R7.2:** un PDF ajunge pe calea OCR dacă stratul-text e de calitate slabă (măsurat: `cleanWordRatio` — Filtrasan 0.49 vs Unghiuri 0.61, prag 0.55) SAU dacă utilizatorul apasă **„Forțează OCR"**.

## Confirmări suplimentare (rundă advisor)

- **R7.1 tabel → `getHTML()` = [CERT]** (nu mai e dedus): test cu Editor TipTap REAL (jsdom) — nodul `table` mapat serializează în `<table>` cu TOATE celulele + `<th>` (sursa exportului PDF/HTML/Word). `ocr-table-render.test.ts`.
- **Gardă Azure-indisponibil = DOVEDITĂ:** cu env-ul Azure ȘTERS, `_ocr_page(engine=azure)` pe Filtrasan → prinde eroarea → **revine la Gemini (18 secțiuni, fără throw)**. Deci dacă cheile lipsesc/greșite în Vercel prod, importul PDF degradează la Gemini, NU dă 500.
- **Azure vede structură și în blocuri de adrese:** Filtrasan → 5 tabele (1 = rezultatele; restul = contact/metadate structurate ca grile). Comportament corect, nu bug — Roland va vedea mai multe tabele decât se aștepta la un raport de lab.

## Onestitate (R3) — ce rămâne pe eyeball-ul prod

- **Scorurile „DUPĂ" ~ [PROBABIL]** pt PERCEPTUAL: lanțul CLIENT complet în browser (rasterizare → Azure → mapare → randare) + aspectul vizual al exportului PDF/DOCX = testul lui Roland pe prod. Mecanica e dovedită (server la sursă + `getHTML()` [CERT] + gate verde).
- **Formulele Azure** (add-on plătit) NU sunt folosite — math rămâne Gemini (R-COST). Un PDF scanat cu MATEMATICĂ (fără tabel) → gardă → Gemini.
- **Celule unite** în tabele Azure: conținutul e pus în celula-origine, celulele acoperite rămân goale (MVP).
- **Figuri pe calea PDF-cu-text-BUN** (`rawTextToBlocks`): încă NU extrage imagini (doar calea Azure o face). Neatins — nu era în cele 3 fișiere.

## Cost consumat (R-COST, free tier)

- Azure Document Intelligence F0: **~3 pagini** consumate în dezvoltare/verificare (Filtrasan ×3). Cotă: 500 pag/lună. OK.
- Gemini: câteva apeluri de diagnostic (free tier).

## Gate (R7.6)

`npx tsc --noEmit` = 0 · `npx jest` = **116/116** (F9 + noi: `pdf-text-quality` 7, `ocr-map` tabel 4 + ordine 3, `test_azure_layout` pytest 8) · `npx next build` = OK · `pytest api/tests/` = 49. Non-regresie F9: calea Gemini/imagini neatinsă.
