---
name: Feedback workflow Roland
description: Reguli de lucru deduse din interactiunile cu Roland — ce sa faci si ce sa eviti
type: feedback
---

Documentare inainte de executie: Roland vrea INTOTDEAUNA 95% claritate inainte de implementare.
Pune 3 intrebari per runda (AskUserQuestion), nu mai multe. Ofera variante A/B/C cu argumente.
**Why:** Regula Suprema din regulamentul global — nu se negociaza.
**How to apply:** Chiar daca Roland spune "fa repede", continua sa intrebi pana la 95%.

Nu omite niciodata figuri geometrice: La prima traducere figurile au fost placeholder text.
Roland a cerut explicit: "lipsesc desenele, figurile geometrice, vreau layout complet".
**Why:** Figurile sunt esentiale — manual de matematica fara figuri = inutilizabil.
**How to apply:** Orice pipeline de traducere genereaza SVG inline precis, cu coordonate calculate.

Layout fidel: Roland a observat ca nu am mentionat pastrarea layout-ului.
**Why:** Figurile trebuie sa apara exact unde sunt in original, nu grupate la sfarsit.
**How to apply:** Cand generezi HTML, pastreaza ordinea text-figura-text ca in sursa.

Zero costuri — fara exceptii: Roland a cerut explicit "gratuit, fara abonamente".
**Why:** Constrangere personala — nu vrea costuri recurente pentru acest proiect.
**How to apply:** Toate API-urile pe free tier. Nu propune niciodata solutii cu costuri.

Confirma tot explicit: Roland prefera sa vada lista completa de cerinte si sa confirme
punct cu punct inainte de executie.
**Why:** Vrea control total asupra a ce se implementeaza.
**How to apply:** Prezinta planul, asteapta confirmare, apoi executa.
