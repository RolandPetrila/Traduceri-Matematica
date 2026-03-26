# PLAN v3 — Traduceri Matematica
# Status: IN PLANIFICARE
# Data start: 2026-03-26 | Ultima actualizare: 2026-03-26 (integrare audit T2 Runda 1)
# Completare: 0%

---

> Acest fisier este SURSA UNICA DE ADEVAR pentru progresul proiectului.
> Scris si actualizat EXCLUSIV de T1 (terminal plan/executie).
> Checkbox: [ ] = neefectuat | [x] = efectuat | [~] = partial | [-] = anulat cu motiv

---

## Viziune

Aplicatie web (PWA) cu 6 module, centrata pe matematica. Utilizator principal: Cristina (profesoara de matematica la sectia slovaca). Upload document matematic (poza/PDF/Word) -> OCR inteligent -> vizualizare A4 cu formule si figuri -> traducere RO/SK/EN cu un singur click -> print/download. Plus: convertor fisiere, chat AI, calculator, corectare si generare teste.

---

## Decizii tehnice

| # | Decizie | Varianta aleasa | Alternativa | Motiv |
|---|---------|-----------------|-------------|-------|
| D1 | Abordare v2->v3 | Refactorizare + Extindere | Rebuild complet | Codul existent functioneaza, doar trebuie reorganizat |
| D2 | Scope plan | Modular progressiv | Tot sau nimic | Focus pe urgent (Modul 1+2), restul schitat |
| D3 | Figuri document | Crop din poza originala (Pillow) | SVG generat de AI | Identice cu originalul, nu aproximari |
| D4 | Ordine module noi | Chat AI -> Calculator -> Teste | Calculator primul | Chat AI e cel mai versatil |
| D5 | Traducere primara | DeepL Free (2 chei) | Gemini traducere | DeepL e mai precis pt limbi europene |
| D6 | OCR | Gemini 2.5 Flash (JSON mode) | Mistral Pixtral | Gemini e mai precis si gratuit |
| D7 | Server | Render free tier | Vercel | Render suporta Python nativ, timeout 100 min |
| D8 | Contor DeepL | Vizibil in interfata | Doar in /diagnostics | Cristina trebuie sa vada cat a consumat |
| D9 | Cold start Render | Ecran "Se incarca..." frumos | Nimic (ecran gol) | Prima impresie conteaza |
| D10 | Securitate | Verificare + Next.js update | Ignorare | Probleme mici dar importante |
| D11 | PDF crop figuri | PyMuPDF (se confirma dupa cercetare MCP) | pdf2image + Poppler | PyMuPDF nu are dependente externe (audit S1) |
| D12 | Rate limiting | In-memory dict (10 req/min, 100/zi per IP) | Redis / nimic | Protectie cota DeepL/Gemini fara costuri (audit S2) |
| D13 | Cache traduceri | localStorage persistent (~5 MB, curatare auto) | Doar in sesiune | Nu pierde munca la inchidere browser (audit S3) |
| D14 | Timeout ecran incarcare | 120 secunde, apoi mesaj + buton retry | Fara timeout | Feedback clar daca serverul nu raspunde (audit S6) |
| D15 | Chat AI — cota Gemini | Groq prioritar pt text, Gemini doar pt poze | Gemini pt tot | Pastreaza cota Gemini pt OCR (audit S7) |
| D16 | PDF mare (>20 pag) | Procesare in loturi de 5 pagini | Tot odata | Previne epuizare memorie server (audit SC3) |
| D17 | Contor DeepL cu 2 chei | Numar combinat simplu ("23% din 1M") | Per cheie separat | Cristina nu trebuie sa stie de 2 chei (audit S10, Roland I4) |
| D18 | Cache versioning | Versiune cache (v1, v2...) cu invalidare automata | Fara versiune | Dupa update pipeline, cache vechi se ignora (audit S11) |
| D19 | Rate limiting scope | Global pe TOATE endpoint-urile (limite diferite) | Doar pe traduceri | Protejeaza si convertorul si viitorul chat (audit S12) |
| D20 | PyMuPDF DPI | 150 (economie memorie) | 300 (default) | DPI 300 = 4x memorie, crash pe 512MB (audit S13) |
| D21 | Multi-JPEG upload | 1 document combinat (5 poze = 5 pagini) | 5 documente separate | Cristina vrea 1 document tradus, nu 5 (Roland I5) |

