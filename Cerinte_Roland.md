# Cerinte Roland — Sistem Traduceri Matematica
# Document complet de cerinte | Versiune finala | 2026-03-22

---

## 1. PIPELINE TRADUCERE (CORE)

1.1. Input: fotografii/documente cu manuale de matematica romanesti (format imagine: JPG, PNG, PDF)
1.2. AI Vision OCR: extragere text din imagini cu recunoastere completa a notatiei matematice (simboluri, formule, indici, exponenti, caractere speciale: unghi, triunghi, apartine, grad etc.)
1.3. Output intermediar: fisiere Markdown structurate cu LaTeX ($...$, $$...$$) si SVG inline pentru figuri geometrice
1.4. Traducere AI: din romana in slovaca (primar) si engleza, cu posibilitate de extensie la alte limbi
1.5. Generare HTML A4 printabil cu MathJax pentru formule si SVG inline pentru constructii geometrice
1.6. Pastrare fidela a layout-ului original — figurile apar exact unde sunt in original, nu grupate separat
1.7. Pastrarea completa a TUTUROR elementelor matematice: formule, simboluri, constructii geometrice, unghiuri, arce, etichete, cote
1.8. Numar de pagina in partea de jos (ca in originalul fotografiat)
1.9. FARA header "Source: pagina_xxxx.md" in output
1.10. Auto-scaling JavaScript pentru incadrare continut pe pagini A4
1.11. Protectie LaTeX prin markdown processing (protect_math / restore_math cu placeholders)

---

## 2. FIGURI GEOMETRICE (SVG)

