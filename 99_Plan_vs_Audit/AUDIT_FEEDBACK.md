# AUDIT FEEDBACK — Runda 1
# Data: 2026-03-26 | Sursa: PLAN_v3.md + PLAN_DECISIONS.md + info.md + cod sursa
# Status: [INTEGRAT] — T1 a integrat toate sugestiile in PLAN_v3.md (2026-03-26)

---

## Rezumat

Planul este solid si bine structurat. Fazele sunt logice, limitele R14 sunt documentate, exemplele de utilizare sunt clare. Am identificat 3 probleme critice care pot bloca implementarea daca nu sunt adresate, 4 sugestii importante, si cateva imbunatatiri optionale. Cea mai critica: planul presupune ca Pillow poate decupa figuri din PDF-uri, dar in realitate are nevoie de o librarie suplimentara care lipseste din proiect.

---

## Sugestii CRITICE (trebuie integrate) [INTEGRAT]

### S1: Lipsa conversie PDF-la-imagine pentru crop figuri
**Ce am gasit**: Codul de decupare figuri (`api/lib/figure_crop.py`) functioneaza cu imagini (JPEG/PNG). Dar cand Cristina incarca un PDF, Pillow NU poate deschide direct paginile PDF-ului ca sa decupeze figurile.
**Ce lipseste**: O librarie care transforma paginile PDF in imagini (de exemplu `pdf2image` + Poppler, sau `PyMuPDF`). Aceasta NU e listata in `requirements.txt`.
**Impact daca nu se rezolva**: Sprint 2.2 (calitate figuri) nu va functiona deloc pentru PDF-uri. Cristina incarca si PDF-uri, nu doar poze — deci o parte importanta din flow nu va merge.
**Solutie propusa**: T1 sa adauge `pdf2image` sau `PyMuPDF` in requirements.txt si sa converteasca fiecare pagina PDF in imagine inainte de crop. Task suplimentar in Sprint 2.2.
**Verificare**: Pillow are nevoie de poppler instalat pe server (Render) pentru pdf2image. PyMuPDF (`fitz`) nu are dependente externe — posibil mai simplu.

### S2: Zero protectie impotriva abuzului (rate limiting)
**Ce am gasit**: API-ul are doar o limita de 1 MB pe cerere. Nu exista nicio protectie care sa limiteze cate cereri poate face cineva pe minut/ora/zi.
**De ce conteaza**: Site-ul e public (fara autentificare). Daca cineva gaseste adresa, poate trimite sute de cereri si epuizeaza toata cota DeepL (500.000 caractere) sau Gemini (250 cereri/zi) intr-o ora. Cristina ramane fara traduceri pentru restul lunii/zilei.
**Impact daca nu se rezolva**: Cota lunara DeepL sau zilnica Gemini poate fi epuizata de oricine, intentionat sau accidental.
**Solutie propusa**: Rate limiting simplu — maxim 10 traduceri/minut si 100/zi per IP. Se poate face cu un dictionar in memorie (nu e nevoie de Redis). Task suplimentar in Sprint 2.3 (securitate).

### S3: Strategia de cache traduceri neclara — sesiune vs persistent
**Ce spune info.md**: "Switch INSTANT daca traducerea exista deja in cache" si mentioneaza "state React sau localStorage".
**Ce spune planul**: "cache doar in sesiune" (se pierde cand inchide browser-ul).
**De ce conteaza**: Cristina traduce 5 pagini (consuma cota DeepL), inchide browserul, revine a doua zi — trebuie sa re-traduca si consuma iar din cota. Cu cache persistent (localStorage), ar avea traducerile salvate.
**Impact daca nu se rezolva**: Consum dublu de cota DeepL + experienta slaba (munca pierduta).
**Solutie propusa**: T1 sa decida explicit si sa adauge un task: salvare traduceri in localStorage (recomandat) sau doar in memorie (mai simplu dar pierde munca). Recomandarea mea: localStorage cu limita de ~5 MB si curatare automata a celor mai vechi.

---

## Sugestii IMPORTANTE (recomandate) [INTEGRAT]

### S4: Strategie de rollback pentru refactorizare (Sprint 2.1)
Sprint 2.1 sparge un fisier de 1420 linii in 4 module. E o operatie mare care poate introduce probleme subtile.
**Recomandare**: T1 sa faca un commit separat INAINTE de refactorizare (snapshot). Daca ceva nu merge, se poate reveni la versiunea anterioara cu `git revert`. Mentionat explicit in plan ca task: "Commit snapshot pre-refactorizare".

### S5: Lipsesc taskuri de testare pe mobil
Info.md specifica 3 dispozitive tinta: laptop, Android, iPhone. Planul are teste pe toate sprinturile, dar NICIUN test nu mentioneaza verificare pe telefon.
**De ce conteaza**: Cristina foloseste si telefonul (poze cu manualul). Daca upload-ul sau vizualizarea nu merge pe 360px latime, pierde functionalitate.
**Recomandare**: Adauga cel putin 1 task de testare mobil in Faza 2: "Test pe telefon Android: upload poza, vizualizare document tradus, switch limba".

### S6: Edge case cold start > 60 secunde
Planul spune cold start = 30-60 secunde si ecranul de asteptare dispare "cand serverul raspunde". Dar:
- Ce daca serverul raspunde dupa 90 secunde? (Render free tier poate fi lent)
- Ce daca serverul nu raspunde deloc? (mentenanta Render, probleme retea)
**Recomandare**: Ecranul de asteptare sa aiba un timeout de 120 secunde. Dupa 120s, afiseaza: "Serverul nu raspunde. Incearca din nou mai tarziu." cu buton de retry. Task suplimentar in Sprint 1.2.

### S7: Cota Gemini partajata intre OCR si viitorul Chat AI
Planul mentioneaza corect (250 cereri/zi total) dar nu are o solutie clara. Daca in Faza 4 adaugam Chat AI, OCR-ul si chat-ul se bat pe aceleasi 250 cereri.
**Recomandare**: In Faza 4, cand se detaliaza, sa se prevada: Chat AI foloseste prioritar Groq (14.400/zi), Gemini doar cand e nevoie de analiza poze. Astfel OCR-ul pastreaza cota Gemini.

---

## Sugestii OPTIONALE (nice to have) [AMANAT — Roland: offline nu e prioritar]

### S8: Service Worker ar putea salva documentele traduse pentru offline
Exista deja un Service Worker functional (`frontend/public/sw.js`), dar documentele traduse NU sunt salvate in cache. Info.md mentioneaza: "documentele deja traduse vizualizabile fara internet".
**Recomandare**: In Faza 2 sau 3, un task optional: SW salveaza in Cache API documentele traduse, vizualizabile offline. Nu e prioritar, dar e mentionat in viziune.

### S9: Monitorizare ore Render
Cu 2 servicii pe 750 ore/luna partajate, ar fi util un check lunar. Render nu avertizeaza automat.
**Recomandare**: Task optional in Faza 3: endpoint `/api/health` returneaza si uptime-ul, afisabil in /diagnostics.

---

## Scenarii neacoperite [INTEGRAT]

### SC1: Gemini returneaza coordonate gresite pentru figuri
**Ce se intampla**: Figurile sunt decupate gresit (taiate, suprapuse, sau lipsesc). Cristina vede un document cu figuri deformate.
**Solutie propusa**: Validare coordonate inainte de crop (bbox trebuie sa fie intre 0.0 si 1.0, w/h > 0). Daca bbox e invalid, afiseaza placeholder "Figura nu a putut fi extrasa" in loc de imagine corupta. Task in Sprint 2.2.

### SC2: Ambele chei DeepL epuizate la mijlocul lunii
**Ce se intampla**: Traducerile nu mai functioneaza. Cristina vede eroare sau nimic.
**Solutie propusa**: Planul mentioneaza "fallback Gemini" — verificare ca acest fallback chiar functioneaza end-to-end si ca mesajul afisat e clar: "Cota DeepL epuizata, se foloseste traducerea alternativa (calitate mai mica)". Task de verificare in Sprint 2.4.

### SC3: Upload fisier mare pe Render (aproape de 4 MB, PDF 50+ pagini)
**Ce se intampla**: RAM-ul de 512 MB al serverului se epuizeaza, cererea pica.
**Solutie propusa**: Procesare pagina cu pagina (nu toate odata in memorie). Daca PDF-ul are > 20 pagini, proceseaza in loturi de 5. Mesaj utilizator: "Document mare, se proceseaza in etape...". Mentionat in limite dar fara task concret.

### SC4: Cristina incarca DOCX cu imagini embedded
**Ce se intampla**: Pipeline-ul OCR e conceput pentru poze/PDF. Un Word cu imagini inline poate sa nu functioneze cu flow-ul de crop figuri.
**Solutie propusa**: Clarificare: DOCX-urile se traduc text-only (fara OCR), sau se extrag imaginile mai intai? info.md listeaza DOCX ca format de input dar planul nu detaliaza flow-ul DOCX.

---

## Intrebari pentru Roland — RASPUNSURI (2026-03-26)

### I1: Cristina incarca mai des poze (JPEG) sau PDF-uri?
**Raspuns Roland**: Nu poate estima, depinde de necesitate.
**Concluzie**: Trebuie sa suportam AMBELE formate. S1 (PDF crop figuri) ramane CRITIC — nu putem presupune ca va folosi doar poze.

### I2: Cache traduceri — sa se pastreze dupa inchiderea browserului?
**Raspuns Roland**: A — DA, cache persistent.
**Concluzie**: S3 devine task CONFIRMAT. T1 sa adauge in Sprint 2.4: salvare traduceri in localStorage cu limita ~5 MB si curatare automata.

### I3: Cat de important e accesul offline la documente deja traduse?
**Raspuns Roland**: B — Nu prea, are mereu internet.
**Concluzie**: S8 (cache offline via Service Worker) ramane OPTIONAL, prioritate scazuta. Nu e nevoie sa fie in primele faze.

---

## Cerinte MCP pentru T1 [INTEGRAT — cercetari finalizate]

### MCP1: Verificare PyMuPDF vs pdf2image pe Render
T1 sa cerceteze: care dintre `PyMuPDF` (fitz) si `pdf2image` (necesita poppler) functioneaza pe Render free tier? PyMuPDF nu are dependente externe, deci probabil mai simplu de instalat.
**Motiv**: S1 (crop figuri din PDF) depinde de aceasta decizie.

### MCP2: Verificare best practices rate limiting Python serverless
T1 sa cerceteze: cum se implementeaza rate limiting simplu in Python serverless pe Render, fara Redis? (dictionar in memorie, sau fisier, sau header-based)
**Motiv**: S2 (protectie abuz) necesita o abordare potrivita pentru arhitectura actuala.

---

## Verificare implementare (dupa executie)

### Faza 1
- [ ] Convertorul functioneaza pe Render (cel putin MD->HTML)
- [ ] Ecranul "Se incarca..." apare la cold start
- [ ] Ecranul dispare automat cand serverul raspunde
- [ ] Ecranul arata un mesaj clar daca serverul nu raspunde dupa 120s

