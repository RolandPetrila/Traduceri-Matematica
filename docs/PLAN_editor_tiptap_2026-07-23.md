# PLAN — Editor nativ TipTap + shadcn/ui (rescriere profesionistă)

> Versiune 1.0 · 2026-07-23 · Efort: max · Sequential-thinking: folosit (7 pași) · Referință: Mösslein (mapat cu agent)
> Decizie Roland (2026-07-23): **rescriere TipTap + shadcn** (Opțiunea 2), cu plan §17 (clarificare per funcție) + gate non-regresie.
> **Protocol §17 (obligatoriu):** NU se scrie cod până nu se confirmă forma per funcție (runde AskUserQuestion + mock).

---

## 1. Problema (de ce)

Editorul actual = aplicație HTML-vanilla (3737 linii) într-un **iframe** în shell-ul Next. Pe telefon → **chrome dublu/triplu** (taburi app + antet wrapper + antetul propriu al editorului) → zona de scris = fâșie subțire. Cauza e **arhitecturală**, nu CSS. Patch-urile pe iframe tratează simptomul.

**Țintă:** editor **nativ React** (fără iframe), o singură bară, responsive nativ, calitate ≥ Mösslein, cu toolbar **mobile-first** (mai bun decât Mösslein).

---

## 2. Blueprint Mösslein (ce copiem / ce îmbunătățim)

**Stack confirmat:** Next 16 / React 19, TipTap 3.27, Tailwind v4, shadcn/ui (new-york, neutral, CSS-vars oklch), `radix-ui` unificat, `next-themes`.

**COPIEM direct** (fișiere-sursă Mösslein):

- Config TipTap: `StudioEditor.tsx:210-236` — `StarterKit` (include Underline în TipTap 3), `TextStyle, Color, FontFamily, FontSize(custom), Highlight.configure({multicolor:true}), TextAlign.configure({types:["heading","paragraph"]}), Subscript, Superscript, Image.configure({allowBase64:true}), Table.configure({resizable:true}), TableRow, TableHeader, TableCell`. `immediatelyRender:false` (SSR-safe).
- **FontSize custom**: `src/lib/tiptap-font-size.ts:11-37` (StarterKit n-are font-size — extensie pe `textStyle`).
- Auto-save debounce 1.6s (`:313-317`); page-count `scrollHeight/PAGE_H` (`PAGE_H=1123`, `:238-242`).
- Dictare Web Speech `lang="ro-RO"` (`:405-454`).
- Export multi-cale: **print→PDF** (`studio-export.ts:101-121` `window.open`+`print()`), **DOCX real** (`@turbodocx/html-to-docx`, `app/actions/studio-docx.ts`), HTML blob + Web Share.
- shadcn setup (components.json new-york/neutral), token-uri oklch în globals.css, `next-themes`.

**ÎMBUNĂTĂȚIM peste Mösslein** (toolbar-ul lui e desktop-only — native `<button>/<select>`, doar `flex-wrap`, fără Sheet/Toggle):

- Toolbar **mobile-first**: desktop = bară completă (shadcn `ToggleGroup`+`DropdownMenu`+`Select`); mobil = bară slim + **bottom `Sheet`** cu grupuri de unelte (ca Google Docs), foaia = primară.
- shadcn de adăugat (absente în Mösslein): `sheet`, `toggle`, `toggle-group`, `dropdown-menu`, `select`, `tooltip`, `scroll-area`.

---

## 3. Non-regresie — TOT ce trebuie păstrat din editorul actual

> Gate: nicio fază „gata" fără ca funcțiile din grupul ei să fie verificate.

- **G1 Formatare**: bold, italic, underline, strike, font, mărime(pt), culoare text, evidențiere, aliniere (L/C/R/Justify), listă •, listă 1., indent ±, stiluri paragraf (Text normal/Titlu 1-3/Citat), removeFormat.
- **G2 Matematică** ⚠️ (cel mai delicat): 103 simboluri (`insertSymbol`), structuri editabile (fracție/radical/Σ/∏/∫/paranteze/funcții/limită/accent-bară-vector/matrice 2×2·3×3 — `insertStructure`+`eq*Html`), **bibliotecă formule pe clase V–XII** (`insertFormula`+`onClasaChange`), **căutare matematică** autocomplete (`initMathSearch`/`search`).
- **G3 Tabele Excel-like**: `insertTable`, add/del rând·coloană, `mergeCells`/`splitCell`, `sortTable`, `sumRow`(total), `toggleHeaderRow`, `toggleZebra`, selecție celule.
- **G4 Inserare**: link, imagine, dată, linie orizontală, întrerupere pagină.
- **G5 Dictare** vocală RO (Web Speech, live/interim, `toggleMic`).
- **G6 Fișier**: nou, salvare + **auto-save localStorage** + restore, **export PDF/Word/HTML**, nume document.
- **G7 Pagini A4** paginat + „Pagina 2" automat (`updatePages`).
- **G8 Găsește & Înlocuiește** (find/replace + highlight).
- **G9 Temă „cretă"** păstrată (sau tokenizată shadcn în paleta verde-cretă a app-ului).

---

## 4. Arhitectură țintă

