# Regulament de generare — Liceu, Clasa a IX-a, Limba Engleză

> Sursă conținut: programa școlară aprobată prin Ordinul ministrului educației,
> cercetării și tineretului nr. 3458/09.03.2004 — „Programe școlare pentru clasa
> a IX-a, ciclul inferior al liceului — Limba engleză" (planuri-cadru: OMECT nr.
> 5723/23.12.2003), **Programa 1** (limba modernă 1, anul VII de studiu — elevii
> care au început studiul limbii engleze din clasa a III-a, la toate filierele,
> profilurile și specializările de liceu). Secțiunile folosite: „COMPETENȚE
> SPECIFICE ȘI FORME DE PREZENTARE A CONȚINUTURILOR" + „CONȚINUTURI RECOMANDATE
> pentru Programa 1" — TEME, ELEMENTE DE CONSTRUCȚIE A COMUNICĂRII, FUNCȚII
> COMUNICATIVE ALE LIMBII (pag. 7-12 din PDF-ul oficial, arhiva rocnee.eu). Nivel
> țintă CECRL: **B1 pentru toate competențele**, la finele ciclului inferior al
> liceului (clasele IX-X) — explicit menționat în programă. Elevi 15-16 ani.
> Scris pentru proiectul „Școlare 🌐", format după `gimnaziu_clasa8_limba-engleza.md`,
> care încheie progresia de gimnaziu la nivel A2 cu achiziții incipiente B1
> (Past Perfect, Reported Speech, Passive Voice, Modal Verbs, Conditional 2/3) —
> clasa a IX-a de liceu continuă direct de acolo, prin sistematizare și extinderi
> punctuale (nu reia de la zero structurile deja predate la gimnaziu).
>
> **Avertisment de reformă — URGENT, citește înainte de a folosi acest fișier:**
> skeleton-ul din `frontend/src/lib/scolare/curriculum/liceu.ts` marchează întregul
> ciclu Liceu cu `in_reforma: true`. [CERT, confirmat la sursă primară 2026-08-08]:
> Ordinul nr. 6.930/2025 (programe școlare liceu, reformă) a fost PUBLICAT în
> Monitorul Oficial al României, Partea I, nr. 4 bis/08.01.2026 — deci reforma nu
> mai e doar „în consultare", e semnată și publicată. Pentru Limba modernă 1 clasa
> a IX-a am găsit direct un exemplar de consultare (2025, TC+CS, ordin needitat pe
> pagina de titlu la acel moment) — [INCERT, neconfirmat direct]: nu am verificat
> personal, în interiorul PDF-ului din Monitorul Oficial, anexa exactă cu conținutul
> final pentru Engleză (am confirmat doar că ordinul care le conține pe toate a fost
> publicat). Reforma intră în vigoare ÎNCEPÂND CU CLASA A IX-A DIN ANUL ȘCOLAR
> 2026-2027 (~3 săptămâni de la data redactării, 2026-08-08). **E posibil ca
> programa OMECT 3458/2004 folosită AICI să NU mai fie cea aplicabilă cohortei
> chiar din toamna 2026** — decizie de ship/defer pentru acest fișier specific,
> necesită re-verificare la sursă (conținutul exact al anexei Engleză din Ordinul
> 6.930/2025) înainte de folosire în producție.
>
> **Limba fișei**: instrucțiunile exercițiilor (titlul/cerința) sunt în ROMÂNĂ,
> coerent cu restul modulului Școlare. Conținutul exercițiului propriu-zis
> (propoziții, cuvinte, dialoguri) este ÎN ENGLEZĂ.

## Domenii de conținut permise (programa oficială)

