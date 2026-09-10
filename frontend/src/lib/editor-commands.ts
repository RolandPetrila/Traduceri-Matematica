/**
 * R6 — Punte de comenzi paletă↔editor (Ctrl+K). Taburile aplicației sunt montate
 * simultan (`display:none`), iar instanța editorului trăiește adânc în `EditorTiptap`.
 * Paleta (la nivel `page.tsx`) NU are acces direct la editor → EditorShell înregistrează
 * un handler aici, iar paleta cheamă `runEditorCommand(id)` (după ce comută pe tabul Editor).
 *
 * Registru simplu (nu event-bus pe `window`) ca să păstrez tipurile. Un singur editor
 * activ → un singur handler; `null` când editorul se demontează.
 */

import { reportFailure } from "./failure";

/** Faza 4.5a — risc „→ Editor": cât timp un item (text/imagine) poate sta în coada de
 * mai jos înainte să fie considerat pierdut și raportat vizibil. */
const PENDING_TIMEOUT_MS = 4000;

export type EditorCommandId =
  | "bold"
  | "italic"
  | "table"
  | "math"
  | "import"
  | "translate-sk"
  | "translate-en"
  | "translate-de"
  | "find";

type Handler = (id: EditorCommandId) => void;

let handler: Handler | null = null;

/** EditorShell înregistrează (și dezînregistrează) handler-ul de comenzi. */
export function setEditorCommandHandler(h: Handler | null): void {
  handler = h;
}

/** Paleta cheamă asta după ce a comutat pe tabul Editor. No-op dacă nu e handler. */
export function runEditorCommand(id: EditorCommandId): void {
  handler?.(id);
}

/** Raportează un item pierdut din coadă — vizibil pe /diagnostics, nu tăcut. */
function reportInsertTimeout(kindLabel: string, userHint: string): void {
  reportFailure({
    code: "E-EDIT-004",
    flow: `editor.insert.${kindLabel}`,
    error: new Error("Editorul nu s-a înregistrat în fereastra de așteptare"),
    context: { kind: kindLabel, waitedMs: PENDING_TIMEOUT_MS },
    userHint,
  });
}

/**
 * Punte separată pentru inserarea unei IMAGINI în editor din alt modul (ex.
 * Calculatorul trimite un grafic ca SVG → figură în document). EditorShell
 * înregistrează inserter-ul; apelantul comută pe tabul Editor, apoi cheamă
 * `insertEditorImage`.
 *
 * Faza 4.5a (risc „→ Editor"): dacă editorul nu s-a înregistrat încă (tab abia
 * comutat, TipTap nu s-a montat), apelul intră într-o COADĂ în loc să se piardă
 * — se golește automat de îndată ce `setEditorImageInserter` primește un
 * handler non-null. Dacă editorul nu se montează în `PENDING_TIMEOUT_MS`,
 * itemul e scos din coadă și raportat vizibil (E-EDIT-004) — nu mai există
 * rezultatul „nimic, tăcut".
 */
type ImageInserter = (src: string, alt?: string) => void;
interface PendingImage {
  src: string;
  alt?: string;
  timer: ReturnType<typeof setTimeout>;
}
let imageInserter: ImageInserter | null = null;
let pendingImages: PendingImage[] = [];

export function setEditorImageInserter(fn: ImageInserter | null): void {
  imageInserter = fn;
  if (fn && pendingImages.length) {
    const queued = pendingImages;
    pendingImages = [];
    for (const item of queued) {
      clearTimeout(item.timer);
      fn(item.src, item.alt);
    }
  }
}

export function insertEditorImage(src: string, alt?: string): void {
  if (imageInserter) {
    imageInserter(src, alt);
    return;
  }
  const item: PendingImage = {
    src,
    alt,
    timer: setTimeout(() => {
      pendingImages = pendingImages.filter((p) => p !== item);
      reportInsertTimeout(
        "image",
        "Imaginea nu a putut fi inserată în Editor. Deschide manual tab-ul Editor și reîncearcă.",
      );
    }, PENDING_TIMEOUT_MS),
  };
  pendingImages.push(item);
}

/**
 * Punte pentru inserarea de TEXT în editor din alt modul (ex. testul generat).
 * Aceeași coadă defensivă ca la imagini — vezi comentariul de mai sus.
 */
type TextInserter = (text: string) => void;
interface PendingText {
  text: string;
  timer: ReturnType<typeof setTimeout>;
}
let textInserter: TextInserter | null = null;
let pendingTexts: PendingText[] = [];

export function setEditorTextInserter(fn: TextInserter | null): void {
  textInserter = fn;
  if (fn && pendingTexts.length) {
    const queued = pendingTexts;
    pendingTexts = [];
    for (const item of queued) {
      clearTimeout(item.timer);
      fn(item.text);
    }
  }
}

export function insertEditorText(text: string): void {
  if (textInserter) {
    textInserter(text);
    return;
  }
  const item: PendingText = {
    text,
    timer: setTimeout(() => {
      pendingTexts = pendingTexts.filter((p) => p !== item);
      reportInsertTimeout(
        "text",
        "Conținutul nu a putut fi inserat în Editor. Deschide manual tab-ul Editor și reîncearcă.",
      );
    }, PENDING_TIMEOUT_MS),
  };
  pendingTexts.push(item);
}

/**
 * R11 (audit 2026-09-07): Chat AI vede documentul CURENT din Editor (context relevant).
 * EditorShell înregistrează un getter de text simplu; Chat-ul îl cheamă la trimitere și-l
 * pasează în system-prompt. `""` dacă editorul nu e montat sau e gol.
 */
type TextGetter = () => string;
let textGetter: TextGetter | null = null;

export function setEditorTextGetter(fn: TextGetter | null): void {
  textGetter = fn;
}

export function getEditorText(): string {
  try {
    return textGetter ? textGetter() : "";
  } catch {
    return "";
  }
}
