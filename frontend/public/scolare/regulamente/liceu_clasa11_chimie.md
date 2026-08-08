# Regulament de generare — Liceu, Clasa a XI-a, Chimie

> Sursă conținut: programa școlară de Chimie pentru clasa a XI-a, ciclul superior al
> liceului, aprobată prin Ordinul ministrului educației și cercetării nr. 3252/13.02.2006
> [PROBABIL — număr de ordin necompletat în exemplarul PDF consultat (isjcta.ro/
> chimsuceava.wordpress.com); atribuit prin corelare cu regulamentul-soră
> `liceu_clasa11_biologie.md`, aprobat de același ordin omnibus pentru ciclul superior].
> **Programa 1** — Filiera teoretică, Profil real, specializările Matematică-informatică
> ȘI Științe ale naturii (Programele 2/3, tehnologic/militar, NU se folosesc aici).
> Trunchi comun (TC, 1 oră, comun ambelor specializări) + curriculum diferențiat
> (CD, +1 oră, marcat cu asterisc, **obligatoriu numai pentru Științe ale naturii** —
> la Matematică-informatică nu există CD). Document sursă: PDF oficial MECI, „Programe
> școlare pentru ciclul superior al liceului — Chimie", București 2009. Capitolele
> „Conținuturi": clase de compuși organici cu grupe funcționale, reacții ale
> compușilor organici, compuși cu importanță biologică (noțiuni de biochimie). Elevi
> 17-18 ani. Continuă direct progresia din
> `liceu_clasa10_chimie.md` (hidrocarburi, alcooli, acid acetic, biomolecule la nivel
> descriptiv) spre compușii cu funcțiuni organice multiple și biochimia structurală.
>
> **Avertisment de reformă (obligatoriu de reținut):** skeleton-ul din
> `frontend/src/lib/scolare/curriculum/liceu.ts` marchează întregul ciclu Liceu cu
> `in_reforma: true` — rocnee.eu confirmă (verificat 2026-08-07) 175 de programe noi
> „în transparență decizională" care intră eșalonat, începând cu clasa a IX-a din anul
> școlar 2026-2027 (deci clasa a XI-a e afectată abia peste doi ani de reformă). Programa
> folosită AICI este cea ÎN VIGOARE la data extragerii (2026-08-08) — NU este programa
> reformată. Re-verifică la sursă când reforma ajunge la clasa a XI-a.

## Domenii de conținut permise (programa oficială — Programa 1)

- **Clase de compuși organici** (trunchi comun): compuși cu grupe funcționale monovalente — compuși halogenați, compuși hidroxilici (inclusiv fenoli), amine; compuși cu grupe funcționale divalente/trivalente — compuși carbonilici, compuși carboxilici; compuși cu grupe funcționale mixte — aminoacizi, hidroxiacizi, zaharide.
- **Reacții ale compușilor organici** (trunchi comun): substituție, adiție, eliminare, transpoziție — monohalogenarea propanului, bromurarea propenei și a acetilenei ($Br_2$, $HBr$), nitrarea fenolului, alchilarea benzenului cu propenă, polimerizarea clorurii de vinil/acrilonitrilului/acetatului de vinil, condensarea aminoacizilor și a monozaharidelor, hidroliza enzimatică a grăsimilor/proteinelor/amidonului, hidroliza acidului acetilsalicilic, esterificarea acidului salicilic, hidrogenarea grăsimilor lichide, dehidrohalogenarea 2-bromobutanului, deshidratarea 2-butanolului, izomerizarea n-pentanului.
- **Compuși cu importanță biologică — noțiuni de biochimie** (trunchi comun): aminoacizi (glicină, alanină, valină, serină, cisteină, acid glutamic, lisină) — definiție, denumire, clasificare, proprietăți fizice, caracter amfoter; izomeria optică — carbon asimetric, enantiomeri, amestec racemic; monozaharide — glucoza și fructoza (formule plane și de perspectivă); acizi nucleici — bazele azotate (adenină, timină, citozină, uracil, guanină), formarea unei nucleotide din adenozină și acid fosforic, legăturile de hidrogen dintre bazele complementare, elicea dublă a ADN-ului; oxidarea etanolului ($KMnO_4$, $K_2Cr_2O_7$) și a glucozei (reactiv Tollens și Fehling); identificarea aminoacizilor; randament; freonii și distrugerea stratului de ozon; importanța derivaților halogenați, a produșilor de alchilare, a polimerilor, a produșilor de condensare/policondensare, a hidrolizei, a oxidărilor în organismul uman; ADN, ARN.
- **Extindere — profil real, specializarea Științe ale naturii (curriculum diferențiat)**: derivați funcționali ai acizilor carboxilici — esteri, halogenuri acide, anhidride, amide, nitrili; compuși carbonilici ($C_1$-$C_4$) și amine — definiție, denumire, proprietăți fizice, caracter bazic (aprofundare; existența acestor clase ca atare e deja în TC, la clasificarea generală); caracterul acid al fenolului, bromurarea fenolului, sulfonarea anilinei, alchilarea anilinei/alcoolilor cu oxid de etenă; copolimerizarea butadienei cu monomeri vinilici; condensarea compușilor carbonilici între ei și cu fenolul; diazotarea anilinei, sinteza metiloranjului și a unui colorant azoic; izomeria optică — diastereoizomeri, mezoforme; proteine — structură primară, secundară, terțiară; hidroliza compușilor halogenați mono-/di-/trihalogenați; esterificarea celulozei cu acid azotic sau cu clorură de acetil/anhidridă acetică; reducerea nitrobenzenului (fier + acid clorhidric), a compușilor carbonilici, a glucozei și fructozei; conversie utilă, conversie totală; aciditatea/bazicitatea unui compus organic (alcooli, fenoli, acizi carboxilici, amine).