---

## Limite servicii gratuite (R14)

| Serviciu | Limita | Ce inseamna in practica | Solutie la epuizare |
|----------|--------|-------------------------|---------------------|
| **DeepL** | 500K car/luna/cheie (2 chei = 1M) | ~350-500 pagini traduse/luna | Fallback pe Gemini traducere (calitate mai mica) + mesaj clar utilizator |
| **Gemini OCR** | 250 cereri/zi, 10/min | ~250 pagini OCR/zi | Procesare pe rand cu asteptare, fallback Mistral |
| **Gemini Chat** | Impartit cu OCR (250 total/zi) | ~100 mesaje chat/zi (daca se face si OCR) | Chat foloseste Groq prioritar, Gemini doar pt poze |
| **Groq** | ~14.400 cereri/zi | Suficient ca backup traducere + chat | Fara alt fallback (nu e nevoie) |
| **Render RAM** | 512 MB per serviciu | Max ~10-15 pagini procesate simultan | PDF >20 pag: procesare in loturi de 5 |
| **Render ore** | 750 ore/luna (2 servicii) | OK la utilizare intermitenta (3-4 ore/zi) | Spin-down automat economiseste ore |
| **Render cold start** | 30-60 sec (poate ajunge la 90+) | Prima accesare dupa pauza e lenta | Ecran "Se incarca..." + timeout 120s + retry |
| **Browser storage** | ~5 MB localStorage pt cache traduceri | ~30-50 documente cached persistent | Curatare automata cele mai vechi |

---

## Scenarii si flow-uri clarificati

### Multi-JPEG upload (Roland I5)
- Cand Cristina selecteaza 5 poze JPEG dintr-o data, se combina automat intr-un **singur document cu 5 pagini**
- Ordinea paginilor: dupa numele fisierului sau ordinea in care le-a selectat
- Traducerea si cache-ul se aplica pe documentul combinat (nu pe fiecare poza separat)
- Cristina vede un singur document tradus, cu toate paginile in ordine

### SC4: Flow DOCX (Word cu imagini)
- DOCX-urile se traduc **text-only** (fara OCR pe imagini)
- Pipeline: extrage textul din Word -> traducere DeepL -> reconstruieste Word tradus
- Imaginile din Word se pastreaza ca atare (nu se proceseaza prin OCR)
- Daca Cristina vrea OCR pe un Word cu figuri: il converteste in PDF sau face poze -> apoi foloseste flow-ul OCR normal

### SC3: PDF mare (>20 pagini)
- Procesare in loturi de 5 pagini (nu toate odata)
- Mesaj vizibil: "Document mare, se proceseaza in etape... (lot 1/4)"
- Fiecare lot: OCR + crop figuri + traducere
- Rezultatul final: documentul complet concatenat

---

## Faza 1: Reparatii urgente + Prima impresie
### Completare: 0%

### Scop
Repara ce e stricat (convertorul) si ofera o experienta placuta la prima accesare (ecran de incarcare cand serverul se trezeste).

### Componente afectate
- `api/convert.py` — fix bug import os
- `frontend/src/app/page.tsx` sau `layout.tsx` — ecran incarcare
- `.gitignore` — adauga 99_Plan_vs_Audit/ si 99_Blueprints/ (scoase din ignore)
- Documentatie: CLAUDE.md, CHECKPOINT.md

### Task-uri

