# Regulament de generare — Liceu, Clasa a XI-a, Informatică

> Sursă conținut: „Repere metodologice pentru aplicarea curriculumului la Clasa a XI-a în anul
> școlar 2023-2024, disciplina Informatică" — Ministerul Educației, Centrul Național de
> Politici și Evaluare în Educație (document oficial, edu.ro), secțiunea planificării
> calendaristice pentru specializarea **matematică-informatică** (varianta STANDARD, non-
> intensivă — 4 ore/săpt., 1 oră curs + 3 ore laborator), cu „Competențe specifice" complete
> reproduse la finalul fiecărui modul. Programa de bază: **[CERT] aprobată cu O.M. nr.
> 5099/09.09.2009**, citat explicit în document („Programa aprobată cu O.M.nr. 5099/09.09.2009,
> filiera teoretică, profil real, specializarea: matematică-informatică"). Continuă strict
> Clasele IX-X (subprograme și șiruri de caractere, EXCLUSE din Clasa a X-a standard conform
> propriei surse a acelei clase, apar aici ca noutate a Clasei a XI-a — cross-verificat între
> cele două documente independente).
>
> **Avertisment reformă**: Liceul e SUB REFORMĂ CURRICULARĂ ACTIVĂ (OMEd nr. 6930/19.12.2025),
> care intră eșalonat din Clasa a IX-a, anul școlar 2026-2027 — la Clasa a XI-a reforma ajunge
> abia din 2028-2029, deci programa STANDARD de mai jos rămâne pe deplin valabilă pentru
> generația curentă de clasa a XI-a. Verifică realinierea când reforma ajunge la acest nivel.

## Domenii de conținut permise (programa oficială)

- **Subprograme**: structura și modul de definire; declararea și apelul subprogramelor; transferul parametrilor la apel (prin valoare și prin referință); returnarea valorilor de către subprograme; variabile locale și globale.
- **Recursivitate**: definire, exemplificare; mecanisme de implementare; aplicații cu subprograme recursive.
- **Șiruri de caractere**: particularități de memorare a șirurilor de caractere; subprograme predefinite de prelucrare a șirurilor de caractere.
- **Structuri de date neomogene** (înregistrări/structuri) — rezolvarea unor probleme cu caracter practic.
- **Liste**: reprezentarea grafică a structurilor de tip listă; operații specifice; stiva și coada; aplicații cu implementare statică.
- **Metode de programare**: Divide et Impera (prezentare generală, aplicații); Backtracking (implementare iterativă sau recursivă a algoritmilor de generare: produs cartezian, permutări, combinări, aranjamente, submulțimile unei mulțimi).
- **Grafuri orientate și neorientate**: terminologie și proprietăți (adiacență, incidență, grad, lanț, lanț elementar, drum, drum elementar, ciclu, ciclu elementar, circuit, circuit elementar, subgraf, graf parțial, conexitate, tare conexitate, arbore, arbore parțial); reprezentarea în memorie (matrice de adiacență, liste de adiacență, lista muchiilor/arcelor); parcurgerea grafurilor.

## Tipuri de exerciții acceptate

- Analiza unui fragment de subprogram (funcție/procedură) descris ca text: „ce returnează?", „ce se modifică prin parametrul transmis prin referință?".
- Urmărirea pas-cu-pas a unui apel recursiv (ex. factorial, sumă de cifre recursivă) — „care e valoarea returnată?" sau „câte apeluri se fac?".
- Identificarea structurii de date potrivite (stivă/coadă/listă) pentru un scenariu descris în limbaj natural.
- Aplicarea „manuală" a metodei backtracking pe un caz mic (ex. generarea tuturor submulțimilor unei mulțimi de 3 elemente).
- Interpretarea unui graf descris printr-o listă de muchii — determinarea gradului unui nod, existența unui drum/ciclu, numărul de componente conexe.

## Exemple concrete de format

1. „O funcție recursivă calculează suma cifrelor unui număr, apelându-se pe câtul împărțirii la 10. Care este șirul de apeluri pentru `n = 274`?"
2. „Un subprogram primește un parametru întreg prin referință și îl dublează. Dacă variabila `x = 6` e transmisă prin referință, ce valoare are `x` după apel?"
3. „Se aplică metoda backtracking pentru generarea tuturor submulțimilor mulțimii `{1, 2, 3}`. Scrie, în ordinea generării, toate submulțimile obținute."
4. „Un graf neorientat are muchiile `(1,2), (2,3), (3,1), (3,4)`. Care este gradul nodului 3? Există un ciclu care conține nodurile 1, 2, 3?"
5. „Explică diferența dintre operațiile specifice unei stive și cele specifice unei cozi, folosind exemplul gestionării unui rând de așteptare la o casă."
6. „Un algoritm Divide et Impera împarte, la fiecare pas, un tablou de 8 elemente în două jumătăți egale. Câte niveluri de împărțire sunt necesare până se ajunge la subtablouri de un singur element?"

## Interdicții explicite

- NU se introduce programarea orientată pe obiecte (clase, obiecte, moștenire) — NU face parte din programa STANDARD (non-intensivă) a Clasei a XI-a (apare doar la specializarea intensiv informatică, exclusă aici).
- NU se introduc baze de date sau SQL — specifice Clasei a XII-a.
- NU se reiau algoritmii de bază pe tablouri (căutare, sortare simplă, interclasare) din Clasa a X-a decât ca punct de plecare pentru o structură de date NOUĂ (listă, graf) — nu ca exercițiu repetitiv identic.
- NU se cere elevului să scrie sau să ruleze cod complet, destinat compilării reale — fișele sunt text-only.

## Densitate și layout

- Densitate: **5-6 exerciții per fișă A4**.
- Structurat pe secțiuni clare, cu delimitări vizuale (spațiere generoasă / linie orizontală).
- Fișele sunt **text-only** — fragmentele de cod, pseudocod sau descrierile de grafuri apar doar ca text de analizat/completat, NU ca exerciții de scriere/compilare/rulare de programe complete.
- Codul sursă, numele de variabile, structurile de date și valorile literale (ex. `x = 6`, `{1,2,3}`, `(1,2)`) se scriu între backtick-uri simple `` `...` ``, pe linii separate dacă fragmentul are mai multe instrucțiuni — NU în blocuri de cod (` ``` `) și NU cu underscore liber în afara backtick-urilor.
