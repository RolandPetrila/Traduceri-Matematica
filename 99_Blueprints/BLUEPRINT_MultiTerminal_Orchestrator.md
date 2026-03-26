# BLUEPRINT: Sistem Multi-Terminal Colaborativ (Orchestrator)
# Versiune: 1.0 | Categorie: Utility — Workflow Management
# Portabilitate: Universal — nu contine referinte la proiecte specifice

---

## CE FACE

Sistem de coordonare pentru lucrul cu multiple instante Claude Code in paralel pe
acelasi proiect. Un terminal planifica si implementeaza, altul auditeaza si
imbunatateste. Sincronizarea se face exclusiv prin fisiere partajate — zero
copy-paste manual intre terminale. Utilizatorul (orchestratorul) controleaza
flow-ul prin comenzi rapide.

---

## ARHITECTURA

```
                    UTILIZATOR (orchestrator)
                    /        \
                   /          \
          [T1: Plan+Exec]   [T2: Audit]
               |                 |
               v                 v
          PLAN.md            FEEDBACK.md
          DECISIONS.md
               \                /
                \              /
            [Folder partajat de coordonare]
```

**Principiu**: Un terminal SCRIE, celalalt CITESTE. Niciodata ambele pe acelasi fisier.

---

## DEPENDENTE

### Pachetele necesare
- **Claude Code CLI** >= orice versiune — nucleul sistemului
- **Git** — versionare, recovery

### Servicii externe
- Niciun serviciu extern necesar
- Optional: orice MCP server activ in Claude Code

### Fisiere prerequisite
- Un proiect existent (git repo recomandat)
- Optional: `CLAUDE.md` per proiect (reguli existente)

---

## STRUCTURA FISIERE

```
[proiect]/
  [folder_coordonare]/          — ex: 99_Plan_vs_Audit/
    T1_REGULAMENT.md            — reguli terminal plan/executie
    T2_REGULAMENT.md            — reguli terminal audit
    GHID_UTILIZARE.md           — ghid complet cu texte de initializare
    info.md                     — viziunea/cerintele proiectului
    PLAN.md                     — planul cu tracking [ ]/[x]
    DECISIONS.md                — log decizii din discutii
    FEEDBACK.md                 — sugestii audit
  [folder_blueprints]/          — ex: 99_Blueprints/
    BLUEPRINT_[Modul].md        — sablon universal per modul finalizat
```

---

## IMPLEMENTARE PAS CU PAS

### Pas 1: Creeaza folderul de coordonare
- Alege un prefix care face folderul sa apara la sfarsit in listing (ex: `99_`)
- Adauga in `.gitignore` — fisierele de coordonare sunt interne, nu cod

### Pas 2: Genereaza regulamentele per terminal

**T1 (Plan + Executie) — reguli esentiale:**
- Nu executa fara confirmare
- Intrebari de clarificare obligatorii (max 3, cu variante A/B/C)
- Actualizeaza DECISIONS.md dupa fiecare runda de discutii
- Actualizeaza PLAN.md dupa fiecare implementare
- Citeste FEEDBACK.md la comanda rapida (ex: "t1")
- Blueprint obligatoriu dupa fiecare modul finalizat
- Commit + push dupa fiecare sprint
- Auto-intrebare calitate: "Sunt 100% sigur ca aceasta este solutia optima?"

**T2 (Audit + Imbunatatire) — reguli esentiale:**
- NU modifica fisiere de cod — doar citeste si analizeaza
- La comanda rapida (ex: "t2"): citeste PLAN.md + DECISIONS.md + info.md
- Analizeaza pe 6 axe: completitudine, corectitudine, scenarii, extensibilitate, riscuri, costuri
- Scrie feedback structurat in FEEDBACK.md
- La cerere: audit complet pe N domenii cu scor
- Auto-intrebare calitate inainte de a scrie feedback

### Pas 3: Genereaza ghidul de utilizare

Trebuie sa contina:
- Textele EXACTE de copiat in fiecare terminal la initializare
- Comenzile rapide si ce face fiecare
- Ciclul de lucru pas cu pas (diagrama flow)
- Skills/tools disponibile si cand se folosesc
- Procedura de recovery la pierdere context
- Verificari periodice recomandate

### Pas 4: Genereaza info.md

Captureaza:
- Viziunea proiectului (ce, pentru cine)
- Flow-ul dorit (pas cu pas)
- Cerinte tehnice (stack, buget, constrangeri)
- Cerinte de proces (cum se lucreaza)
- Context existent (ce s-a facut pana acum)

### Pas 5: Initializeaza fisierele goale

PLAN.md, DECISIONS.md, FEEDBACK.md — cu header + reguli de completare,
dar fara continut (se completeaza in timpul lucrului).

---

## CONFIGURARE

### Variabile de configurare (per proiect)

| Variabila | Default | Descriere |
|-----------|---------|-----------|
| FOLDER_COORDONARE | 99_Plan_vs_Audit | Numele folderului partajat |
| FOLDER_BLUEPRINTS | 99_Blueprints | Folderul pentru sabloane universale |
| NR_TERMINALE | 2 | Cate terminale se folosesc |
| MOD_EXECUTIE | pas_cu_pas | pas_cu_pas / autonom / hibrid |
| GENEREAZA_BLUEPRINTS | true | Daca se genereaza sabloane dupa fiecare modul |
| FOLDERE_PROTEJATE | [] | Lista foldere care nu se modifica |
| BUGET | zero | zero / limitat / nelimitat |