**Sprint 1.1: Fix convertor** — COMPLETAT 2026-03-26
- [x] 2026-03-26 — Fix `api/convert.py` — adaugat `import os` la inceputul fisierului. Commit af0b40b + push.
- [x] 2026-03-26 — Test MINIM: MD->HTML pe Render — OK, HTTP 200, output HTML corect cu headings+bold+liste
- [x] 2026-03-26 — Test TIPIC: 3 tipuri — MD->HTML (OK, diacritice ăîșțâ corecte), JPEG->PDF (OK, 270KB), PDF->DOCX (OK, 36KB)
- [x] 2026-03-26 — Test MAXIM: Split (OK), Compress (OK, 270946->270885), Rotate 90° (OK), Watermark "DRAFT" (OK)

**Sprint 1.2: Ecran "Se incarca..."** — COMPLETAT 2026-03-26
- [x] 2026-03-26 — Detectare cold start: ServerWakeup.tsx polleaza /api/health la fiecare 3 secunde pana raspunde
- [x] 2026-03-26 — Design ecran: fundal verde (gradient chalkboard), mesaj "Se pregateste aplicatia..." + 3 puncte animate galben creta
- [x] 2026-03-26 — Ecranul dispare automat cand serverul raspunde (fara refresh manual)
- [x] 2026-03-26 — Timeout 120 secunde: dupa 2 minute afiseaza "Serverul nu raspunde momentan" + buton "Incearca din nou"
- [x] 2026-03-26 — Fix pre-existent BatchPanel.tsx: eroare de tip in logError() corectata
- [x] 2026-03-26 — Test pe Render live: frontend deployed OK, CSS animatie prezenta, API health OK. Ecranul de incarcare apare cand API e indisponibil, dispare cand raspunde.

**Sprint 1.3: Curatenie v2**
- [ ] Adauga 99_Plan_vs_Audit/ si 99_Blueprints/ in git (scoase din .gitignore)
- [ ] Dezactivare Vercel deploy (nu mai e necesar, totul e pe Render)
- [ ] Update CLAUDE.md cu starea actuala
- [ ] Update CHECKPOINT.md
- [ ] Commit + Push -> Render deploy

### Limite (R14 checklist)
- Timp executie convertor: 1 pagina = ~2-5 sec, 10 pagini = ~10-20 sec, 50+ pagini = poate depasi 512MB RAM [limita Render]
- Dimensiune maxima fisier: ~4 MB (impus de upload frontend), suficient pt documente scolare
- Concurenta: 1 persoana la un moment dat (OK — Cristina e singurul utilizator)
- Offline: convertorul NU functioneaza offline (necesita server)

### Criterii de acceptare
- Cristina poate converti un PDF in Word si invers pe site-ul live
- La prima accesare dupa pauza, vede un ecran frumos (nu pagina goala sau eroare)
- Dupa 30-60 secunde, aplicatia se incarca normal
- Daca serverul nu raspunde dupa 2 minute, vede mesaj clar + buton retry

### Exemple de utilizare
1. Cristina deschide site-ul dupa ce nu l-a folosit 2 ore
2. Vede: ecran verde cu "Se pregateste aplicatia..." si o animatie
3. Dupa 30-40 secunde, site-ul se incarca complet
4. Merge la tab-ul Convertor, incarca un PDF, alege "Converteste in Word"
5. Primeste fisierul Word descarcabil

**Scenariu alternativ (server indisponibil):**
1. Cristina deschide site-ul in timpul unei mentenante Render
2. Vede ecranul verde cu animatia
3. Dupa 2 minute, vede: "Serverul nu raspunde momentan. Incearca din nou mai tarziu."
4. Apasa butonul "Incearca din nou" -> se reverifica

---

## Faza 2: Calitate traduceri + Securitate + Refactorizare backend
### Completare: 0%

### Scop
Documentele traduse sa arate ca Exemplu_BUN.html: figuri identice cu originalul, pozitionate corect, formule randate frumos. Plus: reorganizare cod backend, fix-uri securitate, contor DeepL vizibil, cache traduceri persistent, si protectie impotriva abuzului.