2.1. Figuri SVG inline generate cu coordonate calculate precis (scala ~20px/cm)
2.2. Elemente suportate: linii, poligoane, cercuri, arce de cerc (unghiuri), linii punctate de constructie, markere de unghi drept
2.3. Etichete: varfuri (italic), masuratori (cm, grade), culori diferentiate (rosu #c44 pentru un unghi, verde #1a7 pentru al doilea)
2.4. Containerele SVG wrappate in `<div>` pentru passthrough corect prin Python-Markdown
2.5. Figuri side-by-side (flex layout) acolo unde originalul le afiseaza asa
2.6. Triunghi completat cu fill #e8f0fe pentru pasul final de constructie

---

## 3. PROVIDERI AI

3.1. **Provider primar: Google Gemini Free Tier** (cheia API existenta)
     - Vision OCR + traducere
     - Limite: 15 RPM, 1M tokens/zi
     - Cost: GRATUIT
3.2. **Fallback traducere: Groq** (cheia API existenta)
3.3. **Fallback vision: Mistral/Pixtral** (cheia API existenta)
3.4. Sistem de fallback automat: daca providerul primar esueaza, trece automat la urmatorul
3.5. Extensibil pentru adaugarea de noi provideri AI in viitor
3.6. **CONSTRANGERE ABSOLUTA: totul GRATUIT — zero abonamente, zero costuri recurente**

---

## 4. LIMBI SUPORTATE

4.1. Limba sursa: Romana (RO)
4.2. Limbi tinta initiale: Slovaca (SK), Engleza (EN)
4.3. Extensibil la alte limbi (ex: maghiara, ceha) — adaugare din dropdown in UI
4.4. Calitate maxima pentru toate limbile: diacritice corecte, terminologie matematica precisa
4.5. Dictionar terminologic care invata din corectiile utilizatorului si asigura consistenta

---

## 5. INTERFATA WEB (UI)

### 5.1. Design vizual
5.1.1. Tema: **Tabla verde + creta** — fundal verde-inchis tip tabla scolara (#2d5016)
5.1.2. Text alb/galben ca scris cu creta
5.1.3. Formule matematice decorative in fundal (subtle)
5.1.4. Butoane stilizate ca elemente de tabla
5.1.5. Atmosfera calda, educationala, dedicata matematicii
5.1.6. Numele aplicatiei: **"Sistem Traduceri"**

### 5.2. Tab Traduceri (principal)
5.2.1. Drag and drop upload fisiere (imagini, PDF)
5.2.2. Selectie limba sursa si limba tinta din dropdown-uri
5.2.3. Preview side-by-side: original (stanga) vs. traducere (dreapta)
5.2.4. Editor inline Markdown cu preview live (syntax highlighting + HTML renderizat in timp real cu formule MathJax)
5.2.5. Bara de progres in timp real pe durata procesarii
5.2.6. Maxim 10 pagini per batch
5.2.7. Dictionar terminologic — panel pliabil in tab-ul Traduceri:
       - Vizualizare termeni invatati
       - Adaugare/editare manuala
       - Aplicare automata la traduceri viitoare
5.2.8. Download rezultat (HTML, PDF)

### 5.3. Tab Convertor Fisiere (separat)
5.3.1. Conversii suportate: PDF-DOCX, IMG-PDF, MD-HTML, si toate combinatiile valide
5.3.2. Selectie inteligenta: UI afiseaza doar perechile de conversie valide pentru tipul de fisier incarcat
5.3.3. Calitate superioara la toate conversiile
5.3.4. Operatii pe fisiere:
       - **Merge**: combinare mai multe fisiere intr-unul singur
       - **Split**: impartire fisier in mai multe parti
       - **Compress**: reducere dimensiune fisier
5.3.5. Editare/optimizare PDF:
       - Rotire pagini
       - Stergere pagini
       - Reordonare pagini
       - Optimizare dimensiune
       - Adaugare watermark
5.3.6. Drag and drop upload
5.3.7. **NU incetineste pipeline-ul principal de traducere** — functioneaza independent

### 5.4. Istoric si Tracking (Run History)
5.4.1. Istoric complet al traducerilor efectuate
5.4.2. Detalii per rulare: data, fisiere procesate, limba sursa -> tinta, status (succes/eroare), durata
5.4.3. Preview rezultat din istoric
5.4.4. Re-descarcare orice traducere anterioara
5.4.5. Persistenta in browser (localStorage sau IndexedDB)

### 5.5. Functionare generala
5.5.1. Doar online (nu necesita mod offline)
5.5.2. Fara autentificare/parola — acces direct
5.5.3. Responsive: desktop + mobil
5.5.4. Performanta: UI fluid, fara lag la interactiuni

---

## 6. PWA (Progressive Web App)

6.1. manifest.json complet cu numele "Sistem Traduceri"
6.2. Service Worker pentru caching resurse statice
6.3. Iconita dedicata cu tema matematica (sugestiva pentru traduceri matematice)
6.4. Instalabil pe:
     - **Windows**: iconita pe Desktop, lansare ca aplicatie standalone
     - **Android**: iconita pe Home Screen, experienta full-screen
     - **iPhone/iPad**: Add to Home Screen, experienta full-screen
6.5. Functioneaza perfect pe orice laptop cu Windows, orice telefon Android si iPhone

---

## 7. STACK TEHNIC

7.1. **Frontend**: Next.js 14 + Tailwind CSS + shadcn/ui
7.2. **Backend**: FastAPI (Python) — reutilizeaza scripturile existente din pipeline-ul CLI
7.3. **Rendering formule**: MathJax 3 (CDN)
7.4. **Figuri**: SVG inline generat server-side
7.5. **State management**: React hooks + Context (fara Redux — simplitate)
7.6. **Stilizare**: Tailwind CSS cu tema custom "tabla verde"

---

## 8. DEPLOYMENT SI CI/CD

8.1. **GitHub**: repo https://github.com/RolandPetrila/Traduceri-Matematica.git
8.2. **Vercel**: deployment automat
8.3. Auto-deploy la fiecare push pe branch-ul principal (CI/CD)
8.4. Toate operatiunile de deploy automate — fara interventie manuala
8.5. Cont GitHub si Vercel existente (ale utilizatorului)

---

## 9. EXTENSIBILITATE

9.1. Adaugare limbi noi din dropdown (fara modificari de cod)
9.2. Adaugare functii noi ca module separate (ex: quiz generator, rezolvare exercitii)
9.3. Modulele noi nu afecteaza pipeline-ul de traducere de baza
9.4. Arhitectura modulara: fiecare functionalitate e izolata
9.5. Sistemul accepta imbunatatiri si completari pe parcurs fara refactorizare majora

---

## 10. CALITATE SI VALIDARE

10.1. Suport complet pentru TOATA notatia matematica (simboluri, formule, constructii geometrice, grafice)
10.2. Diacritice corecte in slovaca (ex: trojuholnik -> trojuholnik cu diacritice)
10.3. Validare automata traduceri: detectie limba, verificare markere draft, comparare terminologie
10.4. Encoding fallbacks: UTF-8, UTF-8-SIG, CP1250, Latin-1
10.5. Dictionar terminologic cu invatare din corectii
10.6. Calitate maxima prioritizata la toate nivelurile

---

## 11. SECURITATE

11.1. Chei API stocate EXCLUSIV in variabile de mediu (.env) — NICIODATA in cod
11.2. .env in .gitignore — nu se urca pe GitHub
11.3. .env.example cu structura (fara valori reale) pentru documentare

---

## 12. LOCATIE PROIECT

12.1. **Proiect nou**: C:\Proiecte\Traduceri_Matematica
12.2. **Proiect existent** (pipeline CLI): C:\Users\ALIENWARE\Desktop\Cristina\Extragere_Traducere_HTML_Codex
12.3. Scripturile Python existente se reutilizeaza/adapteaza in backend-ul FastAPI

---

## 13. METODOLOGIE

13.1. PLAN_PROIECT.md va fi creat pe baza structurii din TEMPLATE_PLANIFICARE_PROIECT_V2.md
13.2. Categorii aplicate: A (produs), C (cazuri utilizare), D (volum), E (calitate), G (infrastructura), H (formate livrare), I (monitorizare), J (memorie)
13.3. Checklist de validare inainte de implementare (Sectiunea 8 din template)
13.4. Ordine de implementare cu dependente explicite

---

## SUMAR CANTITATIV

| Categorie | Cerinte |
|-----------|---------|
| Pipeline traducere | 11 |
| Figuri geometrice SVG | 6 |
| Provideri AI | 6 |
| Limbi suportate | 5 |
| Interfata web UI | 28 |
| PWA | 5 |
| Stack tehnic | 6 |
| Deployment CI/CD | 5 |
| Extensibilitate | 5 |
| Calitate si validare | 6 |
| Securitate | 3 |
| Locatie proiect | 3 |
| Metodologie | 4 |
| **TOTAL** | **93** |

---

*Document generat pe 2026-03-22 | Confirmat de Roland in sesiunea de clarificare (3 runde initiale + 2 runde suplimentare)*
*Toate cerintele au fost validate cu minimum 95% claritate conform Regulii Supreme*
