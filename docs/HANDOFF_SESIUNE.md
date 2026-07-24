# HANDOFF SESIUNE — reluare context 100% (editor TipTap + stare proiect)

> Ultima actualizare: 2026-07-25. Scop: o sesiune NOUĂ reia exact de unde am rămas, cu tot contextul operațional.

---

## ⚡ PROMPT DE RELUARE (lipește-l ca PRIMUL mesaj în sesiunea nouă)

```
/onboard

Apoi citește INTEGRAL, în ordine:
1. docs/HANDOFF_SESIUNE.md  (acest fișier — starea + contextul operațional)
2. docs/PLAN_editor_tiptap_2026-07-23.md  (sursa de adevăr pentru rescrierea Editorului: faze F0–F6, decizii §17, non-regresie G1–G9)
3. git log --oneline -15  (jurnalul fazelor)

Rescrierea Editorului nativ TipTap+shadcn e la PARITATE: F0–F4 + **F6 COMPLET** (non-regresie G1–G9 + iframe vechi RETRAS; tabul „Editor" = editor nativ).
Următorul pas pe care îl aleg eu: [F3b structuri interactive fracție/radical]  SAU  [F5 polish: a11y aprofundat + dark-mode]  SAU  [pipăitul manual PDF/dictare]  SAU  [alt modul: Planșe].
Respectă protocolul §17 (clarifică per funcție + mock înainte de cod) și gate-ul de non-regresie.
```

---

## 📍 UNDE SUNTEM (2026-07-25)

Am rescris **Editorul matematic** din HTML-vanilla-în-iframe (chrome triplu pe telefon) în **modul nativ React: TipTap 3 + shadcn/ui**, aliniat cu app-ul de referință Mösslein (`C:\Proiecte\Mosslein_Sistem_Gestiune - Copy`). **PARITATE ATINSĂ — iframe-ul vechi RETRAS.**

**Progres (vezi PLAN pt detalii):**

- [x] F0 setup · F1 core+G1 · F2 tabele+inserare
- [~] F3 matematică (G2): **214 formule V–XII + 103 simboluri + căutare** ✓ · **F3b** structuri interactive (fracție/radical cu găuri) = **DEFERAT** (custom NodeView; Roland: nu blochează retragerea)
- [x] **F4 COMPLET** (a export · b fișier/auto-save · c dictare ro-RO · d pagini A4) — vezi istoricul git
- [x] **F6 COMPLET** ✅ 2026-07-25 — non-regresie G1–G9 + retragere iframe:
  - **G1**: + undo/redo pe bara desktop (Ctrl+Z/Y oricum nativ).
  - **G3**: + **zebra (dungi alternante) + culoare fundal celulă**. Sortare/total = RETRASE INTENȚIONAT (Roland).
  - **G4**: + **întrerupere de pagină** (nod `pageBreak` → print/PDF/HTML + `<w:br w:type=page>` în DOCX).
  - **G6**: + **import automat din editorul vechi** (`editor_documente_v1` → adus o singură dată, cu banner; flag `editor_nou_legacy_imported_v1`).
  - **G8**: **Găsește & Înlocuiește** — bară sub toolbar (Ctrl+F + buton 🔍), evidențiere ca decorații, contor, potrivire exactă, Înlocuiește/Toate.
  - **Audit LIVE G1–G9** desktop + probă 390px: G8 (highlight+replace, decorații absente din getHTML), G4 (marcaj+getHTML), G3 (zebra+fundal live+getHTML), import (banner+R-MATH+one-time), G9 temă — toate verzi.
  - **Retras `public/editor/` (`git rm`)**; `app/editor/page.tsx` randează acum editorul NATIV; `/editor-nou` = „Tot ecranul".
  - Fix-uri la audit: zebra invizibilă live (nodeView TableView ignoră atribute → decorație pune `data-zebra` pe `.tableWrapper`) + `Duplicate extension names: ['link']` (StarterKit 3 include Link → `StarterKit.configure({link})`).
- [~] F5 polish (a11y aprofundat + dark-mode opțional) — RĂMAS, neblocant.

**Editorul nativ = tabul „Editor" (`/editor`) + „Tot ecranul" (`/editor-nou`).** Ambele randează `components/editor/EditorTiptap.tsx`. **Cod la zi local (branch `faza-g-editor`), gate verde (tsc 0 · build 9 rute); DEPLOY încă NEfăcut** (outward-facing, cere confirmarea lui Roland — vezi mai jos).

