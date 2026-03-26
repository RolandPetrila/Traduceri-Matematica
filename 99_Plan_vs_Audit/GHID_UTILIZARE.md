# GHID UTILIZARE — Sistem Multi-Terminal Claude Code
# Versiune: 1.3 | Data: 2026-03-26
# Skill global: /orchestrator — recreeaza acest sistem in orice proiect

---

## ARHITECTURA TERMINALE

```
                    ROLAND
                   /  |   \
                  /   |    \
          [T1]     [T2]     [T3]
          Plan +   Audit +   Orchestrator
          Executie Imbun.    Consilier
            |        |         |
            v        v         v
        PLAN_v3    AUDIT_    99_Orchestr.
        DECISIONS  FEEDBACK  Regulamente
```

**Folder colaborare**: `99_Plan_vs_Audit/`

| Terminal | Rol | Ce scrie | Ce nu face |
|----------|-----|----------|------------|
| T1 | Plan + Executie | PLAN_v3.md, PLAN_DECISIONS.md, cod, blueprints | Nu auditeaza, nu editeaza regulamente |
| T2 | Audit + Imbunatatire | AUDIT_FEEDBACK.md | Nu scrie cod, nu editeaza regulamente |
| T3 | Orchestrator + Consilier | Regulamente, GHID, info.md | Nu scrie cod, nu auditeaza cod |

---

## COMENZI RAPIDE

### Comanda `t1` — trimite catre Terminal 1 (Plan/Executie)

Scrie in chat-ul Terminal 1:

```
t1
```

**Ce face T1 cand primeste "t1":**
1. Citeste `99_Plan_vs_Audit/AUDIT_FEEDBACK.md`
2. Analizeaza sugestiile auditorului
3. Iti propune cum sa le integreze
4. Se intreaba: "Sunt 100% sigur ca aceasta este sugestia maxima de imbunatatire?"
5. Asteapta confirmarea ta

**Cu context suplimentar:**
```
t1 integreaza sugestiile S1 si S3, ignora S2
```
```
t1 verifica daca ai acoperit scenariul X
```

---

### Comanda `t2` — trimite catre Terminal 2 (Audit)

Scrie in chat-ul Terminal 2:

```
t2
```

**Ce face T2 cand primeste "t2":**
1. Citeste `99_Plan_vs_Audit/PLAN_v3.md`
2. Citeste `99_Plan_vs_Audit/PLAN_DECISIONS.md`
3. Citeste `99_Plan_vs_Audit/info.md`
4. Analizeaza pe 6 axe: completitudine, corectitudine, scenarii, extensibilitate, riscuri, costuri
5. Scrie feedback in `99_Plan_vs_Audit/AUDIT_FEEDBACK.md`
6. Se intreaba: "Sunt 100% sigur ca aceasta este sugestia maxima de imbunatatire?"
7. Iti prezinta rezumatul in chat

**Cu context suplimentar:**
```
t2 concentreaza-te pe faza 2 si pe flow-ul de traducere
```

---

### Comanda `t3` — trimite catre Terminal 3 (Orchestrator/Consilier)

Scrie in chat-ul Terminal 3:

```
t3
```

**Inainte de a scrie t3:** lipeste mesajele relevante din T1 sau T2 in fisierul
`99_Plan_vs_Audit/99_Orchestrator.md` (sterge continutul vechi, lipeste cel nou).

**Ce face T3 cand primeste "t3":**
1. Citeste `99_Plan_vs_Audit/99_Orchestrator.md` — mesajele lipite de tine
2. Citeste PLAN_v3.md + PLAN_DECISIONS.md daca e relevant
3. Te ajuta cu: recomandari la alegeri, evaluare progres, ajustari regulamente
4. Raspunde in limbaj simplu

**Cu context suplimentar:**
```
t3 ajuta-ma sa aleg intre variantele lui T1
```
```
t3 actualizeaza regulamentul T1 cu [cerinta noua]
```
```
t3 evalueaza progresul general
```
---

## PASI DE INITIALIZARE

### Pas 1: Deschide Terminal 1 (Plan/Executie)

Deschide un terminal in folderul proiectului:
```bash
cd C:\Proiecte\Traduceri_Matematica
claude
```

