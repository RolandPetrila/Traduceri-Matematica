# FAZELE — explicate pe înțeles, pentru analiza și decizia lui Roland

> **Ce e acest fișier:** cele 6 faze propuse pentru sesiunea de reparație, fiecare explicată în
> același mod: ce e stricat acum → exemplu real din proiectul tău → analogie → de ce contează
> pentru tine și Cristina → ce ar face concret faza → **ce ai tu de decis**.
>
> **Cum se folosește:** îl citești, îl analizezi, îmi spui ce modifici. Nimic nu e stabilit până
> nu confirmi tu. După ce toate fazele sunt stabilite, salvăm progresul și execuția pornește
> într-o sesiune nouă, curată, pe baza acestui document.
>
> **Sursa cerințelor:** `docs/completari_pt_reparatie.md` (cele 8 puncte scrise de tine).
> **Stare:** 🟡 DRAFT — propunerea lui Claude, NEconfirmată încă.

---

## Ce s-a dovedit deja (fapte verificate live, nu presupuneri)

Astea stau la baza fazelor și nu se re-discută — sunt dovezi culese în sesiunea curentă:

1. **Bug SK, cu simptome precise** (reprodus în browser, pe producție):
   - Eșuează **înainte de orice apel de rețea** — 0 cereri `/api/translate-text` în network panel.
   - Mesajul „Traducerea a eșuat. Verifică internetul" **e înșelător** — nicio cerere n-a plecat.
   - După eșec, butonul **SK rămâne dezactivat** → nu poți reîncerca fără reload.
   - Documentul declanșator: import OCR cu **tabel + întrerupere de pagină + `[Pagina 1: OCR eșuat]`**.

2. **Orbire diagnostică** (răspunsul la punctul tău 2): eroarea a fost logată ca
   `editor:translate_error`, nivel `action`, `error_code = null`, context doar `{"to":"sk"}` —
   fără status, fără cauză, fără stack. Invizibilă pe `/diagnostics`, la gruparea pe cod și la
   verificarea automată de erori.

3. **Lecția de metodă** (răspunsul la punctele tale 1 și 4): auditul anterior a citit cod și a
   probat endpoint-uri cu payload minimal. Tu ai apăsat un buton real, pe un document real →
   eroare imediată. Deci `docs/arhiva/RAPORT_F5_AUDIT_2026-09-07.md` se tratează ca **inventar de butoane
   cu verdicte NEVERIFICATE**, nu ca audit terminat.

4. **Decizii deja luate de tine:** subagenți **secvențiali per modul** (nu paralel);
   `Plan_in_Lucru.md` = sesiunea **propune**, tu **aprobi**.

---

# 📍 FAZA 1 — „Repară orbirea diagnostică"

## Ce e stricat acum, în termeni simpli

Când ceva pică în aplicație, aplicația **șoptește** eroarea într-un mod în care nimeni n-o aude.

**Exemplul tău, concret:** ai apăsat SK. Ai văzut „Traducerea a eșuat. Verifică internetul". În
sistemul de log-uri s-a scris **doar atât**: `editor:translate_error` + `{to:"sk"}`. Nimic despre
**de ce**.

**Analogia:** e ca și cum bordul mașinii ar aprinde un bec generic „defecțiune", iar în carnetul
de service s-ar nota doar „șoferul voia să vireze la stânga". Mecanicul de mâine nu poate ști dacă
a fost bateria, frâna sau direcția.

## De ce contează — două situații reale

**1. Cristina, la școală, cu 5 minute înainte de oră.** Nu-i merge generarea unei fișe. Te sună.

- _Azi:_ îi poți spune doar „mai încearcă". Nu ai de unde ști ce s-a întâmplat.
- _După Faza 1:_ ea îți citește un cod (ex. `E-TRAD-002`), tu deschizi `/diagnostics` și vezi
  instant: _„traducerea a picat pentru că documentul conține un tabel pe care extragerea nu-l
  suportă — 18:33, pe telefonul ei"_. Diferența dintre a ghici și a ști.

**2. Cazul care s-a întâmplat efectiv, cu mine.** La începutul sesiunii am rulat verificarea
automată de erori și ți-am raportat **„zero erori active"** — în timp ce eroarea ta de SK stătea
în log **de 3 ori**. Fusese scrisă la nivelul `action`, nu `error`, iar verificarea mea o filtra.
**Orbirea nu te-a păcălit doar pe tine — m-a făcut pe mine să-ți dau un raport fals-liniștitor.**

