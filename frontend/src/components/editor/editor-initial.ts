import type { Editor } from "@tiptap/react";

/**
 * Conținutul inițial al editorului nou (boilerplate). Extras din EditorTiptap ca să-l
 * poată folosi și `editor-import` (detecția „document gol/pristine") fără import ciclic.
 */
export const INITIAL = `
<h1>Document nou</h1>
<p>Scrie aici documentul (proces verbal, adresă, ofertă, orice)…</p>
<p>Selectează text și folosește bara de sus. Pe telefon, apasă <strong>Format</strong> pentru toate uneltele.</p>
`;

/** Semnătura text-only a boilerplate-ului (tag-uri scoase, spații normalizate). */
const INITIAL_SIGNATURE = INITIAL.replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ")
  .trim();

/**
 * „Document gol/pristine" pentru F9: editor gol SAU exact boilerplate-ul neatins.
 * De ce nu doar `isEmpty`: editorul pornește cu INITIAL (h1 + 3 paragrafe) → cu
 * `isEmpty` singur, importul ar cere mereu confirmarea înlocuiește/adaugă pe un
 * editor proaspăt, contrar intenției §17 („n-ai ce pierde → intri direct").
 */
export function isPristineEditor(editor: Editor): boolean {
  if (editor.isEmpty) return true;
  const now = editor.getText().replace(/\s+/g, " ").trim();
  return now === INITIAL_SIGNATURE;
}
