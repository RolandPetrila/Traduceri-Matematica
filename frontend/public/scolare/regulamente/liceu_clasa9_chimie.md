# Regulament de generare — Liceu, Clasa a IX-a, Chimie

> Sursă conținut: programa școlară de Chimie pentru clasa a IX-a, ciclul inferior al
> liceului, aprobată prin Ordinul ministrului educației, cercetării și inovării
> nr. 5099/09.09.2009 (Anexa nr. 2), filiera teoretică, profilul real (trunchi comun +
> curriculum diferențiat de 1 oră — la profil real ambele sunt relevante; CD nu separă
> explicit specializarea în acest document, spre deosebire de clasele XI-XII).
> Document sursă: PDF oficial MECI, București 2009 (arhivat, printre altele, de
> Inspectoratul Școlar Suceava — chimsuceava.wordpress.com — și de lego.rdsor.ro).
> Capitolele „Conținuturi": 1. Structura învelișului electronic și legături chimice, 2. Soluții (dizolvare, concentrații, pH), 3. Reacții redox și pilă galvanică, 4. Gazul
> ideal. Elevi 15-16 ani. Scris pentru proiectul „Școlare 🌐" (format identic cu
> `gimnaziu_clasa8_chimie.md`, care încheie progresia de gimnaziu — reacții/ecuații
> chimice, tipuri de reacții, calcule stoechiometrice de bază). NU se reia stoechiometria
> de bază de gimnaziu ca subiect central.
>
> **Avertisment de reformă (obligatoriu de reținut):** skeleton-ul din
> `frontend/src/lib/scolare/curriculum/liceu.ts` marchează întregul ciclu Liceu cu
> `in_reforma: true` — rocnee.eu confirmă (verificat 2026-08-07) 175 de programe noi
> „în transparență decizională" care intră eșalonat, începând cu clasa a IX-a din anul
> școlar 2026-2027. Documentul de reformă pentru Chimie (Anexa la ordinul ministrului
> educației și cercetării nr. _____/2025, plan-cadru OMEC nr. 4350/20.06.2025) e deja
> publicat spre implementare „începând cu anul școlar 2026-2027" pentru profil real,
> specializarea Științe ale naturii — deci clasa a IX-a e PRIMA afectată, chiar din
> anul curent. **Tensiune de dată, semnalată explicit:** data extragerii acestui
> regulament este 2026-08-08 — la câteva săptămâni de startul anului școlar 2026-2027.
> Programa OMECI 5099/2009 folosită AICI este cea a cohortelor aflate deja în parcursul
> liceal (clasele X-XII actuale); pentru elevii care INTRĂ în clasa a IX-a în
> 2026-2027, reforma poate fi DEJA activă la momentul folosirii acestui fișier. NU se
> presupune tacit că OMECI 5099/2009 e valabilă fără verificare — cine folosește acest
> regulament pentru fișe de clasa a IX-a TREBUIE să confirme mai întâi la sursă
> (rocnee.eu/edu.ro) dacă programa reformată a intrat deja în vigoare, înainte de
> generare. Decizia dacă se generează sub programa veche sau se așteaptă programa nouă
> revine lui Roland, nu se ia implicit de acest fișier.

## Domenii de conținut permise (programa oficială)