### Faza 2
- [ ] translate.py are sub 200 linii
- [ ] Traducere pagina JPEG functioneaza identic cu inainte de refactorizare
- [ ] Figuri decupate din original (nu SVG generat) — vizual comparabil cu Exemplu_BUN.html
- [ ] Figuri corecte si din PDF (nu doar din JPEG) — daca S1 e integrat
- [ ] Contor DeepL vizibil si arata valorile reale
- [ ] Fallback Gemini functioneaza cand DeepL e epuizat
- [ ] CORS restrictionat la domeniul Render
- [ ] Next.js actualizat (fara CVEs critice)
- [ ] Rate limiting activ — daca S2 e integrat
- [ ] Test pe telefon Android: upload + vizualizare + switch limba

---

## Text gata de copiat catre T1 (ACTUALIZAT cu raspunsuri Roland)

> **De la T2 (Runda 1)** — Roland a confirmat raspunsurile. Iata ce trebuie integrat in plan:
>
> **3 probleme critice — TOATE CONFIRMATE:**
> 1. **PDF crop figuri** (CRITIC): `figure_crop.py` lucreaza doar cu imagini. PDF-urile trebuie convertite in imagini mai intai. Lipseste `PyMuPDF` sau `pdf2image` din requirements.txt. Roland nu poate estima frecventa PDF vs JPEG, deci trebuie suportat. Adauga task in Sprint 2.2: instalare PyMuPDF + conversie PDF pages to images inainte de crop.
> 2. **Rate limiting zero** (CRITIC): Oricine gaseste URL-ul poate epuiza cota DeepL/Gemini. Adauga rate limiting simplu (10 req/min per IP) in Sprint 2.3.
> 3. **Cache traduceri persistent** (CONFIRMAT de Roland): Traducerile sa se salveze in localStorage (nu doar in sesiune). Adauga task in Sprint 2.4: salvare traduceri localStorage, limita ~5 MB, curatare automata cele mai vechi.
>
> **4 sugestii importante**: commit snapshot pre-refactorizare (Sprint 2.1), test mobil Android (Sprint 2.5), timeout 120s + mesaj retry pe ecran incarcare (Sprint 1.2), Gemini quota planning pt Chat AI (Faza 4).
>
> **4 scenarii neacoperite**: bbox gresit de la Gemini (validare + placeholder), ambele chei DeepL epuizate (test fallback Gemini end-to-end), PDF mare >20 pag (procesare in loturi), DOCX cu imagini (clarificare flow).
>
> **Cercetare necesara (MCP)**: PyMuPDF vs pdf2image pe Render, rate limiting fara Redis in Python serverless.
>
> **Offline**: Roland a confirmat ca NU e prioritar (are mereu internet). S8 ramane optional.
>
> Feedback complet in `99_Plan_vs_Audit/AUDIT_FEEDBACK.md`.

---
---

# AUDIT FEEDBACK — Runda 2
# Data: 2026-03-26 | Sursa: PLAN_v3.md actualizat + PLAN_DECISIONS.md Runda 4 + cercetari MCP
# Status: [INTEGRAT] — T1 a integrat S10-S13 + S14-S15 + I4/I5 in PLAN_v3.md (2026-03-26)

---

## Rezumat

T1 a integrat excelent TOATE sugestiile din Runda 1: cele 3 critice, cele 4 importante, cele 4 scenarii, cercetarile MCP (PyMuPDF confirmat, sliding window confirmat). Planul e acum mult mai robust. In Runda 2 am gasit 0 probleme critice, 4 sugestii importante si 3 optionale — sunt detalii de finisare, nu blocaje.

---

## Sugestii CRITICE (trebuie integrate)

(Niciuna — toate cele 3 din Runda 1 sunt integrate corect.)

---

## Sugestii IMPORTANTE (recomandate)

### S10: Contor DeepL — cum arata cu 2 chei?
Planul spune: "Cota luna: 234.500 / 500.000 caractere (47%)". Dar sunt 2 chei, fiecare cu 500.000 caractere.
**Intrebare**: Afisam cota per cheie separata sau combinata?
- Daca se afiseaza "234.500 / 500.000 (47%)" si Cristina crede ca s-a terminat la 100%, dar de fapt mai are o cheie intreaga — confuzie.
- Daca se afiseaza "234.500 / 1.000.000 (23%)" — mai clar, dar simplifica prea mult (cheile se consuma secvential, nu simultan).
**Recomandare** [RECOMANDAT]: Afisare combinata simpla: "234.500 / 1.000.000 caractere (23%)". In spate, codul stie ca prima cheie e epuizata si trece la a doua. Cristina nu trebuie sa stie de 2 chei — vede un singur numar. Task de clarificat in Sprint 2.4.

### S11: Cache traduceri — invalidare la update OCR
Sprint 2.2 imbunatateste OCR-ul (coordonate figuri mai bune, crop mai precis). Dar traducerile vechi din localStorage sunt bazate pe OCR-ul vechi (mai slab).
**Ce se intampla**: Cristina traduce azi un document (OCR vechi, figuri proaste). Maine, dupa update-ul Sprint 2.2, deschide iar → primeste traducerea din cache (veche, cu figuri proaste), nu noua.
**Solutie propusa**: Cache-ul sa aiba o "versiune" (un numar simplu, de ex. `v1`). Cand se face update mare la pipeline, se schimba versiunea → cache-ul vechi se ignora automat. E ca un "reset" controlat. Task mic in Sprint 2.4.

### S12: Rate limiting — acoperire toate endpoint-urile
Planul mentioneaza rate limiting pe traduceri (10 req/min). Dar site-ul are si:
- `/api/convert` (convertor fisiere)
- `/api/deepl-usage` (contor)
- Viitor: `/api/chat` (Chat AI)
**Recomandare**: Rate limiter-ul sa fie un modul comun, aplicat pe TOATE endpoint-urile API, nu doar pe traduceri. Limite diferite per endpoint (traducere: 10/min, convertor: 20/min, chat: 30/min). Implementarea e deja planificata ca modul separat (`api/lib/rate_limiter.py`) — trebuie doar specificat ca se aplica global. Task de clarificat in Sprint 2.3.

### S13: PyMuPDF DPI — task explicit de configurare
Cercetarea MCP spune "DPI 150-200 recomandat" pentru Render 512MB. Dar in plan, task-ul din Sprint 2.2 spune doar "adaugare PyMuPDF" fara a specifica DPI-ul.
**De ce conteaza**: Daca T1 foloseste DPI 300 (default in multe tutoriale), un PDF de 10 pagini consuma ~400MB RAM → crash pe Render. Cu DPI 150 consuma ~100MB → OK.
**Recomandare**: Task explicit: "Configurare PyMuPDF DPI = 150 (economie memorie). Test: PDF 10 pagini la DPI 150 → confirma memorie sub 256MB." Adaugat in Sprint 2.2.

---

## Sugestii OPTIONALE (nice to have)

### S14: Mesaje eroare in romana
Planul mentioneaza mesaje ca "Cota DeepL epuizata" si "Serverul nu raspunde" — care e bine. Dar rate limiting-ul returneaza HTTP 429 cu `Retry-After: 60`. Mesajul afisat utilizatorului trebuie sa fie in romana ("Prea multe cereri. Incearca din nou in 1 minut."), nu mesajul tehnic.
**Recomandare**: Task mic: toate mesajele de eroare aratate utilizatorului sa fie in romana, pe intelesul Cristinei.

### S15: Test mobil si la convertor (Faza 3)
Sprint 2.5 are test Android pentru traduceri — foarte bine. Dar Faza 3 (convertor) nu are niciun test pe mobil. Cristina ar putea folosi si convertorul de pe telefon.
**Recomandare**: Un task in Sprint 3.3: "Test Android: incarca PDF, converteste in Word, descarca rezultatul."

### S16: Multi-JPEG upload UX
Info.md spune "Cristina fotografiaza 5 pagini de manual". Planul testeaza "5 pagini" dar nu precizeaza: sunt 5 JPEG-uri separate uploadate simultan, sau un PDF de 5 pagini?
**Recomandare**: Clarificare in plan: daca Cristina selecteaza 5 poze JPEG dintr-o data, se proceseaza ca 5 pagini ale aceluiasi document (concatenate) sau ca 5 documente separate? Asta afecteaza UX-ul si cache-ul.

---

## Scenarii neacoperite

### SC5: Render build time cu PyMuPDF
PyMuPDF e ~20 MB. Pe Render free tier, build-urile au limita de timp (probabil 15-30 minute, dar trebuie verificat).
**Ce se intampla**: Daca build-ul dureaza prea mult, deploy-ul esueaza.
**Solutie propusa**: Probabil OK (pip install PyMuPDF dureaza ~30 sec), dar T1 sa verifice la primul deploy dupa adaugare. Daca e lent, se poate folosi un cache pip.

---

## Intrebari pentru Roland

### I4: Contor DeepL — numar simplu sau detaliat?
**Raspuns Roland**: A — simplu, un singur numar.
**Concluzie**: Afisare "23% folosit din 1.000.000 caractere". Fara mentiune de 2 chei. T1 combina cota ambelor chei in endpoint-ul `/api/deepl-usage`.

### I5: Cand Cristina incarca 5 poze de manual — le vrea ca 1 document sau 5 separate?
**Raspuns Roland**: A — 1 document cu 5 pagini.
**Concluzie**: Multi-upload JPEG = concatenare automata intr-un singur document. Ordinea: dupa numele fisierului sau ordinea selectiei. Traducerea si cache-ul se aplica pe documentul combinat.

---

## Cerinte MCP pentru T1

(Niciuna in aceasta runda — cercetarile anterioare sunt suficiente.)

---

## Verificare implementare (actualizata)

### Faza 1
- [ ] Convertorul functioneaza pe Render (cel putin MD->HTML)
- [ ] Ecranul "Se incarca..." apare la cold start
- [ ] Ecranul dispare automat cand serverul raspunde
- [ ] Ecranul arata mesaj clar daca serverul nu raspunde dupa 120s
- [ ] Mesajul de eroare e in romana, pe intelesul Cristinei

### Faza 2
- [ ] translate.py are sub 200 linii
- [ ] Traducere pagina JPEG functioneaza identic cu inainte de refactorizare
- [ ] Figuri decupate din original — vizual comparabil cu Exemplu_BUN.html
- [ ] Figuri corecte si din PDF (via PyMuPDF, DPI 150)
- [ ] PyMuPDF DPI configurat la 150, test memorie < 256MB pe 10 pagini
- [ ] Contor DeepL vizibil — numar combinat (2 chei afisate ca 1)
- [ ] Cache traduceri persistent in localStorage
- [ ] Cache are versiune (se invalideaza la update pipeline major)
- [ ] Fallback Gemini functioneaza end-to-end cand DeepL e epuizat
- [ ] CORS restrictionat la domeniul Render
- [ ] Next.js actualizat (fara CVEs critice)
- [ ] Rate limiting activ pe TOATE endpoint-urile (nu doar traduceri)
- [ ] Mesaje eroare rate limiting in romana
- [ ] Test pe telefon Android: upload + vizualizare + switch limba

---

## Text gata de copiat catre T1 (Runda 2)