### Componente afectate
- `api/translate.py` — split in module mai mici in `api/lib/`
- `api/lib/ocr_structured.py` — imbunatatire crop figuri
- `api/lib/figure_crop.py` — crop mai precis + fundal alb + suport PDF via PyMuPDF
- `api/lib/html_builder.py` — NOU: modul separat pt constructie HTML A4
- `api/lib/translation_router.py` — NOU: modul separat pt rutare traducere (DeepL/Gemini/Groq)
- `api/lib/pipeline.py` — NOU: orchestrare flux complet OCR->crop->traducere->HTML
- `api/lib/rate_limiter.py` — NOU: protectie impotriva abuzului (10 req/min per IP)
- `api/deepl_usage.py` — NOU: endpoint cota DeepL
- `frontend/src/components/traduceri/DocumentViewer.tsx` — pozitionare figuri corecta
- `frontend/src/components/traduceri/DeeplUsage.tsx` — NOU: contor DeepL vizibil
- `frontend/src/lib/translation-cache.ts` — NOU: cache traduceri localStorage
- `frontend/package.json` — update Next.js (CVEs)
- `requirements.txt` — adaugare PyMuPDF

### Task-uri

**Sprint 2.1: Refactorizare backend (reorganizare cod)**
Fisierul translate.py are 1420 linii — totul amestecat intr-un singur loc. Il spargem in module separate, ca fiecare parte sa faca un singur lucru:
- [ ] **Commit snapshot pre-refactorizare** — salvam starea actuala inainte de a schimba ceva (ca o copie de siguranta). Daca ceva nu merge dupa reorganizare, putem reveni instant. (audit S4)
- [ ] Creaza `api/lib/html_builder.py` — extrage functiile care construiesc documentul HTML (layout A4, MathJax, figuri)
- [ ] Creaza `api/lib/translation_router.py` — extrage logica de alegere: DeepL sau Gemini? Prima cheie sau a doua?
- [ ] Creaza `api/lib/pipeline.py` — extrage fluxul complet: OCR -> crop figuri -> traducere -> HTML
- [ ] Simplifica `api/translate.py` — ramane doar punctul de intrare (primeste cererea, trimite la pipeline, returneaza rezultatul)
- [ ] Test: traducere 1 pagina functioneaza identic dupa reorganizare
- [ ] Test: traducere 5 pagini functioneaza identic

**Sprint 2.2: Calitate figuri + pozitionare**
Acum figurile sunt generate de AI (SVG aproximativ). Le inlocuim cu figuri decupate din poza originala:
- [ ] Imbunatatire OCR prompt: Gemini sa returneze coordonatele exacte ale figurilor (unde incepe si unde se termina fiecare desen)
- [ ] Validare coordonate figuri: daca Gemini returneaza coordonate invalide (in afara paginii, dimensiuni zero), afiseaza un placeholder "Figura nu a putut fi extrasa" in loc de imagine corupta (audit SC1)
- [ ] Crop figuri din imaginea originala cu Pillow (ca si cum ai decupa cu foarfeca din poza)
- [ ] Curatare fundal: fundalul decupaturii devine alb curat
- [ ] Pozitionare in HTML: fiecare figura apare exact unde era in original (langa textul corect)
- [ ] Figuri in perechi unde e cazul (P1+P2 unul langa altul, ca in Exemplu_BUN.html)
- [ ] **Suport PDF**: adaugare PyMuPDF in requirements.txt — converteste fiecare pagina PDF in imagine inainte de crop (audit S1). Astfel si PDF-urile au figuri decupate, nu doar pozele.
- [ ] **PyMuPDF DPI = 150** (audit S13): setare explicita DPI 150 (nu 300 care e default in tutoriale). DPI 300 consuma de 4 ori mai multa memorie si face crash pe serverul cu 512 MB. Test: PDF 10 pagini la DPI 150 -> confirma memorie sub 256 MB.
- [ ] Test MINIM: 1 pagina JPEG cu 1 triunghi -> triunghi vizibil, pozitionat corect
- [ ] Test TIPIC: 3 pagini JPEG cu formule + figuri -> toate figurile la locul lor
- [ ] Test TIPIC PDF: 3 pagini PDF -> figuri decupate corect (via PyMuPDF)
- [ ] Test MAXIM: 10 pagini cu figuri complexe (constructii geometrice pas cu pas)
- [ ] Comparatie vizuala cu Exemplu_BUN.html — confirma calitate echivalenta