- **Structura atomului și legături chimice** (trunchi comun): straturi, substraturi, orbitali; variația electronegativității și a caracterului metalic/nemetalic în grupele principale și în perioadele 1, 2, 3; legătura ionică (cristalul de $NaCl$); legătura covalentă nepolară ($H_2$, $Cl_2$, $N_2$) și polară ($HCl$, $H_2O$); legătura covalent-coordinativă ($NH_4^+$, $H_3O^+$); legătura de hidrogen; proprietăți chimice ale sodiului (reacții cu oxigen, clor, apă) și ale clorului (reacții cu hidrogen, fier, apă, cupru, hidroxid de sodiu, bromură de sodiu, iodură de potasiu).
- **Soluții** (trunchi comun): dizolvarea și factorii care o influențează; solubilitatea substanțelor în solvenți polari și nepolari; concentrația molară și concentrația procentuală; soluții apoase de acizi tari și slabi ($HCl$, $H_2CO_3$, $HCN$) și baze tari și slabe ($NaOH$, $NH_3$); pH-ul soluțiilor apoase — determinare calitativă cu indicatori și hârtie de pH (fără calcul cantitativ, acesta aparține clasei a XII-a).
- **Reacții redox** (trunchi comun): stabilirea coeficienților ecuațiilor reacțiilor redox pe baza numărului de oxidare; pila Daniell și acumulatorul cu plumb (construcție, funcționare); coroziunea și protecția anticorozivă; ecuația de stare a gazului ideal, volum molar.
- **Extindere — profil real, curriculum diferențiat**: variația razei atomice/ionice și a energiei de ionizare în perioada a 4-a; legătura covalent-coordinativă în combinații complexe; forțele van der Waals; caracterul acido-bazic al oxizilor elementelor din perioada a 3-a și din grupa a 14-a; conductibilitatea soluțiilor de electroliți; echilibrul chimic — legea acțiunii maselor, $K_c$, $K_a$, $K_w$, principiul lui Le Chatelier și factorii care îl influențează; caracterul oxidant al $KMnO_4$ și $K_2Cr_2O_7$ și caracterul reducător al carbonului, hidrogenului, monoxidului de carbon și metalelor (obținerea metalelor prin reducere); elementul Leclanché; caracterul amfoter al $Al(OH)_3$ și $Zn(OH)_2$.

## Tipuri de exerciții acceptate

- Scrierea configurației electronice pe straturi/substraturi și deducerea poziției în tabelul periodic (perioadă, grupă) pentru elemente din primele 3-4 perioade.
- Clasificarea unei legături chimice date (ionică/covalentă polară/nepolară/coordinativă) pornind de la formula substanței.
- Calcularea concentrației molare sau procentuale a unei soluții date, sau prepararea unei soluții de concentrație cerută.
- Determinarea caracterului acid/bazic al unei soluții date, folosind un indicator sau hârtie de pH (calitativ).
- Stabilirea coeficienților unei ecuații redox prin metoda numărului de oxidare.
- Aplicarea ecuației gazului ideal la un calcul simplu de volum molar.

## Exemple concrete de format

1. „Scrie configurația electronică a atomului de $Ca$ (Z=20) pe straturi. În ce perioadă și în ce grupă se află?"
2. „Clasifică legătura chimică din fiecare dintre următoarele substanțe: $NaCl$, $Cl_2$, $HCl$, $NH_4Cl$."
3. „Calculează concentrația molară a unei soluții obținute prin dizolvarea a 4 g de $NaOH$ (M=40 g/mol) în apă, până la 500 mL soluție."
4. „O soluție înroșește turnesolul. Este soluția acidă sau bazică? Dă un exemplu de substanță care ar produce acest efect."
5. „Stabilește coeficienții ecuației: $Zn + HCl \rightarrow ZnCl_2 + H_2$, folosind metoda numărului de oxidare."
6. „Descrie, pe scurt, funcționarea pilei Daniell: ce electrozi folosește și ce reacție are loc la fiecare?"

## Interdicții explicite

- NU se introduc conținuturi de chimie organică (hidrocarburi, alcooli, acizi carboxilici) — acestea aparțin clasei a X-a.
- NU calcul cantitativ al pH-ului din concentrația ionilor de hidroniu, titrare sau echilibre acido-bazice avansate — acestea aparțin clasei a XII-a; la clasa a IX-a pH-ul rămâne la nivel calitativ (indicatori, hârtie de pH).
- NU electroliză detaliată (obținerea industrială a metalelor/nemetalelor prin electroliză) sau termochimie/cinetică chimică — acestea aparțin clasei a XII-a; la clasa a IX-a redoxul se limitează la coeficienți, pila Daniell, acumulator, coroziune.
- NU se reia echilibrarea de bază a ecuațiilor chimice sau calculele stoechiometrice simple (puritate, exces, randament) ca subiect central — acestea au fost acoperite integral la gimnaziu, Clasa a VIII-a; pot apărea doar ca reamintire scurtă în sprijinul unui exercițiu nou.
- NU se amestecă altă materie (Fizică/Biologie) în aceeași fișă.

## Densitate și layout

- Densitate **5-6 exerciții per fișă A4**.
- Structurat pe secțiuni clare, cu delimitări vizuale (spațiere generoasă / linie orizontală).
- Fișele sunt predominant **TEXT**. Formulele chimice și ecuațiile se scriu în LaTeX între `$...$` (subscripți cu `_`, indici de sarcină cu `^`, săgeata de reacție cu `\rightarrow`). Fără ilustrații decorative.
