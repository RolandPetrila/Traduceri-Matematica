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
- **Desen după observație**: reproducerea simplificată a unei forme/obiect cunoscut arătat ca
  model (ex. un fluture, o floare cu 5 petale) — desen ghidat de model, NU desen liber din
  imaginație.
- **Tehnici mixte simple (colaj + desen)**: lipirea unui element decupat/desenat (ex. o formă
  geometrică) urmată de completarea desenului în jurul ei — corelat cu Domeniul A („Utilizează
  mâinile și degetele pentru realizarea de activități variate”), cea mai avansată coordonare
  motrică din progresia grădiniței.
- **Simetrie extinsă**: completarea simetrică a unui desen cu mai multe detalii decât la Grupa
  Mijlocie (3-4 elemente de reflectat, nu doar conturul general).

## Tipuri de exerciții acceptate

- Compoziție ghidată: plasarea/desenarea a 3-4 elemente date într-o scenă, cu poziții indicate
  (ex. „soarele sus, copacul jos-stânga”).
- Desen după model: reproducerea unei forme simple arătate alături, cu puncte de sprijin dacă e
  nevoie.
- Colaj simplu: decuparea (sau încercuirea formei corecte, dacă fișa e text-based) și „lipirea”
  descrisă a unui element, urmată de completarea prin desen a restului compoziției.
- Simetrie cu mai multe detalii: completarea celei de-a doua jumătăți a unui desen cu 3-4 elemente
  interne (nu doar conturul).

## Exemple concrete de format

1. „Desenează o scenă de vară: soarele în colțul din dreapta sus, un copac verde în stânga și o
   floare roșie lângă copac.”
2. „Privește fluturele-model din chenar și desenează unul asemănător alături, respectând forma
   aripilor.”
3. „Completează cealaltă jumătate a casei, astfel încât fereastra, ușa și acoperișul să fie
   identice cu partea deja desenată.”
4. „Decupează (sau încercuiește) forma unui pătrat din chenarul alăturat, apoi desenează în jurul
   lui razele soarelui.”

## Interdicții explicite

- NU se cer compoziții cu mai mult de 4 elemente noi (risc de suprasolicitare motrică/atențională
  pentru 5-6 ani).
- NU se cer tehnici reale de pictură (acuarelă, tempera) sau instrumente nepotrivite vârstei —
  doar creion/carioca/decupaj simplu de hârtie.
- NU se cere desen liber complet din imaginație fără niciun reper/model — mereu cu ghidaj (model,
  poziții indicate, contur parțial).
- NU se folosesc calcule scrise pur aritmetic (coerent cu interdicția generală a Grupei Mari),
  chiar dacă exercițiul include numărarea elementelor compoziției.

## Notă de generare — fișe text-based

Fișa e generată ca TEXT cu instrucțiuni de desen/colorat/colaj (AI-ul redactează instrucțiunea, NU
produce o imagine reală). Exercițiile descriu activități plastice pe care copilul le execută pe
fișa tipărită, cu instrumentele lui — ex. „Desenează un soare galben în colțul din dreapta paginii
și colorează-l”, „Decupează pătratul din chenar și lipește-l în centrul paginii”. NU se așteaptă ca
AI-ul să producă imagini reale — reperele grafice minime (chenare, puncte de sprijin) sunt generate
prin CSS simplu, nu ca ilustrație complexă.

## Densitate și layout

- 6 exerciții integrate pe O SINGURĂ pagină A4 (identic cu celelalte materii ale Grupei Mari —
  respectă densitatea validată în „Test Calibrare Globală”).
- Layout: o singură `.page-a4`. 6 blocuri de exercițiu (`.exercise-block`),
  `flex-direction: column; justify-content: space-between;`. Densitate medie — text lizibil pentru
  5-6 ani, fiecare exercițiu ocupă aproximativ 1/6 din înălțimea paginii.
