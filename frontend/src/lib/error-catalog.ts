/**
 * Catalog de erori — OGLINDĂ a `config/error_codes.json` (rădăcina repo), pt uz în
 * bundle-ul frontend (diagnostics). Sursa canonică rămâne `config/error_codes.json`
 * (citit și de backend + folosit ca documentație). Un test anti-drift
 * (`error-catalog.test.ts`) verifică la fiecare `jest` că cele două sunt IDENTICE —
 * dacă editezi unul, editează-l pe celălalt sau testul pică.
 *
 * GENERAT — nu edita manual acest fișier. Editează `config/error_codes.json` și
 * regenerează (vezi scratchpad/gen-error-catalog.mjs).
 *
 * Scop (cerut 2026-08-20): /diagnostics nu mai arată doar codul seac, ci și
 * „cauză probabilă" + „ce faci" → problema exactă, remediabilă instant.
 *
 * Convenție (Faza 1, 2026-09-08): câmpul `cause` descrie CATEGORIA de eșec, nu
 * incidentul. Cauza reală a unei erori anume stă pe rândul de log, în
 * `context.cause` / `context.kind` / `stack` — scrise de `lib/failure.ts`.
 */
export interface ErrorInfo {
  message: string;
  cause: string;
  fix: string;
  severity: "error" | "warn" | "info";
  area: string;
}

