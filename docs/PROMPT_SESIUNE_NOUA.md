# PROMPT PENTRU SESIUNE NOUĂ — copiază tot blocul de mai jos ca PRIM mesaj

> Generat 2026-07-30, după consolidarea tuturor planurilor în `docs/PLAN_MASTER.md` (audit în cod cu 5 agenți paraleli).
> Deciziile din prompt sunt CONFIRMATE de Roland prin AskUserQuestion — sesiunea nouă NU le re-întreabă.

---

```
/onboard

/effort xhigh

CITEȘTE ÎNTÂI, INTEGRAL, ÎN ORDINE (înainte de orice acțiune):
1. docs/PLAN_MASTER.md — SURSA UNICĂ de adevăr (creat 2026-07-30 prin audit în cod al TUTUROR planurilor vechi). Conține: §1 cerințele mele R1–R4, §2 securitate, §3 regresii, §4 curățenie, §5 restanțe math, §6 Planșe, §7 backlog, §8 verificări umane, §9 decizii moștenite, §10 reguli de execuție, §11 ștergerea planurilor vechi.
2. docs/HANDOFF_SESIUNE.md — starea operațională curentă (deploy, capcane, ce e verificat vs nu).
3. .claude/rules/project_rules.md + CLAUDE.md — regulile proiectului.

CONTEXT: PWA matematică pentru Cristina (profesoară, secția slovacă). LIVE pe traduceri-frontend.vercel.app, CACHE_VERSION v19-20260730a, branch faza-g-editor. Editor nativ TipTap cu 334 formule V–XII (KaTeX), traducere RO/SK/EN/DE în editor, import OCR drag&drop, export PDF/DOCX/HTML. Backend Python serverless pe Vercel + Supabase pentru loguri. Non-regresie curentă: tsc 0 · jest 57/57 · next build OK.

DECIZII DEJA CONFIRMATE DE MINE — NU LE RE-ÎNTREBA:
· Ordinea: cerințele mele R1→R4 ÎNTÂI, securitatea (§2) DUPĂ. Am acceptat conștient că cele 3 vulnerabilități HIGH rămân active în acest interval.
· R1 meniu: icon-rail colapsabil ca în Mosslein (extins 240px ↔ colapsat 56px, persistat în localStorage, item activ cu bordură+fundal). Bara de module de sus DISPARE; modulul selectat ocupă tot restul. Mock DEJA aprobat — nu-l mai cere.
· R2 limbi: se șterg DOAR LanguageToggle.tsx + language-context.tsx (selectorul global 🇷🇴🇸🇰🇬🇧 din dreapta sus, nefuncțional). Switch-ul de traducere din editor („scris în: RO ▾ | RO SK EN DE") RĂMÂNE — e funcțional, verificat live.
· R3 DOCX: parsare OMML → LaTeX DIRECT din XML-ul .docx (fidelitate 100%, offline, gratuit). NU calea docx→PDF→OCR vizual. Formulele apar EXACT la locul lor în text, editabile — nu panou-listă, nu glosar.
· R4 OCR: alegerea providerului se face pe DOVADĂ măsurată (test comparativ pe fișierele mele reale), nu pe reputație. Primul sub-pas obligatoriu: confirmă la sursă dacă Azure Document Intelligence are extragere de formule ca LaTeX — e [PROBABIL], nu verificat.
· Overlay pixel-perfect: ABANDON confirmat → se șterge și backend-ul (api/overlay.py + api/lib/overlay.py + testul), fără PyMuPDF (ăla e folosit de OCR).
· Modulele Chat AI / Calculator / Corectare-Generare teste: rămân în BACKLOG (§7), NU se implementează acum.
· Planurile vechi: se șterg (§11), dar DOAR după ce confirm eu că PLAN_MASTER acoperă tot. Întreabă-mă la început: „confirmi ștergerea celor 11 planuri vechi?"

EXECUTĂ ÎN ACEASTĂ ORDINE:
PASUL 0. Întreabă-mă dacă confirm ștergerea planurilor vechi (§11 W1). Dacă da, execută W2–W4 (e curățenie de 10 minute și scapi de confuzie).
PASUL 1. R2 (§1) — eliminarea selectorului global de limbi. Cel mai mecanic, îl faci primul ca să validezi ciclul de gate. Verifică OBLIGATORIU că switch-ul F8 din editor funcționează după.
PASUL 2. R1 (§1) — meniul icon-rail. Citește ÎNTÂI C:\Proiecte\Mosslein_Sistem_Gestiune - Copy\src\components\nav\Sidebar.tsx. ATENȚIE la constrângerea de arhitectură: taburile sunt montate simultan cu display:none — NU treci pe rute Next (ar reseta editorul). Probă live pe FIECARE tab, inclusiv cele iframe (Asistent, Planșe), la 390px și desktop.
PASUL 3. R3 (§1) — OMML → LaTeX. Modul pur unit-testabil + fixture REAL extras din C:\Users\ALIENWARE\Desktop\Cristina\Fisiere_Word\test.multimi2.docx (are 20 ecuații OMML, 0 imagini). Eyeball OBLIGATORIU: importă acel .docx, verifică toate cele 20 de expresii la locul lor, exportă PDF și compară cu Downloads\test.multimi2.pdf (varianta ruptă de acum) și cu originalul Word.
PASUL 4. R4 (§1) — comparația OCR + implementarea câștigătorului.
PASUL 5. Securitate §2 (S1→S8). S1 (npm audit fix) și S2 (o linie în HistoryDetail.tsx:65) sunt sub o oră împreună.
PASUL 6. §3 regresii (G1 contor DeepL, G2 cache persistent, G3 notificare, G4 verificare vizuală) și §4 curățenie (C1 overlay, C2 pdf-rasterize, C3–C6).
PASUL 7. §5 M1 (teoreme lipsă: bisectoarei/Menelaus/Ceva) + §6 P1–P2 (Planșe: reintrodu în handoff + precache /planse/* în sw.js).

REGULI OBLIGATORII (detaliate în §10):
· Gate după FIECARE item: npx tsc --noEmit (0) · npx jest (toate verzi) · npx next build (OK) · probă live 390px + desktop.
· §17: pentru orice element de UI NOU, mock + confirmarea mea ÎNAINTE de cod. (R1 are deja mock aprobat.)
· R-MATH: 0% pierdere de notație matematică. R-COST: totul pe free tier. R-EDIT: tot ce se inserează e editabil și supraviețuiește în exporturi.
· CORS: browser → API Python = text/plain sau multipart, NICIODATĂ application/json.
· Dev local: pornește Next cu NEXT_PUBLIC_API_URL=http://localhost:8000 (proxy-ul dev are timeout 30s, OCR-ul durează ~21-31s). NU rula next build în paralel cu dev.
· Eu testez pe PROD, nu local: după ce gate-ul e verde, propune-mi deploy, nu amâna pentru teste locale exhaustive.
· R-HANDOFF: după fiecare fază → actualizează HANDOFF_SESIUNE.md + bifează în PLAN_MASTER + memoria + commit/push.
· Deploy real DOAR cu confirmarea mea. Bump CACHE_VERSION în frontend/public/sw.js, deploy din frontend/, apoi verifică ALIASUL (nu doar URL-ul deployment-ului).
· Onestitate (R3): ce n-ai rulat, declară-l nerulat. Marchează [CERT]/[PROBABIL]/[INCERT].

Confirmă în 3–4 rânduri ce ai înțeles (fără să repeți planul), spune-mi dacă vezi vreo contradicție în PLAN_MASTER, apoi execută PASUL 0.
```

---

## Note pentru Roland (nu fac parte din prompt)

**De ce ordinea PASUL 1 = R2 (nu R1):** eliminarea limbilor e cea mai mecanică schimbare — validează ciclul complet (gate + deploy) pe un risc mic, înainte de refactorul de layout de la R1 care atinge toate modulele.

**Ce NU am pus în prompt intenționat:** modulele din backlog (§7) și restanțele mari (figuri parametrice, dark-mode, cele 5 generatoare de planșe). Sunt în plan, listate, dar nu în execuție — le alegi tu când vrei.

**Riscul cel mai mare din execuția asta:** R1 (meniul) atinge layout-ul TUTUROR modulelor, inclusiv cele două iframe-uri (Asistent, Planșe). Dacă ceva se rupe, se rupe acolo. De-aia proba live e cerută pe fiecare tab, nu doar pe editor.
