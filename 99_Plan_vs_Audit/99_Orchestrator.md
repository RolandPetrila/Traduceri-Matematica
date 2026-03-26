 1.  apoi terbuie sa  stabilim si care dintre t1 sau t2 testeaza toate implementaarile si le valideaza . putem adauga agenti care sa  
      monitorizeze executiile sa ne asiguram ca sunt complete ? sa putem vedea toate caile care au fost utilizate / cercetate ?  astept       sugestii + completari clare

    Bune intrebari. Raspund cu ce stiu din sistemul pe care l-am construit:

    Cine testeaza si valideaza?

    T1 testeaza in timpul implementarii — ruleaza codul, verifica ca functioneaza la nivelurile MINIM/TIPIC/MAXIM (regula R14 pe care  
    tocmai am adaugat-o).

    T2 valideaza DUPA implementare — cand ii scrii t2 verifica implementarea, citeste codul, verifica calitatea, cauta probleme. Dar T2     nu ruleaza cod — doar il analizeaza.

    Sugestia mea: T1 testeaza, T2 valideaza, combinat:
    - T1 ruleaza testele si scrie rezultatele in PLAN_v3.md la fiecare task (ex: [x] Traducere 1 pagina — OK, 8s, [x] Traducere 10     
    pagini — OK, 47s)
    - T2 verifica daca T1 a testat la toate nivelurile si daca rezultatele sunt realiste

    Agenti de monitorizare executii

    Da, se poate. T1 are acces la Agent tool — poate lansa agenti paraleli care:
    - Ruleaza teste automate in background
    - Verifica build-ul
    - Scaneaza codul pentru probleme

    Propunere concreta — regula noua R15 pentru T1:
    - Dupa fiecare sprint implementat, T1 lanseaza un agent Explore care scaneaza tot ce s-a modificat si genereaza un mini-raport:    
    fisiere atinse, functii create, dependente adaugate, potentiale probleme
    - Rezultatul se scrie intr-o sectiune "Raport executie" in PLAN_v3.md

    Vizibilitatea cailor cercetate

    Problema: Acum nu stii ce a cautat T1 sau T2 inainte sa ia o decizie. Poate a gasit 3 variante dar ti-a aratat doar 1.

    Solutie — regula noua: La fiecare decizie tehnica, T1 sa scrie in PLAN_DECISIONS.md:
    ### Variante cercetate
    - V1: [ce a gasit] — PRO: ... / CONTRA: ...
    - V2: [ce a gasit] — PRO: ... / CONTRA: ...
    - Aleasa: V1 — Motiv: ...
    - Surse verificate: [link/tool folosit]

    Astfel vezi tot traseul de gandire, nu doar concluzia.

    ---
    Cand imi scrii t3, imi ceri sa adaug aceste reguli in T1_REGULAMENT.md si T2_REGULAMENT.md. Eu am informatia clara, trebuie doar sa     editez fisierele (ceea ce pot face doar in terminalul principal, nu in acest side-response).  





2.   STRUCTURA PROPUSA — PLAN v3

  Faza 1: Reparatii urgente (blocheaza functionarea)

  - Fix convertorul (bug gasit — se repara in 2 minute)
  - Test convertor pe Render (confirma ca merge dupa fix)
  - Curatenie din v2 neincheiat (dezactivare Vercel, update documentatie)

  Faza 2: Calitate traduceri (figuri + pozitionare)

  Scopul: documentele traduse sa arate ca Exemplu_BUN.html
  - Imbunatatire figuri: decupate din poza originala (nu desenate de AI) — imaginile sa fie identice cu ce vede Cristina in manual     
  - Pozitionare figuri: fiecare desen apare exact unde e in original (langa "Pasul 3", nu la sfarsit de pagina)
  - Reorganizare cod backend: fisierul mare de traducere (1420 linii) se imparte in module mai mici — ca un sertar mare cu tot
  amestecate se organizeaza in cutii separate pe categorii
  - Teste pe 3 niveluri:
    - MINIM: 1 pagina simpla
    - TIPIC: 3-5 pagini cu formule si figuri
    - MAXIM: 10-20 pagini (limita de stress)

  Faza 3: Convertor polish

  - Verificare toate tipurile de conversie pe Render
  - Fix diacritice slovace in PDF-uri generate (sa scrie corect "s cu haček", nu "?")

  Faza 4: Chat AI (schitat, nu detaliat inca)

  - Cristina selecteaza AI-ul (Gemini sau Groq) si pune intrebari
  - Poate trimite o poza si AI-ul explica ce contine
  - Poate intreba despre documentul deja incarcat

  Faza 5: Calculator matematic (schitat)

  - Calculator in browser, fara internet necesar
  - Ecuatii, grafice, geometrie, unitati de masura

  Faza 6: Teste — corectare + generare (doar mentionat)

  - Corectare teste din foto
  - Generare teste noi pe baza manualului

  ---
  Limite servicii gratuite (R14)

  ┌─────────────────────────┬────────────────────────────────────┬────────────────────────────────────────────────────────────────┐    
  │        Serviciu         │          Ce ofera gratuit          │                    Cat inseamna in practica                    │    
  ├─────────────────────────┼────────────────────────────────────┼────────────────────────────────────────────────────────────────┤    
  │ DeepL (traducere)       │ 500.000 caractere/luna/cheie (avem │ ~300-500 pagini A4 pe luna (formulele nu se numara)            │    
  │                         │  2 chei)                           │                                                                │    
  ├─────────────────────────┼────────────────────────────────────┼────────────────────────────────────────────────────────────────┤    
  │ Gemini (OCR + chat)     │ ~1500 cereri/zi, 15/minut          │ ~1500 pagini OCR pe zi (mai mult decat suficient)              │    
  ├─────────────────────────┼────────────────────────────────────┼────────────────────────────────────────────────────────────────┤    
  │ Groq (traducere backup  │ ~14.400 cereri/zi                  │ Suficient ca backup                                            │    
  │ + chat)                 │                                    │                                                                │    
  ├─────────────────────────┼────────────────────────────────────┼────────────────────────────────────────────────────────────────┤    
  │ Render (server)         │ Gratuit cu pauza dupa 15 min       │ Prima incarcare dupa pauza dureaza 30-60 secunde (ecran de     │    
  │                         │ inactivitate                       │ asteptare). Dupa, merge normal                                 │    
  └─────────────────────────┴────────────────────────────────────┴────────────────────────────────────────────────────────────────┘    

  Concluzie: Cristina poate traduce 15-25 pagini pe zi fara nicio problema. Daca traduce un manual intreg (100+ pagini), cotele DeepL  
  se impart pe ~2 saptamani.

  ---
  Esti de acord cu aceasta structura? Ai ceva de adaugat sau modificat inainte sa scriu PLAN_v3.md complet?