Trimite mesajul de initializare (copiaza EXACT):
```
Citeste fisierul 99_Plan_vs_Audit/T1_REGULAMENT.md — acesta este rolul tau.
Esti T1, terminalul de planificare si executie.

Dupa ce citesti regulamentul, executa pasii de initializare:
1. Citeste 99_Plan_vs_Audit/info.md — viziunea proiectului
2. Citeste CLAUDE.md — regulile proiectului
3. Citeste PLAN_IMPLEMENTARE_v2.md — ce s-a facut pana acum
4. Scaneaza structura proiect (foldere nivel 1-2)
5. Incepe Faza 0: pune-mi intrebari de clarificare (max 3, cu variante A/B/C)
6. NU scrie nimic in PLAN_v3.md pana nu ai minim o runda completa de Q&A cu mine

Referinta design: C:\Users\ALIENWARE\platform-predare (LanguageToggle, DocumentViewer)
```

---

### Pas 2: Deschide Terminal 2 (Audit)

Deschide un AL DOILEA terminal in acelasi folder:
```bash
cd C:\Proiecte\Traduceri_Matematica
claude
```

Trimite mesajul de initializare (copiaza EXACT):
```
Citeste fisierul 99_Plan_vs_Audit/T2_REGULAMENT.md — acesta este rolul tau.
Esti T2, terminalul de audit si imbunatatire.
Citeste si 99_Plan_vs_Audit/info.md pentru viziunea proiectului.
Confirma ca ai inteles rolul si asteapta comanda "t2" de la mine.
```

---

### Pas 3: Deschide Terminal 3 (Orchestrator/Consilier)

Deschide un AL TREILEA terminal in acelasi folder:
```bash
cd C:\Proiecte\Traduceri_Matematica
claude
```

Trimite mesajul de initializare (copiaza EXACT):
```
Citeste fisierul 99_Plan_vs_Audit/T3_REGULAMENT.md — acesta este rolul tau.
Esti T3, terminalul orchestrator si consilier.
Confirma ca ai inteles rolul si asteapta comanda "t3" de la mine.
```

---

### Pas 4: Ciclul de lucru

```
[1] T1 pune intrebari → Roland raspunde → T1 scrie PLAN_DECISIONS.md + PLAN_v3.md
                                |
[*] Roland are nevoie de ajutor? → copiaza in 99_Orchestrator.md → "t3" → T3 ajuta
                                |
[2] Roland vine la T2: "t2"   ←
                                |
[3] T2 citeste planul → scrie AUDIT_FEEDBACK.md → prezinta rezumat
                                |
[4] Roland merge la T1: "t1"  ←
                                |
[5] T1 citeste feedback → propune integrare → Roland confirma
                                |
[6] T1 implementeaza sprint → commit + push
                                |
[7] Roland vine la T2: "t2 verifica implementarea"
                                |
[8] Repeta de la [1] pentru urmatoarea faza

Pasul [*] e optional — se foloseste oricand Roland vrea o a doua parere sau
ajutor la decizii, fara sa intrerupa T1 sau T2 din ce fac.
```

---

## TOOLS, SKILLS SI MCP DISPONIBILE

### Skills (comenzi /)

| Skill | Cand sa o folosesti | Terminal |
|-------|---------------------|----------|
| `/audit` | Audit complet proiect (12 domenii, scor) | T2 |
| `/review` | Review pe modificari git recente | T2 |
| `/status` | Status rapid proiect (30 secunde) | T1 sau T2 |
| `/plan` | Planificare feature/proiect | T1 |
| `/test` | Generare si executie teste | T1 |
| `/deploy` | Checklist pre-deploy | T1 |
| `/checkpoint` | Salvare progres sesiune | T1 |
| `/improve` | Cercetare + imbunatatiri + inovatie | T2 |
| `/explain` | Explica concept/cod simplu | T1 sau T2 |
| `/research` | Cercetare web rapida | T1 sau T2 |
| `/orchestrator` | Recreeaza acest sistem in alt proiect | Orice terminal nou |

### MCP Servers activi

| MCP | Ce face | Cand e util |
|-----|---------|-------------|
| Firecrawl | Scraping web, crawling, search | Cercetare documentatie API, comparatie solutii |
| Vercel | Deploy, logs, management proiecte | Daca revin pe Vercel |
| Google Calendar | Planificare timp | Sprint planning cu deadline-uri |
| Gmail | Email | Notificari, rapoarte |
| Zapier | Automatizari | Integrari externe |

### Agenti (Agent tool)

