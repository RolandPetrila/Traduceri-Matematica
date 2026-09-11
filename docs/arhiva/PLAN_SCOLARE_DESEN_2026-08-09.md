# PLAN — Motor de desen determinist pentru fișele Școlare (grădiniță/vizual)

> Data: 2026-08-09 · Status: ✅ LIVRAT (pilot), NEDEPLOYAT — vezi §REZULTAT la final.

## Problemă

Fișele „Școlare" la grădiniță / domenii vizuale (Educație Plastică etc.) sunt 100% text
(`renderMathText` → escapeHtml + KaTeX; 0 canvas/SVG). Copilul nu are ce colora/trasa pe
foaie. Fix-ul din 2026-08-09 (sesiunea anterioară) a acoperit bug-ul prin `IMAGE_AUTONOMY_RULE`
(elevul desenează SINGUR din text) — corect ca plasă de siguranță, dar nu rezolvă cauza reală:
lipsa unui motor de desen. Model țintă: aplicația veche Carla (`09.08.26_Plansa_Completa.html`)
— SVG inline hand-crafted per exercițiu (colorat cu model alături, traseu punctat, dot-to-dot,
simetrie fluture, baloane cu etichetă de culoare), A4 print, font Comic Neue.

## Arhitectură propusă (verificată în cod, nu presupusă)

1. **Conținutul fișei e text liber** generat de AI (`ScolarePanel.tsx:390`), randat prin
   `renderMathText` (`math-html.ts`) → KaTeX + escape HTML. NU e JSON structurat — deci NU e
   nevoie să schimbăm modul de generare pentru toate cele 112 noduri (risc mic).
2. **Print/export** = `window.print()` direct pe DOM-ul previzualizării (`ScolarePanel.tsx:409`,
   CSS `@media print`) — NU există un pipeline de export separat (PDF backend/DOCX) pentru
   Școlare. Deci SVG injectat prin `dangerouslySetInnerHTML` se printează automat, fără cod nou.
3. **Plan minimal-invaziv:** AI NU desenează SVG (nefiabil, cum a notat Roland). AI alege o
   PRIMITIVĂ + parametri dintr-un enum fix, emisă ca marker text în răspuns, ex.:
   `[[DESEN tip=coloreaza obiect=mar culoare=rosu model=da]]`
   Un parser nou (Școlare-specific, NU atinge `math-html.ts` folosit de Chat/Teste) găsește
   markerul și-l înlocuiește cu SVG generat determinist de o bibliotecă de primitive proprie
   (analog tehnic cu `frontend/public/planse/generators/*.js`, dar in-repo TS pentru Școlare).
4. **`IMAGE_AUTONOMY_RULE` (`prompt.ts`) se ramifică pe domeniu**, NU se relaxează global:
   - Domenii vizuale eligibile pt desen (pilot: de decis mai jos) → regulă nouă: „dacă exercițiul
     cere un vizual, emite markerul [[DESEN ...]] cu parametri din enumul dat — NU descrie o
     imagine, NU cere elevului să deseneze din nimic."
   - Restul domeniilor (matematică, text, etc.) → `IMAGE_AUTONOMY_RULE` actuală rămâne neschimbată.

## De construit (dacă scope-ul e confirmat)

- `frontend/src/lib/scolare/drawing/primitives.ts` — cataloage mici + funcții pure
  `tip → SVG string` (colorează-obiect-cu-model, traseu-de-trasat, unește-puncte, simetrie,
  baloane-cu-etichetă) — catalog inițial de obiecte (măr, soare, fluture, stea, balon, formă
  geometrică) redesenate simplu (nu copiate 1:1 din Carla, dar în același stil).
- `frontend/src/lib/scolare/drawing/parse-render.ts` — găsește markerele `[[DESEN ...]]` în
  textul AI, le validează contra enumului (marker invalid/necunoscut → fallback text, NU crash),
  le înlocuiește cu SVG.
- `prompt.ts` — secțiune nouă condiționată de domeniu (whitelist), cu enumul exact de
  tipuri/obiecte permise (AI nu poate inventa parametri liberi).
- `ScolarePanel.tsx` — folosește noul parser în loc de `renderMathText` direct (sau îl combină)
  DOAR pentru randare (fără efect asupra Chat/Teste, care rămân pe `renderMathText` neschimbat).