**Sprint 2.3: Securitate + Protectie abuz**
Verificare fix-uri existente + rezolvare probleme ramase + protectie cote API:
- [ ] Verificare InlineEditor: codul care previne injectare de continut periculos functioneaza
- [ ] Verificare CORS: serverul accepta cereri doar de la site-ul nostru, nu de oriunde
- [ ] Verificare headere securitate: X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- [ ] Update Next.js la ultima versiune (rezolva vulnerabilitati cunoscute)
- [ ] **Rate limiting GLOBAL** (audit S2 + S12): creaza `api/lib/rate_limiter.py` — modul comun aplicat pe TOATE endpoint-urile API, nu doar pe traduceri. Limite diferite per tip:
  - `/api/translate`: 10 cereri/minut, 100/zi per adresa
  - `/api/convert`: 20 cereri/minut, 200/zi per adresa
  - `/api/deepl-usage`: 30 cereri/minut (doar citire, mai permisiv)
  - Viitor `/api/chat`: 30 cereri/minut
  Ca un turnichet: daca cineva trimite prea multe cereri rapid, se blocheaza temporar. Protejeaza cota DeepL/Gemini de abuz.
- [ ] **Mesaje eroare in romana** (audit S14): toate mesajele de eroare afisate utilizatorului sa fie in limba romana, pe intelesul Cristinei. De ex: "Prea multe cereri. Incearca din nou in 1 minut." (nu mesaj tehnic in engleza)
- [ ] Test rate limiting: trimite 15 cereri rapid -> confirma ca a 11-a e refuzata cu mesaj clar in romana
- [ ] Test: deschide site-ul, verifica in browser ca headerele apar corect

**Sprint 2.4: Contor DeepL + Cache traduceri + Fallback**
- [ ] Endpoint `/api/deepl-usage` — returneaza cota COMBINATA a ambelor chei: caractere consumate total, limita totala (1.000.000), procent. Cristina vede un singur numar, nu stie de 2 chei (audit S10, Roland I4).
- [ ] Componenta `DeeplUsage.tsx` — bara vizuala (ca un contor de benzina): verde = mult disponibil, galben = 50-80%, rosu = peste 80%
- [ ] Afisare in pagina Traduceri: "Cota luna: 234.500 / 1.000.000 caractere (23%)"
- [ ] Daca cota e la >90%: mesaj de avertizare "Cota aproape epuizata, mai poti traduce ~X pagini"
- [ ] Switch automat la cheie 2 cand cheie 1 se epuizeaza (deja implementat — verificare)
- [ ] **Cache traduceri persistent** (audit S3): salvare traduceri in localStorage. Cand Cristina traduce o pagina in slovaca, rezultatul ramane salvat chiar daca inchide browser-ul. A doua zi deschide site-ul -> traducerea e inca acolo, fara sa consume iar din cota DeepL. Limita: ~5 MB (cam 30-50 documente). Cand se umple, cele mai vechi se sterg automat.
- [ ] **Cache versioning** (audit S11): cache-ul are un numar de versiune (ex: "v1"). Cand facem o imbunatatire mare la procesarea documentelor (cum ar fi Sprint 2.2), schimbam versiunea la "v2" -> cache-ul vechi se ignora automat. Altfel Cristina ar vedea traduceri vechi (cu figuri proaste) in loc de cele noi (cu figuri bune). E ca un "reset" controlat.
- [ ] **Verificare fallback complet** (audit SC2): test cand ambele chei DeepL sunt epuizate -> traducerea trece automat pe Gemini -> mesaj clar in romana: "Cota DeepL epuizata luna aceasta, se foloseste traducerea alternativa (poate fi putin mai putin precisa)"
- [ ] Test contor: verifica ca numarul combinat afisat corespunde cu realitatea (suma ambelor chei)
- [ ] Test cache: traduce o pagina, inchide browser, redeschide -> traducerea e salvata
- [ ] Test cache versioning: schimba versiunea -> cache-ul vechi nu mai apare

