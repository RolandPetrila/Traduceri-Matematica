# PLAN DECISIONS LOG
# Proiect: Traduceri Matematica v3
# Scris de: T1 (terminal plan/executie)
# Citit de: T2 (auditor) + Roland

---

> Dupa fiecare runda de intrebari/raspunsuri, T1 adauga o noua sectiune aici.
> Format obligatoriu per runda: Intrebari puse, Decizii luate, Cerinte confirmate/respinse.

---

## Runda 1 — 2026-03-26

### Intrebari puse

- Q1: Abordare v2 -> v3 (continuitate / refactorizare+extindere / rebuild selectiv)
  -> Raspuns Roland: **B — Refactorizare + Extindere**
  Pastram ce functioneaza, reorganizam codul backend (translate.py split), apoi adaugam modulele noi.

- Q2: Scope PLAN_v3 (doar modul 1+2 / toate 6 / modular progressiv)
  -> Raspuns Roland: **C — Modular progressiv**
  Modul 1+2 detaliat cu taskuri concrete, Modul 3+4 schitat ca structura mare, Modul 5+6 mentionat fara detalii.

- Q3: Gap calitate DocumentViewer vs Exemplu_BUN.html (mare / mediu / mic)
  -> Raspuns Roland: **B — Gap mediu**
  Exista probleme specifice (SVG-uri, figuri, etc.) care trebuie identificate si corectate tintit.

### Decizii luate

- D1: Abordare Refactorizare + Extindere — Motiv: codul existent e functional, nu necesita rescrierea de la zero, dar backend-ul (translate.py 1420 linii) trebuie reorganizat inainte de a adauga module noi
- D2: Plan modular progressiv — Motiv: permite focus pe ce e urgent (Traduceri + Convertor) fara a pierde din vedere viziunea completa (6 module)
- D3: Gap mediu calitate output — Motiv: pipeline-ul functioneaza dar are probleme specifice cu figuri/SVG care trebuie corectate tintit

### Cerinte confirmate

- C1: Pastram codul existent functional (DocumentViewer, LanguageToggle, pipeline OCR)
- C2: translate.py se sparge in module mai mici
- C3: Modul 1 (Traduceri) si Modul 2 (Convertor) = prioritare, cu taskuri detaliate
- C4: Modul 3-4 se schiteaza, Modul 5-6 se mentioneaza doar

### Cerinte respinse/amanate

- (niciuna in aceasta runda)

### Feedback de la Roland

- R13: Comunicare accesibila — fara termeni tehnici, cu recomandari clare si exemple din viata reala

---

## Runda 2 — 2026-03-26

### Intrebari puse

- Q1: Ce probleme are output-ul documentelor traduse? (figuri lipsesc / arata diferit / pozitionate gresit / altceva)
  -> Raspuns Roland: **B+C — Figurile nu sunt identice cu originalul SI uneori nu sunt la locul lor**
  Standardul dorit: Exemplu_BUN.html

- Q2: Convertorul de fisiere — functioneaza pe Render? (merge bine / merge partial / netestat)
  -> Raspuns Roland: **C — Netestat recent**
  T1 a testat si a descoperit: convertorul NU functioneaza pe Render (bug: lipseste `import os` din convert.py — serverul se blocheaza la orice conversie)

- Q3: Dupa Traduceri si Convertor — ce modul vine primul? (Calculator / Chat AI / Corectare teste)
  -> Raspuns Roland: **B — Chat AI**
  Cel mai versatil: poate si calcule, si explicatii, si analiza documente.

### Decizii luate

- D4: Figurile trebuie sa fie identice cu originalul si pozitionate exact ca in document — Motiv: standardul Exemplu_BUN.html (crop din original, nu redesenate de AI)
- D5: Convertorul trebuie reparat urgent (bug `import os`) — Motiv: nefunctional pe Render, blocat complet
- D6: Ordinea modulelor viitoare: Chat AI (3) -> Calculator (4) -> Teste (5+6) — Motiv: Chat AI e cel mai versatil si util pentru Cristina

### Cerinte confirmate

- C5: Calitate figuri = nivel Exemplu_BUN.html (decupate din original, fundal alb, pozitionate corect)
- C6: Fix convertor = prioritate in Faza 1 a planului
- C7: Chat AI = primul modul nou dupa Traduceri+Convertor

### Cerinte respinse/amanate

- (niciuna)

### Constatari tehnice (din testare T1)

- API Render raspunde OK (/api/health = 200)
- Convertor blocat: convert.py foloseste `os.environ` de 3 ori dar nu importa `os` — crash la orice conversie
- Traducerile functioneaza (translate.py are importul corect)

### Feedback de la Roland

- R14: Validare pe 3 niveluri (MINIM/TIPIC/MAXIM) obligatorie la fiecare modul planificat
- Fiecare modul din plan trebuie sa declare explicit limitele: timp, dimensiune, cota API, stocare

