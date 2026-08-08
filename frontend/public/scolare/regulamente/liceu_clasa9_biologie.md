# Regulament de generare — Liceu, Clasa a IX-a, Biologie

> Sursă conținut: programa școlară de Biologie pentru clasa a IX-a, ciclul inferior al
> liceului, aprobată prin Ordinul ministrului educației, cercetării și tineretului
> nr. 3458/09.03.2004 (planuri-cadru: OMECT nr. 5723/23.12.2003), filiera teoretică,
> profilul real (trunchi comun + curriculum diferențiat — la profil real ambele sunt
> obligatorii). Document sursă: arhiva oficială rocnee.eu (Centrul Național de Politici
> și Evaluare în Educație), secțiunea programe_scolare, categoria „Matematică și
> Științele naturii". Capitolele „Conținuturi": I. Diversitatea lumii vii,
> II. Celula — unitatea structurală și funcțională a vieții, III. Ereditatea și
> variabilitatea lumii vii. Elevi 15-16 ani. Scris pentru proiectul „Școlare 🌐" (format
> identic cu `gimnaziu_clasa8_biologie.md`, care încheie progresia de gimnaziu).
>
> **Avertisment de reformă (obligatoriu de reținut):** skeleton-ul din
> `frontend/src/lib/scolare/curriculum/liceu.ts` marchează întregul ciclu Liceu cu
> `in_reforma: true` — rocnee.eu confirmă (verificat 2026-08-07) 175 de programe noi
> „în transparență decizională" care intră eșalonat, începând cu clasa a IX-a din anul
> școlar 2026-2027. Programa OMECT 3458/2004 folosită AICI este cea ÎN VIGOARE la data
> extragerii (2026-08-08) pentru elevii aflați deja în parcursul liceal — NU este
> programa reformată. Când reforma clasei a IX-a devine efectivă, acest fișier trebuie
> re-verificat la sursă și, dacă e cazul, înlocuit.

## Domenii de conținut permise (programa oficială)

- **Diversitatea lumii vii**: noțiuni introductive (taxoni — regn, încrengătură, clasă, ordin, familie, gen, specie; nomenclatură binară; celulă procariotă vs eucariotă); virusuri (caractere generale, clasificare, structură, multiplicare); cele cinci regnuri, cu caracterizare generală (mediu și mod de viață, morfologie, tip de nutriție/respirație/reproducere) și exemple reprezentative: Monera (bacterii, cianobacterii), Protiste (sarcodine, ciliofore, zoomastigine, sporozoare, alge unicelulare, euglene, oomicete), Fungi (zigomicete, ascomicete, bazidiomicete) și licheni, Plante (alge pluricelulare, briofite, pteridofite, gimnosperme, angiosperme), Animale (spongieri, celenterate, platelminți, nematelminți, anelide, moluște, artropode, echinoderme, cordate — de la urocordate până la mamifere placentare); conservarea biodiversității în România (specii ocrotite, rezervații naturale, parcuri naționale).
- **Celula — unitatea structurală și funcțională a vieții**: compoziția chimică a materiei vii (nivel general); tipurile fundamentale de celule (procariote, eucariote); structura, ultrastructura și rolul componentelor celulei (înveliș celular — membrană, perete, capsulă; citoplasmă cu organitele ei — reticul endoplasmatic, ribozomi, mitocondrii, aparat Golgi, lizozomi, plastide, vacuole; nucleu — membrană nucleară, nucleoli, cromatină); diviziunea celulară (directă — amitoza; indirectă — mitoza și meioza, cu fazele și importanța lor).
- **Ereditatea și variabilitatea lumii vii**: conceptele de ereditate și variabilitate; legile mendeliene ale eredității (legea purității gameților, legea segregării independente a perechilor de caractere) și abaterile de la segregarea mendeliană (semidominanță, supradominanță, codominanță, gene letale); teoria cromozomală a eredității (plasarea liniară a genelor, transmiterea înlănțuită); recombinarea genetică (intra- și intercromozomală); ereditatea extranucleară (exemple); determinismul cromozomal al sexelor; influența mediului asupra eredității (mutații, factori mutageni); genetica umană — metode de cercetare, cariotipul uman normal, boli ereditare (clasificare și exemple), sfaturi genetice, diagnoza prenatală; ingineria genetică și biotehnologiile (sinteza artificială de gene, transfer interspecific, clonarea).

## Tipuri de exerciții acceptate

- Clasificarea unui organism descris textual (caractere date) în regnul/grupul corect, pe baza caracterelor generale.
- Asociere taxon/grup → exemplu reprezentativ sau caracteristică definitorie (ex. „briofite — hepatice, briate").
- Identificarea unei componente celulare pornind de la descrierea rolului ei (structură → funcție), pentru celula procariotă sau eucariotă.
- Compararea mitozei și meiozei (număr de diviziuni, număr și tip de celule rezultate, importanță).
- Aplicarea legilor mendeliene la o monohibridare simplă (un singur caracter, raport 3:1 sau 1:1), inclusiv un tabel Punnett de dimensiune mică — nivel acceptat la liceu, spre deosebire de gimnaziu.
- Întrebări scurte despre cariotipul uman normal sau despre o boală ereditară descrisă (cauză, mod de transmitere, la nivel general).
- Completarea unei scheme legate de conservarea biodiversității (măsură → efect), dintr-o listă de termeni dați.

## Exemple concrete de format

1. „Clasifică organismul descris (unicelular, heterotrof, fără perete celular, se deplasează prin pseudopode) în regnul corect."
2. „Numește trei organite din citoplasma unei celule eucariote și rolul fiecăreia."
3. „Compară mitoza și meioza: câte celule fiice rezultă din fiecare și cu ce număr de cromozomi?"
4. „Un individ cu genotip Aa este încrucișat cu un individ aa (A = caracter dominant). Calculează raportul genotipic și fenotipic al descendenților."
5. „De ce cariotipul uman normal are 46 de cromozomi organizați în 23 de perechi? Răspunde în 1-2 propoziții."
6. „Numește două măsuri concrete de conservare a biodiversității aplicate în România."

## Interdicții explicite

- NU se introduc conținuturi de fiziologie a sistemelor corpului uman/animal (digestiv, circulator, respirator etc.) — acestea aparțin claselor a X-a și a XI-a, nu clasei a IX-a.
- NU se introduc conținuturi de genetică moleculară avansată (structura ADN/ARN, PCR, reglaj genetic, genomică) — acestea aparțin clasei a XII-a; la clasa a IX-a genetica rămâne la nivelul legilor mendeliene și al teoriei cromozomale.
- NU calcule genetice cu mai multe gene simultan (dihibridări complexe, epistazie) care depășesc formatul unei fișe A4 — se rămâne la monohibridări simple.
- NU se detaliază cicluri evolutive complete pentru fiecare grup taxonomic — programa oficială cere caracterizare generală „fără cicluri evolutive".
- NU se introduc teme de evoluționism ca subiect separat (aceasta a fost acoperită introductiv la gimnaziu, Clasa a VIII-a); la clasa a IX-a apare doar implicit, prin clasificare și diversitate.

## Densitate și layout

- Densitate liberă, dictată de volumul de text per exercițiu. Tipic **5-6 exerciții per pagină A4**.
- Structurat pe secțiuni clare, cu delimitări vizuale (spațiere generoasă / linie orizontală).
- Fișele sunt predominant **TEXT**; structurile biologice și celulare se descriu textual (nu imagini reale). Tabelele Punnett mici și schemele cauză-efect sunt acceptate ca text structurat, cu spații scurte de completat.
