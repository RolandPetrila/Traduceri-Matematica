# Regulament de generare — Liceu, Clasa a X-a, Limba Engleză

> Sursă conținut: programa școlară aprobată prin Ordinul ministrului educației și
> cercetării nr. 4598/31.08.2004 (Anexa nr. 2) — „Programe școlare pentru clasa a
> X-a, ciclul inferior al liceului — Limba engleză" (planuri-cadru: OMECT nr.
> 5723/23.12.2003), **Programa 1** (limba modernă 1, anul VIII de studiu — elevii
> care au început studiul limbii engleze din clasa a III-a, la toate filierele,
> profilurile și specializările de liceu). Secțiunile folosite: „COMPETENȚE
> SPECIFICE ȘI FORME DE PREZENTARE A CONȚINUTURILOR" + „CONȚINUTURI RECOMANDATE
> pentru Programa 1" — TEME, FUNCȚII COMUNICATIVE ALE LIMBII, ELEMENTE DE
> CONSTRUCȚIE A COMUNICĂRII (pag. 7-12 din PDF-ul oficial, arhiva rocnee.eu).
> Nivel țintă CECRL: **B1 pentru toate competențele**, atins la FINELE ciclului
> inferior al liceului — clasa a X-a este anul în care acest nivel se
> consolidează efectiv (aceeași țintă e menționată și la clasa a IX-a, ca reper
> comun al ciclului). Elevi 16-17 ani. Scris pentru proiectul „Școlare 🌐", format
> identic cu `liceu_clasa9_limba-engleza.md`, care continuă progresia de gimnaziu
> (Past Perfect, Reported Speech, Passive Voice, Modal Verbs, Conditional 2/3) prin
> sistematizare de timpuri, Conditional tip 3 și tag questions — clasa a X-a
> preia de acolo și adaugă diateza pasivă/activă complet sistematizată, comparația
> intensivă și construcțiile cu infinitiv/participiu/gerunziu.
>
> **Avertisment de reformă (obligatoriu de reținut):** skeleton-ul din
> `frontend/src/lib/scolare/curriculum/liceu.ts` marchează întregul ciclu Liceu cu
> `in_reforma: true`. [CERT] Ordinul nr. 6.930/2025 (programe școlare liceu,
> reformă) a fost PUBLICAT în Monitorul Oficial, Partea I, nr. 4 bis/08.01.2026,
> aplicabil ESALONAT începând cu clasa a IX-a din anul școlar 2026-2027 (rocnee.eu,
> verificat 2026-08-07/08: 175 de programe noi). [INCERT] Nu am confirmat direct
> dacă acest ordin conține deja și anexa pentru clasa a X-a la Limba modernă 1 —
> pentru limba modernă germană/rusă/japoneză am văzut că o singură anexă acoperă
> IX-XII deodată, deci nu exclud ca la fel să fie și pentru Engleză; nu am verificat
> însă conținutul exact al anexei Engleză. Programa OMECT 4598/2004 folosită AICI
> este cea ÎN VIGOARE pentru cohorta curentă (elevi deja în clasa X înainte de
> reformă). Re-verifică la sursă (Ordinul 6.930/2025) înainte de folosire în
> producție, mai ales pe măsură ce cohorta reformată din clasa IX avansează.
>
> **Limba fișei**: instrucțiunile exercițiilor (titlul/cerința) sunt în ROMÂNĂ,
> coerent cu restul modulului Școlare. Conținutul exercițiului propriu-zis
> (propoziții, cuvinte, dialoguri) este ÎN ENGLEZĂ.

## Domenii de conținut permise (programa oficială)