## Ce ar face concret Faza 1

Fiecare eșec de flux (traducere, import/OCR, export, generare, conversie, print) capătă: **un cod**,
**o cauză reală scrisă în clar** și **locul unde s-a produs** — vizibile în `/diagnostics` și în
log-uri, filtrabile și grupabile.

## Ce ai TU de decis la Faza 1

- **(1a) Acoperirea:** toate fluxurile din toate modulele _(recomandat)_ / doar fluxurile care
  ating AI-rețea (traducere, OCR, generare, chat) / doar traducerea, minim ca să reparăm SK.
- **(1b) Ce vede Cristina pe ecran:** mesaj clar + **cod vizibil** _(recomandat — ea ți-l citește
  la telefon)_ / mesaj + cod + buton „Copiază detaliile" (ți-l trimite pe WhatsApp) / doar mesaj
  prietenos, fără cod (interfață mai curată, dar tu nu afli nimic de la ea).
- **(1c) Cât din conținut se salvează în log:** cod + cauză + **fragment scurt** din conținutul
  care a picat _(recomandat — permite reproducerea fără să-i ceri fișierul)_ / doar cod + cauză,
  fără niciun fragment (discreție maximă, reproducere mai grea).

---

# 📍 FAZA 2 — „Bug SK: reparare + posibilitatea de a reîncerca"

## Ce e stricat acum

Traducerea în slovacă **pică pe un document real** și, mai rău, **se blochează**: după eșec,
butonul SK devine gri și nu mai poți încerca din nou fără să reîncarci pagina.

**Exemplul tău, concret:** ai apăsat SK pe documentul rămas în editor (care avea conținut OCR,
un **tabel** și o întrerupere de pagină). A apărut eroarea. Când am încercat eu să reproduc,
am dat click de trei ori pe SK — **nu s-a întâmplat absolut nimic**, fiindcă butonul era deja
dezactivat de la eșecul tău.

**Analogia:** un întrerupător care, după o singură apăsare nereușită, se blochează în poziția
„stins", iar pe el scrie „verificați rețeaua electrică" — deși firul spre rețea n-a fost niciodată
atins. Problema era în întrerupător, nu în rețea.

## De ce contează — situații reale

**1. Traducerea RO→SK este funcția centrală a aplicației pentru Cristina** (predă la secția
slovacă). Dacă ea pică exact pe documentele cu **tabele** — iar tabelele sunt peste tot în
matematică (tabele de valori, tabele de variație) — atunci aplicația își ratează scopul principal
fix pe materialele cele mai des folosite.

**2. Blocajul e mai rău decât eroarea.** O eroare o mai încerci o dată. Un buton gri îți spune
„gata, nu se mai poate" — Cristina închide aplicația și scrie fișa de mână.

## Ce ar face concret Faza 2

