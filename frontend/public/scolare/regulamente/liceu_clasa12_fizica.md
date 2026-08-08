# Regulament de generare — Liceu, Clasa a XII-a, Fizică

> Sursă conținut: Anexa 2 la Ordinul ministrului educației şi cercetării nr. 5959/22.12.2006
> („Programe şcolare pentru ciclul superior al liceului — FIZICĂ, clasa a XII-a", Programa F1 —
> filiera teoretică profil real, specializările matematică-informatică şi ştiințe ale naturii:
> SUNT OBLIGATORII toate conținuturile şi competențele specifice din programa F1, inclusiv cele
> marcate cu asterisc/curriculum diferențiat). Document verificat direct din PDF-ul oficial
> (secțiunea „Competențe specifice şi conținuturi"). Elevi 18-19 ani. Continuă Clasele IX-XI
> (mecanică, termodinamică, electricitate, oscilații/unde, optică ondulatorie — cunoscute).
> ATENȚIE REFORMĂ: identic cu clasele IX-XI — programa 2006 RĂMÂNE ÎN VIGOARE la data scrierii;
> reforma (edu.ro, în transparență 2025-2026) se aplică eșalonat şi ajunge la clasa a XII-a
> ultima, la câțiva ani după debutul reformei la clasa a IX-a (2026-2027).
> Continuă progresia: clasa a XII-a e ultima verigă, tratând fizica modernă (relativitate,
> cuantică, atomică, nucleară) — conținut complet NOU, fără suprapunere cu clasele anterioare;
> singura legătură directă e cu dioda semiconductoare, aplicație a curentului continuu din
> clasa a X-a, tratată aici la nivel de structură a materiei (semiconductori).
> Scris pentru proiectul „Școlare 🌐". Asset separat de skeleton (§4.2).

## Domenii de conținut permise (programa oficială)

- **Teoria relativității restrânse**: bazele teoriei (relativitatea clasică, experimentul Michelson); postulatele teoriei relativității restrânse, transformările Lorentz; elemente de cinematică şi dinamică relativistă (compunerea vitezelor, principiul fundamental al dinamicii relativiste, relația masă-energie $E = mc^2$).
- **Elemente de fizică cuantică**: efectul fotoelectric extern (legile efectului fotoelectric, ipoteza lui Planck $E = h\nu$, ecuația lui Einstein $h\nu = L_{extracție} + E_{c,max}$); efectul Compton (calitativ); ipoteza de Broglie ($\lambda = h/p$) şi difracția electronilor; dualismul undă-corpuscul.
- **Fizică atomică**: spectre (continuu, de bandă, discret); experimentul Rutherford şi modelul planetar al atomului; experimentul Franck-Hertz; modelul Bohr (nivele energetice $E_n = -\frac{13{,}6}{n^2}\,eV$ pentru hidrogen, tranziții, spectrul hidrogenului); radiațiile X; efectul LASER (calitativ).
- **Semiconductoare. Aplicații în electronică**: conducția electrică în metale şi semiconductori (intrinseci/extrinseci); dioda semiconductoare şi redresarea curentului alternativ; tranzistorul cu efect de câmp (calitativ); circuite integrate (calitativ).
- **Fizică nucleară**: proprietăți generale ale nucleului (structură, dimensiuni, masă, sarcină); energia de legătură a nucleului şi stabilitatea nucleară; radioactivitatea şi legile dezintegrării radioactive ($N = N_0 e^{-\lambda t}$, timp de înjumătățire); interacțiunea radiației nucleare cu substanța, dozimetrie; fisiunea nucleară şi reactorul nuclear; fuziunea nucleară.

## Tipuri de exerciții acceptate

- Probleme cu ecuația lui Einstein pentru efectul fotoelectric (calculul lucrului de extracție sau al energiei cinetice maxime a fotoelectronilor).
- Probleme cu ipoteza lui Planck ($E = h\nu$) — calculul energiei unui foton la o frecvență/lungime de undă dată.
- Probleme cu modelul Bohr (calculul energiei unui nivel, energia unei tranziții, lungimea de undă a fotonului emis/absorbit).
- Probleme cu legea dezintegrării radioactive (calculul numărului de nuclee rămase, al timpului de înjumătățire, sau al activității).
- Probleme cu relația masă-energie ($E = mc^2$) în contexte simple (defect de masă, energie de legătură a nucleului).
- Probleme calitative despre funcționarea diodei semiconductoare (redresare) sau despre fisiune/fuziune nucleară.

## Exemple concrete de format

1. „Un foton cu frecvența $6 \times 10^{14}\,Hz$ cade pe o suprafață metalică cu lucrul de extracție $2\,eV$. Calculează energia cinetică maximă a fotoelectronilor emişi (foloseşte $h = 6{,}626 \times 10^{-34}\,J \cdot s$)."
2. „Un electron din atomul de hidrogen trece de pe nivelul energetic $n=3$ pe nivelul $n=2$. Ştiind că energia nivelului $n$ este $E_n = -\frac{13{,}6}{n^2}\,eV$, calculează energia fotonului emis."
3. „Un eşantion radioactiv are timpul de înjumătățire 8 zile. Calculează ce fracțiune din nucleele inițiale mai rămâne nedezintegrată după 24 de zile."
4. „Defectul de masă al unui nucleu este $\Delta m = 0{,}03\,u$ (unități atomice de masă). Calculează energia de legătură a nucleului, în MeV (foloseşte $1\,u \cdot c^2 \approx 931{,}5\,MeV$)."
5. „O diodă semiconductoare este folosită într-un circuit de redresare a curentului alternativ. Explică, pe scurt, de ce dioda permite trecerea curentului într-un singur sens."
6. „Explică diferența dintre fisiunea nucleară şi fuziunea nucleară, menționând câte un exemplu de aplicație pentru fiecare."

## Interdicții explicite

- NU se repetă mecanica, termodinamica, electricitatea sau oscilațiile/undele de la clasele IX-XI ca subiect principal.
- NU se introduc particule elementare avansate sau acceleratoare de particule ca bază de exercițiu numeric — sunt conținut opțional (curriculum diferențiat avansat), tratate calitativ/informativ, nu cantitativ.
- NU se confundă modelul Bohr (cuantificarea nivelelor energetice ale atomului de hidrogen) cu fizica nucleară (structura şi dezintegrarea nucleului) — sunt capitole distincte.
- NU se folosesc formule de fizică cuantică relativistă avansată (ecuația Dirac etc.) — nivelul rămâne cel al programei de liceu (Planck, Einstein, Bohr, de Broglie).

## Densitate şi layout

- Densitate liberă, dictată de volumul de text per exercițiu. Tipic **5-6 exerciții per pagină A4**.
- Structurat pe secțiuni clare, cu delimitări vizuale (spațiere generoasă / linie orizontală).
- Fişele sunt predominant **TEXT** (formulele se scriu în LaTeX între `$...$`). Pentru scheme de dezintegrare sau diagrame de nivele energetice se pot folosi descrieri textuale, nu ilustrații decorative.
