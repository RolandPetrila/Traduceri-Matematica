# Reguli Proiect — Sistem Traduceri Matematica

## R-COST: Zero costuri
Toate API-urile si serviciile trebuie sa fie pe plan GRATUIT.
Nu propune niciodata solutii cu costuri, fara exceptie.

## R-MATH: Completitudine matematica
Orice pipeline de traducere trebuie sa pastreze 100% din notatia matematica:
formule LaTeX, simboluri speciale, figuri SVG, constructii geometrice.
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
