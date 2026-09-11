# ERATĂ — ce s-a dovedit FALS din „faptele verificate" ale `Fazele.md`

> Scris: 2026-09-08, după execuția Fazei 1 și verificarea LIVE pe producție.
> **De ce există acest fișier:** `docs/Fazele.md` are o secțiune numită „Ce s-a dovedit deja
> (fapte verificate live, nu presupuneri)" (liniile 16-38) care spune explicit că **nu se
> re-discută**. Trei dintre acele „fapte" sunt infirmate de dovezi. Roland analizează acel
> document — trebuie să-l analizeze pe date corecte.

---

## Rezumat: ce cade și ce rămâne

| #   | „Fapt" din `Fazele.md`                                                            | Verdict                | Dovada                                                                                             |
| --- | --------------------------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------- |
| 1   | „Eșuează **înainte de orice apel de rețea** — 0 cereri `/api/translate-text`"     | ❌ **FALS**            | `performance.getEntriesByType("resource")` pe prod: cererea a plecat și a durat **2218 ms**        |
| 2   | „Mesajul «Verifică internetul» e înșelător"                                       | ✅ **ADEVĂRAT**        | Mesaj hardcodat în cod (`editor-translate-state.tsx`), indiferent de cauză. **Reparat în Faza 1.** |
| 3   | „După eșec, butonul **SK rămâne dezactivat** → fără reload nu se poate reîncerca" | ❌ **FALS**            | Trei dovezi independente (mai jos)                                                                 |
| 4   | „Documentul declanșator: tabel + întrerupere de pagină"                           | ❌ **Corelație falsă** | Același document s-a tradus perfect la a doua apăsare, cu tabelul intact                           |
| 5   | „Orbire diagnostică: `action` / `error_code=null` / eroarea aruncată"             | ✅ **ADEVĂRAT**        | Confirmat mecanic în cod. **Reparat în Faza 1.**                                                   |

---

## 1. Cererea de rețea A PLECAT

`Fazele.md` linia 21: _„Eșuează înainte de orice apel de rețea — 0 cereri `/api/translate-text`
în network panel."_

Măsurat pe producție, imediat după eșec:

```
traduceri-api.vercel.app/api/translate-text — 2218 ms
```

Cererea a plecat, serverul a răspuns (status 2xx — altfel interceptorul de rețea ar fi logat
`E-NET-002`). **Eșecul e la citirea răspunsului, nu la trimiterea lui.**

## 2. Cauza REALĂ (necunoscută până acum)

Faza 1 a scos-o la lumină la prima apăsare pe SK:

```
SyntaxError: Failed to execute 'json' on 'Response':
Unexpected token 'x', "x-vercel-i"... is not valid JSON
```

Corpul răspunsului începe cu **`x-vercel-internal-timing: …`** — runtime-ul Vercel Python
scurge antete interne în CORPUL răspunsului, iar `res.json()` crapă.

**Aceasta este exact clasa de bug reparată la R9** (2026-09-07) pentru descărcările binare
din Convertor (`stripVercelFraming`). Atunci s-a curățat **doar calea binară**. Calea JSON —
adică traducerea, funcția centrală pentru Cristina — a rămas necurățată.

## 3. Butonul NU se blochează

Trei dovezi independente:

1. **În cod:** butoanele sunt `disabled={isTranslating}`, iar `isTranslating` se resetează în
   `finally` — deci și pe ramura de eșec (`editor-translate-state.tsx`).
2. **În log-uri:** eșec la `10:27:37`, **reușită la `10:27:42`** (5 secunde), același dispozitiv.
3. **Live, în browser, pe documentul real:** după eșec am citit `disabled: false` pe toate
   patru butoanele, am apăsat SK a doua oară → **documentul s-a tradus integral în slovacă**,
   tabelul intact, cota DeepL 2.9% → 3.1%.

## 4. Tabelul și întreruperea de pagină NU sunt vinovate

Același document (tabel × 3, 20 rânduri, 40 celule, `pageBreak`, marcaj `[Pagina 1: OCR eșuat]`)
a eșuat la prima apăsare și a reușit la a doua, **fără nicio modificare**. Deci eșecul e
**intermitent**, nu determinat de conținut.

Explicația care leagă totul: framing-ul apare la **cold start** al funcției Python
(exact ce spunea finding-ul R9: „`\r\n` la warm, blocul `x-vercel-internal-timing` la cold").
Asta explică și rata observată în log-uri: **10 eșecuri la 49 de încercări ≈ 1 din 5**.

## 5. Nu e nici „bug SK", nici nou

Din log-urile Supabase (toate nivelele, nu doar `error`/`warn`):

- **10 eșecuri**, primul la **2026-08-20**, ultimul la 2026-09-06;
- pe **`sk`, `en`, `de` ȘI `ro`** — nu doar slovacă;
- față de **39 de traduceri reușite** (din 2026-07-29).

Eșecul pe `ro` (revenirea la original) confirmă că limba n-are nicio legătură.

---

## Consecințe pentru punctele de decizie din `Fazele.md`

- **(2a)** „Cât de departe merge reparația (sări peste tabele / traduce și celulele)" — întrebarea
  pornea de la premisa că tabelele rup traducerea. **Nu o rup.** Tabelele se traduc deja. Punctul
  rămâne valabil doar dacă vrei o îmbunătățire, nu ca reparație.
- **(2b)** „Ce se întâmplă la eșec: buton «Încearcă din nou» / reîncercare automată / doar mesaj" —
  pornea de la premisa butonului blocat. **Nu e blocat.** Întrebarea reală devine: vrei
  **reîncercare automată tăcută** (ar fi ascuns complet acest bug de cold-start, care reușește
  mereu la a doua încercare), sau păstrăm mesajul onest + apăsare manuală?
- **(2c)** „Reparăm doar SK sau și EN/DE?" — **nu mai e o decizie**: e dovedit că lovește toate
  limbile, fiind același cod și aceeași cauză (răspunsul serverului).

---

## Un risc NOU, descoperit în timpul verificării (nu era în niciun document)

**Traducerea urmată de reîncărcarea paginii înlocuiește definitiv originalul.**

Mecanism: autosalvarea scrie în `editor_nou_v1` conținutul AFIȘAT, iar `editor_nou_lang_v1`
reține limba afișată. După un reload, aplicația citește conținutul tradus și limba tradusă →
consideră traducerea drept **sursă**. Originalul nu mai există nicăieri (cache-ul de traducere
stochează rezultatul, nu sursa).

Pentru Cristina: traduce o fișă în slovacă, închide tabul, se întoarce a doua zi — **varianta
românească nu se mai poate recupera**. Nu e o ipoteză: mi s-a întâmplat în timpul acestei
verificări, pe documentul rămas în editorul lui Roland.

Propus pentru `Plan_in_Lucru.md` (decizia lui Roland, nu execut nimic pe el acum).