- **Teme** (conform „CONȚINUTURI RECOMANDATE pentru Programa 1", Clasa a IX-a): Domeniul personal — relații interumane/interpersonale, viața personală (alimentație, sănătate, educație, activități de timp liber), universul adolescenței (cultură, arte, sport); Domeniul public — țări și orașe/călătorii, aspecte din viața contemporană (sociale, literare, tehnice, ecologice), mass-media; Domeniul ocupațional — aspecte legate de profesiuni și viitorul profesional, activități din viața cotidiană; Domeniul educațional — viața culturală și lumea artelor (film, muzică, expoziții), repere de cultură și civilizație ale spațiului cultural de limbă engleză și ale culturii universale, texte ale literaturilor britanică și americană.
- **Gramatică funcțională (acte de vorbire)**: a da și a solicita informații generale/personale, despre proveniență, completarea unui formular, programul zilnic, vreme, evenimente, prețuri, orientare în spațiu; a exprima acord/dezacord, o opinie, a compara acțiuni prezente cu cele trecute, a accepta/refuza o ofertă sau invitație, a exprima obligația sau interdicția, a trage concluzii; a exprima o dorință/necesitate, preferințe, o intenție, a folosi stilul formal/informal; a da sfaturi, a cere scuze; a exprima propuneri, decizii, a da instrucțiuni, a încuraja/avertiza pe cineva; a saluta, a face prezentări, a oferi un obiect politicos, a face urări, a cere permisiunea de a întrerupe o conversație.
- **Gramatică** (Elemente de construcție a comunicării, Clasa a IX-a): Substantivul — pluralul substantivelor neregulate (sistematizare), genul substantivului (sistematizare), cazul genitiv 's (sistematizare); Articolul — articolul zero/omiterea articolului; Adjectivul — tipuri de adjective, ordinea adjectivelor; Verbul — sistematizarea modalităților de exprimare a prezentului, trecutului și viitorului, verbele modale (sistematizare); Adverbul — formarea adverbelor, comparația adverbelor; Fraza condițională de tip 3; Afirmația, interogația, negația (sistematizare); Acordul subiectului cu predicatul (sistematizare); Întrebări disjunctive (tag questions) — element nou față de gimnaziu.

## Tipuri de exerciții acceptate

- Formare de întrebări disjunctive (tag questions) pe propoziții afirmative/negative date.
- Completare propoziții cu Conditional tip 3 (situație ipotetică din trecut, cu consecință tot din trecut).
- Potrivire cuvânt-definiție (matching) pe vocabular tematic (călătorii, mass-media, profesii, artă/expoziții).
- Ordonare corectă a adjectivelor într-un grup nominal (mărime/vârstă/culoare/origine + substantiv).
- Tradu propoziții scurte sau expresii RO→EN / EN→RO din temele permise.
- Scurte dialoguri de completat (acord/dezacord politicos, acceptare/refuz invitație, sfat cu should).

## Exemple concrete de format

1. „Completează cu eticheta corectă (tag question): She lives in London, ___?"
2. „Formulează condiționala de tip 3: If I ___ (know) about the trip, I ___ (come) with you."
3. „Potrivește cuvântul cu definiția: exhibition / journalist / profession / destination → «a job or type of work that a person does regularly to earn money»."
4. „Ordonează corect adjectivele: a (French / beautiful / old) painting → ___."
5. „Completează dialogul: A: Would you like to join us for the trip? B: ___ (acceptă politicos)."
6. „Transformă la cazul genitiv: the book that belongs to my sister → ___."

## Interdicții explicite

- NU se depășesc structurile explicit menționate pentru Clasa a IX-a (sistematizare timpuri verbale, Conditional tip 3, tag questions, ordinea adjectivelor, cazul genitiv sistematizare) — fără fraze condiționale mixte sau diateză pasivă complexă (rezervate claselor X-XII).
- NU se folosesc teme din afara listei permise de mai sus.
- NU se combină mai mult de 2 structuri gramaticale noi într-un singur exercițiu (claritate pedagogică).
- Nivelul CECRL țintă (B1) se atinge la FINELE ciclului inferior (clasa X) — clasa a IX-a consolidează tranziția de la A2 (finalul gimnaziului) spre B1, fără a presupune stăpânire completă B1 încă din acest an.

## Densitate și layout

- **5-6 exerciții per fișă A4.**
- Structurat pe secțiuni clare, cu delimitări vizuale (spațiere generoasă / linie orizontală).
- Instrucțiunile exercițiilor: ROMÂNĂ. Conținutul exercițiului (propoziții, cuvinte, dialoguri): ENGLEZĂ.
- Fișele sunt predominant TEXT; se pot folosi tabele simple pentru exercițiile de matching, transformare sau completare.
- **Convenția pentru spații de completat: exact trei underscore (`___`), niciodată mai multe** (șiruri lungi de underscore pot fi afectate de sanitizare la randare).