- Teste: parser (marker valid/invalid/lipsă), 2-3 primitive (SVG conține elementele așteptate),
  eyeball vizual (Chrome, dacă disponibil) sau HTML static salvat pt inspecție manuală.

## Ce NU se schimbă în acest pilot

- Domeniile non-vizuale (matematică, text) — text+KaTeX rămâne cum e azi.
- Pipeline-ul de generare AI (rămâne text liber, nu JSON structurat) — risc minim pe restul de
  112 noduri deja livrate.
- `math-html.ts` (Chat/Teste) — neatins.

## Riscuri / limite declarate

- AI poate ignora instrucțiunea și tot descrie text în loc de marker (mitigare: fallback la
  comportamentul actual — text simplu — dacă markerul lipsește; regresie=0, doar lipsă upgrade).
- Catalogul de obiecte e mic la pilot — cerințe AI în afara enumului cad pe fallback text.
- Nu replică pixel-perfect Carla (SVG-uri hand-crafted); stil similar, cod propriu.

## SCOPE CONFIRMAT (Roland, 2026-08-09)

- **Cicluri/nivele:** Grădiniță (toate 3 grupe) + Primar Cl. 0-1 (nu tot Primar 0-4).
- **Materii:** TOATE materiile/domeniile din aceste nivele (nu doar Educație Plastică) —
  whitelist-ul din `prompt.ts` acoperă toate nodurile grădiniță + primar cl.0/cl.1, nu un
  subset pe domeniu. Orice materie (matematică, limbă, etc.) la aceste niveluri poate folosi
  un marker `[[DESEN ...]]` dacă exercițiul chiar cere un vizual (ex. „unește punctele" la
  numărat, „colorează forma" la geometrie) — nu doar Ed. Plastică.
- **Primitive la pilot: 5 tipuri** — colorează-obiect-cu-model, traseu-de-trasat,
  unește-punctele, simetrie (jumătate lipsă), baloane-cu-etichetă-culoare.
- **Rol AI:** alege primitivă+parametri dintr-un enum fix (marker text), NU desenează SVG brut.
- **Deploy:** doar cu confirmarea explicită a lui Roland, ca de obicei (R-DEPLOY).

## Notă token-buget

Scope-ul confirmat e mai mare decât „pilotul îngust" — acoperă TOATE nodurile grădiniță +
primar cl.0-1 (nu doar Ed. Plastică), cu 5 primitive. Execuția se face pe faze mici, cu
gate (`tsc`/`jest`) după fiecare, ca să nu explodeze contextul într-o sesiune Sonnet cu buget
redus. Dacă la mijloc devine clar că nu încape, mă opresc și raportez exact ce-a rămas.

## REZULTAT (2026-08-09, aceeași sesiune)

**Livrat integral, conform scope-ului confirmat.** Fișiere noi:

- `frontend/src/lib/scolare/drawing/catalog.ts` — catalog fix OBIECTE (mar, soare, stea,
  floare, pătrat, cerc, triunghi, casă, fluture) + PALETA (9 culori) + FORME_UNESTE
  (puncte dot-to-dot: stea ca pentagramă reală — conectare „sări-unul", nu pentagon).
- `frontend/src/lib/scolare/drawing/primitives.ts` — 5 primitive (`coloreaza`, `traseu`,
  `uneste`, `simetrie`, `baloane`), fiecare `string | null` (null = parametru necunoscut,
  fallback la text, niciodată crash). ZERO interpolare de string netrusted în SVG — totul
  trece prin lookup în `OBIECTE`/`PALETA` (verificat de advisor, punctul 2).
- `frontend/src/lib/scolare/drawing/parse-render.ts` — `renderScolareContent()`: SPLIT
  text pe markere `[[DESEN ...]]` ÎNAINTE de randare, `renderMathText` rulează pe fiecare
  segment de text separat (niciodată pe SVG, niciodată SVG prin escape) — arhitectura
  exactă cerută de advisor (punctul 1). Text fără markere = byte-identic cu
  `renderMathText` (regresie 0 pe cele 112 noduri deja livrate — testat explicit).
- `frontend/src/lib/scolare/drawing/drawing-rule.ts` — `isDrawingEligible(cycle, level)`
  (gradiniță toate grupele + primar clasa-0/clasa-1) + `DRAWING_RULE` (enumurile OBIECT/
  CULOARE/FORMA derivate din catalog, NU duplicate manual — anti-drift).

Modificate:

- `prompt.ts` — `buildScolarePrompt` alege `DRAWING_RULE` XOR `IMAGE_AUTONOMY_RULE` (nu
  amândouă — ar fi contradictoriu, per advisor punctul 4); `buildScolareSystemPrompt`
  primește acum `(cycle?, level?)` opțional și ramifică la fel; call site-urile neeligibile
  (gimnaziu/liceu/primar cl.2-4) rămân STRICT pe comportamentul vechi (testat explicit).
- `ScolarePanel.tsx` — randarea preview foloseşte `renderScolareContent` în loc de
  `renderMathText` direct (singurul punct de folosire în fișier); cele 2 call site-uri
  `buildScolareSystemPrompt` primesc acum `cycle, level`. Chat/Teste (folosesc
  `renderMathText` direct, fișiere separate) — NEATINSE.
- Print: CSS-ul existent din `ScolarePanel.tsx` (`print-color-adjust:exact`, zonă izolată)
  acoperea deja cerința advisorului (punctul 3) — verificat, nicio schimbare necesară.
  Wrapper-ele SVG au `break-inside:avoid` inline (punctul 3, a doua parte).

**Gate: `tsc 0 · jest 346/346 (+21 noi: parse-render.test.ts + extensie content.test.ts)
· next build OK`.** Verificare vizuală: extensia Chrome indisponibilă în acest mediu (ca și
sesiunea anterioară) — eyeball prin HTML generat real din `renderScolareContent()` pe un
sample cu toate cele 5 primitive, inspectat manual (geometrie SVG în interiorul viewBox-urilor,
pentagrama corectă) — fișier de referință: `scratchpad/eyeball_desen_output.html` (deschide-l
direct în orice browser pt verificare finală vizuală de către Roland).

**NEDEPLOYAT** — așteaptă confirmarea explicită a lui Roland (R-DEPLOY).

**Ce NU s-a făcut (conștient, scope pilot):** AI-ul trebuie să EMITĂ markerul corect din
proprie inițiativă (nu e verificat/enforced la runtime dacă îl omite — fallback e text
simplu, ca înainte, deci regresie=0 dar și fără upgrade dacă modelul „uită"). Nicio
verificare automată gen `verify-fisa.ts` pt markere (ex. „exercițiul cere colorat dar nu are
marker") — de adăugat DOAR dacă proba reală arată nevoie (nu presupune orb).

## PROBĂ LIVE (2026-08-09, aceeași sesiune) — CONFIRMAT empiric

Roland a confirmat vizual `eyeball_desen_output.html` („sunt bune"). Apoi probă LIVE reală
prin `/api/proxy` (PROD, Gemini, `scratchpad/desen_live_probe.mjs`) cu promptul NOU
(`DRAWING_RULE`) pe 4 noduri eligibile (Grădiniță Grupa Mică Ed.Plastică — repro exact,
Grădiniță Grupa Mare Matematică, Primar Clasa 0 Matematică, Primar Clasa I Arte Vizuale),
2 mostre fiecare:

**23/23 markere emise = valide, 0 invalide.** AI-ul a folosit toate cele 5 tipuri de
primitive (coloreaza, traseu, uneste, simetrie, baloane) din proprie inițiativă, cu
parametri corecți, pe rândul lui, FĂRĂ să mai descrie vizualul redundant în text (verificat
pe un sample complet — enunț scurt + marker curat). Confirmă empiric că promptul funcționează
pe modelul real, nu doar teoretic.

✅✅ **DEPLOYAT (2026-08-09, confirmat Roland „fă deploy acum")**. Commit `022d49b` (push
`faza-g-editor`), `vercel deploy --prod --yes` din `frontend/` →
`dpl_D5Ri4Cw9MGX4gN2Gkks49BpEq4u3` READY/production, alias `traduceri-frontend.vercel.app`.
Verificat live: homepage 200 + regulamentul `gradinita_grupa-mica_educatie-plastica.md` 200.
Backend `traduceri-api` neatins (modificare frontend-only).