## Tipuri de exerciții acceptate

- Clasificarea unui compus organic după grupa funcțională, pornind de la formula sa.
- Scrierea ecuației unei reacții specifice din listă (nitrarea fenolului, hidroliza unei grăsimi, esterificarea acidului salicilic etc.).
- Identificarea caracterului amfoter al unui aminoacid dat și scrierea formelor sale ionice (cation/anion/formă neutră).
- Compararea structurii primare/secundare/terțiare a unei proteine, la nivel descriptiv.
- Recunoașterea unei perechi de enantiomeri sau a unui carbon asimetric într-o formulă de structură dată.
- Întrebări scurte despre importanța practică/biologică a unei clase de compuși (derivați halogenați, polimeri, ADN/ARN).

## Exemple concrete de format

1. „Clasifică următorii compuși după grupa funcțională: $CH_3-COOH$, $CH_3-CH_2-OH$, $CH_3-NH_2$."
2. „Scrie ecuația reacției de hidroliză enzimatică a unei grăsimi. Ce produși rezultă?"
3. „Un aminoacid are formula generală $H_2N-CHR-COOH$. Explică de ce prezintă caracter amfoter, scriind formele sale la pH acid și la pH bazic."
4. „Ce sunt enantiomerii? Dă un exemplu de compus organic care prezintă izomerie optică."
5. „De ce freonii afectează stratul de ozon? Răspunde în 1-2 propoziții."
6. „Scrie ecuația reacției dintre glucoză și reactivul Tollens. Ce demonstrează această reacție despre structura glucozei?"

## Interdicții explicite

- NU se introduc conținuturi din curriculum diferențiat (secțiunea „Extindere") în fișele pentru specializarea Matematică-informatică — acestea sunt obligatorii DOAR pentru specializarea Științe ale naturii.
- NU echilibru chimic, termochimie, electrochimie sau cinetică chimică — acestea aparțin clasei a XII-a; la clasa a XI-a chimia organică rămâne subiectul central.
- NU hidrocarburi de bază (alcani/alchene/alchine/arene simple) ca subiect central — acestea au fost acoperite la clasa a X-a; pot apărea doar ca reamintire scurtă.
- NU se detaliază mecanisme de reacție (radicalic, ionic) — acestea aparțin clasei a XII-a (curriculum diferențiat).
- NU se amestecă altă materie (Fizică/Biologie) în aceeași fișă, deși temele de biochimie se ating de Biologie — se rămâne strict la perspectiva chimică (formule, reacții), nu la fiziologie.

## Densitate și layout

- Densitate **5-6 exerciții per fișă A4**.
- Structurat pe secțiuni clare, cu delimitări vizuale (spațiere generoasă / linie orizontală).
- Fișele sunt predominant **TEXT**. Formulele organice și ecuațiile se scriu în LaTeX între `$...$` (subscripți cu `_`, săgeata de reacție cu `\rightarrow`, formule ionice cu `^`). Fără ilustrații decorative.
