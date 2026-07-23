# HANDOFF SESIUNE — reluare context 100% (editor TipTap + stare proiect)

> Ultima actualizare: 2026-07-23. Scop: o sesiune NOUĂ reia exact de unde am rămas, cu tot contextul operațional.

---

## ⚡ PROMPT DE RELUARE (lipește-l ca PRIMUL mesaj în sesiunea nouă)

```
/onboard

Apoi citește INTEGRAL, în ordine:
1. docs/HANDOFF_SESIUNE.md  (acest fișier — starea + contextul operațional)
2. docs/PLAN_editor_tiptap_2026-07-23.md  (sursa de adevăr pentru rescrierea Editorului: faze F0–F6, decizii §17, non-regresie G1–G9)
3. git log --oneline -15  (jurnalul fazelor)

Continuăm rescrierea Editorului nativ TipTap+shadcn. Am terminat F0–F3 și TOATĂ faza F4 (a export · b fișier/auto-save · c dictare · d pagini A4).
Următorul pas pe care îl aleg eu: [F5 find/replace + polish]  SAU  [F3b structuri interactive]  SAU  [F6 non-regresie + retragerea iframe-ului vechi].
Respectă protocolul §17 (clarifică per funcție + mock înainte de cod) și gate-ul de non-regresie.
```

---

## 📍 UNDE SUNTEM (2026-07-23)

Rescriem **Editorul matematic** din HTML-vanilla-în-iframe (chrome triplu pe telefon) în **modul nativ React: TipTap 3 + shadcn/ui**, aliniat cu app-ul de referință Mösslein (`C:\Proiecte\Mosslein_Sistem_Gestiune - Copy`).

**Progres (vezi PLAN pt detalii):**

- [x] F0 setup (TipTap 3.28 + 12 componente shadcn + temă cretă tokenizată)
- [x] F1 editor core + G1 formatare (desktop toolbar + mobil bară slim + bottom Sheet)
- [x] F2 tabele (G3) + inserare (G4: link/imagine/dată/linie)
- [~] F3 matematică (G2): **214 formule pe clase V–XII + 103 simboluri + căutare** ✓ (fidel)
- [ ] **F3b** structuri interactive (fracție/radical cu găuri) — custom TipTap NodeView; **abordare de confirmat cu Roland**
- [~] **F4** — sub-fazat:
  - [x] **F4a Export** ✅ 2026-07-23: `Fișier ▾` (PDF print vectorial · Word .docx turbodocx · HTML standalone), document alb clasic. Verificat LIVE + **fidelitate R-MATH pe conținut real** (sup/sub/tabel/bold păstrate în DOCX dezarhivat + HTML; PDF = același body). Mobil Sheet OK. PDF click = eyeball manual.
  - [x] **F4b Fișier** ✅ 2026-07-24: cheie `editor_nou_v1` (separată de editorul vechi), auto-save debounce 1.5s + Salvează manual + Redenumește (numele → export) + Document nou cu confirmare + restore la reload + status „✓ salvat HH:MM". Verificat LIVE desktop + mobil 390px + **non-regresie R-MATH**: restore după reload păstrează sup/sub/tabel(4 celule)/bold; export re-testat post-refactor (numele → `Test-F4b.html`, corp fidel).
  - [x] **F4d Pagini A4** ✅ 2026-07-24: foaia desktop la metrici A4 REALE (210mm, 20/18mm) = identice cu documentul exportat (lățime conținut 174mm în ambele) → ghidajele „Pagina N" indică fidel sfârșitul paginii; contor „📄 N pag. A4". **Limită onestă:** ruptura reală din PDF poate fi cu un element mai sus (print-ul nu taie la mijloc de paragraf) — spune „aliniat la A4", nu „exact". Pe mobil foaia rămâne fluidă → ghidaje+contor ASCUNSE (ar minți). Verificat LIVE.
  - [x] **F4c Dictare** ✅ 2026-07-24: microfon în bara slim mobil + toolbar desktop, `ro-RO` continuous cu auto-restart, interimar gri ca DECORAȚIE ProseMirror (structural imposibil să ajungă în document/auto-save/export), aviz cloud o singură dată. Suport verificat: Chrome/Edge/Opera + **Safari macOS 14.1+/iOS 14.5+**; Firefox NU → buton ascuns. Verificat LIVE cu motor simulat.
  - ⇒ **FAZA F4 COMPLETĂ** (F4a export · F4b fișier · F4c dictare · F4d pagini)
- [ ] F5 find/replace + polish · F6 non-regresie + înlocuire iframe vechi

**Editorul nou = rută preview `/editor-nou`** (tabul „Editor" normal rămâne pe iframe-ul vechi funcțional până la paritate F6). Fișiere: `frontend/src/components/editor/*` (incl. `EditorFileMenu.tsx` = export) + `frontend/src/app/editor-nou/page.tsx` + `frontend/src/lib/tiptap-font-size.ts` + `frontend/src/lib/editor-export.ts` (PDF/Word/HTML) + `frontend/src/components/editor/math-data.json` (214 formule + 103 simboluri extrase). Dep nouă: `@turbodocx/html-to-docx`.

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