✻ Worked for 4m 3s

● Agent "Research DeepL free API limits" completed

● Agent "Research Gemini free API limits" completed

● Agent "Research Render free tier limits" completed

● Cercetarea s-a finalizat. Rezultatele sunt mai precise decat estimarile mele initiale — Gemini are limite mai mici decat credeam.    
  Actualizez tabelul:

  Limite servicii gratuite (CORECTATE dupa cercetare)

  ┌─────────────────┬──────────────────────────────┬───────────────────────────────────────────────────────────────────────────────┐   
  │    Serviciu     │       Ce ofera gratuit       │                         Cat inseamna pentru Cristina                          │   
  ├─────────────────┼──────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┤   
  │ DeepL           │ 500.000 car./luna/cheie      │ ~350-500 pagini/luna. Formulele matematice protejate NU se numara. Un manual  │   
  │ (traducere)     │ (avem 2 chei = 1 milion      │ intreg (~100 pag.) = ~3-4 zile de cota.                                       │   
  │                 │ total)                       │                                                                               │   
  ├─────────────────┼──────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┤   
  │                 │                              │ ~250 pagini OCR pe zi (1 poza = 1 cerere). Daca Cristina traduce 10-20        │   
  │ Gemini (OCR)    │ 250 cereri/zi, 10/minut      │ pag./zi, e mai mult decat suficient. Dar la un manual de 100 pag. odata = ar  │   
  │                 │                              │ trebui impartit pe 2 zile.                                                    │   
  ├─────────────────┼──────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┤   
  │ Groq (traducere │ ~14.400 cereri/zi            │ Suficient ca rezerva daca DeepL e epuizat                                     │   
  │  backup)        │                              │                                                                               │   
  ├─────────────────┼──────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┤   
  │                 │ 750 ore/luna pt TOATE        │ Avem 2 servicii care impart cele 750 ore. Cu utilizare normala (cateva        │   
  │ Render (server) │ serviciile, 512 MB memorie   │ ore/zi) = OK. Daca ambele ruleaza non-stop = depasire. Prima accesare dupa    │   
  │                 │                              │ pauza: 30-60 sec asteptare (serverul "se trezeste").                          │   
  └─────────────────┴──────────────────────────────┴───────────────────────────────────────────────────────────────────────────────┘   

  Ce s-a schimbat fata de estimarea initiala:

  - Gemini: 250 pagini/zi (nu 1500 cum credeam) — tot suficient, dar trebuie tinut cont la traduceri masive
  - Render: 750 ore impartite pe 2 servicii — merge la utilizare intermitenta, dar nu 24/7
  - Timeout server: 100 minute per cerere — foarte generos, nu va fi problema

  Solutii propuse pentru limite:

  1. Gemini 250/zi: Procesam paginile una cate una cu progres vizibil. La 20+ pagini, le punem la coada si le traducem pe rand.        
  2. Render 750 ore: Serverele se opresc automat cand nu le foloseste nimeni (economie de ore). La prima accesare dupa pauza, Cristina 
  va vedea un ecran "Se incarca..." timp de 30-60 secunde.
  3. DeepL 1M caractere: Cu 2 chei, avem cota dubla. Afisam in aplicatie cat s-a consumat (ca un contor de benzina).

  ---
  Restul structurii ramane la fel (Faza 1-6 cum le-am prezentat mai sus). Esti de acord sa incep scrierea PLAN_v3.md?