Reproducere în browser → găsirea cauzei reale în cod → reparare → **mesaj corect** (nu „verifică
internetul" când nu s-a făcut nicio cerere) → **buton reîncercabil** după eșec → test de regresie
pe un document cu tabel + întrerupere de pagină, ca să nu revină.

## Ce ai TU de decis la Faza 2

- **(2a) Cât de departe merge reparația:** _(i)_ să nu mai crape — traduce ce poate și sare peste
  nodurile problematice (rapid, sigur); _(ii)_ **suport complet** — traduce inclusiv textul din
  celulele tabelului _(mai mult de lucru, dar tabelele sunt frecvente la matematică)_. Exemplu
  real: o fișă cu un tabel de valori — vrei ca și capetele de tabel („Valoare", „Rezultat") să
  apară în slovacă, sau e acceptabil ca tabelul să rămână în română?
- **(2b) Ce se întâmplă la eșec:** buton „Încearcă din nou" _(recomandat)_ / reîncercare automată
  o dată, în tăcere / doar mesaj clar, fără reîncercare.
- **(2c) Acoperirea limbilor:** reparăm doar SK / **verificăm și reparăm la fel EN și DE**
  _(recomandat — foarte probabil au exact același defect, fiind același cod)_.

---

# 📍 FAZA 3 — „Caiet de sarcini" (desfășurătorul aplicației)

## Ce lipsește acum

**Nu există niciun document care să spună, buton cu buton, ce trebuie să facă aplicația.** Fără el,
nimeni — nici tu, nici eu, nici o sesiune viitoare — nu poate verifica „funcționează cum trebuie?".
Se pot descoperi defecte doar din întâmplare, exact cum ai făcut tu ieri cu SK.

**Exemplul concret:** auditul de ieri a declarat „~73 de butoane funcționează". Dar nimeni nu
scrisese ce ar TREBUI să facă fiecare — așa că „funcționează" a însemnat de fapt „codul pare
conectat", nu „face ce promite". Butonul SK a fost declarat verde. Tu l-ai spart în 10 secunde.

**Analogia:** o clădire fără proiect tehnic. Nu poți face recepția lucrării — poți doar să te
plimbi prin ea și să speri că observi crăpăturile. Caietul de sarcini ESTE proiectul tehnic față
de care se face recepția.

## De ce contează — situații reale

**1. Poți testa singur, metodic, fără mine.** Iei lista, mergi prin ea buton cu buton și bifezi.
Nu mai depinzi de declarațiile mele.
**2. Cristina poate raporta precis:** „butonul X nu face ce scrie în caiet la punctul Y" — în loc
de „nu merge ceva".
**3. Orice sesiune viitoare** verifică pe baza aceluiași document, fără să reinventeze totul (și
fără să-ți dea, ca mine, un „verde" nesusținut).

## Ce ar face concret Faza 3

Un document `docs/CAIET_DE_SARCINI.md`: **modul → submodul → funcție → buton**. Pentru fiecare
buton: ce execută concret, ce input realist cere, cum se testează pas cu pas, care e rezultatul
așteptat, ce cod de eroare emite la eșec, cum se vede în diagnoza live.
Acoperă: Convertor, Editor (toolbar, matematică, inserare, tabel, căutare, Ctrl+K, import/OCR,
export, traducere F8), Asistent AI, Calculator, Teste, Istoric, Planșe (6 generatoare + coș),
Școlare, meniul Setări/Reîncarcă, pagina `/diagnostics`.

## Ce ai TU de decis la Faza 3

- **(3a) Granularitatea:** absolut fiecare buton, inclusiv formatarea (Bold, Italic, aliniere) /
  **doar butoanele „de execuție"** — cele care generează, transformă, salvează, trimit
  _(recomandat: formatarea o vezi instant pe ecran; generarea unei fișe nu)_.
- **(3b) Cum se construiește:** pornind de la inventarul existent din `RAPORT_F5_AUDIT` _(rapid,
  dar moștenește ce am inventariat eu)_ / **deschizând live fiecare modul și notând ce se vede
  acolo** _(mai lent, dar prinde submodulele pe care nimeni nu le-a deschis — exact ce ai
  întrebat tu la punctul 2)_ / ambele: pornim de la inventar, dar confirmăm live fiecare modul.
- **(3c) Forma:** un singur fișier mare _(căutare ușoară cu Ctrl+F)_ / câte un fișier per modul
  _(mai ușor de citit și de bifat pe rând)_.

---

# 📍 FAZA 4 — „Auditul real, în browser, modul cu modul"

## Ce e stricat acum

Auditul precedent a fost făcut **citind cod** și **trimițând cereri de probă simple** către server.
A declarat verde exact butonul pe care tu l-ai spart la primul click.

**Exemplul concret, care arată diferența:** proba mea a trimis **un singur paragraf** la serverul
de traducere → răspuns 200 → „funcționează". Documentul tău avea **conținut OCR + tabel +
întrerupere de pagină** → crăpat. Ambele afirmații vorbeau despre „traducere", dar numai a ta
vorbea despre realitate.

**Analogia:** verifici mașina pornind motorul în garaj și declari „mașina merge" — fără s-o scoți
pe drum, încărcată, în pantă.

## De ce contează — situații reale

**1. Ăsta e răspunsul la reproșul tău numărul 1** („nu ai verificat toate funcțiile"). La finalul
fazei ai un verdict per modul **cu dovadă** (captură de ecran, log, status) — nu cuvântul meu.
**2. Găsești defectele înaintea Cristinei.** Un buton spart descoperit de mine costă o oră.
Descoperit de ea, în fața clasei, costă lecția.

## Ce ar face concret Faza 4

Modul cu modul, în ordine: un subagent dedicat pregătește planul de test din Caietul de sarcini;
sesiunea principală **execută verificarea live în browser** (click real pe fiecare buton), cu
**conținut realist**, citind consola, rețeaua și log-urile. Raport după fiecare modul, cu dovadă.
Defectele găsite intră în `Plan_in_Lucru.md` ca **propuneri**, pe care le aprobi tu.

## Ce ai TU de decis la Faza 4

- **(4a) Cu ce date testăm:** eu generez fișiere de test sintetice _(rapid, dar artificial)_ /
  **tu îmi dai câteva fișiere reale de-ale Cristinei** — o poză de manual, un .docx cu tabel, un
  PDF scanat _(recomandat: cel mai apropiat de realitate; azi am văzut că un PDF sintetic a trecut,
  iar unul realist a spart traducerea)_ / amestecat.
- **(4b) Ordinea modulelor:** de la cel mai folosit la cel mai rar _(Editor → Școlare → Teste →
  Chat → Convertor → Planșe → Calculator)_ / în ordinea din meniu / îmi spui tu prioritatea.
- **(4c) Ce fac când găsesc un defect:** mă opresc și-l repar imediat _(vezi rezultate pe loc, dar
  auditul durează mai mult)_ / **notez și continui auditul, reparăm la final pe listă aprobată de
  tine** _(recomandat: vezi întâi tabloul complet, apoi decizi prioritățile)_.

---

# 📍 FAZA 5 — „Unificarea documentației în două fișiere vii"

## Ce e stricat acum

Documentația e împrăștiată în 18 fișiere `docs/`, plus memorie, plus rapoarte de audit — și **o
parte din ea minte**. Un document învechit e mai periculos decât lipsa lui, fiindcă îl crezi.

**Exemple concrete, din chiar sesiunea asta:**

- Handoff-ul scria „NEDEPLOYAT" despre o funcție care era **deja live** — era să redeployez degeaba.
- `CLAUDE.md` scria că formulele se randează cu MathJax, deși codul folosește KaTeX de mult.
- Un audit întreg s-a construit pe un raport ale cărui verdicte nu fuseseră verificate.

**Analogia:** o firmă cu 18 versiuni ale aceleiași proceduri, în sertare diferite. Angajatul nou
o citește pe cea greșită și face munca de două ori.

## De ce contează — situații reale

**1. Vezi într-un singur loc tot ce s-a făcut vreodată** (`Plan_Finalizat.md`) — util exact când
te întrebi „am făcut noi lucrul X?" și nu mai ții minte din ce sesiune.
**2. Într-un singur loc, exact ce a rămas** (`Plan_in_Lucru.md`), cu căsuțe pe care **doar tu** le
aprobi. Nu-ți mai scapă nimic printre 18 fișiere.
**3. O sesiune nouă citește două fișiere, nu optsprezece** — și nu mai pornește pe informație veche.

## Ce ar face concret Faza 5

- `docs/Plan_Finalizat.md` — tot istoricul implementărilor, de la prima execuție la ultima, cu
  dovadă (commit, deploy, verificare). Fișier **viu**, actualizat după fiecare sesiune.
- `docs/Plan_in_Lucru.md` — ce rămâne de făcut, cu căsuțe `[ ]` bifate **doar** când e finalizat,
  verificat și testat live. Când o fază se termină, itemii ei se **transferă** în `Plan_Finalizat.md`.
- `docs/completari_pt_reparatie.md` rămâne neatins — e caietul tău de reclamații.

## Ce ai TU de decis la Faza 5

- **(5a) Ce se întâmplă cu documentele vechi:** se șterg _(git păstrează oricum istoricul)_ /
  **se mută într-un folder `docs/arhiva/`** _(recomandat dacă vrei să le mai poți răsfoi)_ /
  rămân pe loc, dar marcate „ISTORIC — nu te baza pe ele".
- **(5b) Cât de detaliat e `Plan_Finalizat.md`:** fiecare commit _(foarte detaliat, greu de citit)_ /
  **un rezumat per fază/sesiune, cu link la commit-uri** _(recomandat: se citește în 5 minute)_ /
  doar titluri de faze.
- **(5c) Cum se ordonează istoricul:** cronologic _(vezi evoluția în timp)_ / pe module _(găsești
  repede „ce s-a făcut la Școlare")_ / cronologic, dar cu un index pe module la început.

---

# 📍 FAZA 6 — „Automatizarea procesului" (ca să nu se piardă)

## Ce lipsește acum

Tot ce stabilim aici ține **doar cât își aduce cineva aminte**. Sesiunea următoare pornește cu
context curat — dacă regula nu e scrisă în locul potrivit, dispare.

**Exemplul concret, dureros:** regula de verificare automată a erorilor **exista deja**
(R-DIAG-AUTO). Dar era scrisă îngust — „citește erorile de nivel `error`/`warn`" — iar eroarea ta
era la nivel `action`. Regula a fost respectată **la literă** și a produs un raport fals. Nimeni
n-a confruntat regula cu realitatea.

**Analogia:** o procedură bună care trăiește doar în capul unui angajat. Când pleacă el (= sesiune
nouă, context curat), pleacă și procedura.

## De ce contează — situații reale

**1. Peste o lună, într-o sesiune nouă,** vreau să pornesc corect fără să-mi explici tu totul de la
capăt: citesc `Plan_in_Lucru.md` + `completari_pt_reparatie.md` și știu exact unde suntem.
**2. Nu mai primești „verde" nesusținut:** regula spune explicit că nimic nu se declară funcțional
fără dovadă live, în browser, pe conținut realist.
**3. Fișierul tău de reclamații e citit automat** la fiecare pornire — nu mai depinde de faptul că
îmi amintesc eu să-l deschid.

## Ce ar face concret Faza 6

Reguli scrise în `.claude/rules/project_rules.md` + memoria proiectului: (a) la start se citesc
`Plan_in_Lucru.md` și `completari_pt_reparatie.md`; (b) după fiecare fază: se bifează, se transferă
bifatele în `Plan_Finalizat.md`, se actualizează handoff-ul și memoria, commit+push; (c) nimic nu
se declară „funcțional" fără dovadă live; (d) verificarea automată a erorilor citește **toate**
nivelele de log, nu doar `error`/`warn`.

## Ce ai TU de decis la Faza 6

- **(6a) Cât de strictă e regula dovezii:** **nimic nu se declară gata fără dovadă live în browser**
  _(recomandat — exact ce a lipsit; face lucrurile mai lente, dar oneste)_ / dovadă live doar pentru
  fluxurile pe care le atinge Cristina / dovadă live doar la cerere.
- **(6b) Ritmul raportării:** raport după fiecare **fază** _(mai puține întreruperi)_ / după fiecare
  **modul** _(vezi progresul mai des, dar mai multe mesaje)_.
- **(6c) Vrei o „listă de pornire" afișată la începutul fiecărei sesiuni?** — adică să-ți arăt, în
  primul mesaj, ce am citit (plan, reclamații, stare) și ce urmează, ca să vezi negru pe alb că
  am pornit corect. _(Recomandat: e verificarea ta că procesul chiar rulează.)_

---

## Reguli de execuție care se transmit sesiunii de execuție (capcane deja dovedite)

- **Gate:** `npm run typecheck`, `npm test`, `npm run build` (din `frontend/`), `pytest api/tests/`
  (prin `.venv`). Se citește valoarea `EXIT_*` **din output** — pipe-ul (`| tail`) maschează codul
  de ieșire și produce „verde fals" (mi s-a întâmplat azi).
- **Deploy:** SECVENȚIAL, niciodată două în paralel (coliziune de configurație — dovedit azi).
  Frontend: `cd frontend` ÎNTÂI, apoi `npx vercel deploy --prod --yes --token="$VERCEL_API_KEY"`.
  Backend: din rădăcină. Bump `CACHE_VERSION` în `frontend/public/sw.js`. Verificare pe ALIAS.
- **Commit:** mesaje fără diacritice (hook-ul de siguranță le respinge).
- Deploy automat după fiecare fază verde e deja autorizat de tine („întotdeauna live").

---

## Jurnalul stabilirii fazelor

| Fază                          | Stare          | Data stabilirii |
| ----------------------------- | -------------- | --------------- |
| F1 — Orbirea diagnostică      | 🟡 de discutat | —               |
| F2 — Bug SK                   | 🟡 de discutat | —               |
| F3 — Caiet de sarcini         | 🟡 de discutat | —               |
| F4 — Audit real in-browser    | 🟡 de discutat | —               |
| F5 — Unificarea documentației | 🟡 de discutat | —               |
| F6 — Automatizarea procesului | 🟡 de discutat | —               |
