# Regulament de generare — Liceu, Clasa a XII-a, Chimie

> Sursă conținut: programa școlară de Chimie pentru clasa a XII-a, ciclul superior al
> liceului, aprobată prin Ordinul ministrului educației și cercetării nr. 5959/22.12.2006
> [PROBABIL — număr de ordin necompletat în exemplarul PDF consultat (isjcta.ro/
> chimsuceava.wordpress.com); atribuit prin corelare cu regulamentul-soră
> `liceu_clasa12_biologie.md`, aprobat de același ordin omnibus pentru ciclul superior
> — se aplică și clasei a XIII-a, filiera tehnologică]. **Programa 1** — Filiera
> teoretică, Profil real, specializările Matematică-informatică ȘI Științe ale naturii
> (Programele 2/3, tehnologic/militar, NU se folosesc aici). Trunchi comun (TC, 1 oră,
> comun ambelor specializări) + curriculum diferențiat (CD, +1 oră, marcat cu asterisc,
> **obligatoriu numai pentru Științe ale naturii**). Document sursă: PDF oficial MECI,
> „Programe școlare pentru ciclul superior al liceului — Chimie", București 2009.
> Capitolele „Conținuturi": clasificarea reacțiilor chimice în chimia anorganică și
> organică, noțiuni de cinetică chimică, noțiuni de termochimie. **NU este un capitol de
> biochimie** — deși conține aplicații biologice (soluții tampon, energia în sistemele
> biologice), miezul programei e chimie fizică/generală aplicată. Elevi 18-19 ani.
> Încheie progresia liceală, continuând din `liceu_clasa11_chimie.md` (compuși organici
> cu funcțiuni, biochimie structurală) spre chimia fizică — reacții, echilibre, energie,
> viteză, electrochimie.
>
> **Avertisment de reformă (obligatoriu de reținut):** skeleton-ul din
> `frontend/src/lib/scolare/curriculum/liceu.ts` marchează întregul ciclu Liceu cu
> `in_reforma: true` — rocnee.eu confirmă (verificat 2026-08-07) 175 de programe noi
> „în transparență decizională" care intră eșalonat, începând cu clasa a IX-a din anul
> școlar 2026-2027 (deci clasa a XII-a e afectată abia peste trei ani de reformă).
> Programa folosită AICI este cea ÎN VIGOARE la data extragerii (2026-08-08) — NU este
> programa reformată. Re-verifică la sursă când reforma ajunge la clasa a XII-a.

## Domenii de conținut permise (programa oficială — Programa 1)

- **Clasificarea reacțiilor chimice** (trunchi comun): reacții de oxido-reducere, reacții acido-bazice, reacții de precipitare, reacții de complexare, reacții exoterme/endoterme, reacții lente/rapide — criterii de clasificare aplicate atât în chimia anorganică, cât și în cea organică.
- **Termochimie** (trunchi comun): entalpia de reacție; căldura de combustie (arderea hidrocarburilor); căldura de neutralizare (acid tare — bază tare); legea lui Hess; căldura de dizolvare.
- **Cinetică chimică** (trunchi comun): viteza de reacție, legea vitezei; catalizatori, inhibitori.
- **Echilibre și electrochimie** (trunchi comun): echilibre acido-bazice — pH-ul soluțiilor de acizi/baze monoprotice tari și slabe, $pK_a$, $pK_b$; amfoliți; soluții tampon în sisteme biologice ($CO_3^{2-}/HCO_3^-$, $HPO_4^{2-}/H_2PO_4^-$, aminoacizi/proteine); electroliza — metodă de obținere a metalelor ($Na$, $Al$, rafinarea $Cu$), nemetalelor ($Cl_2$, $I_2$, $H_2$) și a substanțelor compuse ($NaOH$); electroliza apei, a soluției de $NaCl$, a soluției de $CuSO_4$; titrarea acido-bazică (acid tare — bază tare); identificarea cationilor ($Ca^{2+}$, $Ba^{2+}$, $Pb^{2+}$, $Fe^{2+}$, $Fe^{3+}$, $Cu^{2+}$) și a anionilor ($SO_4^{2-}$, $CO_3^{2-}$, $S^{2-}$, $NO_2^-$); combinații complexe (obținere, ex. reactivul Schweitzer, reactivul Tollens).
- **Extindere — profil real, specializarea Științe ale naturii (curriculum diferențiat)**: energia în sistemele biologice — rolul ATP și ADP, arderea zaharurilor; influența concentrației, temperaturii și catalizatorilor asupra vitezei de reacție, ecuația lui Arrhenius, energia de activare, complexul activat; seria potențialelor standard de reducere, celule electrochimice (elemente galvanice uscate); hidroliza sărurilor; stereochimia combinațiilor complexe — numere de coordinare 2, 4, 6 (ex. $[Ag(NH_3)_2]^+$, $[Ni(NH_3)_6]^{2+}$), izomerie geometrică; mecanisme de reacție — sinteza $HCl$, monoclorurarea $CH_4$, clorurarea etenei cu $HCl$, clorurarea catalitică a benzenului (intermediari ionici și radicalici); legile electrolizei, calcule de t.e.m.; verificarea calitativă a legii Lambert-Beer (concentrația unei probe de $[Cu(NH_3)_4]^{2+}$); electroliza soluției de $KI$; titrarea redox (iodometrie) — tehnică separată de Lambert-Beer.

