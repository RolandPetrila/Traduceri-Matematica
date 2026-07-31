/**
 * R7.1 [CERT] — tabelul mapat din OCR chiar RANDEAZĂ + SERIALIZEAZĂ prin TipTap.
 * Instanțiază un Editor REAL cu `editorExtensions` (jsdom), pune blocurile produse
 * de `structuredPagesToBlocks` pe o secțiune `table` și verifică `getHTML()` (sursa
 * exportului PDF/HTML/Word) conține `<table>` + TOATE celulele. Închide gap-ul pe
 * care advisor l-a semnalat (era dedus, nu rulat).
 */
import { Editor } from "@tiptap/core";
import { editorExtensions } from "./extensions";
import { structuredPagesToBlocks, type OcrPage } from "./ocr-map";

describe("R7.1 — tabel OCR → getHTML() (TipTap real)", () => {
  it("table section → <table> cu toate celulele în getHTML()", () => {
    const pages: OcrPage[] = [
      {
        sections: [
          {
            type: "table",
            headerRows: 1,
            rows: [
              ["Parameter", "Einheit", "Ergebnis"],
              ["pH", "-", "7.2"],
              ["Säurekapazität", "mmol/l", "0"],
            ],
          },
        ],
      },
    ];
    const { blocks } = structuredPagesToBlocks(pages);
    const editor = new Editor({
      element: document.createElement("div"),
      extensions: editorExtensions,
      content: { type: "doc", content: blocks },
    });
    const html = editor.getHTML();
    editor.destroy();

    expect(html).toContain("<table");
    for (const cell of [
      "Parameter",
      "Einheit",
      "Ergebnis",
      "pH",
      "7.2",
      "Säurekapazität",
      "mmol/l",
    ]) {
      expect(html).toContain(cell);
    }
    // Rândul de antet e serializat ca <th> (headerRows=1).
    expect(html).toMatch(/<th[\s>]/);
  });
});
