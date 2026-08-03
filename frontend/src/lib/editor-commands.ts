/**
 * R6 — Punte de comenzi paletă↔editor (Ctrl+K). Taburile aplicației sunt montate
 * simultan (`display:none`), iar instanța editorului trăiește adânc în `EditorTiptap`.
 * Paleta (la nivel `page.tsx`) NU are acces direct la editor → EditorShell înregistrează
 * un handler aici, iar paleta cheamă `runEditorCommand(id)` (după ce comută pe tabul Editor).
 *
 * Registru simplu (nu event-bus pe `window`) ca să păstrez tipurile. Un singur editor
 * activ → un singur handler; `null` când editorul se demontează.
 */

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

/**
 * Punte separată pentru inserarea unei IMAGINI în editor din alt modul (ex.
 * Calculatorul trimite un grafic ca SVG → figură în document). EditorShell
 * înregistrează inserter-ul; apelantul comută pe tabul Editor, apoi cheamă
 * `insertEditorImage`. No-op dacă editorul nu e montat.
 */
type ImageInserter = (src: string, alt?: string) => void;
let imageInserter: ImageInserter | null = null;

export function setEditorImageInserter(fn: ImageInserter | null): void {
  imageInserter = fn;
}

export function insertEditorImage(src: string, alt?: string): void {
  imageInserter?.(src, alt);
}