## Tipuri de exerciții acceptate

- Clasificarea unei reacții chimice date după criteriile programei (redox, acido-bazică, precipitare, complexare, exo-/endotermă).
- Calcularea entalpiei/căldurii unei reacții pe baza legii lui Hess, din date date.
- Explicarea efectului unui catalizator sau al creșterii concentrației/temperaturii asupra vitezei unei reacții date.
- Calcularea pH-ului unei soluții de acid sau bază monoprotic(ă) tare, dintr-o concentrație dată.
- Scrierea ecuațiilor semireacțiilor de la electrozi pentru electroliza unei soluții date (ex. $NaCl$ sau $CuSO_4$).
- Identificarea unui cation sau anion dintr-o probă, pe baza unei reacții specifice descrise.

## Exemple concrete de format

1. „Clasifică următoarea reacție după tip: $Zn + CuSO_4 \rightarrow ZnSO_4 + Cu$. Ce s-a oxidat și ce s-a redus?"
2. „Folosind legea lui Hess, calculează entalpia reacției de ardere a metanului, cunoscând entalpiile de formare ale reactanților și produșilor."
3. „Explică, pe scurt, de ce un catalizator mărește viteza unei reacții chimice, fără a fi consumat în proces."
4. „Calculează pH-ul unei soluții de $HCl$ cu concentrația $0{,}01$ mol/L (acid tare, monoprotic)."
5. „Scrie semireacțiile care au loc la catod și la anod în electroliza soluției apoase de $NaCl$."
6. „Ce reactiv se poate folosi pentru identificarea ionului $Fe^{3+}$ dintr-o soluție? Scrie ecuația reacției."

## Interdicții explicite

- NU se introduc conținuturi din curriculum diferențiat (secțiunea „Extindere") în fișele pentru specializarea Matematică-informatică — acestea sunt obligatorii DOAR pentru specializarea Științe ale naturii.
- NU chimie organică (hidrocarburi, compuși cu funcțiuni, biochimie structurală) ca subiect central — aceasta a fost acoperită integral la clasele a X-a și a XI-a; poate apărea doar ca substrat al unei reacții (ex. arderea unei hidrocarburi la termochimie).
- NU se prezintă acest capitol ca „biochimie" — miezul programei e chimie fizică/generală (termochimie, cinetică, echilibre, electrochimie, complecși); aplicațiile biologice (soluții tampon, ATP/ADP) sunt doar ilustrări punctuale, nu subiectul central.
- NU calcule cu acizi/baze poliprotice sau soluții tampon cantitative — programa se limitează la acizi/baze monoprotice tari și slabe pentru calculul de pH.
- NU se amestecă altă materie (Fizică/Biologie) în aceeași fișă.

## Densitate și layout

- Densitate **5-6 exerciții per fișă A4**.
- Structurat pe secțiuni clare, cu delimitări vizuale (spațiere generoasă / linie orizontală).
- Fișele sunt predominant **TEXT**. Formulele și ecuațiile se scriu în LaTeX între `$...$` (subscripți cu `_`, sarcini ionice cu `^`, săgeata de reacție cu `\rightarrow`). Fără ilustrații decorative.
