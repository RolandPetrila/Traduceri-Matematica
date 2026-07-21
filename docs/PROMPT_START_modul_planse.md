# Prompt de start — modul „Planșe" (de atașat după /onboard)

> Copiază blocul de mai jos ca PRIMUL mesaj într-o sesiune Claude Code deschisă în `C:\Proiecte\Traduceri_Matematica`, DUPĂ ce rulezi `/onboard`. Plan complet: `docs/PLAN_modul_planse.md`.

---

Implementezi un MODUL NOU în această aplicație (Traduceri_Matematica): modulul „Planșe" — sub-taburi care generează planșe educaționale A4 print-ready, INSTANT și OFFLINE. Planul complet, APROBAT, e în `docs/PLAN_modul_planse.md` — CITEȘTE-L INTEGRAL înainte de orice. Mai jos e doar orientarea.

═══ PROTOCOL OBLIGATORIU (cum lucrezi) — §17 din plan ═══
NU scrie cod până nu stabilești cu mine EXACT ce implementezi. Pentru FIECARE funcționalitate (nu doar fiecare fază):

1. Rulează runde MULTIPLE de AskUserQuestion ca să clarifici exact ce faci — cu mock/exemplu concret când forma contează (UI, layout, structură de puzzle).
2. La fiecare rundă oferă îmbunătățiri și recomandări adaptate contextului (nu opțiuni seci) — marchează [Recomandat] cu 1 motiv.
3. Confirmare per piesă („da, asta") înainte de cod; NU trece la faza următoare fără confirmare.
4. Ciclu per funcționalitate: clarifică → recomandă → confirmă → implementează → verifică (selftest verde) → arată rezultatul.
   Fără presupuneri, nimic „pe ghicite".

═══ CE FACE FOLDERUL-SURSĂ (generatoarele care se portează) ═══
Sursa = `G:\My Drive\Roly\4. Artificial Inteligence\Folder_Lucru\Carla\Planse_interactive\` (alt proiect, același PC — se CITEȘTE, NU se modifică). 6 generatoare Python deterministe (stdlib), fiecare cu build()/randeaza()/selftest(), fiecare produce HTML A4 (pagini puzzle + pagini răspuns ascunse la print):
• Numere_Incrucisate/generator_numere.py — careu 3×3 multi-crossing. Params: nivel {Ușor/Standard/Avansat} × operație {adunare/scădere/înmulțire/împărțire}. Corectitudine: 6 ecuații + gate unicitate prin enumerare completă.
• Numere_Incrucisate/generator_integrama.py — integramă „crossword" aritmetică: ecuații a op b = c încrucișate în operanzi, toate 4 operațiile. Params: nr_ecuații (dificultate). Corectitudine: solver de propagare forțată ⇒ soluție unică.
• Labirint/generator_labirint.py — labirint perfect (recursive backtracker). Params: nivel {8/12/16}. Corectitudine: arbore (muchii=celule−1) + BFS drum unic.
• Uneste_Punctele/generator_uneste.py — connect-the-dots SVG. Params: nivel (nr vârfuri) sau formă. DATE: ../Biblioteca_Trasee/trasee_catalog.json (27 forme).
• Dictare_Grafica/generator_dictare.py — dictare grafică pe grilă. Params: nivel int 2-5 sau formă. DATE: același trasee_catalog.json.
• Cautare_Cuvinte/generator_cautare.py — word search. Params: temă (24) × nivel {10×10/12×12/14×14}. DATE: banca_cuvinte.json.
Cele 2 fișiere de date (banca_cuvinte.json, trasee_catalog.json) se COPIAZĂ ca active în frontend/public/planse/data/.

═══ CE CONSTRUIEȘTI ═══
Modul IFRAME-IZOLAT în frontend/public/planse/ (exact ca modulul editor/), embedat prin frontend/src/app/planse/page.tsx. Generatoarele PORTATE în JS (rulează în browser: offline, instant), cu Python ca ORACOL (replici PRNG-ul Python — MT19937 — + porți self-testele → păstrezi garanția de corectitudine). Sub-tab per generator + „Școlare" separat. Istoric anti-repetiție hibrid (IndexedDB + Supabase). Coș → un singur PDF (window.print).

═══ URMĂTORUL PAS — fă DOAR Faza 0 (schelet NATIV) ═══
PRIMAR (adopție nativă, §16.3 din plan): fă convenția "iframe-module" ca modulele să fie drop-in — (a) sursă unică tabs.json (config/tabs.json canonic, copiat în frontend/config/ la prebuild), (b) în page.tsx derivă validarea din TABS (nu array hardcodat pe linia ~24), (c) componentă generică <IframeModule tabId> pentru taburi cu "kind":"iframe". Apoi adaugi DOAR intrarea "planse" (kind:iframe) în tabs.json + folderul public/planse/ minimal. TEST DE REGRESIE: cele 5 taburi existente trebuie să meargă după refactor. Dacă convenția dă probleme, FALLBACK la pașii manuali de mai jos (§4 din plan), ca să nu blochezi Planșe:

1. tab „Planșe" în config/tabs.json ȘI frontend/config/tabs.json (identic: {"id":"planse","label":"Planșe","icon":"🧩"}).
2. frontend/src/app/page.tsx: dynamic import PlansePage + adaugă "planse" în array-ul de validare localStorage (~linia 24) + div cu display-toggle.
3. frontend/src/app/planse/page.tsx: copie a app/editor/page.tsx (header chalk-* + iframe src="/planse/index.html").
4. frontend/public/planse/{index.html, app.js, style.css} minimal — bară sub-taburi „în construcție".
   Rulează `cd frontend && npm run dev`, confirmă că tabul „Planșe" apare și deschide shell-ul gol. NU trece la Faza 1 fără confirmarea mea.

═══ CONTEXT CRITIC (să nu repeți greșeli) ═══
• Corectitudinea e invariantul central: niciun generator „gata" fără selftest verde (selftest.html) + cross-check contra Python (același seed → același rezultat via MT19937).
• Modul IZOLAT: NU atinge pipeline-ul de traduceri/OCR. Doar adăugiri aditive.
• Temă „cretă": folosește clasele chalk-* (model: app/editor/page.tsx).
• Două tabs.json de ținut SINCRON + extinde array-ul de validare din page.tsx (altfel tabul salvat nu se restaurează).
• Unicitate = niciodată exact aceeași planșă (dedup pe semnătură). Unește/Dictare sunt MĂRGINITE de catalog (27 forme) → se pot epuiza.
• Sub-tabul „Școlare" = AI la cerere (Faza 4, ONLINE, NU offline) și cere întâi fix-ul a 7 regulamente greșite din proiectul Carla — NU-l începe în Faza 0.
• Generatoarele Carla se CITESC via G:\ (sursa de adevăr); NU copia folderul — portezi doar logica + cele 2 JSON de date.

Plan complet: docs/PLAN_modul_planse.md. Copie: ~/.claude/plans/care-ar-fi-posibilitatea-robust-crown.md.
