# Regulament de generare — Liceu, Clasa a XII-a, Informatică

> Sursă conținut: „Programe școlare — Informatică, Clasa a XII-a, ciclul superior al liceului",
> Anexa nr. 5 la ordinul ministrului educației, cercetării și inovării **[CERT] nr.
> 5099/09.09.2009**, Ministerul Educației, Cercetării și Inovării, București 2009 — filiera
> teoretică profil real (specializările Matematică-informatică, Matematică-informatică intensiv
> informatică) și filiera vocațională profil militar (aceleași specializări), secțiunea
> „Conținuturi detaliate", Modulul 1 (obligatoriu pentru toți elevii de la specializarea
> matematică-informatică). Structura e MODULARĂ: Modulul 1 „Baze de date" (1 oră/săpt. teorie)
> e OBLIGATORIU; apoi elevul alege UN modul practic (3 ore/săpt.) dintre — I. Sisteme de
> gestiune a bazelor de date (Modelare date + programare SQL), II. Programare vizuală, III.
> Programare web. Acest regulament fixează **varianta I (SQL)** — singura testabilă complet
> text-only (interogări SQL analizate ca text); variantele II/III sunt EXCLUSE explicit din
> acest regulament din acest motiv (implementare vizuală/web necesită mediu real de rulare),
> deși permise de programa oficială. Conținutul de mai jos combină Modulul 1 (obligatoriu,
> integral) cu selecția din Modulul 2 Varianta A relevantă pentru interogări SQL text-only.
>
> **Avertisment reformă**: Liceul e SUB REFORMĂ CURRICULARĂ ACTIVĂ (OMEd nr. 6930/19.12.2025),
> care intră eșalonat din Clasa a IX-a, anul școlar 2026-2027 — la Clasa a XII-a reforma ajunge
> abia din 2029-2030, deci programa STANDARD de mai jos rămâne pe deplin valabilă pentru
> generația curentă de clasa a XII-a. Verifică realinierea când reforma ajunge la acest nivel.

## Domenii de conținut permise (programa oficială)

- **Modelul conceptual al unei probleme de gestiune** (Modulul 1): entități și instanțe; atribute; identificator unic; relații între entități (unu-la-unu, unu-la-mai-mulți, mai-mulți-la-mai-mulți); normalizarea datelor — prima, a doua și a treia formă normală (la nivel de recunoaștere/explicare, nu de aplicare completă).
- **Tabele** (Modulul 1): crearea structurii unei tabele (tipuri de date, câmpuri/coloane); conținutul unei tabele (linii/înregistrări); operații specifice — adăugare, modificare, ștergere, sortare, căutare, calcule statistice.
- **Baze de date** (Modulul 1): modele de baze de date (relațional, rețea, ierarhic — doar recunoaștere); cheie primară, chei externe; reguli de integritate referențială.
- **Introducere în SQL** (Modulul 1, obligatoriu): structura comenzilor SQL; selecție și proiecție; interogări simple; inserarea, modificarea, ștergerea datelor în tabele; crearea și modificarea structurii tabelelor.
- **Programare SQL — extindere** (Modulul 2, Varianta A): expresii și funcții; gruparea datelor; sortarea datelor; relaționarea tabelelor; interogări multiple (`JOIN`).

## Tipuri de exerciții acceptate

- Analiza unei interogări SQL date (prezentată ca text, NU executabilă) — „ce rânduri returnează această interogare?".
- Completarea unei interogări SQL incomplete pentru a obține un rezultat cerut.
- Identificarea erorii dintr-o interogare SQL scurtă (sintaxă greșită sau condiție incorectă).
- Proiectare teoretică simplă: „ce coloane/chei ar trebui să aibă un tabel pentru a stoca...", inclusiv identificarea unei relații unu-la-mai-mulți sau mai-mulți-la-mai-mulți dintr-un scenariu descris.
- Întrebări teoretice despre cheie primară vs. cheie externă, integritate referențială, sau recunoașterea formei normale încălcate într-un exemplu simplu de tabelă.

## Exemple concrete de format

1. „Un tabel `Elevi` are coloanele `id`, `nume`, `clasa`, `medie`. Scrie o interogare SQL care selectează numele elevilor cu media peste `9`, sortați descrescător după medie."
2. „Ce returnează interogarea `SELECT clasa, COUNT(*) FROM Elevi GROUP BY clasa;` aplicată tabelului `Elevi` de mai sus?"
3. „Un tabel `Comenzi` are o coloană `id_client`, care este cheie externă spre tabelul `Clienti`. Explică ce rol are această cheie externă pentru integritatea datelor."
4. „Completează interogarea SQL lipsă, astfel încât să afișeze produsele cu prețul peste `100`, sortate crescător după preț: `SELECT * FROM Produse WHERE ... ORDER BY ...`"
5. „Un tabel `Elev_Materie` leagă tabelele `Elevi` și `Materii`, fiecare pereche (elev, materie) apărând o singură dată. Ce tip de relație este aceasta — unu-la-unu, unu-la-mai-mulți sau mai-mulți-la-mai-mulți? Motivează."
6. „O interogare combină datele din tabelele `Elevi` și `Clase` folosind `JOIN` pe baza coloanei `id_clasa`. Explică, în cuvinte, ce rânduri va conține rezultatul."

## Interdicții explicite

- NU se introduce programarea orientată pe obiecte, programarea vizuală (ex. Visual FoxPro, C#, Delphi) sau programarea web (HTML/PHP/ASP) — module opționale ale programei (Modulele 2-Varianta B, 3, 4, 5), excluse deliberat din acest regulament (vezi nota din blocul „Sursă conținut").
- NU se cere elevului să scrie sau să ruleze interogări reale pe un sistem de gestiune a bazelor de date — fișele sunt text-only, interogările SQL apar doar ca text de analizat/completat.
- NU se reiau structurile de date algoritmice (liste, grafuri, subprograme, recursivitate) din Clasa a XI-a — Clasa a XII-a se concentrează exclusiv pe baze de date.
- NU se detaliază administrarea avansată a bazelor de date (instalare server, indecși, secvențe, gestionarea drepturilor de acces, tranzacții) — parte a Modulului 2 opțional, dar prea tehnică pentru un exercițiu text-only; se pot menționa DOAR conceptual, ca întrebare teoretică scurtă, nu ca exercițiu de aplicare.

## Densitate și layout

- Densitate: **5-6 exerciții per fișă A4**.
- Structurat pe secțiuni clare, cu delimitări vizuale (spațiere generoasă / linie orizontală).
- Fișele sunt **text-only** — interogările SQL apar doar ca text de analizat/completat/depanat, NU ca exerciții de scriere/rulare pe un sistem real de baze de date.
- Interogările SQL, numele de tabele/coloane și valorile literale (ex. `SELECT nume FROM Elevi`, `medie > 9`) se scriu între backtick-uri simple `` `...` ``, pe linii separate dacă interogarea are mai multe clauze — NU în blocuri de cod (` ``` `) și NU cu underscore liber în afara backtick-urilor.