export const ERROR_CATALOG: Record<string, ErrorInfo> = {
  "E-OCR-001": {
    message: "OCR a esuat pentru o pagina",
    cause: "Providerul OCR (Gemini/Mistral) a intors eroare sau JSON invalid pentru pagina respectiva; posibil imagine prea mare, rate-limit (429), sau model retras (404).",
    fix: "Verifica lantul OCR din api/ocr.py + api/lib/ocr_structured.py; ruleaza scratchpad/provider_health-style probe pe modelele OCR; daca un model e 404/429, actualizeaza-l/largeste conditia de fallback.",
    severity: "error",
    area: "ocr",
  },
  "E-OCR-002": {
    message: "Rasterizarea PDF in browser a esuat",
    cause: "pdf.js nu a putut randa pagina (PDF corupt, protejat cu parola, sau prea mare pt memoria browserului pe mobil).",
    fix: "Verifica editor-import.tsx (bucla pdf.js). Testeaza PDF-ul in Convertor (PDF->PNG); daca si acolo pica, e fisierul. Pe mobil, reduce scale-ul de randare.",
    severity: "error",
    area: "ocr",
  },
  "E-OCR-003": {
    message: "Toti providerii OCR au esuat (Gemini + Mistral)",
    cause: "Intreg lantul OCR a cazut: chei epuizate (429 pe ambele Gemini), model retras (404), sau retea. Vezi contextul per-pagina pt eroarea reala a fiecarui tier.",
    fix: "Ruleaza o proba live pe /api/proxy?provider=gemini|gemini2 (vezi scratchpad/provider_health.mjs). Verifica GOOGLE_API_KEY/_2 + MISTRAL_API_KEY/_2 setate in Vercel.",
    severity: "error",
    area: "ocr",
  },
  "E-TRANS-001": {
    message: "Traducerea on-demand a esuat",
    cause: "Providerul de traducere (DeepL principal, apoi lant fallback) a intors eroare; posibil cota DeepL Free epuizata (lunar) sau textul depaseste limita.",
    fix: "Verifica /api/deepl-usage (cota ramasa). Vezi api/lib/translation_router.py pt lantul de fallback. Testeaza cu text scurt.",
    severity: "error",
    area: "translate",
  },
  "E-TRANS-002": {
    message: "Traducerea batch a esuat pentru un fisier",
    cause: "Un segment din batch a cazut la toti providerii, sau separatorul de batch a fost alterat (vezi E-TRANS-004).",
    fix: "Vezi translation_router.py; reia per-sectiune. Verifica math_protect.py nu a corupt placeholderele.",
    severity: "error",
    area: "translate",
  },
  "E-TRANS-003": {
    message: "Lantul de provideri de traducere s-a epuizat",
    cause: "Toti providerii (DeepL/NLLB/OpenRouter/Gemini/Groq) au esuat pt acelasi text. Cel mai probabil: cote epuizate simultan sau un model retras neprins de conditia de fallback.",
    fix: "Ruleaza proba live pe providerii de traducere. Verifica cheile in Vercel. Acelasi tipar ca lantul Chat (groq 404/cerebras 402) — vezi memoria finding_chat_openrouter_free_404.",
    severity: "error",
    area: "translate",
  },
  "E-TRANS-004": {
    message: "Separatorul de batch a fost alterat de provider — reluare per-sectiune (aliniere)",
    cause: "Providerul a tradus/modificat si textul-separator dintre segmente, stricand re-alinierea. Auto-recuperat prin reluare per-sectiune.",
    fix: "Informativ — recuperare automata. Daca apare des, schimba separatorul cu unul mai rezistent in translation_router.py.",
    severity: "warn",
    area: "translate",
  },
  "E-TRANS-005": {
    message: "Traducerea a esuat IN BROWSER (niciun apel de retea esuat)",
    cause: "Esecul s-a produs pe partea de client, fara ca vreun apel API sa fie raportat ca esuat. Doua sub-cazuri, distinse de context.kind: 'logic' = eroare de cod la extragerea/aplicarea continutului; 'badResponse' = serverul a raspuns 200 dar CORPUL era corupt si nu s-a putut parsa. Acest text descrie CATEGORIA; incidentul real e in context.cause + stack pe randul de log — nu presupune un vinovat din acest camp.",
    fix: "Citeste context.kind. 'badResponse' cu 'x-vercel-i...' in cauza = runtime-ul Vercel Python scurge framing intern in corpul raspunsului la cold start (aceeasi clasa ca R9 pe descarcarile binare, dar pe calea JSON) — de obicei a doua incercare reuseste. 'logic' = bug de cod: reproduce cu tipul de continut din context.sample.",
    severity: "error",
    area: "translate",
  },
  "E-CONV-001": {
    message: "Conversia fisierului a esuat",
    cause: "Operatie incompatibila cu formatul (ex. edit-pdf/split/merge pe un non-PDF), fisier corupt, sau backend a intors non-JSON (CORS/edge) parsat gresit de client.",
    fix: "Verifica formatul input vs operatie (garda de format in convertor/page.tsx blocheaza acum PDF-only pe non-PDF). Vezi api/convert.py pt ruta. Parsarea erorii e acum robusta (text->JSON, nu invers).",
    severity: "error",
    area: "convert",
  },
  "E-CONV-002": {
    message: "Export document esuat (DOCX/PDF/HTML)",
    cause: "Randarea math->PNG (KaTeX) sau figuri SVG->PNG a esuat, sau HTMLtoDOCX a primit HTML invalid.",
    fix: "Vezi editor-export.ts. Testeaza export pe un document simplu (fara math) pt a izola. Verifica formule cu glife Unicode brute (norm() le trateaza acum).",
    severity: "error",
    area: "convert",
  },
  "E-VALID-001": {
    message: "Output gol/incomplet — executia nu a livrat rezultat (HTML/fisier gol)",
    cause: "Providerul a intors 200 dar corp gol (ex. Gemini finishReason MAX_TOKENS cu content gol), sau conversia a produs 0 bytes.",
    fix: "Verifica maxOutputTokens (buget 8192). Foloseste butonul Continua pt raspuns taiat. Vezi validator in monitoring.ts.",
    severity: "error",
    area: "validate",
  },
  "E-VALID-002": {
    message: "Output suspect — text prea scurt sau structura posibil pierduta",
    cause: "Rezultatul e mult mai scurt decat inputul — posibila pierdere de continut la OCR/traducere/conversie.",
    fix: "Compara cu sursa (SourcePreview). Reia operatia. Informativ, nu blocheaza.",
    severity: "warn",
    area: "validate",
  },
  "E-VALID-003": {
    message: "Posibil element matematic pierdut (nicio formula LaTeX detectata) — R-MATH",
    cause: "Un document asteptat cu matematica a iesit fara nicio formula LaTeX — OCR-ul poate a ratat notatia, sau traducerea a stricat placeholderele.",
    fix: "Verifica math_protect.py + ocr_structured.py. Compara cu sursa. R-MATH: pierderea notatiei = bug critic.",
    severity: "warn",
    area: "validate",
  },
  "E-OVL-001": {
    message: "Extragerea overlay (PDF text) a esuat",
    cause: "Stratul de text al PDF-ului nu a putut fi extras (PDF scanat/imagine fara text, sau protejat).",
    fix: "Foloseste OCR in loc de overlay pt PDF-uri scanate. Vezi api/overlay/extragerea de text.",
    severity: "error",
    area: "overlay",
  },
  "E-NET-001": {
    message: "Eroare de retea la apelul API",
    cause: "Cerere abortata (timeout client) sau retea cazuta. Pe Chat: un provider lent (Gemini pe raspuns lung) atins de timeout-ul per-provider. NU e neaparat un bug — lantul face fallback.",
    fix: "Daca sunt aborturi SISTEMATICE la exact PROVIDER_TIMEOUT_MS (chat-providers.ts), ridica timeout-ul (facut 20s->40s 2026-08-20). Daca un provider apare mereu, scoate-l din CHAIN. Vezi scratchpad/provider_health.mjs.",
    severity: "error",
    area: "network",
  },
  "E-NET-002": {
    message: "Raspuns HTTP cu eroare (4xx/5xx) de la API — executia nu a livrat",
    cause: "Providerul a intors o eroare HTTP: 404=model retras/cont fara acces, 402=cota free epuizata/plata ceruta, 401=cheie invalida, 429=rate-limit, 5xx=providerul e jos.",
    fix: "Citeste status-ul din context. 404/402 pe un provider = scoate-l/inlocuieste-l in CHAIN (ex. groq 404, cerebras 402 scosi 2026-08-20). 429=asteapta/ridica cota. 401=reseteaza cheia in Vercel.",
    severity: "warn",
    area: "network",
  },
  "E-RATE-001": {
    message: "Prea multe cereri (rate limit)",
    cause: "Rate-limit-ul proxy-ului (60 cereri/min/IP) sau al providerului (429) a fost atins — de obicei prea multe mesaje cascadate rapid.",
    fix: "Asteapta un minut. Daca apare la uz normal, verifica RL_MAX in api/proxy/route.ts. Providerul (429) se rezolva cu cheia _2 (failover).",
    severity: "warn",
    area: "network",
  },
  "E-APP-001": {
    message: "Eroare aplicatie (ErrorBoundary)",
    cause: "Exceptie JS neprinsa in React — bug de cod (undefined, render crash). Vezi stack-ul in context.",
    fix: "Reproduce local, citeste stack trace-ul. Cel mai grav tip — de reparat imediat. Verifica componenta din context.",
    severity: "error",
    area: "app",
  },
  "E-EDIT-001": {
    message: "Importul de fisier in editor a esuat (client)",
    cause: "Lantul de import din browser s-a oprit cu eroare (citirea fisierului, rasterizarea pdf.js, bucla OCR per-pagina, sau maparea in blocuri de editor). Categoria; incidentul real e in context.cause / context.kind.",
    fix: "Vezi editor-import.tsx. Daca context.kind = network, verifica /api/ocr (E-OCR-001). Daca e logic, e o eroare de cod pe fisierul respectiv — cere fisierul de la utilizator si reproduce.",
    severity: "error",
    area: "editor",
  },
  "E-EDIT-002": {
    message: "Dictarea vocala a esuat",
    cause: "Motorul de recunoastere vocala al browserului a refuzat sau s-a oprit. Codul returnat de motor e in context.cause.",
    fix: "not-allowed = permisiune microfon respinsa; audio-capture = microfon absent sau TACUT (vezi MicTestDialog, capcana din 2026-07-26); network = serviciul de voce al browserului; nesuportat = browser fara Web Speech API. Vezi editor-dictation.tsx.",
    severity: "error",
    area: "editor",
  },
  "E-EDIT-003": {
    message: "Salvarea sau incarcarea documentului local a esuat",
    cause: "Stocarea din browser (localStorage) a refuzat operatia — cel mai des cota plina, fereastra privata, sau document prea mare (figuri inglobate base64).",
    fix: "Vezi storage.ts + editor-document.tsx. Verifica dimensiunea din context. Sterge documentele vechi sau redu figurile inglobate.",
    severity: "error",
    area: "editor",
  },
  "E-CHAT-001": {
    message: "Lantul de provideri AI (Chat) s-a epuizat",
    cause: "Niciun provider din CHAIN n-a livrat un raspuns util. Motivul per provider e in context.errors.",
    fix: "Citeste context.errors: 404 = model retras, 402 = cota free epuizata, 401 = cheie invalida, 429 = rate-limit, abort = timeout per provider. Scoate/inlocuieste providerii morti in chat-providers.ts; ruleaza scratchpad/provider_health.mjs. Acelasi tipar ca 2026-08-20 si 2026-09-07.",
    severity: "error",
    area: "chat",
  },
  "E-CHAT-002": {
    message: "Citirea imaginii (OCR) in Chat a esuat",
    cause: "Poza atasata in chat n-a putut fi transformata in text: fisier prea mare (413), OCR-ul a intors eroare, sau nu s-a gasit text in imagine.",
    fix: "Vezi context.status. 413 = poza prea mare, redu rezolutia. Altfel verifica lantul OCR ca la E-OCR-001.",
    severity: "error",
    area: "chat",
  },
  "E-TEST-001": {
    message: "Generarea testului a esuat",
    cause: "Generarea din modulul Teste s-a oprit: lantul AI n-a livrat, raspunsul a fost gol sau taiat, ori construirea testului a crapat.",
    fix: "Vezi context.cause si context.provider. Daca au picat toti providerii, cauza-mama e E-CHAT-001 pe acelasi lant. Vezi TestePanel.tsx + lib/test-generator.ts.",
    severity: "error",
    area: "teste",
  },
  "E-TEST-002": {
    message: "Corectarea lucrarii a esuat",
    cause: "Corectarea automata s-a oprit inainte de a produce baremul. ATENTIE: pe acest flux NU se salveaza fragment din lucrare (e munca unui elev) — doar marimi structurale.",
    fix: "Vezi context.cause, context.textLen, context.hasMath. Daca lantul AI a picat, vezi E-CHAT-001. Vezi TestePanel.tsx.",
    severity: "error",
    area: "teste",
  },
  "E-TEST-003": {
    message: "OCR pe poza lucrarii a esuat",
    cause: "Poza lucrarii n-a putut fi transformata in text (413 prea mare, OCR in eroare, sau imagine fara text lizibil). NU se salveaza fragment din lucrare.",
    fix: "Vezi context.status si context.cause. 413 = redu rezolutia pozei. Altfel, acelasi lant ca E-OCR-001.",
    severity: "error",
    area: "teste",
  },
  "E-SCOL-001": {
    message: "Generarea fisei scolare a esuat",
    cause: "Generarea din modulul Scolare s-a oprit: lantul AI n-a livrat, raspunsul a fost gol sau taiat, ori construirea fisei a crapat. Nodul curricular cerut e in context.node.",
    fix: "Vezi context.cause si context.node. Daca au picat toti providerii, cauza-mama e E-CHAT-001. Vezi ScolarePanel.tsx + lib/scolare/.",
    severity: "error",
    area: "scolare",
  },
  "E-PLAN-001": {
    message: "Generarea unei planse a esuat",
    cause: "Un generator din modulul Planse (labirint/cautare/uneste/dictare/numere/integrama) a aruncat o eroare la construirea fisei. Generatorul e in context.generator.",
    fix: "Modul offline, vanilla JS: vezi frontend/public/planse/app.js + generators/. Reproduce cu parametrii din context (aceeasi forma, acelasi numar de itemi).",
    severity: "error",
    area: "planse",
  },
  "E-HIST-001": {
    message: "Re-descarcarea din Istoric a esuat",
    cause: "Refacerea fisierului dintr-o intrare veche de istoric a esuat: datele salvate lipsesc ori sunt corupte, sau serverul a refuzat cererea.",
    fix: "Vezi context.status si context.cause. Intrarile peste 2MB nu au output_data salvat si nu pot fi re-descarcate — se reface conversia in Convertor.",
    severity: "error",
    area: "istoric",
  },
};

/** Info pt un cod de eroare (sau undefined dacă necunoscut). */
export function getErrorInfo(code?: string): ErrorInfo | undefined {
  if (!code) return undefined;
  return ERROR_CATALOG[code];
}
