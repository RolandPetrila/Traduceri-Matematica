# Regulament de generare — Liceu, Clasa a XI-a, Fizică

> Sursă conținut: Anexa 2 la Ordinul ministrului educației şi cercetării nr. 3252/13.02.2006
> („Programe şcolare pentru ciclul superior al liceului — FIZICĂ, clasa a XI-a", Programa F1 —
> filiera teoretică profil real, specializările matematică-informatică şi ştiințe ale naturii:
> SUNT OBLIGATORII toate conținuturile din programa F1, inclusiv cele marcate cu asterisc şi
> redactate cursiv, care formează curriculumul diferențiat). Document verificat direct din
> PDF-ul oficial (secțiunea „Competențe specifice şi conținuturi"). Elevi 17-18 ani. Continuă
> Clasele IX-X (mecanică newtoniană, optică geometrică, termodinamică, curent continuu şi
> alternativ — cunoscute).
> ATENȚIE REFORMĂ: identic cu clasele IX-X — programa 2006 RĂMÂNE ÎN VIGOARE la data scrierii;
> reforma (edu.ro, în transparență 2025-2026) se aplică eșalonat, ajunge la clasa a XI-a abia
> peste 2 ani şcolari de la debutul reformei la clasa a IX-a (2026-2027).
> Continuă progresia: circuitul RLC din clasa a X-a (curent alternativ) e reluat aici din
> perspectiva OSCILAȚIILOR (circuit oscilant LC, formalism fazorial); optica geometrică din
> clasa a IX-a e reluată ca OPTICĂ ONDULATORIE (interferență, difracție — fenomene noi, bazate
> pe natura ondulatorie a luminii, nu pe raze).
> Scris pentru proiectul „Școlare 🌐". Asset separat de skeleton (§4.2).

## Domenii de conținut permise (programa oficială)

- **Oscilații şi unde mecanice**: oscilatorul mecanic (fenomene periodice, mărimi caracteristice — perioadă, frecvență, elongație, amplitudine — model „oscilator armonic" $x(t) = A\cos(\omega t + \varphi)$, cu $\omega = 2\pi/T$); oscilații mecanice amortizate; oscilatori mecanici cuplați (oscilații întreținute/forțate, rezonanța); unde mecanice (propagarea unei perturbații, model „undă plană", relația $\lambda = v \cdot T$, reflexia şi refracția undelor mecanice, unde seismice, interferența undelor mecanice/unde staționare, acustica, ultrasunete şi infrasunete).
- **Oscilații şi unde electromagnetice**: circuitul RLC în curent alternativ (reluat din perspectiva oscilațiilor, formalism fazorial); oscilații electromagnetice libere — circuitul oscilant LC ($T = 2\pi\sqrt{LC}$); câmpul electromagnetic şi unda electromagnetică; clasificarea undelor electromagnetice (după frecvență/sursă); aplicații (radio, TV, cuptor cu microunde).
- **Optică ondulatorie**: dispersia luminii; interferența luminii (condiții de obținere a interferenței staționare, dispozitivul Young $\Delta x = \frac{\lambda D}{d}$, interferența localizată); difracția luminii (calitativ, rețea de difracție); polarizarea luminii (calitativ).
- Notă: programa oficială include şi un capitol opțional avansat „Elemente de teoria haosului" (determinism/impredictibilitate, spațiul fazelor, geometrie fractală) — conținut calitativ, greu de transpus în exerciții numerice standard; NU se foloseşte ca bază de exercițiu în acest regulament (vezi Interdicții).

## Tipuri de exerciții acceptate

- Probleme cu mărimile caracteristice oscilatorului armonic (perioadă, frecvență, pulsație $\omega = 2\pi/T$, elongație la un moment dat).
- Probleme cu circuitul oscilant LC (perioada proprie $T = 2\pi\sqrt{LC}$, frecvența proprie).
- Probleme cu propagarea undelor mecanice ($\lambda = vT$, viteza sunetului, lungimea de undă).
- Probleme de interferență cu dispozitivul Young (distanța dintre franjuri, $\Delta x = \lambda D / d$).
- Probleme calitative de identificare a fenomenului (rezonanță, unde staționare, difracție) dintr-o descriere.
- Probleme simple de acustică (viteza sunetului în funcție de mediu, frecvențe audibile).

## Exemple concrete de format

1. „Un pendul elastic oscilează cu perioada 0,5 s. Calculează frecvența şi pulsația oscilației."
2. „Un circuit oscilant conține o bobină cu inductanța 0,1 H şi un condensator cu capacitatea 4 μF. Calculează perioada proprie de oscilație a circuitului."
3. „O undă sonoră se propagă în aer cu viteza 340 m/s şi are frecvența 680 Hz. Calculează lungimea de undă."
4. „Într-un dispozitiv Young, distanța dintre cele două fante este 0,2 mm, iar ecranul este situat la 2 m distanță. Pentru o lumină cu lungimea de undă 500 nm, calculează distanța dintre două franje luminoase consecutive."
5. „Un copil împinge periodic un leagăn exact la frecvența proprie de oscilație a acestuia, iar amplitudinea oscilațiilor creşte semnificativ. Ce fenomen fizic descrie această situație?"
6. „O sirenă emite un sunet cu frecvența 1000 Hz. Explică, folosind noțiunea de undă sonoră, de ce sunetul poate fi auzit chiar şi atunci când sursa nu este vizibilă."

## Interdicții explicite

- NU se introduc elemente de relativitate, fizică cuantică, atomică, semiconductoare sau nucleară — conținut de clasa a XII-a.
- NU se repetă mecanica newtoniană de bază (principii, forțe) sau termodinamica/curentul continuu de la clasele IX-X ca subiect principal — pot apărea doar ca premisă (de ex. energie mecanică într-un oscilator).
- NU se foloseşte capitolul opțional „Elemente de teoria haosului" ca bază pentru exerciții numerice — e conținut calitativ/filozofic, incompatibil cu formatul fişă-exercițiu.
- NU se confundă difracția/interferența (optică ondulatorie, unde) cu reflexia/refracția (optică geometrică, clasa a IX-a) — sunt fenomene diferite.

## Densitate şi layout

- Densitate liberă, dictată de volumul de text per exercițiu. Tipic **5-6 exerciții per pagină A4**.
- Structurat pe secțiuni clare, cu delimitări vizuale (spațiere generoasă / linie orizontală).
- Fişele sunt predominant **TEXT** (formulele se scriu în LaTeX între `$...$`). Pentru scheme de circuit oscilant sau figuri de interferență se pot folosi descrieri textuale, nu ilustrații decorative.
