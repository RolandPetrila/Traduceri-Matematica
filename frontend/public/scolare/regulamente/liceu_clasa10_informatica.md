# Regulament de generare — Liceu, Clasa a X-a, Informatică

> Sursă conținut: programa școlară oficială „Informatică — Clasa a X-a, ciclul inferior al
> liceului", filiera teoretică profil real (specializările Matematică-informatică, Științe ale
> naturii) și filiera vocațională profil militar (Matematică-informatică), componenta
> curriculum diferențiat (1 oră/săptămână) — Ministerul Educației, Cercetării și Inovării,
> București 2009, secțiunea „Competențe specifice și conținuturi" (document integral, cu
> competențe generale identice IX-X). Ordin de aprobare [PROBABIL] OMECI nr. 5099/09.09.2009
> (aceeași observație ca la Clasa a IX-a — numărul nu apare explicit pe copia scanată, dar e
> citat explicit pe programele Cls. XI-XII, identice ca format/dată). Programa permite Pascal
> SAU C/C++ ca limbaj de studiu; acest regulament fixează **C++**, pentru continuitate cu
> Gimnaziu Cl.VII (Python/C/C++/Ruby) și cu resursele de referință folosite de „Programa pentru
> examenul de diferență" (pbinfo.ro, exclusiv C++). Confirmat prin 2 surse independente
> (programa integrală 2009 + programa de diferență) că, în varianta standard, subprogramele și
> șirurile de caractere sunt EXCLUSE din Clasa a X-a (marcate „Doar pentru intensiv" în
> diferență) — apar abia în Clasa a XI-a.
>
> **Avertisment reformă**: Liceul e SUB REFORMĂ CURRICULARĂ ACTIVĂ (OMEd nr. 6930/19.12.2025),
> care intră eșalonat din Clasa a IX-a, anul școlar 2026-2027 — la Clasa a X-a reforma ajunge
> abia din 2027-2028, deci programa STANDARD de mai jos rămâne pe deplin valabilă pentru
> generația curentă de clasa a X-a. Verifică realinierea când reforma ajunge la acest nivel.

## Domenii de conținut permise (programa oficială)

- **Elementele de bază ale limbajului C++**: structura programului; vocabularul limbajului; tipuri simple de date (standard); constante, variabile, expresii; citirea/scrierea datelor.
- **Structuri de control în C++**: structura liniară; structura alternativă; structuri repetitive.
- **Mediul de programare** (la nivel teoretic/descriptiv, nu de rulare efectivă): prezentare generală; editarea programelor sursă; compilare, rulare, depanare.
- **Tipuri structurate de date**: tipul tablou — tablouri unidimensionale și tablouri bidimensionale.
- **Fișiere text**: definire; operații specifice (citire/scriere din/în fișier text, prin comparație cu intrarea/ieșirea standard).
- **Algoritmi fundamentali de prelucrare a tablourilor**: căutare secvențială, căutare binară, sortare, interclasare, prelucrări specifice tablourilor bidimensionale.

## Tipuri de exerciții acceptate

- Analiza unui fragment de cod C++ (prezentat ca text, NU executabil): „ce afișează acest program?".
- Completarea unei instrucțiuni lipsă (citire, structură de control, index de tablou) într-un fragment de cod descris textual.
- Identificarea erorii logice sau de sintaxă dintr-un fragment scurt de cod.
- Determinarea valorilor unui tablou după aplicarea „manuală" a unui algoritm descris (sortare, căutare, interclasare).
- Întrebări teoretice despre diferența dintre citirea/scrierea la consolă și citirea/scrierea dintr-un fișier text.

## Exemple concrete de format

1. „Un tablou `v` are 5 elemente: `3, 8, 1, 9, 4`. Ce valori are tabloul după aplicarea unui algoritm de sortare crescătoare?"
2. „Un fragment de cod citește un tablou de 5 valori întregi și afișează suma elementelor pare. Pentru tabloul `2, 5, 6, 9, 10`, ce se afișează?"
3. „Se caută binar valoarea `17` într-un tablou sortat crescător `2, 5, 9, 12, 17, 20, 31`. Care este primul element cu care se compară `17` (elementul din mijloc)?"
4. „Ce diferență există între citirea unei valori de la tastatură și citirea aceleiași valori dintr-un fișier text, din punctul de vedere al comenzilor folosite?"
5. „Se interclasează două tablouri sortate crescător, `a = 1, 4, 6` și `b = 2, 3, 7`. Care este tabloul rezultat, în ordine crescătoare?"
6. „Completează instrucțiunea lipsă dintr-un program care citește un tablou bidimensional cu 2 linii și 3 coloane și afișează suma tuturor elementelor."

## Interdicții explicite

- NU se introduc subprograme (funcții/proceduri definite de utilizator) sau recursivitate — specifice Clasei a XI-a.
- NU se introduc șiruri de caractere ca tip distinct de prelucrare, structuri neomogene (înregistrări), liste înlănțuite, stive/cozi sau grafuri — specifice Clasei a XI-a.
- NU se reiau algoritmii elementari de prelucrare a numerelor izolate (fără tablou) din Clasa a IX-a — Clasa a X-a lucrează cu date STRUCTURATE (tablouri, fișiere).
- NU se cere elevului să scrie sau să ruleze cod complet, complex, destinat compilării reale — fișele sunt text-only.

## Densitate și layout

- Densitate: **5-6 exerciții per fișă A4**.
- Structurat pe secțiuni clare, cu delimitări vizuale (spațiere generoasă / linie orizontală).
- Fișele sunt **text-only** — fragmentele de cod C++ apar doar ca text de analizat/completat, NU ca exerciții de scriere/compilare/rulare de programe complete.
- Codul sursă, numele de variabile și valorile literale (ex. `v[3] = 9`, `n = 5`) se scriu între backtick-uri simple `` `...` ``, pe linii separate dacă fragmentul are mai multe instrucțiuni — NU în blocuri de cod (` ``` `) și NU cu underscore liber în afara backtick-urilor.