- Modul nou **nativ**: `frontend/src/app/editor/` → înlocuiește iframe-ul cu componente React (`EditorTiptap.tsx`, `EditorToolbar.tsx`, `EditorToolbarMobile.tsx`, `extensions/`, `lib/editor-export.ts`, `lib/editor-math.ts`).
- **shadcn/ui** inițializat în Traduceri (nou): `components.json`, `src/components/ui/*`, `lib/utils` (cn). Paletă adaptată temei cretă (token-uri).
- Iframe-ul `public/editor/index.html` → păstrat temporar ca fallback „Tot ecranul" până la paritate completă, apoi retras (R-MINIMAL).
- Responsive: pattern Mösslein (fără `useMediaQuery` — dual-tree `md:hidden` / breakpoints CSS, SSR-safe) + bottom `Sheet` pt unelte pe mobil.

---

## 5. Faze (checklist bifabil) + gate

- [x] **F0 — Setup** ✅ 2026-07-23: TipTap 3.28 (react/pm/starter-kit + text-style/color/font-family/highlight/text-align/subscript/superscript/image/underline/link/table+row/header/cell) + shadcn (lib/utils cn, tokeni cretă în vars shadcn, tailwind.config extins, tailwindcss-animate, components.json new-york, 12 componente ui). Gate: tsc 0 · next build OK.
- [x] **F1 — Editor core + G1 (formatare)** ✅ 2026-07-23: `EditorTiptap.tsx` (useEditor + extensii Mösslein) + `TiptapToolbar.tsx` (G1: font/mărime/B·I·U·S·sub·sup/culoare/evidențiere/clear/stil-paragraf/aliniere/liste/indent, shadcn Toggle/Select/Popover) + `MobileToolbar.tsx` (bară slim + bottom Sheet). Foaia A4 responsive (fără padding fix). Rută preview `/editor-nou` (tabul rămâne pe iframe vechi). Gate: tsc 0 · build OK · verificat LIVE la 390px (foaia primară + Sheet „Format") + desktop. RĂMAS din G1: bara de fișier (Nou/Salvează/nume) = la F4.
- [ ] **F2 — G3 Tabele + G4 Inserare**: Table resizable + meniuri tabel (add/del/merge/split/sort/total/header/zebra) + link/imagine/dată/linie/page-break.
- [ ] **F3 — G2 Matematică** ⚠️ (per §17 — decizie separată): simboluri + structuri + bibliotecă clase V–XII + căutare. Gate: paritate cu inserările actuale.
- [ ] **F4 — G5 Dictare + G6 Fișier + G7 Pagini**: Web Speech ro-RO; save/auto-save/restore (localStorage, compat cu cheia actuală dacă se poate); export PDF(print)/Word(turbodocx)/HTML; page-count A4.
- [ ] **F5 — G8 Find/Replace + G9 Temă + polish**: find/replace; temă cretă tokenizată; a11y (focus/aria); dark-mode opțional.
- [ ] **F6 — Non-regresie + QA mobil + retragere iframe**: checklist G1–G9 pe desktop + telefon (Android+iPhone); apoi retrag `public/editor/index.html`. Gate: toate grupurile verzi.

---

## 6. Decizii §17 (Roland, 2026-07-23)

1. ✅ **Toolbar mobil = bară slim sus (undo/redo/B/I/U/„⋯ Format") + bottom `Sheet`** cu grupuri de unelte (ca Google Docs). Foaia = primară.
2. ✅ **Matematică FIDEL**: simboluri Unicode + structuri HTML editabile (fracție/radical/matrice) + **biblioteca RO pe clase V–XII NESCHIMBATĂ**. NU LaTeX/KaTeX. Paritate 100%, editabil inline, risc mic.
3. [ ] **Export** — de confirmat la F4 (refolosire cale actuală vs turbodocx DOCX + print-PDF). Default provizoriu: refolosesc logica actuală (HTML→print PDF, DOCX/HTML).
4. ✅ **Temă „cretă" tokenizată** (verde/galben în variabilele shadcn); foaia rămâne albă. NU paleta neutral.
5. [ ] **Paritate** — țintă 100% (G1–G9); orice tăiere se confirmă la faza respectivă.

---

## 7. Riscuri & mitigări

| Risc                                          | Mitigare                                                                                     |
| --------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Regresie pe G2 (matematică) — cel mai complex | Fază dedicată F3 + §17 + gate paritate; păstrez iframe-ul vechi ca fallback până la paritate |
| Efort mare / multi-sesiune                    | Faze mici, fiecare livrabilă + verificată; iframe rămâne funcțional între faze               |
| shadcn peste tema cretă existentă             | Tokenizez paleta cretă în variabilele shadcn; nu ating celelalte module                      |
| Export DOCX fidelitate                        | Refolosesc turbodocx (dovedit Mösslein) sau calea HTML actuală                               |
| SSR/RSC (Next 15)                             | `immediatelyRender:false` + `"use client"` (ca Mösslein)                                     |

---

## 8. Ce NU se atinge

Modulele Traduceri / Convertor / Planșe / Asistent rămân neatinse (R-EXT). shadcn se adaugă aditiv. Iframe-ul editor vechi rămâne până la paritate, apoi se retrage.
