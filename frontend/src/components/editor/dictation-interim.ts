import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Editor } from "@tiptap/react";

/**
 * Text interimar de dictare (F4c) randat ca DECORAȚIE ProseMirror, nu ca text
 * inserat în document.
 *
 * De ce decorație: decorațiile NU fac parte din document → `editor.getHTML()`
 * nu le vede niciodată, deci e structural imposibil ca text neconfirmat să
 * ajungă în auto-save (debounce 1.5s) sau în export PDF/Word/HTML. Cu inserare
 * inline ar fi trebuit să curățăm manual, și orice scăpare ar fi corupt documentul.
 *
 * Bonus: tranzacțiile doar-meta nu modifică documentul → nu declanșează `update`,
 * deci dictarea nu poluează istoricul de undo și nu forțează auto-save la fiecare
 * silabă auzită.
 */
export const dictationInterimKey = new PluginKey<{ text: string }>(
  "dictationInterim",
);

export const DictationInterim = Extension.create({
  name: "dictationInterim",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: dictationInterimKey,
        state: {
          init: () => ({ text: "" }),
          apply(tr, value) {
            const meta = tr.getMeta(dictationInterimKey);
            if (typeof meta === "string") return { text: meta };
            return value;
          },
        },
        props: {
          decorations(state) {
            const current = dictationInterimKey.getState(state);
            const text = current?.text ?? "";
            if (!text) return DecorationSet.empty;
            const pos = state.selection.to;
            const widget = Decoration.widget(
              pos,
              () => {
                const span = document.createElement("span");
                span.className = "dictation-interim";
                span.textContent = text;
                return span;
              },
              { side: 1 },
            );
            return DecorationSet.create(state.doc, [widget]);
          },
        },
      }),
    ];
  },
});

/** Setează (sau golește, cu "") textul interimar afișat la cursor. */
export function setDictationInterim(editor: Editor, text: string): void {
  const { view } = editor;
  if (!view) return;
  view.dispatch(view.state.tr.setMeta(dictationInterimKey, text));
}
