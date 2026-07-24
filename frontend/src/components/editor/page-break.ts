import { Node } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pageBreak: {
      /** Inserează o întrerupere de pagină (efect la print/PDF/Word). */
      setPageBreak: () => ReturnType;
    };
  }
}

/**
 * Întrerupere de pagină (G4, paritate cu editorul vechi) — nod atomic de bloc.
 *
 * ⚠️ `class="page-break"` EXACT, fără alte clase: `@turbodocx/html-to-docx`
 * testează egalitatea STRICTĂ a atributului class (`"page-break" === attributes.class`,
 * verificat în `dist/html-to-docx.browser.esm.js`, 2026-07-24) ca să emită
 * `<w:br w:type="page"/>` în .docx. Orice clasă în plus ar rupe tăcut exportul Word.
 *
 * `style` inline asigură ruptura la print/PDF și în HTML-ul exportat; marcajul
 * vizibil din editor vine din CSS (`.editor-content .page-break`, globals.css).
 */
export const PageBreak = Node.create({
  name: "pageBreak",
  group: "block",
  atom: true,
  selectable: true,

  parseHTML() {
    return [{ tag: "div[data-page-break]" }, { tag: "div.page-break" }];
  },

  renderHTML() {
    return [
      "div",
      {
        class: "page-break",
        "data-page-break": "true",
        style: "page-break-after: always;",
      },
    ];
  },

  addCommands() {
    return {
      setPageBreak:
        () =>
        ({ chain }) =>
          // Paragraf după ruptură: altfel, dacă e ultimul nod, nu mai ai unde scrie.
          chain()
            .insertContent([{ type: this.name }, { type: "paragraph" }])
            .run(),
    };
  },
});
