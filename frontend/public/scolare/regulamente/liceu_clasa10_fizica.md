# Regulament de generare — Liceu, Clasa a X-a, Fizică

> Sursă conținut: programa oficială aprobată prin Ordinul ministrului educației şi cercetării
> nr. 4598/31.08.2004 („Programe şcolare pentru clasa a X-a, ciclul inferior al liceului —
> FIZICĂ", filiera teoretică profil real, trunchi comun + curriculum diferențiat — pentru
> profil real sunt OBLIGATORII toate conținuturile, inclusiv cele marcate cu asterisc/corp
> italic, care aparțin curriculumului diferențiat). Document verificat direct din PDF-ul
> oficial (secțiunea „Competențe specifice şi conținuturi"). Elevi 16-17 ani. Continuă Clasa
> a IX-a (mecanică newtoniană + optică geometrică cantitativă — cunoscute).
> ATENȚIE REFORMĂ: identic cu Clasa a IX-a — Ministerul a lansat în transparență (2025-2026)
> noi programe liceale, aplicare eșalonată din 2026-2027 (confirmat rocnee.eu, 2026-08-07).
> Programa 2004 RĂMÂNE ÎN VIGOARE la data scrierii — reflectă conținutul PREDAT ACUM, nu
> draftul de reformă.
> Continuă progresia de la Gimnaziu (clasa a VIII-a: electrocinetică de bază — legea Ohm, 2
> rezistoare serie/paralel, $P=UI$ — CUNOSCUTĂ) — la liceu X, circuitele devin COMPLEXE
> (legile lui Kirchhoff, generatoare cu rezistență internă, grupări mixte), plus termodinamică
> şi curent alternativ, conținuturi complet NOI.
> Scris pentru proiectul „Școlare 🌐". Asset separat de skeleton (§4.2).

## Domenii de conținut permise (programa oficială)

- **Elemente de termodinamică**: noțiuni termodinamice de bază (sistem termodinamic, parametri de stare, principiul zero); calorimetrie; principiul I al termodinamicii ($\Delta U = Q - L$, cu energia internă ca mărime de stare); aplicarea principiului I la transformările gazului ideal — izotermă, izobară, izocoră, adiabatică (legile Boyle-Mariotte, Gay-Lussac, Charles); transformări de stare de agregare (căldură latentă specifică); motoare termice (randament $\eta = L/Q_{primit}$, cicluri Otto/Diesel); principiul al II-lea al termodinamicii (formularea Carnot, randamentul ciclului Carnot $\eta_{Carnot} = 1 - \frac{T_2}{T_1}$).
- **Producerea şi utilizarea curentului continuu**: curentul electric ($I = q/t$); legea lui Ohm pentru o porțiune de circuit şi pentru întregul circuit (cu tensiune electromotoare şi rezistență internă, $I = \frac{E}{R+r}$); legile lui Kirchhoff (legea nodurilor, legea ochiurilor); gruparea rezistoarelor şi a generatoarelor electrice (serie, paralel, mixt); energia şi puterea electrică; efectele curentului electric.
- **Producerea şi utilizarea curentului alternativ**: curentul alternativ (valori instantanee, maxime, efective; frecvența industrială 50 Hz); elemente de circuit RLC în curent alternativ (reactanță inductivă/capacitivă, impedanță, defazaj, rezonanță); energia şi puterea în curent alternativ (putere activă, reactivă, aparentă); transformatorul ($\frac{U_1}{U_2} = \frac{N_1}{N_2}$); motoare electrice; aparate electrocasnice.

## Tipuri de exerciții acceptate

- Probleme de calorimetrie/principiul I al termodinamicii pentru transformări simple ale gazului ideal (izotermă, izobară, izocoră), cu unități SI.
- Probleme cu randamentul unui motor termic ($\eta = L/Q$), exprimat şi în procente.
- Probleme de circuit de curent continuu cu generator (t.e.m. şi rezistență internă) şi 2-3 rezistoare grupate serie/paralel/mixt, aplicând legea lui Ohm şi/sau legile lui Kirchhoff.
- Probleme de energie/putere electrică ($W = RI^2t$, $P = UI$), cu unități (J, W, kWh).
- Probleme simple de impedanță pentru un circuit RLC serie în curent alternativ (fără formalism fazorial complex).
- Probleme cantitative despre transformator (raport de transformare) sau calitative despre funcționarea unui motor electric.

## Exemple concrete de format

1. „Un gaz ideal primeşte o cantitate de căldură de 500 J la volum constant. Calculează variația energiei interne a gazului, ştiind că nu se efectuează lucru mecanic."
2. „Un motor termic primeşte 2000 J căldură de la sursa caldă şi cedează 1200 J sursei reci. Calculează randamentul motorului."
3. „O baterie cu t.e.m. de 12 V şi rezistență internă 0,5 Ω alimentează un circuit cu două rezistoare de 5 Ω şi 7 Ω legate în serie. Calculează intensitatea curentului din circuit."
4. „Două rezistoare de 20 Ω şi 30 Ω sunt legate în paralel, alimentate la o tensiune de 12 V. Calculează intensitatea curentului prin fiecare rezistor şi puterea totală disipată."
5. „Un transformator are 1000 de spire în înfăşurarea primară şi 200 de spire în cea secundară. Dacă tensiunea primară este 220 V, calculează tensiunea secundară."
6. „Un circuit RLC serie de curent alternativ conține un rezistor de 30 Ω şi o reactanță totală (inductivă minus capacitivă) de 40 Ω. Calculează impedanța circuitului."

## Interdicții explicite

- NU se introduc oscilații, unde mecanice/electromagnetice sau optică ondulatorie — conținut de clasa a XI-a.
- NU se introduc elemente de relativitate, fizică cuantică, atomică, semiconductoare sau nucleară — conținut de clasa a XII-a.
- NU se repetă circuitele SIMPLE de gimnaziu (2 rezistoare, fără generator cu rezistență internă, fără legile lui Kirchhoff) — la liceu, circuitul TREBUIE să fie complex (Kirchhoff, rezistență internă, grupare mixtă) pentru a marca progresia.
- NU se foloseşte formalismul fazorial complet (diagrame fazoriale, calcul vectorial) pentru curent alternativ — se rămâne la nivel de formule scalare (impedanță, reactanță).

## Densitate şi layout

- Densitate liberă, dictată de volumul de text per exercițiu. Tipic **5-6 exerciții per pagină A4**.
- Structurat pe secțiuni clare, cu delimitări vizuale (spațiere generoasă / linie orizontală).
- Fişele sunt predominant **TEXT** (formulele se scriu în LaTeX între `$...$`). Pentru scheme de circuit electric se pot folosi descrieri textuale, nu ilustrații decorative.
