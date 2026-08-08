# Comenzi /slash — Ghid Utilizare Claude Code

> Nume verificate față de comenzile reale (`~/.claude/commands` + skills). Actualizat 2026-08-08.

## Comenzi recomandate pentru proiectul Traduceri Matematica

| Comanda       | Cand se foloseste                                                       | Frecventa recomandata            |
| ------------- | ----------------------------------------------------------------------- | -------------------------------- |
| `/onboard`    | Inceput sesiune — primire rapida context (CLAUDE.md + memorie + git)    | La fiecare sesiune noua          |
| `/status`     | Status rapid proiect in 30s (stack, git, anomalii)                      | Orientare rapida                 |
| `/audit`      | Audit complet proiect (12-18 domenii, scor, plan remediere)             | Dupa feature mare                |
| `/review`     | Code review pe modificarile git (6 criterii + verdict + mesaj commit)   | La fiecare commit major          |
| `/test`       | Genereaza si ruleaza teste (detectare framework)                        | Dupa fiecare feature/fix         |
| `/doctor`     | Health check MEDIU de lucru (MCP-uri, hooks, env, git)                  | Cand ceva pare ciudat            |
| `/deploy`     | Checklist pre-deploy (build, teste, env, securitate, git)               | La fiecare deploy                |
| `/plan`       | Planificare feature noua complexa (clarificare + spec + task breakdown) | Cand ai cerinte noi              |
| `/checkpoint` | Snapshot persistent sesiune (pentru terminal nou)                       | La sfarsit de sesiune            |
| `/improve`    | Cercetare + recomandari imbunatatire pe 3 lentile (valoare/efort)       | Cand vrei sa upgradezi           |
| `/research`   | Cercetare web (min 3 surse, marcat CERT/PROBABIL/INCERT)                | Cand ai nevoie de dovezi         |
| `/explain`    | Explicatie concept/cod la nivel de incepator                            | Cand nu intelegi o parte din cod |
| `/security`   | Audit securitate (OWASP Top 10 + dependinte + secrets + git history)    | Inainte de deploy public         |

## Comenzi avansate (situatii speciale)

| Comanda                 | Cand se foloseste                                                      | Nota                                |
| ----------------------- | ---------------------------------------------------------------------- | ----------------------------------- |
| `/fortify`              | Intarire completa proiect (inventar + diagnostic cross-cutting + plan) | Consolidare periodica               |
| `/orchestrator`         | Setup multi-terminal (T1 executie + T2 audit + T3 orchestrator)        | Overkill pentru proiecte mici/medii |
| `/debug`                | Diagnostic rapid din log-uri reale (root cause + fix + verificare)     | La erori SEV1/SEV2                  |
| `/perf`                 | Analiza performanta cu masuratori reale (bottlenecks + recomandari)    | La probleme de viteza               |
| `/simplify`             | Reduce complexitate cod/documentatie (dead code, over-engineering)     | Dupa acumulare de cod               |
| `/sugereaza-blueprints` | Analizeaza proiectul si recomanda blueprint-uri potrivite              | 1x la inceput de proiect            |

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
