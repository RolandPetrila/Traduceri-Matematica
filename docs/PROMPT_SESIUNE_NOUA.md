# PROMPT PENTRU SESIUNE NOUĂ — copiază tot blocul de mai jos ca PRIM mesaj

> Regenerat 2026-07-30 (seara), după: PASUL 0 (curățenie 11 planuri) + R1 + R2 DONE & DEPLOYAT, și după stabilirea a 2 cerințe NOI (R5 + R6) prin AskUserQuestion.
> Deciziile din prompt sunt CONFIRMATE de Roland — sesiunea nouă NU le re-întreabă.

---

```
/onboard

/effort xhigh

CITEȘTE ÎNTÂI, INTEGRAL, ÎN ORDINE (înainte de orice acțiune):
1. docs/HANDOFF_SESIUNE.md — blocul „▶️ REIA DE AICI (2026-07-30 seara)" din cap: starea reală + cerințele noi + ordinea. (Restul fișierului = jurnal istoric; nu-l reciti tot.)
2. docs/PLAN_MASTER.md — SURSA UNICĂ de adevăr. §1 = cerințele mele R1–R6 (R1,R2 ✅; R3,R4,R5,R6 de făcut), §2 securitate, §3 regresii, §4 curățenie, §5 math, §6 Planșe, §10 reguli de execuție.
3. .claude/rules/project_rules.md + CLAUDE.md — regulile proiectului.

CONTEXT: PWA matematică pentru Cristina (profesoară, secția slovacă). LIVE pe traduceri-frontend.vercel.app, branch faza-g-editor, CACHE_VERSION v21-20260730c. Editor nativ TipTap (334 formule KaTeX V–XII), traducere RO/SK/EN/DE în editor (F8), import OCR drag&drop, export PDF/DOCX/HTML. Backend Python serverless pe Vercel + Supabase. Non-regresie curentă: tsc 0 · jest 57/57 · next build OK (8 rute).

CE E DEJA FĂCUT (NU relua): PASUL 0 = cele 11 planuri vechi ȘTERSE (consolidate în PLAN_MASTER). R1 ✅ = meniu icon-rail colapsabil (Sidebar înlocuiește bara de sus), DEPLOYAT v21, verificat live desktop+mobil. R2 ✅ = eliminat selectorul global de limbi (F8 din editor rămâne), DEPLOYAT v20.

DECIZII CONFIRMATE DE MINE — NU LE RE-ÎNTREBA:
· R3 (DOCX): parsare OMML → LaTeX DIRECT din XML-ul .docx (fidelitate, offline, gratuit). Fidelitate: ETAPA A = formulele apar la locul lor + text în ordine + bold/liste simple (FERM, obligatoriu); ETAPA B = apropiere de layout vizual, iterativ DUPĂ A (nu bloca A pe B).
· R3 fixture-uri REALE (test set): C:\Users\ALIENWARE\Desktop\Cristina\Fisiere_Word\test.multimi2.docx (20 OMML) + test5nr.naturale2025.docx + „2.Unghiuri. Bisectoare.docx". Dovada bug-ului: Downloads\test5nr.naturale2025.pdf (output actual al app-ului) are matematica DISPĂRUTĂ complet.
· R4 (OCR imagine/scan): alegere provider pe DOVADĂ măsurată (nu reputație). Primul sub-pas: confirmă la sursă dacă Azure Document Intelligence extrage formule ca LaTeX (e [PROBABIL], neverificat). Testează pe mai multe tipuri (poză manual, PDF scanat, screenshot). ATENȚIE: .docx-urile mele merg prin R3 (OMML), NU prin OCR.
· R5 (toolbar): PĂSTREAZĂ toolbar-ul cum e — mută DOAR butoanele de limbi (F8 „scris în RO SK EN DE", azi pe rând separat) în rândul de SUS, după evidențiere + „Șterge formatarea". Am RESPINS explicit redesign-ul în module-panel.
· R6 (search global): pe lângă search-ul existent din meniul Matematică (rămâne), adaugă UN search GLOBAL stil Ctrl+K peste TOATĂ aplicația (funcții editor + comută între module + acțiuni). R6 e UI nou → §17 mock înainte de cod.

EXECUTĂ ÎN ACEASTĂ ORDINE (am zis „alegi tu"; ordinea aleasă, motivată în PLAN_MASTER §1):
PASUL 1. R3 (DOCX OMML→LaTeX) — bug VIZIBIL pe prod, prioritar. Modul pur frontend/src/lib/omml-to-latex.ts (unit-testabil fără DOM) + fixture real din word/document.xml + cititor zip (fflate/jszip, înlocuiește mammoth) + reuse parseInlineToNodes din ocr-map.ts. Eyeball pe cele 3 .docx: import → formule la locul lor → export PDF comparat cu varianta ruptă.
PASUL 2. R5 (mut F8 sus) — trivial; grupează deploy-ul cu R3.
PASUL 3. R6 (Ctrl+K global) — mock §17 întâi, apoi cod.
PASUL 4. R4 (OCR imagine/scan pe dovadă).
PASUL 5. §2 securitate (S1→S8; S1 npm audit fix cu capcana katex@0.16.11, S2 XSS o linie în HistoryDetail.tsx:65).
PASUL 6. §3 regresii + §4 curățenie + §5 math + §6 Planșe.

REGULI OBLIGATORII (detaliate în PLAN_MASTER §10):
· Gate după FIECARE item: npx tsc --noEmit (0) · npx jest (57 verzi) · npx next build (OK) · probă live 390px + desktop.
· §17: pentru orice UI NOU (R6), mock + confirmarea mea ÎNAINTE de cod. (R5 e doar relocare, nu UI nou — o mică probă vizuală ajunge.)
· R-MATH: 0% pierdere de notație. R-COST: totul free tier. R-EDIT: tot ce se inserează e editabil și supraviețuiește în exporturi.
· CORS: browser → API Python = text/plain sau multipart, NICIODATĂ application/json.
· Dev local: pornește Next cu NEXT_PUBLIC_API_URL=http://localhost:8000 (proxy-ul dev are timeout 30s, OCR-ul durează ~21-31s). NU rula next build în paralel cu dev. Pt verificare de layout: `next start` pe build (evită stale-bundle-ul dev).
· Testare mobilă: resize_window din Chrome MCP NU emulează viewport-ul (rămâne desktop). Metoda care merge: injectează un iframe de 390px same-origin cu pagina, via javascript_tool → citește DOM / screenshot.
· Capcana hidratare: NU citi localStorage/width în useState initializer (rupe comutarea taburilor). Init DEFAULT + useEffect (ca Sidebar.tsx / EditorMathMenu / page.tsx).
· Eu testez pe PROD: după gate verde, propune-mi deploy (bump CACHE_VERSION în frontend/public/sw.js, vercel deploy --prod --yes --token="$VERCEL_API_KEY" din frontend/, verifică ALIASUL nu doar deployment-ul). Deploy real DOAR cu confirmarea mea.
· advisor înainte de lucru substanțial/riscant și înainte de „gata". R-HANDOFF: după fiecare fază → actualizează HANDOFF + bifează PLAN_MASTER + memoria + commit/push.
· Onestitate (R3): ce n-ai rulat, declară-l nerulat. [CERT]/[PROBABIL]/[INCERT].

Confirmă în 3–4 rânduri ce ai înțeles (fără să repeți planul), spune-mi dacă vezi vreo contradicție, apoi începe PASUL 1 (R3): mai întâi advisor + confirmă capabilitatea zip/OMML, apoi modulul pur + fixture + integrare, cu gate + eyeball pe cele 3 .docx.
```

---

## Note pentru Roland (nu fac parte din prompt)

**De ce ordinea R3 întâi:** e singurul bug VIZIBIL pe prod (matematica dispare din .docx-urile tale) și are fixture-uri reale — valoare mare, self-contained. R5 (mut F8) e trivial și se deployează cu R3. R6 (Ctrl+K) e feature nou cu mock. R4 (OCR imagine) e exploratoriu și consumă cote API.

**Cerințele tale noi, așa cum le-am înțeles final:** toolbar-ul rămâne cum e, muți doar butoanele de limbi sus (R5); search global Ctrl+K peste tot, pe lângă cel din Matematică (R6); OCR-ul din .docx reparat cu OMML→LaTeX pe fișierele tale reale (R3), plus OCR imagine/scan mai bun testat pe mai multe tipuri (R4).

**Riscul cel mai mare:** R3 (parsarea OMML) — fidelitate parțială la layout-uri complexe; de-aia am separat ETAPA A (formule+ordine, ferm) de ETAPA B (vizual, iterativ).