- **Teme** (conform „CONȚINUTURI RECOMANDATE pentru Programa 1", Clasa a X-a): Domeniul personal — relații interpersonale, viața personală (stil de viață, strategii de studiu, comportament social), universul adolescenței (cultură, arte, sport); Domeniul public — aspecte din viața contemporană (sociale, economice, politice, istorice, culturale, educaționale, ecologice, strategii de utilizare a resurselor), democrație/civism/drepturile omului, mass-media; Domeniul ocupațional — activități din viața cotidiană, profesii și viitorul profesional, aspecte teoretice și practice ale specialității; Domeniul educațional — viața culturală și lumea artelor (arte vizuale, arte interpretative), descoperiri științifice și tehnice, repere de cultură și civilizație ale spațiului cultural de limbă engleză și ale culturii universale.
- **Gramatică funcțională (acte de vorbire)**: a da și a solicita informații (inclusiv legate de completarea unui formular), a raporta; a-și exprima acordul/dezacordul, satisfacția/insatisfacția, a compara acțiuni prezente cu cele trecute; a exprima refuzul și a-l argumenta, a exprima surpriza/curiozitatea/teama/îndoiala, a exprima compasiunea, a folosi stilul formal/informal; a încuraja/avertiza pe cineva, a comenta păreri; a cere permisiunea de a întrerupe o conversație.
- **Gramatică** (Elemente de construcție a comunicării, Clasa a X-a): Substantivul — cazul genitiv (toate tipurile), idiomuri corelate cu temele recomandate; Adjectivul — comparația intensivă (so...that, such...that, structuri cu far more); Verbul — verbele modale pentru realizarea funcțiilor comunicative, infinitivul/participiul/gerunziul; Prepoziții, conjuncții, determinanți; Pronumele (sistematizare); Sintaxa — diateza pasivă, diateza activă, construcții infinitivale/participiale/gerundivale.

## Tipuri de exerciții acceptate

- Transformare de propoziții din diateza activă în diateza pasivă (și invers).
- Completare cu forma corectă (gerunziu sau infinitiv) după verbe care cer una dintre construcții.
- Potrivire cuvânt-definiție (matching) pe vocabular tematic (democrație, resurse, mass-media, artă).
- Completare propoziții cu structuri de comparație intensivă (so...that / such...that).
- Tradu propoziții scurte sau expresii RO→EN / EN→RO din temele permise.
- Scurte dialoguri de completat (refuz politicos argumentat, comparare experiențe trecute/prezente).

## Exemple concrete de format

1. „Transformă la diateza pasivă: They painted the mural in 2020. → The mural ___ in 2020."
2. „Completează cu forma corectă (gerunziu/infinitiv): She enjoys ___ (paint) but she wants ___ (become) an architect."
3. „Potrivește cuvântul cu definiția: democracy / resource / election / citizen → «a person who is a legal member of a country»."
4. „Completează structura de comparație intensivă: The exhibition was ___ impressive that we stayed for hours."
5. „Completează dialogul: A: Can you help me with this project this weekend? B: ___ (refuză politicos și argumentează)."
6. „Formulează cazul genitiv: the paintings that belong to the museum → ___."

## Interdicții explicite

- NU se depășesc structurile explicit menționate pentru Clasa a X-a (diateza pasivă/activă, gerunziu/infinitiv, comparație intensivă, genitiv toate tipurile, verbe modale funcționale) — fără fraze condiționale mixte sau diateză pasivă indirectă tip „He is said to have..." (rezervate claselor XI-XII).
- NU se folosesc teme din afara listei permise de mai sus.
- NU se combină mai mult de 2 structuri gramaticale noi într-un singur exercițiu.
- Nivelul CECRL țintă (B1, pentru toate competențele) se consideră ATINS la finele acestei clase — exercițiile pot avea complexitate ușor mai ridicată decât la clasa a IX-a, dar rămân în limitele B1 (fără abstractizare avansată sau argumentare complexă, specifice B2/claselor XI-XII).

## Densitate și layout

- **5-6 exerciții per fișă A4.**
- Structurat pe secțiuni clare, cu delimitări vizuale (spațiere generoasă / linie orizontală).
- Instrucțiunile exercițiilor: ROMÂNĂ. Conținutul exercițiului (propoziții, cuvinte, dialoguri): ENGLEZĂ.
- Fișele sunt predominant TEXT; se pot folosi tabele simple pentru exercițiile de matching, transformare sau completare.
- **Convenția pentru spații de completat: exact trei underscore (`___`), niciodată mai multe** (șiruri lungi de underscore pot fi afectate de sanitizare la randare).