> **De la T2 (Runda 2)**: Planul actualizat e mult mai solid. 0 probleme critice. 4 detalii importante de finisat:
>
> 1. **Contor DeepL cu 2 chei** (S10): Afiseaza numar combinat simplu ("23% din 1.000.000"), nu per cheie. Cristina nu trebuie sa stie de 2 chei. Clarifica in Sprint 2.4.
> 2. **Cache versioning** (S11): Cache localStorage sa aiba versiune. Cand se face update mare la pipeline (Sprint 2.2), cache-ul vechi se invalideaza automat. Altfel Cristina primeste traduceri vechi dupa update. Task mic in Sprint 2.4.
> 3. **Rate limiting global** (S12): Aplica rate_limiter.py pe TOATE endpoint-urile (/api/convert, /api/deepl-usage, viitor /api/chat), nu doar pe /api/translate. Limite diferite per endpoint. Clarifica in Sprint 2.3.
> 4. **PyMuPDF DPI explicit** (S13): Seteaza DPI = 150 (nu default). DPI 300 consuma 4x mai multa memorie si poate face crash pe Render 512MB. Task explicit in Sprint 2.2.
>
> **3 optionale**: mesaje eroare in romana, test mobil convertor (Faza 3), clarificare multi-JPEG upload.
>
> **Raspunsuri Roland (I4, I5):**
> - I4: Contor simplu — un singur numar combinat ("23% din 1.000.000"). Fara mentiune de chei.
> - I5: Multi-upload JPEG = 1 document combinat (5 poze → 1 document cu 5 pagini, tradus si cached ca un tot).
>
> Feedback complet in `99_Plan_vs_Audit/AUDIT_FEEDBACK.md`.

---
---

# AUDIT FEEDBACK — Runda 3 (finala)
# Data: 2026-03-26 | Sursa: PLAN_v3.md + PLAN_DECISIONS.md (Runda 5) — dupa integrare completa Runda 1+2
# Status: [INTEGRAT] — S17 (multi-JPEG task) adaugat in Sprint 2.5, S18 (exemplu contor) corectat

---

## Rezumat

T1 a integrat excelent TOATE sugestiile din Runda 1 si Runda 2. Planul contine acum 21 decizii, 21 cerinte confirmate, ~70 task-uri. Am gasit 0 critice, 1 problema importanta (task de implementare lipsa), si 1 inconsistenta minora. Planul e gata de executie dupa aceste 2 corectii.

---

## Sugestii CRITICE

(Niciuna.)

---

## Sugestii IMPORTANTE

### S17: Multi-JPEG upload — scenariu documentat dar task de implementare LIPSA
Roland a confirmat (I5, D21): cand Cristina incarca 5 poze JPEG, se combina automat intr-un document cu 5 pagini. Scenariul e descris frumos in plan (sectiunea "Multi-JPEG upload"), dar:
**Problema**: In niciun sprint nu exista un task care sa implementeze concatenarea. Cine construieste logica "5 JPEG-uri → 1 document"? Unde se face combinarea — in frontend (inainte de upload) sau in backend (dupa upload)?
**Impact daca nu se rezolva**: Scenariul e promis dar nu se va construi. Cristina incarca 5 poze si fiecare se proceseaza separat.
**Recomandare** [RECOMANDAT]: Adauga task in Sprint 2.2 sau 2.5:
- Frontend: cand se selecteaza mai multe imagini, le trimite pe toate intr-un singur request (FormData cu mai multe fisiere)
- Backend: `pipeline.py` primeste lista de imagini, le proceseaza ca pagini ale aceluiasi document, returneaza un singur HTML cu toate paginile
- Test: upload 3 poze JPEG → primeste 1 document cu 3 pagini traduse

### S18: Inconsistenta contor DeepL in exemplu
In sectiunea "Exemple de utilizare" Faza 2 (linia 260 din plan), scrie:
> "Cota DeepL: 12.340 / 500.000 caractere (2%)"
Dar decizia D17 spune: numar combinat, 1.000.000 total.
**Fix**: Schimba in "Cota DeepL: 12.340 / 1.000.000 caractere (1%)". Corectie mica, dar exemplele trebuie sa fie consistente cu deciziile.

---

## Sugestii OPTIONALE

(Niciuna noua — cele din Runda 2 sunt integrate sau amanate.)

---

## Scenarii neacoperite

(Niciuna noua.)

---

## Intrebari pentru Roland

(Niciuna — toate intrebarile din Runda 1 si 2 au primit raspuns.)

---

## Evaluare generala plan — GATA DE EXECUTIE

| Criteriu | Evaluare |
|----------|----------|
| **Completitudine** | 95% — doar multi-JPEG task lipsa |
| **Corectitudine** | 100% — toate deciziile tehnice corecte si cercetate |
| **Scenarii acoperite** | 95% — 6 scenarii documentate cu solutii |
| **Limite R14** | 100% — MINIM/TIPIC/MAXIM documentat per modul |
| **Extensibilitate** | 100% — module separate, tab-uri dinamice, config extensibil |
| **Riscuri** | Gestionate — rollback, fallback, rate limiting, DPI controlat |
| **Costuri** | 100% gratuit — verificat per serviciu |
| **Monitorizare** | 90% — contor DeepL, loguri existente, rate limiter |

**Concluzia mea: Planul e gata de executie.** Dupa corectia S17 (task multi-JPEG) si S18 (exemplu contor), T1 poate incepe Faza 1 fara blocaje.

---

## Verificare implementare (lista finala completa)

### Faza 1
- [ ] Convertorul functioneaza pe Render (cel putin MD->HTML)
- [ ] Ecranul "Se incarca..." apare la cold start
- [ ] Ecranul dispare automat cand serverul raspunde
- [ ] Ecranul arata mesaj clar in romana daca serverul nu raspunde dupa 120s
- [ ] 99_Plan_vs_Audit/ si 99_Blueprints/ comise in git

### Faza 2
- [ ] translate.py are sub 200 linii
- [ ] Traducere pagina JPEG functioneaza identic dupa refactorizare
- [ ] Figuri decupate din original — vizual comparabil cu Exemplu_BUN.html
- [ ] Figuri corecte si din PDF (via PyMuPDF, DPI 150)
- [ ] PyMuPDF DPI configurat la 150, memorie < 256MB pe 10 pagini
- [ ] Multi-JPEG upload → 1 document combinat (D21)
- [ ] Contor DeepL vizibil — numar combinat simplu (1.000.000 total)
- [ ] Cache traduceri persistent in localStorage (~5 MB)
- [ ] Cache are versiune (invalidare la update pipeline)
- [ ] Fallback Gemini functioneaza end-to-end cand DeepL e epuizat
- [ ] Mesaj clar in romana la fallback ("se foloseste traducerea alternativa")
- [ ] CORS restrictionat la domeniul Render
- [ ] Next.js actualizat (fara CVEs critice)
- [ ] Rate limiting activ pe TOATE endpoint-urile (limite diferite per tip)
- [ ] Mesaje eroare rate limiting in romana
- [ ] Test pe telefon Android: upload + vizualizare + switch limba
- [ ] Test PDF mare 25 pagini: procesare in loturi cu mesaj vizibil

### Faza 3
- [ ] Toate 10 tipuri de conversie functioneaza
- [ ] Diacritice RO+SK corecte in PDF generat
- [ ] Operatii PDF avansate (merge, split, compress, rotate, watermark)
- [ ] Test pe telefon Android: conversie PDF→Word

---

## Text gata de copiat catre T1 (Runda 3 — finala)

> **De la T2 (Runda 3 — FINALA)**: Plan verificat complet. 0 critice. 2 corectii mici:
>
> 1. **Multi-JPEG task lipsa** (S17): Scenariul "5 poze = 1 document" e descris dar NICIUN sprint nu il implementeaza. Adauga task in Sprint 2.2 sau 2.5: frontend trimite mai multe imagini intr-un request, backend le combina intr-un document cu N pagini. Test: upload 3 JPEG-uri → 1 document cu 3 pagini.
> 2. **Exemplu contor gresit** (S18): Exemplul din Faza 2 spune "12.340 / 500.000" dar D17 spune combinat 1.000.000. Corecteaza la "12.340 / 1.000.000 caractere (1%)".
>
> **Evaluare**: Plan gata de executie. Dupa aceste 2 corectii, T1 poate incepe Faza 1.
>
> Feedback complet in `99_Plan_vs_Audit/AUDIT_FEEDBACK.md`.

---
---

# AUDIT FEEDBACK — Runda 4 (verificare executie)
# Data: 2026-03-26 | Sursa: PLAN_v3.md (Sprint 1.1+1.2 completate) + cod sursa verificat
# Status: NOU

---

## Rezumat

T1 a executat Sprint 1.1 si Sprint 1.2 din Faza 1. Am verificat codul implementat contra cerintelor din plan. **Totul e corect.** Sprint 1.3 (curatenie) ramane de executat. Am gasit 0 probleme in cod, doar 2 observatii administrative.

---

## Verificare Sprint 1.1: Fix convertor — CONFIRMAT

| Task | Plan | Cod | Verdict |
|------|------|-----|---------|
| Fix import os | Adauga `import os` in convert.py | Prezent la linia 12 | OK |
| Test MINIM (MD→HTML) | HTTP 200, output corect | Confirmat de T1 | OK |
| Test TIPIC (3 tipuri) | MD→HTML, JPEG→PDF, PDF→DOCX | Toate OK, diacritice corecte | OK |
| Test MAXIM (operatii) | Split, Compress, Rotate, Watermark | Toate OK | OK |

Commit: `af0b40b` — pushed.

---

## Verificare Sprint 1.2: Ecran "Se incarca..." — CONFIRMAT

Componenta: `frontend/src/components/layout/ServerWakeup.tsx` (109 linii)

| Cerinta | Implementare | Verdict |
|---------|--------------|---------|
| Poll /api/health la 3 secunde | `POLL_INTERVAL_MS = 3_000` + `setTimeout` | OK |
| Design tabla verde + animatie | `radial-gradient #2d5016→#1a3009` + 3 puncte galben-creta animate | OK |
| Mesaj in romana | "Se pregateste aplicatia..." | OK |
| Dispare automat la raspuns server | `if (res.ok) setStatus("ready")` | OK |
| Timeout 120 secunde | `TIMEOUT_MS = 120_000` | OK |
| Mesaj eroare + retry in romana | "Serverul nu raspunde momentan" + buton "Incearca din nou" | OK |

Bonus: fix `BatchPanel.tsx` — logError() avea semnatura gresita, acum corecta.

Commit: `0149df0` — pushed.

---

## Criterii de acceptare Faza 1 — verificare

| Criteriu | Status |
|----------|--------|
| Cristina poate converti PDF↔Word pe site-ul live | PASS (Sprint 1.1 test TIPIC) |
| Ecran frumos la prima accesare (nu pagina goala) | PASS (ServerWakeup cu tema tabla) |
| Dupa 30-60 sec, aplicatia se incarca normal | PASS (auto-dismiss la raspuns server) |
| Mesaj clar + retry daca serverul nu raspunde dupa 120s | PASS (verificat in cod) |

**Faza 1 completare reala: ~66%** (Sprint 1.1 + 1.2 gata, Sprint 1.3 ramas)

---

## Observatii administrative

