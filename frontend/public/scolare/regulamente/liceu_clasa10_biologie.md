# Regulament de generare — Liceu, Clasa a X-a, Biologie

> Sursă conținut: programa școlară de Biologie pentru clasa a X-a, ciclul inferior al
> liceului, aprobată prin Ordinul ministrului educației și cercetării nr. 4598/31.08.2004
> (Anexa nr. 2; planuri-cadru: OMECT nr. 5723/23.12.2003, aceleași cu clasa a IX-a),
> filiera teoretică, profilul real (trunchi comun + curriculum diferențiat — la profil
> real ambele sunt obligatorii). Document sursă: arhiva oficială rocnee.eu (Centrul
> Național de Politici și Evaluare în Educație), secțiunea programe_scolare, categoria
> „Matematică și Științele naturii". Capitolele „Conținuturi": I. Țesuturi vegetale și
> animale, II. Structura și funcțiile fundamentale ale organismelor vii,
> III. Dezechilibre ecologice. Elevi 16-17 ani. Continuă direct progresia din
> `liceu_clasa9_biologie.md` (diversitate + celulă + ereditate) spre fiziologie
> comparată plante/animale.
>
> **Avertisment de reformă (obligatoriu de reținut):** skeleton-ul din
> `frontend/src/lib/scolare/curriculum/liceu.ts` marchează întregul ciclu Liceu cu
> `in_reforma: true` — rocnee.eu confirmă (verificat 2026-08-07) 175 de programe noi
> „în transparență decizională" care intră eșalonat, începând cu clasa a IX-a din anul
> școlar 2026-2027 (deci clasa a X-a e afectată abia din anul următor reformei). Programa
> OMEC 4598/2004 folosită AICI este cea ÎN VIGOARE la data extragerii (2026-08-08) — NU
> este programa reformată. Re-verifică la sursă când reforma ajunge la clasa a X-a.

## Domenii de conținut permise (programa oficială)

- **Țesuturi vegetale și animale** (clasificare, structură, rol): țesuturi vegetale — embrionare (primare, secundare), definitive (de apărare: epidermă, suber; fundamentale: asimilatoare, de depozitare; conducătoare: lemnoase și liberiene; mecanice; secretoare); țesuturi animale — epiteliale (de acoperire, secretoare, senzoriale), conjunctive (moi, semidure, dure, sânge), musculare (striat, striat cardiac, neted), nervos (neuron, celulă glială).
- **Structura și funcțiile fundamentale ale organismelor vii** (fiziologie comparată plante/animale, pe funcții): nutriția (autotrofă — fotosinteza: structura frunzei, ecuație chimică, factori de mediu care o influențează, chemosinteza la bacterii; heterotrofă — la fungi, la plante parazite/mixotrofe, nutriția simbiontă la licheni și plante leguminoase, digestia la animale, sistemul digestiv la mamifere, particularități la vertebrate, boli digestive la om); respirația (aerobă și anaerobă/fermentații, la plante, sistemul respirator la mamifere, particularități la vertebrate, boli respiratorii la om); circulația (la plante — absorbția și circulația sevelor; la animale — mediul intern, sistemul circulator la mamifere, particularități la vertebrate, boli circulatorii la om); excreția (transpirația și gutația la plante; sistemul excretor la mamifere, particularități la vertebrate, boli excretorii la om); funcțiile de relație (sensibilitatea la plante și la animale — organe de simț și sistem nervos la mamifere, particularități la vertebrate, deficiențe senzoriale, boli ale sistemului nervos central la om; locomoția la animale — sistemul locomotor la mamifere, particularități la vertebrate); funcția de reproducere (la plante — asexuată/vegetativă și sexuată la angiosperme: floare, fecundație, sămânță, fruct; la animale — asexuată și sexuată la mamifere/om, boli cu transmitere sexuală, planificare familială, particularități la vertebrate).
- **Dezechilibre ecologice**: cauze, efecte, măsuri de prevenție/remediere.

## Tipuri de exerciții acceptate

- Identificarea funcției unui țesut vegetal sau animal descris (structură → funcție).
- Compararea aceleiași funcții vitale (nutriție, respirație, circulație, excreție) la plante față de animale.
- Completarea unei scheme simple a unui sistem de organe la mamifere (ex. traseul sângelui prin circulația mare/mică).
- Asociere boală → sistem de organe afectat → o măsură de prevenție, dintr-un context scurt dat.
- Explicarea unei particularități structural-funcționale la un grup de vertebrate (ex. de ce peștii au branhii, nu plămâni).
- Întrebări scurte despre factorii de mediu care influențează un proces fiziologic (ex. fotosinteza, transpirația).

## Exemple concrete de format

1. „Ce tip de țesut vegetal formează stratul protector extern al unei tulpini tinere: epiderma, țesutul conducător sau parenchimul asimilator?"
2. „Numește doi factori de mediu care influențează intensitatea fotosintezei la plante."
3. „Completează traseul circulației mici: inimă (ventricul drept) → ? → plămâni → ? → inimă (atriu stâng)."
4. „Compară respirația aerobă și respirația anaerobă: unde are loc fiecare și ce produși rezultă."
5. „Numește o boală a sistemului circulator la om și un factor de risc asociat ei."
6. „De ce reproducerea sexuată la angiosperme necesită polenizare, spre deosebire de reproducerea vegetativă?"

## Interdicții explicite

- NU se detaliază mecanismul biochimic intim al fotosintezei sau al respirației celulare — programa cere explicit „fără mecanismul intim"; se rămâne la ecuația chimică generală și la factorii care influențează procesul.
- NU se introduc conținuturi de genetică sau ereditate — acestea aparțin clasei a IX-a (bazele) și clasei a XII-a (nivel avansat, molecular).
- NU se introduc conținuturi de ecologie umană avansată (ecosisteme antropizate, dinamica populațiilor, dezvoltare durabilă) — acestea aparțin clasei a XII-a; la clasa a X-a ecologia se limitează strict la „dezechilibre ecologice: cauze, efecte, măsuri".
- NU detaliu anatomic care depășește programa (ex. structura fină a peretelui tubului digestiv) — programa cere explicit „fără structura peretelui".
- NU terminologie medicală de specialitate dincolo de denumirile de boli enumerate în programă (fără doze, protocoale de tratament).

## Densitate și layout

- Densitate liberă, dictată de volumul de text per exercițiu. Tipic **5-6 exerciții per pagină A4**.
- Structurat pe secțiuni clare, cu delimitări vizuale (spațiere generoasă / linie orizontală).
- Fișele sunt predominant **TEXT**; structurile anatomice se descriu textual (nu imagini reale). Schemele simple cauză-efect sau traseu-funcție sunt acceptate ca text structurat, cu spații scurte de completat.