**Sprint 2.5: Teste finale + Deploy**
- [ ] Commit toate modificarile Faza 2
- [ ] Push -> Render deploy
- [ ] Test pe Render live: traducere completa cu figuri (JPEG)
- [ ] Test pe Render live: traducere PDF cu figuri (via PyMuPDF)
- [ ] **Test pe telefon Android** (audit S5): incarca o poza facuta cu telefonul -> vizualizare document tradus -> switch limba RO/SK/EN -> confirma ca totul se vede bine pe ecran mic
- [ ] **Test PDF mare** (audit SC3): incarca un PDF de 25 pagini -> confirma ca se proceseaza in loturi cu mesaj vizibil "Se proceseaza in etape..."
- [ ] **Multi-JPEG upload** (audit S17, Roland I5): cand Cristina selecteaza mai multe poze JPEG dintr-o data, se combina automat intr-un singur document cu N pagini. Frontend: trimite toate imaginile intr-un singur request. Backend: pipeline.py le proceseaza ca pagini ale aceluiasi document, returneaza un singur HTML. Test: upload 3 poze JPEG -> primeste 1 document cu 3 pagini traduse.

### Limite (R14 checklist)
- Timp executie traducere: 1 pagina = ~10-20 sec (OCR + traducere), 5 pagini = ~1-2 min, 20 pagini = ~5-8 min
- Dimensiune fisier: max 4 MB per upload (suficient pt poze de manual)
- Limita DeepL: ~350-500 pagini/luna cu 2 chei. La ~25 pag/zi = suficient pt o luna normala. La epuizare: fallback Gemini cu mesaj clar.
- Limita Gemini OCR: 250 cereri/zi = 250 pagini. Daca traduce 20 pagini/zi = OK cu marja
- Stocare browser: cache traduceri in localStorage (~5 MB, curatare automata). ~30-50 documente pastrate persistent.
- Offline: documentele deja traduse NU sunt disponibile offline (dar sunt in cache la revenire in browser)
- Concurenta: 1 utilizator la un moment dat (Cristina). Rate limiting protejeaza de abuz extern.
- PDF mare: >20 pagini se proceseaza in loturi de 5 (previne epuizare memorie server 512 MB)

### Criterii de acceptare
- Output traducere arata ca Exemplu_BUN.html (figuri identice, pozitionate corect, formule frumoase)
- Figuri corecte si din PDF (nu doar din JPEG) — via PyMuPDF
- translate.py redus la sub 200 linii (restul in module separate)
- Contor DeepL vizibil in pagina Traduceri
- Cache traduceri persistent (nu se pierd la inchidere browser)
- Rate limiting activ (10 req/min per IP)
- Zero vulnerabilitati critice, Next.js actualizat
- Fallback Gemini functioneaza end-to-end cand DeepL e epuizat
- Test pe telefon Android OK

### Exemple de utilizare
1. Cristina fotografiaza 5 pagini de manual cu telefonul
2. Le incarca pe site (drag & drop sau selectie fisiere)
3. Apasa "Traduce in Slovaca"
4. Vede progresul: "Pagina 1/5... 2/5..."
5. Rezultatul apare: text tradus + formule + figuri identice cu originalul
6. Apasa RO -> vede originalul. Apasa SK -> vede traducerea. Switch instant (din cache).
7. In josul paginii vede: "Cota DeepL: 12.340 / 1.000.000 caractere (1%)"
8. Apasa Print -> document A4 perfect
9. Inchide browserul, revine a doua zi -> traducerea e inca acolo (din localStorage)

---

## Faza 3: Convertor polish
### Completare: 0%

### Scop
Convertorul de fisiere sa functioneze complet si corect pe Render: toate tipurile de conversie, diacritice corecte, PDF-uri de calitate.

### Componente afectate
- `api/convert.py` — fix-uri si imbunatatiri
- `frontend/src/app/convertor/page.tsx` — verificare UI

### Task-uri

