import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as PMNode } from "@tiptap/pm/model";
import type { Editor } from "@tiptap/react";

/**
 * G8 Găsește & Înlocuiește — motorul.
 *
 * Potrivirile se randează ca DECORAȚII ProseMirror (ca la dictare, F4c): nu fac
 * parte din document → `getHTML()` nu le vede niciodată, deci evidențierea nu
 * poate ajunge în auto-save sau în export, și nu poluează istoricul de undo.
 * Doar înlocuirea propriu-zisă modifică documentul.
 */

export type FindMatch = { from: number; to: number };

export type FindState = {
  query: string;
  caseSensitive: boolean;
  matches: FindMatch[];
  index: number;
};

export const findKey = new PluginKey<FindState>("editorFind");

const EMPTY_STATE: FindState = {
  query: "",
  caseSensitive: false,
  matches: [],
  index: 0,
};

/**
 * Caută în fiecare bloc de text separat: o potrivire nu traversează paragrafe
 * și nu e ruptă de marcaje (bold/sup/culoare împart textul în mai multe noduri,
 * dar aici sunt concatenate, cu o hartă offset→poziție în document).
 */
export function findMatches(
  doc: PMNode,
  query: string,
  caseSensitive: boolean,
): FindMatch[] {
  const out: FindMatch[] = [];
  if (!query) return out;
  const needle = caseSensitive ? query : query.toLowerCase();

  doc.descendants((node, pos) => {
    if (!node.isTextblock) return true;

    let text = "";
    const positions: number[] = [];
    node.forEach((child, offset) => {
      if (child.isText) {
        const value = child.text ?? "";
        for (let i = 0; i < value.length; i++) {
          positions.push(pos + 1 + offset + i);
        }
        text += value;
      } else {
        // Nod inline non-text (imagine, hard break) → caracter-santinelă, ca
        // offset-urile să rămână aliniate și potrivirile să nu-l traverseze.
        text += "￼";
        positions.push(pos + 1 + offset);
      }
    });

    const haystack = caseSensitive ? text : text.toLowerCase();
    let at = haystack.indexOf(needle);
    while (at !== -1) {
      const from = positions[at];
      const lastPos = positions[at + needle.length - 1];
      if (from !== undefined && lastPos !== undefined) {
        out.push({ from, to: lastPos + 1 });
      }
      at = haystack.indexOf(needle, at + needle.length);
    }
    return false; // blocul a fost tratat integral aici
  });

  return out;
}

export const FindHighlight = Extension.create({
  name: "editorFind",

  addProseMirrorPlugins() {
    return [
      new Plugin<FindState>({
        key: findKey,
        state: {
          init: () => EMPTY_STATE,
          apply(tr, value, _oldState, newState) {
            const meta = tr.getMeta(findKey) as Partial<FindState> | undefined;
            // Recalculăm doar la schimbare de căutare sau de document.
            if (!meta && !tr.docChanged) return value;
            const next = { ...value, ...(meta ?? {}) };
            const matches = findMatches(
              newState.doc,
              next.query,
              next.caseSensitive,
            );
            let index = next.index;
            if (index >= matches.length) index = matches.length - 1;
            if (index < 0) index = 0;
            return { ...next, matches, index };
          },
        },
        props: {
          decorations(state) {
            const current = findKey.getState(state);
            if (!current?.query || current.matches.length === 0) {
              return DecorationSet.empty;
            }
            return DecorationSet.create(
              state.doc,
              current.matches.map((match, i) =>
                Decoration.inline(match.from, match.to, {
                  class:
                    i === current.index
                      ? "search-match search-match-current"
                      : "search-match",
                }),
              ),
            );
          },
        },
      }),
    ];
  },
});

/** Starea curentă a căutării (sigur și înainte ca `editor.view` să existe). */
export function getFindState(editor: Editor | null): FindState {
  if (!editor?.view) return EMPTY_STATE;
  return findKey.getState(editor.state) ?? EMPTY_STATE;
}

/** Actualizează căutarea (query / caseSensitive / index) printr-o tranzacție meta. */
export function setFindState(
  editor: Editor | null,
  patch: Partial<FindState>,
): void {
  const view = editor?.view;
  if (!view) return;
  view.dispatch(view.state.tr.setMeta(findKey, patch));
}

/** Sare la potrivirea următoare (+1) / anterioară (−1), circular, și derulează la ea. */
export function goToMatch(editor: Editor | null, delta: number): void {
  const state = getFindState(editor);
  const total = state.matches.length;
  if (!editor || total === 0) return;
  const next = (state.index + delta + total) % total;
  setFindState(editor, { index: next });
  const match = state.matches[next];
  if (!match) return;
  editor
    .chain()
    .setTextSelection({ from: match.from, to: match.to })
    .scrollIntoView()
    .run();
}

/** Înlocuiește potrivirea curentă. Întoarce `true` dacă a înlocuit ceva. */
export function replaceCurrentMatch(
  editor: Editor | null,
  replacement: string,
): boolean {
  const view = editor?.view;
  if (!view) return false;
  const state = getFindState(editor);
  const match = state.matches[state.index];
  if (!match) return false;
  const tr = view.state.tr;
  if (replacement) tr.insertText(replacement, match.from, match.to);
  else tr.delete(match.from, match.to);
  // Păstrăm indexul: potrivirea curentă dispare, deci indexul arată deja spre
  // următoarea (lista se recalculează în `apply`, pe tranzacția asta).
  tr.setMeta(findKey, { index: state.index });
  view.dispatch(tr);
  return true;
}

/** Înlocuiește toate potrivirile. Întoarce câte au fost înlocuite. */
export function replaceAllMatches(
  editor: Editor | null,
  replacement: string,
): number {
  const view = editor?.view;
  if (!view) return 0;
  const state = getFindState(editor);
  const total = state.matches.length;
  if (total === 0) return 0;
  const tr = view.state.tr;
  // De la ultima spre prima: pozițiile potrivirilor anterioare rămân valide.
  for (let i = total - 1; i >= 0; i--) {
    const match = state.matches[i];
    if (replacement) tr.insertText(replacement, match.from, match.to);
    else tr.delete(match.from, match.to);
  }
  tr.setMeta(findKey, { index: 0 });
  view.dispatch(tr);
  return total;
}
