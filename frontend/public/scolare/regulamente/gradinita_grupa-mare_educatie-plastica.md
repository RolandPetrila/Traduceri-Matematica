# Regulament de generare — Grădiniță, Grupa Mare, Educație Plastică (DEC)

> Sursă conținut: reguli proprii (folder Carla, Grădiniță) + aliniat la Curriculum pentru educația
> timpurie OMEN 4694/2019 (Domeniile A — motricitate fină, C — potențial creativ). Copii 5-6 ani.
> **Completare 2026-08-08:** Carla NU are conținut pentru Educație Plastică la Grupa Mare (§2
> „Materii acoperite” din sursa Carla listează domeniul, dar §3 „Conținut educațional per materie”
> nu are subsecțiune scrisă pentru el — omisiune, nu contradicție; skeleton-ul aplicației confirmă
> nodul „educatie-plastica” la Grupa Mare). Conținutul de mai jos e construit de la zero, ca
> extrapolare firească a progresiei Mică→Mijlocie (culori primare→amestec culori, colorat
> contur→simetrie), aliniat la Domeniile A+C, fără să depășească ce e rezonabil pentru preșcolar
> mare.

## Domenii de conținut permise (aliniat curriculum)

- **Compoziție cu mai multe elemente**: aranjarea/desenarea a 3-4 elemente date într-o scenă
  coerentă (ex. soare, copac, casă) — extensie a desenului tematic de la Grupa Mijlocie, corelat
  cu Domeniul C („Demonstrează creativitate prin activități artistico-plastice, muzicale și
  practice”).
- **Desen după descriere**: reproducerea simplificată a unei forme/obiect cunoscut descris în enunț
  (ex. un fluture, o floare cu 5 petale) — desen ghidat de instrucțiunea text, NU desen liber din
  imaginație.
- **Tehnici mixte simple (colaj + desen)**: desenarea și decuparea de către copil a unui element (ex. o formă
  geometrică desenată de el pe o foaie separată), urmată de lipirea și completarea desenului în jurul ei — corelat cu Domeniul A („Utilizează
  mâinile și degetele pentru realizarea de activități variate”), cea mai avansată coordonare
  motrică din progresia grădiniței.
- **Simetrie extinsă**: desenarea unui obiect simetric întreg, cu mai multe detalii decât la Grupa
  Mijlocie (3-4 elemente identice pe fiecare jumătate, nu doar conturul general).

## Tipuri de exerciții acceptate

- Compoziție ghidată: plasarea/desenarea a 3-4 elemente date într-o scenă, cu poziții indicate
  (ex. „soarele sus, copacul jos-stânga”).
- Desen după descriere: reproducerea unei forme simple descrise în enunț, cu repere date în cuvinte dacă e
  nevoie.
- Colaj simplu: desenarea și decuparea de către copil a unei forme, apoi „lipirea”
  descrisă a elementului, urmată de completarea prin desen a restului compoziției.
- Simetrie cu mai multe detalii: desenarea unui obiect simetric întreg cu 3-4 elemente
  interne identice pe fiecare jumătate (nu doar conturul).

## Exemple concrete de format

1. „Desenează o scenă de vară: soarele în colțul din dreapta sus, un copac verde în stânga și o
   floare roșie lângă copac.”
2. „Desenează un fluture, având grijă ca cele două aripi să aibă aceeași formă
   (simetrice).”
3. „Desenează o casă întreagă, astfel încât fereastra, ușa și acoperișul să fie
   la fel pe amândouă jumătățile (simetrice).”
4. „Desenează un pătrat (poți să-l și decupezi), apoi desenează în jurul
   lui razele soarelui.”

## Interdicții explicite

- NU se cer compoziții cu mai mult de 4 elemente noi (risc de suprasolicitare motrică/atențională
  pentru 5-6 ani).
- NU se cer tehnici reale de pictură (acuarelă, tempera) sau instrumente nepotrivite vârstei —
  doar creion/carioca/decupaj simplu de hârtie.
- NU se cere desen liber complet din imaginație fără niciun reper TEXTUAL — mereu cu ghidaj în cuvinte (ce să deseneze,
  poziții indicate, câte elemente); NU se presupune un model/contur deja tipărit pe fișă.
- NU se folosesc calcule scrise pur aritmetic (coerent cu interdicția generală a Grupei Mari),
  chiar dacă exercițiul include numărarea elementelor compoziției.

## Notă de generare — fișe text-based

Fișa e generată ca TEXT cu instrucțiuni de desen/colorat/colaj (AI-ul redactează instrucțiunea, NU
produce o imagine reală). Exercițiile descriu activități plastice pe care copilul le execută pe
fișa tipărită, cu instrumentele lui — ex. „Desenează un soare galben în colțul din dreapta paginii
și colorează-l”, „Desenează și decupează un pătrat, apoi lipește-l în centrul paginii”. NU se așteaptă ca
AI-ul să producă imagini reale — fișa e text-only, fără chenare, contururi sau puncte de sprijin
generate grafic; toate reperele sunt descrise în cuvinte.

## Densitate și layout

- 6 exerciții integrate pe O SINGURĂ pagină A4 (identic cu celelalte materii ale Grupei Mari —
  respectă densitatea validată în „Test Calibrare Globală”).
- Layout: o singură `.page-a4`. 6 blocuri de exercițiu (`.exercise-block`),
  `flex-direction: column; justify-content: space-between;`. Densitate medie — text lizibil pentru
  5-6 ani, fiecare exercițiu ocupă aproximativ 1/6 din înălțimea paginii.