**Sprint 3.1: Verificare matrice conversie**
- [ ] Test PDF -> Word: text corect, structura pastrata
- [ ] Test Word -> PDF: diacritice RO/SK corecte (s cu haček, t cu haček, a cu breve)
- [ ] Test Word -> HTML: headings, paragrafe, formatare
- [ ] Test Image -> PDF: JPEG/PNG -> PDF corect
- [ ] Test Image -> Image: JPEG <-> PNG
- [ ] Test Markdown -> HTML: formatare corecta
- [ ] Test Markdown -> PDF: text corect
- [ ] Test HTML -> PDF: structura pastrata
- [ ] Test HTML -> Word: headings, paragrafe
- [ ] Test HTML -> Markdown: conversie inversa

**Sprint 3.2: Fix diacritice PDF**
Problema: cand convertesti Word in PDF, literele cu accente slovace/romanesti apar gresit (ca "?" sau patratele).
- [ ] Investigare: actualul generator PDF (fpdf2) nu suporta bine Unicode complet
- [ ] Solutie: adaugare font cu suport Unicode (ex: DejaVu Sans) sau schimbare librarie
- [ ] Test: document cu diacritice RO (a, i, s, t) + SK (c, s, z, d, t, l, n) -> PDF corect
- [ ] Test MAXIM: document 20 pagini cu mix RO+SK -> PDF corect

**Sprint 3.3: Operatii PDF avansate**
- [ ] Test merge: 3 PDF-uri -> 1 PDF corect
- [ ] Test split: PDF 10 pagini -> paginile 3-5 extrase
- [ ] Test compress: PDF 5 MB -> dimensiune redusa
- [ ] Test rotate: rotire pagina 90 grade
- [ ] Test watermark: text "DRAFT" pe toate paginile
- [ ] **Test pe telefon Android** (audit S15): incarca un PDF, converteste in Word, descarca rezultatul — confirma ca totul functioneaza pe ecran mic
- [ ] Commit + Push -> Render deploy

### Limite (R14 checklist)
- Timp: 1 fisier mic = ~2 sec, 1 PDF 50 pagini = ~10-15 sec, merge 10 PDF-uri = ~20-30 sec
- Dimensiune: max 4 MB upload. PDF-uri mai mari de 50 pagini pot depasi 512 MB RAM pe Render
- Offline: NU functioneaza offline
- Diacritice: limitate de fontul PDF inclus (de rezolvat in Sprint 3.2)

### Criterii de acceptare
- Toate cele 10 tipuri de conversie functioneaza pe Render
- Diacritice romanesti si slovace corecte in PDF-uri generate
- Operatii PDF avansate (merge, split, compress, rotate, watermark) functionale

---

## Faza 4: Chat AI (SCHITAT — se detaliaza cand ajungem aici)
### Completare: 0%

### Scop
Asistent AI integrat in aplicatie. Cristina poate pune intrebari, trimite poze, cere explicatii matematice.

### Componente estimate
- `frontend/src/app/chat/page.tsx` — pagina chat (tab nou)
- `frontend/src/components/chat/ChatPanel.tsx` — interfata conversatie
- `frontend/src/components/chat/MessageList.tsx` — lista mesaje
- `frontend/src/components/chat/AISelector.tsx` — selectare Gemini/Groq
- `api/chat.py` — endpoint chat cu streaming
- `api/lib/chat_providers.py` — rutare Gemini/Groq

### Functionalitati principale
- Chat conversational cu AI (intrebari si raspunsuri)
- Upload imagine in chat: "Ce contine aceasta pagina?"
- Selectare AI: Gemini 2.5 Flash (inteligent, vede poze) sau Groq Llama 3.3 (rapid, doar text)
- Formule matematice in raspunsuri (randate cu MathJax)
- Context din document: daca un document e incarcat, AI-ul il poate referi
- Istoric chat salvat local (se pastreaza si dupa inchidere browser)

### Nota importanta — Cota Gemini (audit S7)
Chat AI foloseste **Groq prioritar** pentru intrebari text (14.400 cereri/zi — practic nelimitat). **Gemini se foloseste DOAR** cand Cristina trimite o poza in chat (analiza imagine). Astfel cota Gemini (250/zi) ramane disponibila pentru OCR-ul de traduceri.