---

## Runda 3 — 2026-03-26

### Intrebari puse

- Q1: Roland a primit structura completa a planului (6 faze) + tabel limite servicii gratuite
  -> Raspuns Roland: **Confirmat — cu 3 adaugari**

### Decizii luate

- D7: Structura plan confirmata — 6 faze: (1) Reparatii urgente, (2) Calitate traduceri + Securitate + Refactorizare, (3) Convertor polish, (4) Chat AI, (5) Calculator, (6) Teste
- D8: Faza 2 include fix-uri securitate (verificare InlineEditor, CORS, headere + Next.js CVEs) — Motiv: sunt rapide si importante
- D9: Faza 2 include contor vizibil DeepL (cat s-a consumat din cota lunara) — Motiv: Cristina trebuie sa vada cat a consumat, ca un contor de benzina
- D10: Faza 1 include ecran "Se incarca..." frumos cand serverul Render se trezeste — Motiv: prima impresie conteaza, Cristina nu trebuie sa vada ecran gol timp de 30-60 secunde

### Cerinte confirmate

- C8: Fix-uri securitate in Faza 2 (rapide, nu amana traducerile)
- C9: Contor DeepL vizibil in interfata
- C10: Ecran de asteptare frumos la cold start Render

### Cerinte respinse/amanate

- (niciuna)

### Feedback de la Roland

- R15: Testare si raport executie obligatoriu dupa fiecare sprint
- R16: Transparenta cercetare — variante cercetate cu PRO/CONTRA la fiecare decizie

### Variante cercetate (R16) — Limite servicii gratuite

- V1: DeepL Free — 500K caractere/luna/cheie, 2 chei disponibile = 1M total. ~350-500 pagini/luna.
  - PRO: Cota generoasa, formulele protejate nu se numara / CONTRA: Dupa epuizare, blocat pana luna urmatoare
  - Surse: documentatie oficiala DeepL, WebSearch agent

- V2: Gemini 2.5 Flash Free — 250 cereri/zi, 10/minut, 250K tokeni/minut
  - PRO: Suficient pt 250 pagini OCR/zi / CONTRA: Redus de Google in dec 2025 (era 1500/zi)
  - Surse: Google AI docs, WebSearch agent (confirmat reducerea din dec 2025)

- V3: Render Free — 750 ore/luna partajate, 512MB RAM, cold start 30-60s
  - PRO: Timeout generos (100 min), gratuit / CONTRA: 2 servicii impart 750 ore, spin-down dupa 15 min
  - Surse: Render docs (render.com/docs/free), WebSearch agent

---

## Runda 4 — 2026-03-26 (Integrare Audit T2 Runda 1)

### Sursa

T2 a livrat AUDIT_FEEDBACK.md (Runda 1). T3 (orchestrator) a colectat raspunsurile lui Roland la intrebarile T2 si a scris RUNDA_CURENTA.md cu instructiuni de integrare.

### Raspunsuri Roland la intrebarile T2

- I1 (PDF vs JPEG): Cristina incarca mai des poze JPEG, dar foloseste si PDF-uri ocazional. Ambele formate trebuie suportate.
- I2 (Cache traduceri): A — persistent in localStorage. Economiseste cota si nu pierde munca.
- I3 (Offline): B — nu e prioritar acum. Cristina are internet.

### Decizii luate

- D11: PDF crop figuri cu PyMuPDF (se confirma dupa cercetare MCP) — Motiv: Pillow nu poate deschide PDF direct, trebuie convertit in imagine. PyMuPDF nu are dependente externe (vs pdf2image care necesita Poppler pe server).
- D12: Rate limiting in-memory (10 req/min, 100/zi per IP) — Motiv: site-ul e public, oricine poate epuiza cota DeepL/Gemini fara protectie.
- D13: Cache traduceri persistent in localStorage (~5 MB, curatare automata) — Motiv: Cristina sa nu piarda traducerile la inchidere browser si sa nu consume iar din cota.
- D14: Timeout ecran incarcare la 120 secunde + mesaj + retry — Motiv: cold start poate depasi 60s, feedback clar daca serverul nu raspunde.
- D15: Chat AI foloseste Groq prioritar, Gemini doar pt poze — Motiv: pastreaza cota Gemini pentru OCR.
- D16: PDF >20 pagini se proceseaza in loturi de 5 — Motiv: previne epuizare RAM pe Render (512 MB).

### Cerinte confirmate

- C11: Toate 3 sugestii critice integrate (S1 PDF crop, S2 rate limiting, S3 cache persistent)
- C12: Toate 4 sugestii importante integrate (S4 snapshot, S5 test mobil, S6 timeout 120s, S7 Gemini quota)
- C13: 4 scenarii adaugate in plan (SC1 bbox validare, SC2 fallback DeepL, SC3 PDF mare, SC4 DOCX flow)
- C14: 99_Plan_vs_Audit/ si 99_Blueprints/ se adauga in git (scoase din .gitignore)

