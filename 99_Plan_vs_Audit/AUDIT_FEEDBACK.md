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