### Limite estimate (R14)
- Gemini: partajeaza limita de 250 cereri/zi cu OCR-ul. Chat-ul foloseste Groq pt text -> impact minim pe cota OCR
- Groq: 14.400 cereri/zi — practic nelimitat pentru chat text
- Stocare: istoric chat in localStorage, ~1-2 MB per conversatie lunga
- Offline: NU functioneaza (necesita internet pentru AI)

---

## Faza 5: Calculator matematic (SCHITAT — se detaliaza cand ajungem aici)
### Completare: 0%

### Scop
Calculator stiintific in browser. Cristina scrie o formula sau ecuatie, vede rezultatul calculat si graficul functiei. Totul local, fara internet necesar.

### Componente estimate
- `frontend/src/app/calculator/page.tsx` — pagina calculator (tab nou)
- `frontend/src/components/calculator/CalculatorPanel.tsx` — interfata principala
- `frontend/src/components/calculator/GraphPlot.tsx` — grafic functii 2D
- `frontend/src/components/calculator/UnitConverter.tsx` — convertor unitati

### Functionalitati principale
- Calcule: ecuatii, sisteme, simplificari, factorizari
- Geometrie: arii, perimetre, volume, Pitagora, trigonometrie
- Grafice: plot 2D (sinus, cosinus, polinoame)
- Convertor unitati: lungime, suprafata, volum, unghi, temperatura
- Input LaTeX: scrie formula, vezi rezultatul randat
- Istoric calcule salvat local

### Limite estimate (R14)
- 100% client-side (math.js) — ZERO cereri server, ZERO costuri API
- Offline: DA, functioneaza complet fara internet
- Stocare: ~500 KB pentru istoric calcule
- Performanta: calcule instant (sub 100ms). Grafice complexe pot dura 1-2 sec pe telefon vechi

---

## Faza 6: Teste — corectare + generare (MENTIONAT — se planifica ulterior)
### Completare: 0%

### Scop
Doua sub-functionalitati:
1. **Corectare teste din foto**: Cristina fotografiaza testul unui elev, AI-ul il corecteaza automat si da nota
2. **Generare teste noi**: Cristina incarca pagini de manual, specifica parametri (numar intrebari, dificultate, limba), AI-ul genereaza testul + baremul

### Note
- Depinde de Modul 4 (Chat AI) pentru integrare
- Cel mai complex modul (prompt engineering avansat)
- Se va planifica detaliat dupa finalizarea Fazelor 1-5

---

## Checklist R14 — Sumar limite per modul

| Modul | MINIM (1 pag) | TIPIC (5 pag) | MAXIM (20 pag) | Limita lunara |
|-------|--------------|---------------|----------------|---------------|
| **Traduceri OCR** | ~10-15 sec | ~1-2 min | ~5-8 min (loturi) | 250 pag/zi (Gemini) |
| **Traduceri DeepL** | ~3-5 sec | ~10-20 sec | ~30-60 sec | ~350-500 pag/luna (2 chei) |
| **Convertor** | ~2 sec | ~5-10 sec | ~20-30 sec | Nelimitat (local pe server) |
| **Chat AI** | instant | n/a | n/a | ~14K mesaje/zi (Groq) + ~50 poze/zi (Gemini) |
| **Calculator** | instant | n/a | n/a | Nelimitat (local in browser) |

---

## Ordinea de implementare

```
Faza 1 ──> Faza 2 ──────────────> Faza 3 ──> Faza 4 ──> Faza 5 ──> Faza 6
Reparatii   Calitate + Securitate  Convertor  Chat AI   Calculator  Teste
+ Ecran     + Refactor + Cache     polish    (schitat)  (schitat)  (mentionat)
incarcare   + Contor + Rate limit
            + PyMuPDF + Fallback
```

**Regula**: Nu se trece la faza urmatoare pana nu e completa faza curenta si confirmata de Roland.