### Cerinte respinse/amanate

- S8 (cache offline Service Worker): AMANAT — Roland a confirmat ca offline nu e prioritar
- S9 (monitorizare ore Render): OPTIONAL — nice to have, nu prioritar

### Variante cercetate (R16) — PyMuPDF vs pdf2image

- V1: PyMuPDF (`pip install PyMuPDF`) — self-contained, fara dependente externe
  - PRO: Se instaleaza simplu cu pip, functioneaza pe orice server / CONTRA: Pachet mai mare (~20 MB)
  - Cercetare MCP in curs (agent lansat)

- V2: pdf2image (`pip install pdf2image`) + Poppler
  - PRO: Librarie simpla / CONTRA: Necesita Poppler instalat la nivel de sistem — pe Render free tier nu se pot instala pachete sistem (apt-get), deci probabil NU merge
  - Cercetare MCP in curs (agent lansat)

- **Aleasa: V1 (PyMuPDF) — CONFIRMAT de cercetare MCP**
- **pdf2image NU MERGE pe Render** — necesita Poppler (apt-get), care nu e disponibil pe Render native Python
- PyMuPDF: 3-5x mai rapid, self-contained, import nou: `import pymupdf` (nu `import fitz`)
- Adaugare: `PyMuPDF>=1.25.0` in requirements.txt
- Atentie: DPI 150-200 recomandat (DPI 300+ consuma prea multa memorie pe 512MB RAM)
- Surse: PyMuPDF docs, Render community forum, WebSearch agent

### Variante cercetate (R16) — Rate limiting fara Redis

- V1: Dictionar in memorie Python (IP -> lista timestamps) — "sliding window log"
  - PRO: Zero dependente, simplu, precis / CONTRA: Se pierde la restart server (OK — rate limits se reseteaza)

- V2: Fisier pe disc
  - PRO: Persista la restart / CONTRA: Lent, Render pierde fisierele la spin-down oricum

- V3: Token bucket
  - PRO: Clasic / CONTRA: Are "boundary burst" problem (la granita ferestrei pot trece 2x cererile)

- **Aleasa: V1 (sliding window log in memorie) — CONFIRMAT de cercetare MCP**
- Detalii implementare: `threading.Lock()` pt thread safety, `X-Forwarded-For` pt IP real, curatare la 5 min, HTTP 429 + `Retry-After: 60`
- Surse: Medium (hexshift), OneUptime blog, Render docs, MDN X-Forwarded-For

---

## Runda 5 — 2026-03-26 (Integrare Audit T2 Runda 2)

### Sursa

T2 a livrat AUDIT_FEEDBACK.md Runda 2. 0 probleme critice, 4 importante, 3 optionale. T3 a colectat raspunsurile Roland (I4, I5).

### Decizii luate

- D17: Contor DeepL afiseaza numar combinat simplu (suma 2 chei = "23% din 1.000.000") — Motiv: Cristina nu trebuie sa stie de 2 chei (Roland I4)
- D18: Cache localStorage are versiune cu invalidare automata — Motiv: dupa update pipeline, cache vechi se ignora (audit S11)
- D19: Rate limiting global pe TOATE endpoint-urile cu limite diferite per tip — Motiv: protejeaza si convertorul si viitorul chat, nu doar traducerile (audit S12)
- D20: PyMuPDF DPI explicit = 150 (nu 300 default) — Motiv: DPI 300 consuma 4x memorie, crash pe 512MB (audit S13)
- D21: Multi-JPEG upload = 1 document combinat — Motiv: Cristina vrea 1 document tradus cu 5 pagini, nu 5 documente separate (Roland I5)

### Cerinte confirmate

- C15: Contor DeepL simplu, combinat, fara mentiune de chei (Roland I4)
- C16: Cache versioning cu invalidare la update-uri mari (audit S11)
- C17: Rate limiting pe toate endpoint-urile (audit S12)
- C18: DPI 150 obligatoriu pentru PyMuPDF (audit S13)
- C19: Multi-JPEG = document combinat (Roland I5)
- C20: Mesaje eroare in romana (audit S14)
- C21: Test mobil si la convertor in Faza 3 (audit S15)

### Cerinte respinse/amanate

- SC5 (build time PyMuPDF): NOTA — se verifica la primul deploy, probabil OK (~30 sec)

### Variante cercetate (R16)

- Contor DeepL: V1 (per cheie) vs V2 (combinat) — Aleasa V2, Roland confirmat
- Cache: V1 (fara versiune) vs V2 (cu versiune) — Aleasa V2, previne cache stale
- Rate limiting: V1 (doar traduceri) vs V2 (global diferentiat) — Aleasa V2, protejeaza tot