### O1: Plan metadata neactualizat
PLAN_v3.md inca spune:
- Linia 2: `Status: IN PLANIFICARE` — ar trebui `IN EXECUTIE`
- Linia 4: `Completare: 0%` — ar trebui `~15%` (Faza 1 partial completa)
- Faza 1 header: `Completare: 0%` — ar trebui `~66%`
**Recomandare**: T1 sa actualizeze metadata planului dupa fiecare sprint completat. Tracking-ul pierde valoare daca nu reflecta realitatea.

### O2: RUNDA_CURENTA.md stale
Inca spune "Gata de executie — T1 asteapta confirmarea lui Roland pentru Sprint 1.1". Dar Sprint 1.1 si 1.2 sunt deja completate.
**Recomandare**: T1 sa actualizeze la: "Faza 1 in executie — Sprint 1.1+1.2 completate, Sprint 1.3 urmeaza."

---

## Sugestii CRITICE

(Niciuna.)

---

## Sugestii IMPORTANTE

(Niciuna — implementarea e corecta.)

---

## Intrebari pentru Roland

(Niciuna.)

---

## Text gata de copiat catre T1 (Runda 4 — verificare executie)

> **De la T2 (Runda 4 — VERIFICARE)**: Am verificat codul Sprint 1.1 si 1.2 contra planului. **Totul e corect:**
>
> - Sprint 1.1: `import os` prezent, toate 4 niveluri de test trecute. OK.
> - Sprint 1.2: ServerWakeup.tsx — 109 linii, toate 6 cerinte implementate corect (poll 3s, tema tabla, timeout 120s, mesaje romana, retry). OK.
> - Bonus: fix BatchPanel logError() — corect.
> - Criterii acceptare Faza 1: 4/4 PASS.
>
> **2 observatii administrative:**
> 1. Actualizeaza metadata plan: status "IN EXECUTIE", completare ~15%, Faza 1 ~66%.
> 2. Actualizeaza RUNDA_CURENTA.md cu starea reala (Sprint 1.1+1.2 gata).
>
> Sprint 1.3 (curatenie) ramane. Dupa el, Faza 1 e 100% si se poate trece la Faza 2.
>
> Feedback complet in `99_Plan_vs_Audit/AUDIT_FEEDBACK.md`.

---
---

# AUDIT FEEDBACK — Runda 5 (verificare executie Faza 1+2)
# Data: 2026-03-26 | Sursa: PLAN_v3.md + cod sursa verificat prin agent
# Status: NOU

---

## Rezumat

T1 a executat un volum impresionant: **Faza 1 completa (100%) + Faza 2 la 95%** intr-o singura sesiune. Am verificat codul implementat linie cu linie. Calitatea implementarii e foarte buna. Am gasit 1 problema importanta (criteriu plan neindeplinit), 1 observatie tehnica de verificat, si cateva elemente ramase.

---

## Verificare Sprint 1.3 (Curatenie) — NOU, COMPLETAT

| Task | Status | Detalii |
|------|--------|---------|
| 99_Plan_vs_Audit/ in git | OK | Commit af0b40b |
| Vercel dezactivat | OK | `vercel git disconnect` via CLI |
| CLAUDE.md actualizat v3.0 | OK | Status, stack, key files, 6 module |
| CHECKPOINT.md actualizat | OK | Sesiune 2026-03-26 |
| Commit + Push | OK | ec04023, Render deploy OK |

**Faza 1: 100% COMPLETA.** Toate 3 sprinturi executate si verificate.

---

## Verificare Sprint 2.1 (Refactorizare) — VERIFICAT

| Element | Plan | Implementare | Verdict |
|---------|------|--------------|---------|
| Snapshot pre-refactorizare | Commit siguranta | cbbe712 | OK |
| html_builder.py | Modul HTML A4 | 304 linii, build_html + MathJax + figuri perechi | OK |
| translation_router.py | Modul rutare | 482 linii, DeepL + Gemini + Groq + Claude + DOCX | OK |
| pipeline.py | Modul orchestrare | **[-] ANULAT** — orchestrarea ramane in translate.py | DEVIERE (vezi S19) |
| translate.py simplificat | "sub 200 linii" | **450 linii** (de la 1444) | CRITERIU NEINDEPLINIT (vezi S19) |
| Test 1 pagina | Pe Render live | Success, 37.6s | OK |
| Test 2 pagini | Pe Render live | Success, 93s | OK |

---

## Verificare Sprint 2.2 (Calitate figuri) — VERIFICAT

| Element | Plan | Implementare | Verdict |
|---------|------|--------------|---------|
| OCR bbox prompt | Coordonate x,y,w,h | Gemini returneaza fractii 0-1 | OK |
| Validare bbox (SC1) | Placeholder la invalid | _validate_bbox() + placeholder | OK |
| Crop + fundal alb | Pillow background removal | Din colturi, toleranta 40px | OK |
| Pozitionare in HTML | La locul original | In fluxul documentului | OK |
| Figuri perechi | P1+P2 side-by-side | html_builder.py liniile 147-172 | OK |
| PyMuPDF DPI 150 | D20 obligatoriu | `dpi: int = 150` linia 53 | OK |
| Test MINIM (1 JPEG) | 1 triunghi | 6 figuri crop, 47.7s | OK |
| Test TIPIC (2 JPEG) | Formule + figuri | 12 figuri, 78s | OK |
| Test PDF | PyMuPDF | 2 figuri crop, 34.9s | OK |
| Test MAXIM (10 PDF) | Procesare loturi | **NEIMPLEMENTAT** | RAMAS |

---

## Verificare Sprint 2.3 (Securitate) — VERIFICAT

| Element | Implementare | Verdict |
|---------|--------------|---------|
| InlineEditor sanitize | sanitizeHtml() activ | OK |
| CORS | ALLOWED_ORIGIN pe toate endpoint-urile | OK |
| Headere securitate | X-Frame-Options, X-Content-Type-Options, Referrer-Policy | OK |
| Next.js | 14.2.35 (ultima 14.x) | OK |
| Rate limiter | sliding window, threading.Lock, X-Forwarded-For, 6 endpoint-uri | OK |
| Mesaje romana | "Prea multe cereri..." + "Limita zilnica atinsa." | OK |

---

## Verificare Sprint 2.4 (Contor + Cache) — VERIFICAT

| Element | Implementare | Verdict |
|---------|--------------|---------|
| /api/deepl-usage | Combina 2 chei, total 1M, warning levels (90%/70%) | OK (D17) |
| DeeplUsage.tsx | Bara vizuala verde/galben/rosu, refresh 60s | OK |
| Test live | 16.115 / 1.000.000 (1.6%), ~728 pagini | OK |
| Cache localStorage | Max 50 entries, evict oldest | OK (D13) |
| Cache versioning | v2, invalidare automata la mismatch | OK (D18) |
| Integrare page.tsx | Check cache inainte de API + save dupa | OK |
| Fallback DeepL→Gemini | **NETESTAT** end-to-end | RAMAS |

---

## Verificare Sprint 2.5 (Teste finale) — VERIFICAT

| Element | Implementare | Verdict |
|---------|--------------|---------|
| Deploy Render | d391b9c, OK | OK |
| Test JPEG live | 6 figuri crop, 70s | OK |
| Test PDF live | 1 fig crop, 24.5s | OK |
| Multi-JPEG (S17) | 2 JPEG → 1 doc, 10 figuri, 97s | OK (D21) |
| Test Android | **Roland verifica** | RAMAS |
| PDF >20 pag batching | **NEIMPLEMENTAT** | RAMAS (D16) |
| DeepL usage live | 16.115/1M, OK | OK |

---

## Sugestii CRITICE

(Niciuna.)

---

## Sugestii IMPORTANTE

### S19: translate.py la 450 linii — criteriu plan "sub 200" neindeplinit
**Ce spune planul**: "translate.py redus la sub 200 linii (restul in module separate)" — criteriu de acceptare Faza 2.
**Ce exista in realitate**: 450 linii (reducere de la 1444, deci -69%).
**De ce**: pipeline.py a fost anulat ([-]) — orchestrarea ramane in translate.py. Decizia e logica (mai putin risc), dar criteriul de acceptare nu a fost actualizat.
**Impact**: Nu e o problema de calitate — codul e bine structurat. Dar "sursa unica de adevar" spune una si realitatea spune alta.
**Recomandare**: T1 sa actualizeze criteriul la "translate.py redus la sub 500 linii" sau "reducere >60% fata de original (1444)". Reflect realitatea, nu mentine un criteriu neindeplinit.

