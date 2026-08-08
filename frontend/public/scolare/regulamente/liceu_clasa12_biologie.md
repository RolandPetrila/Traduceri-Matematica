# Regulament de generare — Liceu, Clasa a XII-a, Biologie

> Sursă conținut: programa școlară de Biologie pentru clasa a XII-a, ciclul superior al
> liceului, aprobată prin Ordinul ministrului educației și cercetării nr. 5959/22.12.2006
> (Anexa nr. 2; planuri-cadru: OMEdC nr. 5718/22.12.2005, aceleași cu clasa a XI-a; se
> aplică și clasei a XIII-a, filiera tehnologică), filiera teoretică, profilul real —
> specializarea Științe ale naturii (2 ore/săptămână, care include TOT conținutul,
> inclusiv cel marcat cu asterisc în programă). Document sursă: arhiva oficială
> rocnee.eu (Centrul Național de Politici și Evaluare în Educație), secțiunea
> programe_scolare, categoria „Matematică și Științele naturii". Capitolele
> „Conținuturi": I. Genetică (genetică moleculară + genetică umană), II. Ecologie
> umană. Elevi 18-19 ani. Încheie progresia liceală: genetica MOLECULARĂ (ADN/ARN,
> reglaj genetic) e mult mai avansată decât genetica mendeliană macroscopică din
> `liceu_clasa9_biologie.md` (legile lui Mendel, teoria cromozomală).
>
> **Avertisment de reformă (obligatoriu de reținut):** skeleton-ul din
> `frontend/src/lib/scolare/curriculum/liceu.ts` marchează întregul ciclu Liceu cu
> `in_reforma: true` — rocnee.eu confirmă (verificat 2026-08-07) 175 de programe noi
> „în transparență decizională" care intră eșalonat, începând cu clasa a IX-a din anul
> școlar 2026-2027 (clasa a XII-a e afectată abia peste trei ani de reformă). Programa
> OMEdC 5959/2006 folosită AICI este cea ÎN VIGOARE la data extragerii (2026-08-08) — NU
> este programa reformată. Re-verifică la sursă când reforma ajunge la clasa a XII-a.

## Domenii de conținut permise (programa oficială)

- **Genetică moleculară**: obiectul de studiu, scurt istoric; acizii nucleici (compoziția chimică; structura primară și secundară a ADN; tipurile de ARN — structură și funcții; funcția autocatalitică și heterocatalitică a acizilor nucleici); organizarea materialului genetic la virusuri, procariote și eucariote, inclusiv genomica structurală (obiect de studiu, metode și tehnici — PCR, importanță, la nivel general/descriptiv); reglajul genetic la procariote și la eucariote (pe termen scurt și pe termen lung).
- **Genetică umană**: genomul uman — complementul cromozomial și harta genetică; determinismul genetic al principalelor caractere fenotipice umane (inclusiv determinismul genetic în memorie, inteligență, comportament și temperament); diversitatea genetică umană — genetica raselor umane; mutageneza și teratogeneza — anomaliile cromozomiale asociate cancerului uman (fenotipul cancerului, agenți carcinogeni, oncogene, protooncogene, antioncogene); imunogenetica (antigene, alergeni, anticorpi, implicații în transplantul de organe, interferonul); domeniile de aplicabilitate și considerațiile bioetice în genetica umană — sfaturile genetice, diagnosticul prenatal, fertilizarea in vitro, clonarea terapeutică, terapia genică.
- **Ecologie umană**: caracteristicile ecosistemelor antropizate și modalitățile de investigare a lor; particularitățile biotopului și biocenozei; relațiile interspecifice și fluxul de materie/energie în ecosistemele antropizate; structura și dinamica populațiilor umane (migrația, rata natalității, rata mortalității, rata morbidității, structura pe vârste și pe sexe, speranța de viață, explozia demografică); impactul antropic asupra ecosistemelor naturale (degradarea habitatelor, introducerea de specii noi, supraexploatarea resurselor biologice, urbanizare și industrializare, poluare chimică/fizică/biologică); efectele deteriorării ecosistemelor asupra sănătății umane; conservarea resurselor naturale și a biodiversității; dezvoltarea durabilă, inclusiv convenții internaționale (ex. Conferința O.N.U. de la Rio de Janeiro 1992, Protocolul de la Kyoto 1997).

## Tipuri de exerciții acceptate

- Descrierea structurii secundare a ADN (dublu helix, complementaritatea bazelor azotate A-T, C-G), la nivel conceptual.
- Diferențierea ARNm, ARNt și ARNr după rolul lor în sinteza proteinelor.
- Aplicarea regulii complementarității bazelor: dată o secvență scurtă de ADN, se cere secvența de ARN mesager complementară (fără mecanism biochimic detaliat de transcripție).
- Asociere concept bioetic → definiție (sfat genetic, diagnostic prenatal, terapie genică, clonare terapeutică).
- Analiza unui scenariu scurt de impact antropic asupra unui ecosistem și identificarea unei măsuri de remediere.
- Interpretarea unui indicator demografic simplu (ex. rata natalității, speranța de viață) dintr-un context dat.

## Exemple concrete de format

1. „Care este baza azotată complementară adeninei în molecula de ADN: timina, citozina sau guanina?"
2. „Dată secvența de ADN 3'-TAC GGA-5', scrie secvența de ARN mesager complementară."
3. „Asociază termenul cu definiția: terapie genică — a) introducerea unei gene funcționale pentru a corecta o boală genetică; diagnostic prenatal — b) investigarea materialului genetic al fătului înainte de naștere."
4. „Numește doi agenți carcinogeni și tipul de expunere asociat fiecăruia."
5. „Explică, în 1-2 propoziții, cum contribuie supraexploatarea resurselor biologice la deteriorarea unui ecosistem."
6. „Ce este dezvoltarea durabilă? Dă un exemplu de convenție internațională legată de acest concept."

## Interdicții explicite

- NU calcule genetice de tip mendelian (monohibridare, dihibridare, tabele Punnett) — acestea aparțin clasei a IX-a; clasa a XII-a se concentrează pe genetică MOLECULARĂ (ADN/ARN) și pe genetică umană avansată, nu pe legile eredității macroscopice.
- NU conținuturi de fiziologie a sistemelor corpului uman (digestiv, circulator, respirator etc.) — acestea aparțin clasei a XI-a.
- NU dezbateri ideologice sau religioase asupra clonării, fertilizării in vitro sau ingineriei genetice — conținutul rămâne strict științific/bioetic, conform programei (prezentare a domeniilor de aplicabilitate, nu opinie personală).
- NU detaliu biochimic al mecanismului PCR sau al altor tehnici de genomică structurală dincolo de nivelul „obiect de studiu, metode și tehnici" — fără protocoale complete de laborator.

## Densitate și layout

- Densitate liberă, dictată de volumul de text per exercițiu. Tipic **5-6 exerciții per pagină A4**.
- Structurat pe secțiuni clare, cu delimitări vizuale (spațiere generoasă / linie orizontală).
- Fișele sunt predominant **TEXT**; structurile moleculare (ADN/ARN) se descriu textual sau prin secvențe scurte de litere (nu imagini reale). Exercițiile de complementaritate a bazelor sunt acceptate ca text structurat, cu spații scurte de completat.