| Agent | Scop | Terminal |
|-------|------|----------|
| Explore | Cautare cod, analiza codebase | T1 sau T2 |
| Plan | Design plan implementare | T1 |
| general-purpose | Task-uri complexe multi-step | T1 |

---

## REGULI DE AUR

1. **T1 SCRIE cod, T2 CITESTE cod** — niciodata invers
2. **Sincronizare prin fisiere** — nu prin copy-paste manual
3. **Roland decide** — ambele terminale propun, Roland confirma
4. **t1/t2 = trigger** — scrie comanda, terminalul stie ce sa faca
5. **Zero costuri** — orice solutie trebuie sa fie gratuita
6. **Nu modifica 99_Roland_Work/** — folder protejat

---

## DACA PIERZI CONTEXTUL

### Terminal nou sau context comprimat?

**Pentru T1 (plan/executie):**
```
Citeste 99_Plan_vs_Audit/T1_REGULAMENT.md — acesta este rolul tau.
Citeste 99_Plan_vs_Audit/PLAN_v3.md si 99_Plan_vs_Audit/PLAN_DECISIONS.md
pentru context complet. Continua de unde s-a ramas.
```

**Pentru T2 (audit):**
```
Citeste 99_Plan_vs_Audit/T2_REGULAMENT.md — acesta este rolul tau.
Citeste 99_Plan_vs_Audit/PLAN_v3.md si 99_Plan_vs_Audit/PLAN_DECISIONS.md
pentru context complet. Continua de unde s-a ramas.
```

**Pentru T3 (orchestrator):**
```
Citeste 99_Plan_vs_Audit/T3_REGULAMENT.md — acesta este rolul tau.
Esti T3, orchestratorul. Confirma si asteapta comanda "t3".
```

Terminalul va sti exact:
- Ce rol are (T1 sau T2)
- Ce s-a discutat (PLAN_DECISIONS.md)
- Ce e planificat si ce s-a facut (PLAN_v3.md)
- Ce feedback exista (AUDIT_FEEDBACK.md)

---

## VERIFICARI PERIODICE

| Cand | Ce verifici | Comanda |
|------|-------------|---------|
| Dupa fiecare faza planificata | Planul e complet? | `t2` |
| Dupa fiecare sprint implementat | Codul e corect? | `t2 verifica implementarea` |
| Dupa 3+ sprinturi | Audit complet | In T2: `/audit` |
| Inainte de deploy major | Checklist | In T1: `/deploy` |
| Cand adaugi feature nou | Extensibilitate OK? | `t2 verifica extensibilitatea` |
| Dupa modul finalizat | Blueprint generat? | In T1: verifici `99_Blueprints/` |

---

## BLUEPRINTS — SABLOANE UNIVERSALE

Dupa ce T1 finalizeaza orice modul/componenta/functionalitate:
1. T1 genereaza automat `99_Blueprints/BLUEPRINT_[NumeModul].md`
2. Blueprint-ul e **universal** — ZERO referinte la acest proiect
3. Poate fi copiat in orice alt proiect si implementat direct
4. Contine: arhitectura, dependente, pasi implementare, configurare, integrare, testare, edge cases

**Blueprint-uri existente:**
- `BLUEPRINT_MultiTerminal_Orchestrator.md` — acest sistem de orchestrare

---

## SKILL GLOBAL: /orchestrator

In ORICE proiect, ruleaza `/orchestrator` pentru a crea un sistem multi-terminal nou.
Skill-ul pune 9 intrebari de configurare si genereaza automat tot setup-ul.

Locatie skill: `~/.claude/commands/orchestrator.md`

---

## TIPS AVANSATE

### Cum sa extinzi la 3+ terminale
1. Creeaza `T3_REGULAMENT.md` cu rol specific (ex: Tester, Deployer)
2. Adauga comanda rapida `t3` cu fisierele asociate
3. Defineste ce fisiere scrie T3 (ex: `TEST_RESULTS.md`)
4. Respecta regula: un fisier = un singur scriitor

### Cum sa folosesti MCP-urile eficient
- **Firecrawl**: cere-i lui T1 sa cerceteze documentatie API cu `firecrawl_search`
- **Google Calendar**: planifica sprinturi cu deadline-uri reale
- **Zapier**: automatizeaza notificari la commit/deploy

### Model recomandat
- **Opus max effort** — pentru ambele terminale (plan complex + audit profund)
- Opus in loc de Sonnet: merita pentru decizii arhitecturale si audituri