### S20: Rate limiter — verificare ca functioneaza pe Render in productie
**Ce am gasit**: rate_limiter.py e integrat in `dev_server.py` (care ruteaza toate POST-urile). Dar pe Render, API-ul ruleaza prin acelasi dev_server.py sau prin handler-e serverless separate?
**De ce conteaza**: Daca Render foloseste dev_server.py ca web server → rate limiting e activ in productie. Daca Render ruleaza fiecare fisier api/*.py ca functie separata → rate limiting nu e activ.
**Recomandare**: T1 sa confirme: care e entry point-ul pe Render? Daca e dev_server.py, totul e OK. Daca nu, trebuie adaugat `is_rate_limited()` in fiecare handler individual (translate.py, convert.py, etc.).

---

## Elemente ramase din Faza 2

| Element | Responsabil | Prioritate |
|---------|-------------|------------|
| Test MAXIM PDF 10 pagini (batching loturi) | T1 | IMPORTANT — D16 neimplementat |
| Comparatie vizuala cu Exemplu_BUN.html | Roland | IMPORTANT — criteriu acceptare |
| Fallback DeepL→Gemini end-to-end | T1 (simulare) | MEDIU — SC2 |
| Test cache browser (inchide + redeschide) | Roland | MEDIU |
| Test Android | Roland | MEDIU |

---

## Criterii de acceptare Faza 2 — verificare

| Criteriu | Status | Nota |
|----------|--------|------|
| Output ca Exemplu_BUN.html | IN ASTEPTARE | Roland verifica vizual |
| Figuri din PDF via PyMuPDF | PASS | Test 1 pag PDF OK |
| translate.py sub 200 linii | **FAIL** (450) | S19: criteriu de actualizat |
| Contor DeepL vizibil | PASS | 16.115/1M, bara vizuala |
| Cache persistent | PASS | localStorage, 50 entries, v2 |
| Rate limiting activ | **PARTIAL** | S20: de verificat pe Render |
| Zero CVEs critice | PASS | Next.js 14.2.35 |
| Fallback Gemini end-to-end | IN ASTEPTARE | Necesita test |
| Test Android | IN ASTEPTARE | Roland |

**Scor: 5 PASS, 1 FAIL (criteriu), 1 PARTIAL, 3 IN ASTEPTARE**

---

## Observatii administrative

### O3: Plan metadata INCA neactualizat la header
Linia 2: `Status: IN PLANIFICARE` si linia 4: `Completare: 0%` — dar realitatea e Faza 1 100% + Faza 2 95%.
Faza 1 si 2 au "Completare" corect actualizat (100% si 95%), dar header-ul global nu.

### O4: RUNDA_CURENTA.md arata Sprint 1.3 IN CURS dar e COMPLETAT
Plan-ul il arata ca COMPLETAT. RUNDA_CURENTA nu reflecta avansul real.

---

## Text gata de copiat catre T1 (Runda 5 — verificare executie)

> **De la T2 (Runda 5 — VERIFICARE EXECUTIE)**: Am verificat codul Faza 1 + Faza 2 complet. Calitatea e excelenta — implementare corecta pe toata linia.
>
> **Scor criterii Faza 2: 5 PASS / 1 FAIL / 1 PARTIAL / 3 IN ASTEPTARE**
>
> **2 sugestii importante:**
> 1. **translate.py la 450 linii** (S19): Criteriul plan spune "sub 200" dar realitatea e 450 (pipeline.py anulat). Codul e bine structurat, reducere 69% — doar actualizeaza criteriul sa reflecte realitatea ("sub 500" sau "reducere >60%").
> 2. **Rate limiter pe Render** (S20): E integrat in dev_server.py. Confirma ca dev_server.py e entry point-ul pe Render. Daca da → OK. Daca nu → trebuie adaugat in fiecare handler.
>
> **5 elemente ramase:** PDF batching >20 pag (D16), comparatie vizuala Exemplu_BUN (Roland), fallback DeepL→Gemini test, cache browser test (Roland), test Android (Roland).
>
> **Admin:** Header plan inca spune "IN PLANIFICARE / 0%" — actualizeaza la "IN EXECUTIE / ~50%".
>
> Feedback complet in `99_Plan_vs_Audit/AUDIT_FEEDBACK.md`.

---
---

# AUDIT FEEDBACK — Runda 6 (verificare corectii)
# Data: 2026-03-26 | Sursa: RUNDA_CURENTA.md (7 actiuni) + cod + PLAN_v3.md + PLAN_DECISIONS.md
# Status: NOU

---

## Rezumat

T3 (orchestrator) a identificat 5 inconsistente in plan si a cerut 7 corectii. T1 le-a executat pe toate. Am verificat fiecare. **Totul e corect.** translate.py a scazut de la 450 la 334 linii (reducere 77% fata de original).

---

## Verificare cele 7 actiuni din RUNDA_CURENTA.md

| # | Actiune | Status | Dovada |
|---|---------|--------|--------|
| 1 | Criteriu translate.py rescris | OK | Plan linia 239: ">60% reducere fata de original (1444 -> sub 500)" |
| 2 | pipeline.py marcat anulat | OK | Plan linia 159: "[-] ANULAT" |
| 3 | Sprint 2.4 + 2.5 statusuri corectate | OK | Sprint 2.4: "PARTIAL", Sprint 2.5: "PARTIAL", Faza 2: "90%" |
| 4 | Fallback-uri inline sterse din translate.py | OK | 450 → 334 linii. Linia 43-44: import direct (fara try/except) |
| 5 | D22 adaugata | OK | PLAN_DECISIONS.md: rate limiter pe Render via dev_server.py startCommand |
| 6 | R19 citita | OK | Aplicata de T1 |
| 7 | Commit + push | OK | Commit 5b66378, pushed |

---

## Verificare translate.py dupa stergere fallback-uri

| Metrica | Inainte | Acum | Evaluare |
|---------|---------|------|----------|
| Linii totale | 450 | **334** | Reducere 77% fata de original (1444) |
| Cod duplicat | 106 linii (OCR + crop fallback) | **0** | Eliminat complet |
| Import lib/ | Optional (try/except) | **Obligatoriu** (direct) | Corect — lib/ e mereu disponibil pe Render |
| DeepL import | Optional (try/except) | **Optional** (try/except) | Corect — cheia poate lipsi |

Structura curenta translate.py (334 linii):
- Importuri + setup: ~45 linii
- PDF→imagini (PyMuPDF DPI 150): 31 linii
- Utilitare (log, protect_math): 41 linii
- Multipart parser: 7 linii
- Handler do_POST (orchestrare): ~150 linii
- Helper _send_json + _parse_multipart: ~60 linii

**Verdict: Cod curat, fara duplicari, fiecare bucata are un scop clar.**

---

## Stare actuala proiect

| Faza | Status | Completare |
|------|--------|------------|
| Faza 1 | COMPLETA | 100% |
| Faza 2 | IN CURS | 90% — 4 taskuri ramase |
| Faza 3-6 | NEINCEPUTE | 0% |

**4 task-uri ramase Faza 2:**
1. Test MAXIM PDF 10 pagini + batching (T1)
2. Comparatie vizuala Exemplu_BUN.html (Roland)
3. Fallback DeepL→Gemini end-to-end (T1)
4. Test Android (Roland)

---

## Text gata de copiat catre T1 (Runda 6)

> **De la T2 (Runda 6 — VERIFICARE CORECTII)**: Toate 7 corectii executate corect.
> translate.py: 450 → 334 linii (fallback-uri sterse, importuri directe). Reducere 77% fata de original.
> Plan corectat: criteriu actualizat, pipeline.py anulat, sprint-uri corectate, D22 adaugata.
> Commit 5b66378 pushed. **0 probleme.** Faza 2 la 90% — 4 task-uri ramase.

---
---

# AUDIT FEEDBACK — Runda 7 (audit major post-schimbare directie)
# Data: 2026-03-27 | Sursa: PLAN_v3.md + PLAN_DECISIONS.md + ORCHESTRATOR_STATUS.md + RUNDA_CURENTA.md + cod sursa verificat + screenshots v2/v3/Exemplu_BUN
# Status: [INTEGRAT] — T1 a implementat fix SVG (D28-D32) pe 2026-04-04

---

## Rezumat

**Audit major.** S-au schimbat decizii fundamentale (D3 figuri SVG in loc de crop, D23-D27 flow nou) dar codul de productie NU a fost actualizat inca. Exista o ruptura critica intre ce spun deciziile si ce face codul. v3 test e un progres bun (SVG frumos, CSS corect, MathJax OK) dar ii lipseste ~60% din continutul paginii. Am gasit **3 probleme CRITICE**, **5 IMPORTANTE** si **2 scenarii neacoperite**. Faza 2 completare reala: **~55%** (nu 90% cum spune planul).

---

## Sugestii CRITICE (trebuie rezolvate inainte de a continua)

### S21: Codul de productie contrazice deciziile D3/D24-D27

**Ce spun deciziile (PLAN_v3.md):**
- D3 (actualizat 2026-03-27): Figuri SVG generat de Gemini (ca Exemplu_BUN.html), NU crop din original
- D24: Cauza root figuri lipsa = prompt-ul OCR interzicea SVG (linia 54)
- D26: Gemini genereaza si figurile SVG inline
- D27: Prompt-ul OCR trebuie sa ceara SVG inline + text structurat

**Ce face codul de productie ACUM:**
- `ocr_structured.py` linia 54: **"Do NOT generate SVG — just provide the bounding box coordinates"** — EXACT opusul a ce spun D3/D24/D26/D27
- `translate.py` linia 218: **apeleaza `crop_all_figures()`** — decupeaza figuri din original, nu foloseste SVG
- `figure_crop.py` (148 linii): **activ si functional** — dar D3 spune sa NU mai fie folosit

**Ce inseamna asta**: Daca cineva face acum o traducere pe site-ul live, primeste figuri crop (nu SVG). Deciziile spun SVG. Codul face crop. **Sunt in contradictie totala.**

**Ce trebuie facut (in ordine):**
1. Rescrie prompt-ul OCR: scoate "Do NOT generate SVG", adauga cerere explicita de SVG inline (ca in prompt-ul folosit pt v3 test)
2. Scoate apelul `crop_all_figures()` din translate.py
3. Adapteaza `build_html_structured()` sa primeasca SVG inline (nu base64 PNG crop)
4. Testeaza live pe Render

**Impact daca nu se rezolva**: Site-ul produce figuri crop (calitate variabila, depinde de bbox) in loc de SVG (consistent, ca in Exemplu_BUN). Cristina primeste rezultat mai slab decat ce s-a testat.

---

### S22: v3 test — continut incomplet (FIX 1 din RUNDA_CURENTA nerezolvat)

**Ce ar trebui sa contina pagina** (verificat contra test_page_1.jpeg si Exemplu_BUN):
- Titlu "Tema 5.3 — Construcția triunghiurilor"
- Paragraf introductiv ("Orice triunghi are sase elemente masurabile...")
- Prima sectiune de constructie (S.U.S. sau echivalent) cu P1-P4 + 4 figuri SVG
- Observatie intermediara
- A doua sectiune de constructie (L.L.L.) cu P1-P4 + 4 figuri SVG
- 2 observatii finale
- **Total asteptat: ~15-20 elemente, 8 figuri SVG, 2 pagini A4**

**Ce contine v3 ACUM** (verificat in HTML si screenshot):
- Incepe direct de la P3 al primei sectiuni (lipseste totul dinainte)
- Are sectiunea L.L.L. completa cu P1-P4 + 4 figuri SVG
- Are 2 observatii finale
- **Total: ~10 elemente, 6 figuri SVG, 1 pagina A4**

**Lipseste**: titlul, intro, prima jumatate a primei sectiuni (~60% din continut). Exact problema semnalata in RUNDA_CURENTA FIX 1.

**Cauza probabila**: Gemini trunchiaza output-ul (limita de tokeni pe raspuns). Cu SVG inline, output-ul e mult mai mare decat cu bbox coordonate. Riscul de truncare creste.

**Ce trebuie facut**: Exact ce spune RUNDA_CURENTA — prompt mai agresiv cu "Extract ALL content from TOP to BOTTOM" + posibil procesare in 2 apeluri daca Gemini nu incape intr-un singur raspuns.

---

### S23: Faza 2 completare supraevaluata (90% → ~55%)

**De ce 90% e gresit:**

| Element | Inainte de D3 | Dupa D3 | Status real |
|---------|--------------|---------|-------------|
| Sprint 2.1 (refactorizare) | 100% | 100% | OK — nu depinde de tip figuri |
| Sprint 2.2 (calitate figuri) | ~80% | **~20%** | Toata munca de crop (bbox, figure_crop.py, PyMuPDF crop) devine inutila. Trebuie reimplementat cu SVG |
| Sprint 2.3 (securitate) | 100% | 100% | OK — nu depinde de figuri |
| Sprint 2.4 (contor + cache) | ~80% | ~80% | OK — raman aceleasi task-uri |
| Sprint 2.5 (teste) | ~60% | **~20%** | Testele vechi validau crop, trebuie refacute pt SVG |

**Calcul**: (100 + 20 + 100 + 80 + 20) / 5 = **~64%**. Cu task-urile ramase (Android, PDF batching, fallback) → **~55%**.

**Ce trebuie facut**: T1 sa actualizeze completarea Faza 2 la ~55% in plan header.

---

## Sugestii IMPORTANTE (recomandate)

### S24: figure_crop.py devine cod mort — de dezactivat explicit

Cu D3 (SVG generat), urmatoarele devin inutile:
- `api/lib/figure_crop.py` (148 linii) — functiile crop_figure() si crop_all_figures()
- Apelul `crop_all_figures()` in translate.py
- Campul `bbox` in prompt-ul OCR
- Validarea bbox (`_validate_bbox()` in ocr_structured.py)

**Recomandare**: Nu sterge inca (sa ramana ca backup daca SVG nu functioneaza bine). Dar dezactiveaza: scoate apelul din translate.py, adauga comentariu "# DEPRECATED — D3: switched to SVG". Dupa ce SVG e confirmat stabil, sterge complet.

---

### S25: Flow upload → original → traducere on-demand (D23) — neimplementat

**Ce spune D23**: Upload → se afiseaza ORIGINAL in romana → traducerea se face DOAR la click pe buton limba.

**Ce face codul ACUM**: Pipeline-ul din translate.py face si OCR si traducere la upload (in aceeasi cerere). Abia apoi frontend-ul permite switch.

**De ce conteaza**: Cristina asteapta 40-70 secunde (OCR + traducere) pana vede ceva. Cu flow-ul D23, ar vedea originalul in ~20-30 sec (doar OCR) si ar traduce doar daca vrea.

**Recomandare**: Asta e o schimbare mai mare. Prioritizeaza asa:
1. **ACUM**: Fix SVG + continut complet (S21 + S22) — astea sunt blocante
2. **DUPA**: Splitteaza pipeline-ul (OCR la upload, traducere on-demand)

Endpoint-ul `/api/translate-text` deja exista — trebuie doar sa devina calea principala in loc de a traduce la upload.

---

### S26: Paginare nefunctionala — 1 pagina A4 indiferent de continut

**Ce am vazut**: v3 pune tot continutul intr-un singur `<section class="paper">`. Pe ecran, continutul depaseste A4 si scroll-ul il afiseaza. La print, totul se comprima pe o pagina (via `fitPaperSections()` scale-down).

**Exemplu_BUN**: Are continut distribuit pe 2 pagini A4, fiecare cu `<section class="paper">`.

**De ce conteaza**: La print, continut de 2 pagini comprimat pe 1 pagina → text mic, ilizibil. Cristina printeaza documentele.

**Recomandare**: html_builder.py (sau build_v3.py) trebuie sa imparta continutul in sectiuni .paper separate cand depaseste o pagina A4. Logica: dupa N elemente (de ex. ~15-20) sau dupa anumite heading-uri → `</div></section><section class="paper"><div class="paper-content">`.

---

### S27: Risc crescut de truncare Gemini cu SVG inline

**Calcul:**
- Bbox output per figura: ~30-50 tokeni (JSON cu 4 numere)
- SVG output per figura: ~300-500 tokeni (XML complet cu linii, arce, text)
- Pagina cu 8 figuri: bbox = ~400 tokeni total, SVG = ~3500 tokeni total
- Diferenta: **~9x mai mult output**

**Ce s-a intamplat deja**: In v2 si v3, Gemini a truncat output-ul si a livrat doar 40% din pagina. Cu SVG, riscul e si mai mare.

**Recomandare**: Monitorizare tokeni output pe fiecare cerere Gemini. Daca output-ul e truncat:
- Solutia mentionata in RUNDA_CURENTA: procesare in 2 apeluri (prima jumatate + a doua jumatate)
- SAU: cere mai intai structura text (fara SVG), apoi SVG separat per sectiune
- SAU: creste `max_output_tokens` in cererea catre Gemini (daca e posibil pe plan gratuit)

---

### S28: Plan Sprint 2.2 neactualizat cu noile decizii

Sprint 2.2 inca listeaza task-uri de crop:
- "OCR prompt actualizat: Gemini returneaza bbox" → trebuie rescris: "Gemini returneaza SVG inline"
- "Crop figuri din original cu Pillow" → trebuie rescris: "figuri SVG generate de Gemini"
- "PyMuPDF adaugat + _pdf_to_images()" → ramane (conversie PDF→imagine pt OCR, nu pt crop)
- Task-urile [x] din Sprint 2.2 sunt INVALIDATE de D3

**Recomandare**: T1 sa rescrie Sprint 2.2 cu task-uri noi care reflecta D3/D27:
- [ ] Prompt OCR rescris: cere SVG inline + text complet
- [ ] html_builder.py adaptat: primeste SVG direct (nu base64 crop)
- [ ] figure_crop.py dezactivat
- [ ] Test v3 complet (toate elementele paginii)
- [ ] Paginare functionala (multi-pagina A4)

---

## Scenarii neacoperite

### SC6: Gemini genereaza SVG matematic gresit (triunghi deformat, unghiuri incorecte)

**Ce se intampla**: Cu crop din original, figurile erau IDENTICE cu manualul (garantat corecte). Cu SVG generat de Gemini, AI-ul poate gresi: proportii incorecte, unghiuri gresite, etichete lipsa, constructii geometrice simplificate.

**De ce conteaza**: Cristina e profesoara de matematica — va observa erori geometrice si nu va folosi un document cu figuri gresite. Un triunghi cu unghiuri vizual gresite e mai rau decat lipsa figurii.

**Contraargument**: Exemplu_BUN.html (generat cu SVG Gemini) arata acceptabil — deci Gemini POATE produce SVG corect.

**Solutie propusa**: Validare vizuala obligatorie de catre Cristina dupa fiecare traducere. Nu e automatizabil — e o limitare acceptata a abordarii SVG. Documenteaza in plan: "Figurile SVG sunt generate de AI si pot contine mici diferente fata de original."

### SC7: Gemini trunchiaza output pe pagini complexe cu multe figuri

**Ce se intampla**: Pagina are 8+ figuri SVG + text lung → raspunsul Gemini depaseste limita de tokeni → primeste doar partial (demonstrat in v2/v3).

**Solutie propusa**: Procesare in 2 etape:
- Etapa 1: Extrage text structurat + indicatori figuri (fara SVG complet) — output mic
- Etapa 2: Pentru fiecare figura indicata, cerere separata "genereaza SVG pentru aceasta sectiune a imaginii"
- Avantaj: fiecare cerere are output controlat
- Dezavantaj: 1 cerere OCR → N+1 cereri → consuma mai mult din cota Gemini

SAU: Creste `max_output_tokens` si verifica daca raspunsul e complet (compara numar sectiuni returnate vs asteptate).

---

## Intrebari pentru Roland

### I6: Ai verificat v3 pe ecran? Figurile SVG sunt acceptabile ca acuratete geometrica?
SVG-urile din v3 (screenshot-ul pe care l-am vazut) arata bine vizual, dar pot avea mici diferente fata de manualul original (proportii, unghiuri). Sunt OK pentru Cristina?

### I7: Esti constient de trade-off-ul crop vs SVG?
- **Crop** (abordarea veche): figurile sunt IDENTICE cu originalul (poza decupata). Calitate garantata, dar depinde de bbox precis.
- **SVG** (abordarea noua): figurile sunt GENERATE de AI. Arata curat si consistent, dar pot contine erori geometrice.
Confirmi ca preferi SVG? (Exemplu_BUN.html e standardul)

---

## Evaluare generala — stare actuala

| Criteriu | Evaluare | Nota |
|----------|----------|------|
| **Completitudine** | 60% | Sprint 2.2 invalidat de D3, task-uri de rescris |
| **Corectitudine decizii** | 85% | D3/D23-D27 sunt corecte ca directie, dar neimplementate |
| **Cod vs Plan** | **40%** | Ruptura majora — codul face crop, planul spune SVG |
| **Scenarii** | 75% | SC6 + SC7 neacoperite (truncare + calitate SVG) |
| **Limite R14** | 70% | Impact cota Gemini cu SVG neestimata |
| **Extensibilitate** | 90% | Modulele sunt separate, SVG simplifica pipeline-ul |
| **Riscuri** | **MEDIU-RIDICAT** | Truncare demonstrata, calitate SVG neverificata pe volum |
| **Costuri** | 100% | Totul gratuit |
| **Monitorizare** | 80% | Lipsa monitorizare tokeni output Gemini |

**Faza 2 completare reala: ~55%** (nu 90%)

---

## Verificare implementare (actualizata cu D3)

### Faza 2 — task-uri noi necesare
- [ ] Prompt OCR rescris: cere SVG inline (nu bbox), text complet de sus pana jos
- [ ] html_builder.py adaptat: primeste SVG direct in HTML
- [ ] figure_crop.py dezactivat (comentat sau sters)
- [ ] translate.py: scos crop_all_figures(), adaptat pt SVG
- [ ] Test v3 complet: TOATE elementele paginii (titlu + 2 sectiuni + observatii = min 15 elemente)
- [ ] Paginare functionala: continut lung se imparte pe mai multe pagini A4
- [ ] Test truncare: pagina cu 8+ figuri SVG → output Gemini complet
- [ ] Comparatie vizuala v3 vs Exemplu_BUN — Roland confirma
- [ ] Flow on-demand (D23): upload = doar OCR, traducere = la click buton limba

### Faza 2 — task-uri ramase din inainte
- [ ] Fallback DeepL→Gemini end-to-end
- [ ] Test Android
- [ ] PDF batching >20 pagini
- [ ] Cache browser test (inchide + redeschide)

---

## Text gata de copiat catre T1 (Runda 7)

> **De la T2 (Runda 7 — AUDIT MAJOR post-schimbare directie)**:
>
> **3 probleme CRITICE:**
>
> 1. **Codul contrazice deciziile** (S21): `ocr_structured.py` linia 54 INCA zice "Do NOT generate SVG" dar D3/D24-D27 spun EXACT opusul. `translate.py` INCA apeleaza `crop_all_figures()`. Site-ul LIVE produce figuri crop, nu SVG. Trebuie: rescrie prompt OCR (cere SVG inline), scoate crop_all_figures(), adapteaza html_builder.
>
> 2. **v3 incomplet** (S22): Lipseste ~60% din continut (titlu, intro, prima sectiune constructie). FIX 1 din RUNDA_CURENTA nerezolvat. Cauza: Gemini trunchiaza output-ul — cu SVG inline, riscul de truncare e ~9x mai mare decat cu bbox.
>
> 3. **Faza 2 la 55%, nu 90%** (S23): D3 invalideaza toata munca de crop din Sprint 2.2 (bbox, figure_crop.py, teste crop). Sprint 2.2 trebuie rescris cu task-uri SVG. Actualizeaza completarea.
>
> **5 sugestii importante:**
> - S24: figure_crop.py dezactivat (nu sters inca — backup)
> - S25: Flow on-demand (D23) — dupa fix SVG, nu acum
> - S26: Paginare — continut lung pe mai multe pagini A4 (nu scale-down pe 1)
> - S27: Monitorizare truncare Gemini — SVG = 9x mai multi tokeni output
> - S28: Plan Sprint 2.2 neactualizat — rescrie task-urile
>
> **2 scenarii noi:**
> - SC6: Gemini poate genera SVG matematic gresit (triunghi deformat)
> - SC7: Truncare output pe pagini complexe (deja demonstrat)
>
> **2 intrebari pentru Roland:**
> - I6: Ai vazut v3? SVG-urile sunt acceptabile ca acuratete geometrica?
> - I7: Confirmi trade-off-ul SVG (curat dar posibil inexact) vs crop (identic cu originalul)?
>
> Feedback complet in `99_Plan_vs_Audit/AUDIT_FEEDBACK.md`.

---
---

# AUDIT FEEDBACK — Runda 8 (verificare v3 + corectie audit anterior)
# Data: 2026-03-27 | Sursa: test_page_1.jpeg (original) + test_page_1_ORIGINAL_RO_v3.html + v3_screenshot.png + RUNDA_CURENTA.md actualizat
# Status: [INTEGRAT] — T1 a implementat fix SVG (D28-D32) pe 2026-04-04

---

## Rezumat

**Corectie importanta**: In Runda 7, am raportat ca v3 e incomplet (S22 — "lipseste 60% din continut"). **Am gresit.** Am verificat imaginea originala (`test_page_1.jpeg`) si T1 avea dreptate: poza de manual INCEPE cu P3 al sectiunii U.S.U. — titlul "Tema 5.3" e pe pagina anterioara a cartii, NU in aceasta poza. v3 extrage TOATE cele 15 elemente din poza originala. Calitatea e foarte buna (8.5/10).

**0 probleme critice noi.** S21 din Runda 7 ramane valida (codul de productie inca face crop, nu SVG) dar T1 are plan clar de 4 pasi. S23 corectata: Faza 2 la ~65-70% (nu 55% cum am zis).

---

## RETRACTARE — S22 din Runda 7 este GRESITA

**Ce am spus**: "Lipseste ~60% din continut (titlu, intro, prima sectiune)."
**Ce e adevarat**: Poza originala `test_page_1.jpeg` INCEPE cu P3 al sectiunii U.S.U. Titlul si sectiunea S.U.S. sunt pe pagina ANTERIOARA a manualului. v3 extrage COMPLET continutul pozei.
**Concluzie**: T1 a verificat corect. Imi cer scuze pentru eroare.

---

## Verificare v3 — element cu element contra originalului

Am comparat fiecare element din poza `test_page_1.jpeg` cu HTML-ul v3:

| # | Element din original | Prezent in v3 | Calitate |
|---|---------------------|---------------|----------|
| 1 | P₃ text (∢MNy, 60°) | ✓ linia 80 | LaTeX corect |
| 2 | P₄ text ({P} = Mx ∩ Ny) | ✓ linia 81 | LaTeX corect |
| 3 | Figuri P3+P4 side-by-side | ✓ liniile 82-110 | SVG 7/10 (structura simplificata) |
| 4 | **Observație.** paragraf | ✓ linia 111 | Bold + text complet |
| 5 | Heading L.L.L. | ✓ linia 112 | h2 corect |
| 6 | Paragraf constructie | ✓ linia 113 | Text complet |
| 7 | **Exemplu.** △ABC | ✓ linia 114 | LaTeX cu masuri |
| 8 | P₁ text | ✓ linia 115 | OK |
| 9 | P₂ text | ✓ linia 116 | OK |
| 10 | Figuri P1+P2 | ✓ liniile 117-137 | SVG 8.5/10 |
| 11 | P₃ text (L.L.L.) | ✓ linia 138 | OK |
| 12 | P₄ text (L.L.L.) | ✓ linia 139 | OK |
| 13 | Figuri P3+P4 (L.L.L.) | ✓ liniile 140-162 | SVG 9/10 (masuri 3,4,5) |
| 14 | Heading "Observații" | ✓ linia 163 | h2 corect |
| 15 | 2 observatii (lista) | ✓ liniile 164-167 | ol cu 2 li |

**Scor: 15/15 completitudine, 8.3/10 calitate SVG**

---

## Calitate SVG — detalii

Cel mai bun SVG: **P4 L.L.L.** (triunghi ABC cu fill albastru, etichete A/B/C, masuri 3/4/5 pe laturi) — 9/10, arata profesional.

Cel mai slab SVG: **P3 U.S.U.** (constructie unghi) — 7/10, razele pornesc din centru in loc de la varfurile M si N. Matematic corect ca rezultat, dar pasul intermediar de constructie e simplificat.

**Toate figurile**: etichetate corect, unghiuri prezente, masuri corecte, stil consistent (stroke #333, fill #e8f0fe, font Cambria).

---

## Verificare tehnica

| Element | Status |
|---------|--------|
| MathJax displayMath | ✓ `[['$$','$$'],['\\[','\\]']]` |
| CSS flex figuri | ✓ Syntax corect |
| Bold | ✓ `<strong>` (nu asteriscuri) |
| Headings | ✓ h2 |
| Lista ordonata | ✓ ol/li |
| Diacritice | ✓ ă, î, ș, ț, â |
| Paper A4 | ✓ Print CSS OK |

---

## Observatii minore

### O5: Cratima din carte pastrata
"compa- sului" (liniile 116, 138) — cratima de rupere de rand din manual copiata in text. De lipit in prompt: "If a word is hyphenated across a line break, join it."

### O6: Paginare pe 1 pagina
Pe aceasta poza concreta, continutul incape pe 1 A4 → OK. Pe pagini mai lungi (2+ pagini manual) → devine necesar. Ramane ca task viitor.

---

## Evaluare plan T1 (4 pasi urmatori)

| Pas | Descriere | Evaluare |
|-----|-----------|----------|
| 1 | Prompt NOU in `ocr_structured.py` | ✓ Rezolva S21 |
| 2 | `html_builder.py` pt HTML fragments | ✓ Se potriveste cu D27. **Atentie**: sanitizare HTML (XSS) |
| 3 | Flow on-demand (upload → original → traducere la click) | ✓ Implementeaza D23 |
| 4 | Endpoint `/api/ocr` separat | ✓ Separare clara |

**Planul e corect. Ordinea e buna. Poate incepe executia dupa confirmare Roland.**

---

## Corectie estimare Faza 2

| Runda 7 spunea | Runda 8 corectie | Motiv |
|-----------------|-----------------|-------|
| Sprint 2.2: 20% | **50%** | v3 dovedeste SVG functional, prompt nou validat |
| Sprint 2.5: 20% | **30%** | Multi-JPEG functioneaza, dar teste SVG lipsesc |
| **Total: ~55%** | **~65-70%** | v3 reduce riscul tehnic semnificativ |

---

## Status sugestii Runda 7 (actualizat)

| Sugestie | Status Runda 8 |
|----------|----------------|
| S21 (cod vs decizii) | **VALID** — codul productie inca face crop. T1 are plan de fix |
| S22 (continut incomplet) | **RETRAS** — v3 e complet, T1 avea dreptate |
| S23 (completare 55%) | **CORECTAT** → ~65-70% |
| S24 (figure_crop.py cod mort) | **VALID** — de dezactivat la pasul 4 |
| S25 (flow on-demand) | **VALID** — planificat la pasul 3 |
| S26 (paginare) | **VALID dar NEBLOCANT ACUM** — OK pe test_page_1, necesar pe documente lungi |
| S27 (truncare Gemini) | **VALID** — risc real, dar v3 demonstreaza ca pe 1 pagina merge |
| S28 (Sprint 2.2 neactualizat) | **VALID** — T1 trebuie sa rescrie task-urile |
| SC6 (SVG gresit matematic) | **VALID** — P3 U.S.U. confirma simplificare geometrica (7/10) |
| SC7 (truncare pe pagini complexe) | **VALID** — de testat pe pagini cu 8+ figuri |

---

## Stare ORCHESTRATOR_STATUS — stale

| Problema din ORCHESTRATOR | v3 | Productie |
|--------------------------|-----|-----------|
| 1. Flow gresit | Nerezolvat | Nerezolvat |
| 2. Figuri lipsa | **Rezolvat** | Nerezolvat |
| 3. Paginare | Partial OK | Nerezolvat |
| 4. Bold asteriscuri | **Rezolvat** | Nerezolvat |
| 5. Perechi side-by-side | **Rezolvat** | Nerezolvat |

T3 ar trebui sa actualizeze dupa confirmarea Roland.

---

## Intrebari pentru Roland (I6, I7, I8 — din Runda 7 + noua)

- **I6**: Ai deschis v3 in browser? SVG-urile sunt OK ca acuratete?
- **I7**: Confirmi SVG (curat, generat de AI) in locul crop (identic cu originalul)?
- **I8**: T1 poate incepe integrarea in pipeline? (4 pasi)

---

## Text gata de copiat catre T1 (Runda 8)

> **De la T2 (Runda 8 — VERIFICARE v3 + CORECTIE):**
>
> **CORECTIE**: S22 din Runda 7 era gresita. Am verificat poza originala — INCEPE cu P3 U.S.U. (titlul e pe pagina anterioara). v3 extrage **15/15 elemente (100% complet)**. Imi cer scuze.
>
> **Calitatea v3: 8.5/10** — foarte bun:
> - Completitudine: 15/15 elemente ✓
> - SVG figuri: 8.3/10 (P4 L.L.L. = 9/10, P3 U.S.U. = 7/10)
> - Tehnic: MathJax ✓, CSS ✓, bold ✓, headings ✓, diacritice ✓
>
> **Planul tau de 4 pasi e CORECT** si in ordinea corecta. Atentie la Pas 2: sanitizeaza HTML-ul de la Gemini.
>
> **Faza 2 completare corecta: ~65-70%** (nu 90% din plan, nu 55% din Runda 7 mea).
>
> **2 observatii minore**: "compa- sului" (cratima de lipit), paginare OK acum dar necesara pe documente lungi.
>
> **Sugestii Runda 7 inca valide**: S21 (cod vs decizii), S24-S28, SC6-SC7. Toate au solutii in planul tau de 4 pasi.
>
> **Asteptam de la Roland**: I6 (verificare v3), I7 (confirma SVG), I8 (poate T1 incepe integrarea?).
>
> Feedback complet in `99_Plan_vs_Audit/AUDIT_FEEDBACK.md`.

---
---

# AUDIT FEEDBACK — Runda 9 (comparatie onesta Exemplu_BUN vs v3)
# Data: 2026-03-27 | Sursa: Exemplu_BUN.html (410 linii) vs test_page_1_ORIGINAL_RO_v3.html (171 linii) — comparatie linie cu linie
# Status: [INTEGRAT] — T1 a implementat fix SVG (D28-D32) pe 2026-04-04. Cele 7 cerinte prompt integrate in prompt-ul nou.

---

## Rezumat

**Ma corectez din nou. Runda 8 era prea optimista (8.5/10). Am comparat in detaliu fiecare SVG, fiecare eticheta, fiecare detaliu de layout.**

Roland are dreptate — v3 NU este la nivelul Exemplu_BUN. Diferentele sunt semnificative si afecteaza calitatea documentului pentru o profesoara de matematica. Scor real: **5/10** comparat cu Exemplu_BUN.

Am gasit **4 probleme CRITICE** si **3 IMPORTANTE**.

---

## Comparatie SVG — figura cu figura

### P3 U.S.U. (constructia unghiului la N)

| Aspect | Exemplu_BUN (liniile 302-318) | v3 (liniile 83-97) | Diferenta |
|--------|------|-----|-----------|
| **Geometrie** | Raze din M (15,100) si N (175,100) spre sus | Raze din CENTRU (100,100) spre ambele directii | **GRESIT** — razele trebuie sa porneasca din varfuri |
| Tip linii | Baza solida, raze PUNCTATE (stroke-dasharray="5,3") | TOTUL solid | Lipsesc liniile de constructie punctate |
| Culori unghiuri | 40° = rosu (#c44), 60° = **verde (#1a7)** | Ambele ROSII (#c44) | Fara diferentiere vizuala |
| Puncte la varfuri | DA — cercuri r=2.5 la M si N | NU | Lipsesc |
| Etichete font | font-size="14" (varfuri), "12" (raze), "11" (unghiuri) | Fara font-size specificat | Necontrolat |
| Masura | "6 cm" | "6" | **Lipseste unitatea "cm"** |

### P4 U.S.U. (triunghiul complet MNP)

| Aspect | Exemplu_BUN (liniile 319-333) | v3 (liniile 98-109) | Diferenta |
|--------|------|-----|-----------|
| Forma | Triunghi scalenic realist (15,105 / 175,105 / 96,32) | Triunghi isoscel simetric (20,100 / 180,100 / 100,30) | **Proportii gresite** — P e centrat in v3 dar in original e asimetric |
| Arce unghiuri | 40° rosu + 60° verde (culori diferite) | 40° rosu + 60° rosu (aceeasi culoare) | Fara diferentiere |
| Puncte la varfuri | DA — cercuri la M, N, P | NU | Lipsesc |
| Fill | #e8f0fe (albastru deschis) | #e8f0fe | OK |
| Masura | "6 cm" | "6" | Lipseste "cm" |

### P1 L.L.L. (segmentul AB)

| Aspect | Exemplu_BUN (liniile 343-352) | v3 (liniile 118-126) | Diferenta |
|--------|------|-----|-----------|
| Segment | AB de la (25,110) la (105,110) — proportionat | AB de la (20,100) la (180,100) — **toata latimea** | **Proportie gresita** — segmentul e prea lung |
| Linie de prelungire | DA — linie subtire gri (5,110)-(195,110) artatand dreapta | NU | Lipseste contextul geometric |
| Puncte | DA — cercuri la A si B | DA — cercuri | OK |
| Masura | "4 cm" (font-size="10") | "4" (font-size="10") | Lipseste "cm" |

### P2 L.L.L. (arc din A)

| Aspect | Exemplu_BUN (liniile 353-364) | v3 (liniile 127-136) | Diferenta |
|--------|------|-----|-----------|
| Arc | PUNCTAT (#c44, dasharray="6,3") — arc de cerc vizibil | SOLID negru (#333) — linie groasa | **Stilul de constructie pierdut** |
| Eticheta arc | "3 cm" in rosu pe arc | NU — nici o eticheta | **Masura arcului lipsa** |
| Linie prelungire | DA | NU | |

### P3 L.L.L. (ambele arce)

| Aspect | Exemplu_BUN (liniile 370-384) | v3 (liniile 141-151) | Diferenta |
|--------|------|-----|-----------|
| Arc din A | Punctat rosu (#c44) | Solid negru | Fara distinctie |
| Arc din B | Punctat **verde (#1a7)** | Solid negru | **Cele 2 arce nu se deosebesc** |
| Punct intersectie C | DA — cerc mare (r=4) cu fill semi-transparent | NU | **Punctul C nu e marcat** |
| Etichete arce | "3 cm" rosu + "5 cm" verde | NIMIC | **Masurile lipsesc complet** |

### P4 L.L.L. (triunghiul complet ABC, 3-4-5)

| Aspect | Exemplu_BUN (liniile 385-399) | v3 (liniile 152-161) | Diferenta |
|--------|------|-----|-----------|
| **Forma triunghi** | **Dreptunghic** (C la 25,55 = direct deasupra A). Triunghi 3-4-5 corect. | **Isoscel** (C la 100,30 = centrat). Triunghi 3-4-5 GRESIT. | **GRESIT MATEMATIC** — un triunghi 3-4-5 e dreptunghic |
| Unghi drept | DA — **patrat la A** (rect 8x8 la vertex) | NU | **Lipseste marcajul de unghi drept** |
| Puncte varfuri | DA | NU | |
| Masuri | "3 cm", "4 cm", "5 cm" — pe fiecare latura | "3", "4", "5" — fara "cm" | Lipsesc unitatile |

---

## Probleme CRITICE gasite

### C1: Triunghi 3-4-5 desenat GRESIT (nu e dreptunghic)

Un triunghi cu laturile 3, 4, 5 este INTOTDEAUNA dreptunghic (3² + 4² = 5²). Cristina, profesoara de matematica, va observa IMEDIAT ca:
- v3 il deseneaza ca triunghi isoscel (varf centrat)
- Exemplu_BUN il deseneaza corect ca dreptunghic (varf C direct deasupra A, unghi drept la A)
- v3 nu are marcajul de unghi drept (patratel)

**Asta e o eroare matematica, nu doar estetica.**

### C2: Razele de constructie pornesc din locul gresit (P3 U.S.U.)

In constructia U.S.U., la pasul P3 trebuie sa desenezi unghiul la varful N. Raza trebuie sa porneasca din N.
- Exemplu_BUN: raza din N (175,100) in sus — CORECT
- v3: linie din CENTRU (100,100) — GRESIT geometric

### C3: Fara distinctie vizuala intre elemente de constructie

Exemplu_BUN foloseste un "vocabular vizual" consistent:
- Linii **PUNCTATE** (#aaa, dasharray) = raze auxiliare / constructie
- Linii **SOLIDE** = segmente definitive
- **ROSU** (#c44) = un unghi/arc
- **VERDE** (#1a7) = alt unghi/arc (distinctie)
- **Cercuri** la varfuri = puncte geometrice

v3 foloseste:
- TOTUL solid negru
- TOTUL rosu (fara distinctie intre unghiuri)
- Fara puncte la varfuri

**Asta face figurile mai greu de inteles ca pasi de constructie** — nu se vede ce e "nou" la fiecare pas si ce e "de la pasul anterior".

### C4: Unitatile de masura lipsesc din SVG-uri

In TOATE figurile v3: "4" in loc de "4 cm", "6" in loc de "6 cm", etc.
In Exemplu_BUN: TOATE masurile au unitatea "cm".

**Asta e o problema pentru un document scolar** — elevii trebuie sa vada unitatile.

---

## Probleme IMPORTANTE

### I1: Proportiile triunghinlor sunt gresite

In v3, TOATE triunghiurile au baza de la (20,100) la (180,100) = toata latimea. In Exemplu_BUN, segmentele au lungimi proportionale si realiste. Asta face ca:
- AB = 4 cm sa arate la fel ca MN = 6 cm in v3 (ambele umplu toata latimea)
- In Exemplu_BUN, AB e mai scurt ca MN

### I2: Lipsa linie de prelungire (dreapta suport)

Exemplu_BUN arata o linie subtire gri care prelungeste segmentul — asta arata ca segmentul e parte dintr-o dreapta. E un detaliu de constructie geometrica important.

### I3: Textul "compa- sului" (cratima de rupere de rand)

Aparitie de 2 ori. Textul din carte avea ruptura de rand acolo, Gemini a pastrat-o.

---

## Scor real v3 vs Exemplu_BUN

| Criteriu | Exemplu_BUN | v3 | Scor v3 |
|----------|-------------|-----|---------|
| Continut text complet | 10/10 | 9/10 (are "compa- sului") | 9/10 |
| LaTeX formule | 10/10 | 9/10 (corect) | 9/10 |
| Proportii geometrice | 10/10 | 3/10 (isoscel in loc de dreptunghic) | **3/10** |
| Pasi constructie vizuali | 10/10 | 3/10 (fara punctat/solid, fara culori) | **3/10** |
| Etichete si masuri | 10/10 | 5/10 (lipsesc "cm", font-sizes) | **5/10** |
| Puncte la varfuri | 10/10 | 2/10 (lipsesc aproape toate) | **2/10** |
| Layout paginare | 10/10 | 6/10 (1 pagina, dar OK pt 1 poza) | 6/10 |
| Stil CSS general | 10/10 | 8/10 (aproape identic) | 8/10 |
| Diacritice | 10/10 | 10/10 | 10/10 |
| **TOTAL** | **10/10** | **5/10** | **5/10** |

---

## Ce trebuie facut concret

Prompt-ul OCR trebuie sa ceara explicit urmatoarele (care sunt in Exemplu_BUN dar nu in v3):

1. **Geometrie corecta**: "A 3-4-5 triangle is a RIGHT triangle. Draw it accordingly with a right angle marker (small square)."
2. **Linii punctate pt constructie**: "Use dashed lines (stroke-dasharray) for auxiliary/construction rays. Use solid lines only for definitive segments."
3. **Culori diferite pt unghiuri diferite**: "Use different colors for different angles: red (#c44) for one, green (#1a7) for another."
4. **Puncte la varfuri**: "Add small circles (r=2.5) at ALL geometric vertices."
5. **Unitati de masura**: "ALWAYS include units in labels: '4 cm' not '4'."
6. **Proportii realiste**: "If AB=4 cm and MN=6 cm, make the segments proportionally different, not both full-width."
7. **Raze din varfuri**: "Construction rays START from their named vertex, not from the center."

---

## Intrebari pentru Roland

### I9: Vrei ca T1 sa imbunatateasca prompt-ul cu aceste 7 cerinte inainte de a integra in pipeline?
Altfel, pipeline-ul va produce aceeasi calitate ca v3 (5/10), nu ca Exemplu_BUN (10/10).

### I10: Vrei sa vada un v4 test cu prompt-ul imbunatatit inainte de integrare?
Recomand: DA — un test v4 cu prompt-ul nou, comparat vizual cu Exemplu_BUN, inainte de a rescrie codul de productie.

---

## Text gata de copiat catre T1 (Runda 9 — comparatie onesta)

> **De la T2 (Runda 9 — COMPARATIE REALA Exemplu_BUN vs v3):**
>
> **Am comparat fiecare SVG linie cu linie. v3 e la 5/10 fata de Exemplu_BUN. Roland are dreptate.**
>
> **4 probleme CRITICE:**
> 1. **Triunghi 3-4-5 desenat gresit**: v3 il face isoscel (varf centrat). Exemplu_BUN il face dreptunghic (corect matematic, cu patrat de unghi drept). Eroare matematica.
> 2. **Raze din centru**: P3 U.S.U. — razele pornesc din centru in v3, trebuie sa porneasca din varfuri M si N.
> 3. **Zero distinctie constructie**: v3 foloseste totul solid negru. Exemplu_BUN foloseste: punctat = constructie, solid = definitiv, rosu = un unghi, verde = alt unghi. In v3 nu se vede ce e nou la fiecare pas.
> 4. **"4" in loc de "4 cm"**: Unitatile lipsesc din TOATE SVG-urile. Inacceptabil intr-un document scolar.
>
> **3 probleme importante**: proportii gresite (totul full-width), lipsa linie prelungire dreapta, "compa- sului".
>
> **Ce trebuie**: Inainte de integrarea in pipeline, IMBUNATATESTE prompt-ul cu 7 cerinte explicite (geometrie corecta, punctat/solid, culori diferite, puncte varfuri, "cm", proportii, raze din varfuri). Genereaza un v4 test si compara cu Exemplu_BUN. DUPA ce v4 e aprobat de Roland → integreaza in pipeline.
>
> Feedback complet in `99_Plan_vs_Audit/AUDIT_FEEDBACK.md`.
