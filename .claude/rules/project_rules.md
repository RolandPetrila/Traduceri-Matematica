# Reguli Proiect — Sistem Traduceri Matematica

## R-COST: Zero costuri

Toate API-urile si serviciile trebuie sa fie pe plan GRATUIT.
Nu propune niciodata solutii cu costuri, fara exceptie.

## R-MATH: Completitudine matematica

Orice pipeline de traducere trebuie sa pastreze 100% din notatia matematica:
formule LaTeX, simboluri speciale, figuri (crop bbox din original), constructii geometrice.
Pierderea oricarui element matematic = bug critic.

## R-LAYOUT: Pastrare layout

Figurile geometrice apar exact unde sunt in documentul original.
Nu se grupeaza separat, nu se muta la sfarsit.

## R-LANG: Limba

- Documentatie, UI, mesaje: ROMANA
- Cod sursa, variabile, comentarii cod: ENGLEZA
- Nu amesteca limbile in acelasi context

## R-THEME: Tema UI

Tema vizuala: tabla verde + creta. Orice componenta UI noua
trebuie sa respecte paleta: fundal verde-inchis, text alb/galben, stil creta.

## R-SEC: Securitate API

Chei API exclusiv in .env. La orice citire accidentala a .env,
avertizeaza IMEDIAT si recomanda regenerarea cheilor.

## R-EXT: Extensibilitate

Functionalitati noi = module separate. Nu modifica pipeline-ul
de traducere de baza cand adaugi feature-uri noi.

## R-DEPLOY: Deploy Vercel + Supabase (free)

Deploy pe Vercel (frontend Next.js + backend Python serverless), log-uri pe Supabase.
Totul pe free tier. Functiile serverless au limita `maxDuration` 300s pe Hobby (setat in
vercel.json) → orice procesare grea (OCR) se face per-pagina (o invocare/pagina), bună
practica, comod sub limita. Fara proces persistent in productie.
Deploy-ul real (linkare conturi, env vars) necesita confirmare explicita de la Roland.

## R-EDIT: Editare live persistenta

Pasii 2 (RO) si 3 (SK) sunt editabili. Editarile contentEditable TREBUIE salvate in state
(cacheRef) — sa supravietuiasca la switch de limba SI in toate export-urile. Pasul 1 (original) read-only.

## R-EXPORT: Export din continut editat

Export PDF (print vectorial + MathJax typeset, nu raster), DOCX (backend), HTML — toate
reflecta continutul EDITAT de utilizator, nu datele OCR originale.

## R-DIAG: Diagnostic live cu coduri de eroare

Fiecare eroare are un cod (`E-<ARIE>-<NNN>`, vezi config/error_codes.json), logat in Supabase,
vizibil live cross-device pe /diagnostics. Apelurile Supabase sunt fail-open (nu blocheaza fluxul).

## R-HANDOFF: Context transferabil intre sesiuni (OBLIGATORIU)

Scopul: orice sesiune noua sa reia munca la ~100% context, fara pierdere, ca si cum ar continua.
Pentru asta, "creierul" proiectului traieste in FISIERE PERSISTENTE, nu in memoria sesiunii:
`docs/HANDOFF_SESIUNE.md` (stare + prompt de reluare + context operational) + planul activ din
`docs/PLAN_*.md` (faze bifabile + decizii + non-regresie) + memoria proiectului + git.

Reguli obligatorii pentru FIECARE sesiune:

1. **La START:** citeste `docs/HANDOFF_SESIUNE.md` + planul activ (`docs/PLAN_*.md`) inainte de a continua.
2. **DUPA fiecare faza/livrabil:** actualizeaza la zi, IMEDIAT:
   - `docs/HANDOFF_SESIUNE.md` — progresul + "urmatorul pas" + orice context operational nou;
   - planul activ — bifeaza [x]/[~] cu data;
   - memoria proiectului (`memory/*` + `MEMORY.md`) — decizii/capcane noi;
   - commit + push (jurnal in git).
3. **Cand contextul se apropie de limita** (~sesiune lunga): verifica handoff-ul e complet, apoi
   spune user-ului sa deschida o sesiune noua cu `/onboard` + citirea handoff-ului.
4. Handoff-ul + planul + memoria = SURSA de adevar transferabila; tine-le sincrone cu realitatea
   codului (anti-stale). Un handoff invechit e mai periculos decat lipsa lui.
