# Ghid de verificare — Editor F6 (paritate + funcții noi)

> Versiune 1.0 · 2026-07-25 · Pentru Roland. Aplicația LIVE: `traduceri-frontend.vercel.app` (tab **Editor** sau `/editor-nou` = „Tot ecranul").

---

## 0. Cum se citește acest ghid (IMPORTANT — adevărul despre „detectare automată")

Ai cerut ca sistemul să _sesizeze automat prin loguri_ dacă verificările trec. Adevărul, spus direct:

**Un log poate dovedi ce a făcut CODUL și ce DATE au rezultat — NU poate dovedi ce se VEDE cu ochiul sau ce s-a AUZIT.** De-asta cele 5 verificări sunt pe lista „manuală": partea lor perceptuală (arată bine PDF-ul? a înțeles dictarea cuvintele corecte? e utilizabil pe telefon?) are nevoie de tine. Telemetria **îngustează** golul — nu-l închide.

De aceea fiecare verificare de mai jos are două părți:

- 🟢 **[LOG]** — ce confirmă logul **automat** (eu, într-o sesiune viitoare, citesc logul și spun „a mers / n-a mers"). Mecanic, obiectiv.
- 🟡 **[OCHIUL TĂU]** — ce rămâne să judeci tu. Perceptual, subiectiv. Aici o poză/un cuvânt de la tine e suficient.

> ✅ **Starea telemetriei ACUM (2026-07-25):** ACTIVĂ și dovedită live (vezi §8). Partea 🟢 se loghează automat în Supabase (`logs` în proiectul tenders-ro) la fiecare acțiune. Partea 🟡 (testarea manuală) rămâne a ta. Tu doar faci pașii de mai jos — eu citesc logurile după.

---

## 1. G2 — Matematică (formule + simboluri)

**Pași:**

1. Deschide **Editor**. Apasă **Σ Matematică**.
2. Alege o clasă (ex. VIII), apasă o formulă cu putere (ex. o formulă cu `x²`). Verifică că apare în foaie.
3. Din același panou, apasă un simbol (ex. `√` sau `π`). Verifică că apare la cursor.
4. Scrie ceva text lângă ele.

- 🟢 **[LOG]** `editor:math_insert` cu: tip (formulă/simbol), clasa, iar `getHTML()` conține `<sup>`/`<sub>`/simbolul Unicode corect. → pot confirma automat că notația a intrat fidel în document.
- 🟡 **[OCHIUL TĂU]** Formula se **vede** corect randată (exponentul sus, indicele jos), nu ca text simplu „x2".

---

## 2. G5 — Dictare vocală reală (RO)

> Necesită microfon + Chrome/Edge/Safari (Firefox nu are). Pe telefon: butonul 🎤 e direct în bara de sus.

**Pași:**

1. Pune cursorul unde vrei textul. Apasă **🎤 Dictează**. La prima dictare apare avizul „audio pleacă la Google/Apple" — acceptă.
2. Vorbește clar o frază în română (ex. „Aria triunghiului este bază ori înălțime supra doi").
3. Fă o pauză de 2-3 secunde, mai spune o frază (test pentru `continuous`).
4. Apasă **Oprește**.

- 🟢 **[LOG]** `editor:dictation_start` (config `ro-RO`, `continuous`), apoi `editor:dictation_final` cu **textul transcris** (îl pot citi — văd exact ce a auzit motorul), apoi `editor:dictation_stop`. → pot confirma: a pornit, ce a transcris, a ținut prin pauză (auto-restart), s-a oprit.
- 🟡 **[OCHIUL TĂU]** (a) Textul a intrat **la cursor** (nu la sfârșit); (b) transcrierea **se potrivește** cu ce ai spus (asta doar tu știi); (c) după **Oprește**, indicatorul de microfon din tab (bulina roșie a browserului) **se stinge**.

---

## 3. G7 — Pagini A4 (ghidaje + contor)

**Pași:**

1. Pe **desktop** (ghidajele sunt ascunse pe telefon — foaia e fluidă acolo).
2. Scrie/lipește text cât să treci de o pagină (ex. 40-50 de rânduri).
3. Urmărește contorul „📄 N pag. A4" din bară și linia punctată „Pagina 2".

- 🟢 **[LOG]** `editor:page_count` cu numărul de pagini calculat. → pot confirma că paginarea numără corect pe măsură ce crește documentul.
- 🟡 **[OCHIUL TĂU]** Linia „Pagina 2" cade **aproximativ** unde se va rupe la print (reamintire onestă din F4d: ruptura reală poate fi cu un element mai sus — print-ul nu taie la mijloc de paragraf).

---

## 4. Export PDF (print vectorial)

> `window.print()` deschide dialogul de print al browserului — de-asta NU se poate automatiza (blochează orice unealtă). Aici tu ești singura verificare vizuală.

**Pași:**

1. Scrie un document cu de toate: un titlu, **bold**, o formulă `x²`, un tabel mic, o **întrerupere de pagină** (vezi §6).
2. **Fișier ▾ → Exportă PDF**. În dialogul de print alege „Salvează ca PDF".
3. Deschide PDF-ul.

- 🟢 **[LOG]** `editor:export` cu `format:"pdf"`, numărul de întreruperi de pagină, `hasSup/hasSub/hasTable/hasBold`, numele documentului. → pot confirma că sursa trimisă la print conținea toată notația.
- 🟡 **[OCHIUL TĂU]** (a) PDF-ul **arată** ca documentul (font, tabel, formulă); (b) **întreruperea de pagină** chiar începe pagină nouă; (c) unde cade ruptura naturală vs ghidajul „Pagina N".

---

## 5. Export Word (.docx) — dintr-o dictare reală

> Verificarea „completă" pe care doar tu o poți face: motor vocal real + export real, combinate.

**Pași:**

1. Dictează câteva fraze (§2). Adaugă un tabel cu **dungi alternante** (Tabel → Dungi alternante) și o **întrerupere de pagină**.
2. **Fișier ▾ → Exportă Word**. Se descarcă un `.docx`.
3. Deschide-l în Word/LibreOffice/Google Docs.

- 🟢 **[LOG]** `editor:export` cu `format:"docx"`, mărimea fișierului, aceleași steaguri de conținut. → pot confirma că exportul s-a produs din conținutul editat (nu gol, nu eroare).
- 🟡 **[OCHIUL TĂU]** În Word: textul dictat e acolo, tabelul are dungi, întreruperea de pagină e o pagină nouă, diacriticele corecte.

---

## 6. Întrerupere de pagină (în editor + în export)

**Pași:**

1. Pune cursorul între două paragrafe. **Inserare → Întrerupere de pagină**.
2. În editor apare o linie punctată cu eticheta „Întrerupere de pagină".
3. Exportă PDF **și** Word (§4, §5) și verifică ruptura.

- 🟢 **[LOG]** `editor:insert` cu `type:"page_break"`, iar `getHTML()` conține `class="page-break"`. → pot confirma că nodul e în document și va deveni `<w:br type=page>` în Word.
- 🟡 **[OCHIUL TĂU]** În PDF/Word chiar **începe pagină nouă** acolo.

---

## 7. Găsește & Înlocuiește — pe TELEFON real

> Pe desktop e deja verificat de mine. Pe mobil am verificat doar logica (Sheet-ul se închide când deschizi căutarea), nu vizual.

**Pași (pe telefon):**

1. Deschide Editor. Scrie un text cu un cuvânt repetat (ex. „triunghi" de 3 ori).
2. Apasă **Format** (jos) → **🔍**. Sheet-ul „Format" trebuie să se **închidă**, iar bara de căutare să apară sus.
3. Scrie „triunghi" → vezi contorul (ex. 3), potrivirile evidențiate. Scrie o înlocuire → **Toate**.

- 🟢 **[LOG]** `editor:find_open`, `editor:find_replace_all` cu numărul de potriviri înlocuite. → pot confirma că a găsit N și a înlocuit N.
- 🟡 **[OCHIUL TĂU]** Pe ecranul telefonului: bara e **utilizabilă** (câmpurile se văd, tastatura nu le acoperă), evidențierea galben/portocaliu se vede.

---

## 8. Starea telemetriei — ACTIV ✅ (2026-07-25)

Partea 🟢 e **pornită și dovedită live**. Nu mai e „pregătită, inactivă".

- **Sink:** tabela `logs` creată în proiectul Supabase **tenders-ro** (refolosit — 0 $, decizia ta pt R-COST; izolată prin `source` + prefixul `editor:` din mesaj; RLS activ, doar service-role scrie/citește).
- **Env vars pe producție:** `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` setate (numele exact pe care-l citește codul — nepotrivirea `SERVICE_ROLE_KEY` rezolvată la cablare). Redeploy făcut.
- **Instrumentare:** editorul emite evenimentele 🟢 de mai sus, **mereu pornit** (decizia ta), doar evenimente semantice.
- **Dovadă end-to-end:** click real pe site-ul LIVE → au apărut în tabelă `editor:find_open` + `editor:page_count` (verificat prin interogare directă). Lanțul `UI → logAction → /api/logs → Supabase → interogare` funcționează.

**Cum citesc eu logurile** (într-o sesiune viitoare): interoghez tabela `logs` filtrând `message like 'editor:%'` pe fereastra de timp a testului tău, și-ți dau un raport „trecut/picat" pe partea 🟢 (mecanică), lăsându-ți doar 🟡 (perceptuală). Le vezi și tu live pe `/diagnostics`.

---

## 9. Schema evenimentelor (contractul IMPLEMENTAT)

Un singur canal: `trackEditor("<ev>", {…})` → `logAction("editor:<ev>")` → `/api/logs` → Supabase `logs`. **Filtrare: `message like 'editor:%'`** (`level="action"`, `source="user-action"` — moștenit din `logAction`; NU `source="editor"`). **Evenimente semantice, nu „fiecare click"** (clickul brut = zgomot + consumă cotă + nu ajută la verificare).

| Eveniment                                           | Context (payload)                                                                  | Verifică |
| --------------------------------------------------- | ---------------------------------------------------------------------------------- | -------- |
| `editor:math_insert`                                | `{kind:"formula"/"symbol", grup/clasa/symbol, hasSup, hasSub}`                     | §1       |
| `editor:dictation_start`                            | `{lang:"ro-RO", continuous:true}`                                                  | §2       |
| `editor:dictation_audio`                            | `{}` — micul livrează sunet (dacă LIPSEȘTE → mic/permisiune)                       | §2       |
| `editor:dictation_final`                            | `{textLen, sample}` (primele 80 caractere transcrise)                              | §2       |
| `editor:dictation_stop`                             | `{durationMs}`                                                                     | §2       |
| `editor:dictation_error`                            | `{code}`: not-allowed/audio-capture/network/no_audio_loop/…                        | §2       |
| `editor:page_count`                                 | `{pages}` — emis DOAR la schimbarea numărului                                      | §3       |
| `editor:insert`                                     | `{type}`: `page_break`/`table`/`table_zebra`/`cell_bg`/`link`/`image`/`date`/`hr`  | §6       |
| `editor:export`                                     | `{format, name, htmlLen, pageBreaks, hasSup, hasSub, hasTable, hasBold, hasZebra}` | §4, §5   |
| `editor:find_open`                                  | `{}`                                                                               | §7       |
| `editor:find_replace_all`                           | `{query, replaced}`                                                                | §7       |
| `editor:legacy_bring` / `editor:legacy_import_auto` | `{name}`                                                                           | import   |

> Notă confidențialitate (decizie Roland 2026-07-25): telemetria e **MEREU PORNITĂ** — logare în cloud a activității reale (inclusiv a Cristinei, fără autentificare). Alegere conștientă, nu default. Dacă vrei vreodată s-o poți opri, se adaugă un comutator „mod verificare" în bara editorului.