### Fisiere de configurare
- `.gitignore` — trebuie actualizat cu folderele de coordonare si blueprints
- `CLAUDE.md` — optional, poate referi regulamentele

---

## INTEGRARE

### Cum se conecteaza la aplicatia existenta
- Folderele de coordonare sunt **separate** de codul sursa
- Nu exista import-uri sau dependente intre cod si sistemul de orchestrare
- Integrarea e pur conventionala — terminalele stiu sa citeasca/scrie fisierele

### Cum se adauga in alt proiect (portabilitate)

1. Ruleaza `/orchestrator` in noul proiect (daca skill-ul e instalat global)
2. SAU copiaza acest blueprint si urmeaza pasii de implementare manual
3. Adapteaza: viziunea, stack-ul, constrangerile, protectiile
4. Initializeaza terminalele cu textele din ghid

---

## PATTERN-URI CHEIE

### Pattern 1: Sincronizare prin fisiere
```
T1 scrie PLAN.md → Utilizator comanda "t2" → T2 citeste PLAN.md →
T2 scrie FEEDBACK.md → Utilizator comanda "t1" → T1 citeste FEEDBACK.md
```
**Regula**: Un fisier are un singur SCRIITOR. Toti ceilalti sunt CITITORI.

### Pattern 2: Comanda rapida ca trigger
```
Utilizatorul scrie "t2" in chat-ul T2:
  → T2 stie sa citeasca PLAN.md + DECISIONS.md
  → T2 analizeaza si scrie FEEDBACK.md
  → T2 prezinta rezumat in chat

Utilizatorul scrie "t1" in chat-ul T1:
  → T1 stie sa citeasca FEEDBACK.md
  → T1 propune integrare
  → T1 asteapta confirmare
```

### Pattern 3: Blueprint post-implementare
```
T1 finalizeaza modul → genereaza BLUEPRINT_[Modul].md →
Blueprint = sablon universal, zero referinte la proiect →
Reutilizabil in orice alt context
```

### Pattern 4: Recovery la pierdere context
```
Terminal nou/reset → Primeste text initializare din GHID →
Citeste regulamentul sau (T1 sau T2) →
Citeste PLAN.md + DECISIONS.md → Contextul e restaurat complet
```

---

## EDGE CASES SI RISCURI

| Edge case | Cum e tratat | Ce se intampla daca nu e tratat |
|-----------|-------------|--------------------------------|
| Ambele terminale scriu in acelasi fisier | Regula "1 scriitor per fisier" | Conflicte, date pierdute |
| Terminal pierde context (compresie) | Recovery prin fisierele de coordonare | Se reia de la zero, pierde progresul |
| Utilizatorul uita sa sincronizeze | Ghidul specifica ciclul de lucru | T2 auditeaza plan vechi, feedback irelevant |
| T1 implementeaza fara confirmare | R1 in regulament: "nu executa fara confirmare" | Implementare gresita, refacere |
| Proiect fara git | Sistemul functioneaza, dar fara versionare | Nu se poate face rollback |
| Blueprint generat incorect (cu referinte locale) | R11: "ZERO referinte la proiect" | Blueprint inutilizabil in alt context |

---

## TESTARE

### Verificare setup
- [ ] Folderul de coordonare exista si contine toate fisierele
- [ ] .gitignore include folderele de coordonare si blueprints
- [ ] T1 poate citi regulamentul si confirma rolul
- [ ] T2 poate citi regulamentul si confirma rolul
- [ ] Comanda "t1" in T1 citeste FEEDBACK.md
- [ ] Comanda "t2" in T2 citeste PLAN.md + DECISIONS.md
- [ ] Blueprint generat nu contine referinte la proiectul curent

### Verificare ciclica
- [ ] Dupa 3 runde de t1/t2, fisierele sunt consistente
- [ ] Dupa recovery (terminal nou), contextul e complet

---

## EXTENSIBILITATE

### Adaugare terminal T3 (ex: Tester)
1. Creeaza `T3_REGULAMENT.md` cu rol specific
2. Adauga comanda rapida "t3" in GHID
3. Defineste ce fisiere scrie T3 (ex: `TEST_RESULTS.md`)
4. Actualizeaza tabelul de proprietate fisiere in toate regulamentele

### Adaugare categorie blueprint noua
1. Extinde enum-ul de categorii in template-ul BLUEPRINT
2. Adauga reguli specifice categoriei (ex: "API Module" necesita sectiunea ENDPOINTS)

### Integrare cu CI/CD
1. T1 genereaza `.github/workflows/` sau echivalent
2. T2 verifica pipeline-ul ca parte din audit
3. Blueprint-urile includ sectiunea de CI/CD per modul

---

## MONITORING / LOGGING

| Ce se logheaza | Unde | Cine |
|----------------|------|------|
| Decizii luate | DECISIONS.md | T1 |
| Probleme gasite | FEEDBACK.md | T2 |
| Progres implementare | PLAN.md (checkbox-uri) | T1 |
| Blueprints generate | 99_Blueprints/ (un fisier per modul) | T1 |
| Audituri complete | FEEDBACK.md (sectiune dedicata) | T2 |