Fișiere `frontend/src/components/editor/`: `EditorTiptap.tsx` (providere: document → pagini → dictare → **find**) · `TiptapToolbar.tsx` (+undo/redo/🔍) · `MobileToolbar.tsx` (Sheet controlat, se închide la deschiderea căutării) · `EditorInsertMenu.tsx` (+întrerupere pagină, +zebra/fundal celulă) · `EditorMathMenu.tsx` · `EditorFileMenu.tsx` · `editor-document.tsx` (+import legacy) · `editor-pages.tsx` · `editor-dictation.tsx` + `dictation-interim.ts` · **`editor-find.tsx` + `search-find.ts`** (G8) · **`page-break.ts`** (G4) · **`table-extensions.ts`** (zebra+fundal+decorație) · `extensions.ts` · `math-data.json`. Plus `lib/editor-export.ts` (+zebra inline+page-break CSS), `app/editor/page.tsx` (native, nu iframe), `app/globals.css`.

### ⚠️ DE PIPĂIT MANUAL de Roland (nu se pot automatiza — rămân deschise)

1. **Export PDF** — `window.print()` deschide dialog modal care blochează Chrome MCP. De verificat că PDF-ul arată corect, unde cade ruptura de pagină, ȘI că **întreruperea de pagină** rupe corect.
2. **Dictare cu voce reală** — nu există intrare audio în automatizare. De verificat: textul intră **la cursor**; `continuous` ține prin pauze; **Oprește** stinge indicatorul.
3. **O dictare reală → Export Word** (cu un tabel cu zebra + o întrerupere de pagină) — combină motor vocal real + export real + funcțiile noi F6.
4. **Găsește & Înlocuiește pe MOBIL** — verificat prin logică + tsc (Sheet-ul se închide la deschiderea căutării), dar NU vizual (proba mobil instabilă). De confirmat pe telefon real: 🔍 din „Format" → bara apare sus și e utilizabilă.

---

## 🔑 CONTEXT OPERAȚIONAL (ce NU se vede din cod — CRITIC)

1. **URL canonic = `traduceri-frontend.vercel.app`** (proiectul NOU, iulie). Există și `traduceri-matematica.vercel.app` (VECHI, martie) — de pe el era instalat PWA-ul lui Roland; ambele rulează acum codul nou, dar **canonic e traduceri-frontend**. NU le confunda.
2. **Deploy:** din `frontend/`, `vercel deploy --prod --yes --token="$VERCEL_API_KEY"` (Vercel CLI instalat global via `npm i -g vercel`; tokenul e în env `VERCEL_API_KEY`, sistem central de chei). Deploy = outward-facing → confirmare scurtă de intenție de la Roland, apoi îl rulez EU.
3. **Testare mobil:** `resize_window` din Chrome MCP **NU emulează** viewport-ul (rămâne 1536). Metoda care merge: injectează un **iframe de 390px** cu pagina în ea (same-origin), via `javascript_tool` → screenshot. (Ecranele CDP dau uneori timeout — reîncearcă.)
4. **Decizii §17 (confirmate):** matematică FIDEL (Unicode + HTML, NU LaTeX); toolbar mobil = bară slim + bottom Sheet (ca Google Docs); temă „cretă" tokenizată (NU neutral). Export (F4) + paritate = de confirmat la faza lor.
5. **Insight cheie Mösslein:** copiem MOTORUL lui (config TipTap, FontSize custom, auto-save, export), dar toolbar-ul LUI e desktop-only → noi facem toolbar mobil MAI BUN (Sheet). Vezi PLAN §2.
6. **Preferință Roland:** rulez EU tot ce se poate automatiza (deploy/push/CLI); manual doar login/2FA/aprobări. Execuție autonomă cu tracking clar + commit/push după fiecare fază.
7. **Workflow per fază:** cod → `tsc 0` + `next build OK` → verificare LIVE la 390px (iframe-probe) + desktop → commit+push → deploy → raport. NU trece la faza următoare fără confirmare.

---

## 🧭 CUM RELUEZI (pas cu pas, în sesiunea nouă)

1. Deschide Claude Code ÎN `C:\Proiecte\Traduceri_Matematica`.
2. Lipește PROMPT-ul de reluare de mai sus.
3. Verifică: `git branch --show-current` = `faza-g-editor`; `git log -1` = ultimul commit editor-tiptap.
4. Continuă faza aleasă din PLAN, respectând §17 + non-regresie.

> Notă: acest fișier + PLAN-ul + memoria + git = „creierul" transferabil. Actualizează-le la fiecare fază (așa rămâne handoff-ul mereu valid).
