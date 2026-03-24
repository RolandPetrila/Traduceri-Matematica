# Comenzi /slash — Ghid Utilizare Claude Code

## Comenzi recomandate pentru proiectul Traduceri Matematica

| Comanda | Cand se foloseste | Frecventa recomandata |
|---|---|---|
| `/status` | Inceput sesiune — vezi unde esti cu proiectul | La fiecare sesiune noua |
| `/audit_full` | Verificare completa proiect (cod, securitate, structura) | 1x pe saptamana sau dupa feature mare |
| `/review` | Review cod inainte de push important | La fiecare commit major |
| `/test` | Dupa modificari cod — genereaza si ruleaza teste | Dupa fiecare feature/fix |
| `/health` | Check rapid daca totul functioneaza corect | Cand ceva pare ciudat |
| `/deploy` | Checklist complet inainte de deploy Vercel | La fiecare deploy |
| `/plan` | Planificare feature noua complexa | Cand ai cerinte noi |
| `/checkpoint` | Salvare progres sesiune pentru continuitate | La sfarsit de sesiune |
| `/deep-research` | Cercetare aprofundata + recomandari imbunatatire | Cand vrei sa upgradezi proiectul |
| `/analyze` | Analiza statica cod (fara git, orice proiect) | Dupa refactoring major |
| `/explain` | Explicatie concept/cod la nivel de incepator | Cand nu intelegi o parte din cod |
| `/securitate` | Audit securitate complet | Inainte de deploy public |

## Comenzi avansate (situatii speciale)

| Comanda | Cand se foloseste | Nota |
|---|---|---|
| `/orchestrate` | Task-uri mari, paralele, independente (3+ terminale) | Overkill pentru proiecte mici/medii |
| `/workflow` | Inlantuire mai multe comenzi automat | Cand ai un flow repetitiv |
| `/sabloane` | Analiza workflow si recomandari personalizate | 1x la inceput de proiect |
| `/ask` | Clarificare completa inainte de executie | Cand task-ul e ambiguu |
| `/dashboard` | Generare dashboard HTML vizual | Pentru rapoarte vizuale |
| `/review-trimestrial` | Raport trimestrial activitate AI | 1x la 3 luni |

## Ordine recomandata intr-o sesiune tipica

1. `/status` — orientare rapida
2. Conversatie directa — task-uri, fix-uri, features
3. `/review` — verifica ce ai modificat
4. `/test` — testeaza modificarile
5. `/checkpoint` — salveaza progresul

## Reguli de baza

- **Conversatia directa** acopera 90% din nevoi — comenzile /slash sunt pentru workflow-uri structurate
- **Nu combina** mai multe comenzi /slash simultan — ruleaza-le pe rand
- **Rezultatele** se afiseaza direct in conversatie — nu genereaza fisiere separate (cu exceptia `/dashboard`)
