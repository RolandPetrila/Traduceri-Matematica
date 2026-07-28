import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { ResizableImage } from "./image-resize";

/**
 * Gate de EXPORT pt redimensionarea figurilor (2026-07-29): dimensiunea trebuie să
 * trăiască ca `width`/`height` pe `<img>` în `editor.getHTML()` — sursa TUTUROR
 * export-urilor (PDF/HTML/DOCX). Dacă renderHTML/parseHTML n-ar duce atributele,
 * resize-ul ar fi cosmetic (ar dispărea la salvare/export). Testăm round-trip-ul.
 */
function makeEditor(content: string): Editor {
  return new Editor({
    extensions: [StarterKit, ResizableImage],
    content,
  });
}

const SRC = "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4="; // <svg></svg>

describe("ResizableImage — round-trip width/height pt export", () => {
  it("parseHTML + renderHTML păstrează width/height (dus-întors)", () => {
    const editor = makeEditor(
      `<img src="${SRC}" width="240" height="224" alt="figura">`,
    );
    const html = editor.getHTML();
    expect(html).toContain('width="240"');
    expect(html).toContain('height="224"');
    editor.destroy();
  });

  it("fără dimensiune → <img> natural (fără atribute width/height)", () => {
    const editor = makeEditor(`<img src="${SRC}" alt="figura">`);
    const html = editor.getHTML();
    expect(html).not.toContain("width=");
    expect(html).not.toContain("height=");
    editor.destroy();
  });

  it("updateAttributes (ce face resize-ul) apare în getHTML", () => {
    const editor = makeEditor(`<img src="${SRC}" alt="figura">`);
    // selectăm imaginea (primul nod) și-i scriem dimensiunea, ca la commit-ul de drag.
    editor.commands.setNodeSelection(0);
    editor.commands.updateAttributes("image", { width: 300, height: 180 });
    const html = editor.getHTML();
    expect(html).toContain('width="300"');
    expect(html).toContain('height="180"');
    editor.destroy();
  });

  it("reset (dublu-click → width/height null) scoate atributele din getHTML", () => {
    const editor = makeEditor(
      `<img src="${SRC}" width="240" height="224" alt="figura">`,
    );
    editor.commands.setNodeSelection(0);
    editor.commands.updateAttributes("image", { width: null, height: null });
    const html = editor.getHTML();
    expect(html).not.toContain("width=");
    expect(html).not.toContain("height=");
    editor.destroy();
  });

  it("save→reload: getHTML re-alimentat ca content păstrează dimensiunea (localStorage restore)", () => {
    // editor-document.tsx salvează getHTML() în localStorage și restaurează prin
    // setContent(html). Simulăm exact acel drum: editez → getHTML (=salvare) →
    // editor NOU cu acel HTML (=restore) → dimensiunea trebuie să reziste.
    const e1 = makeEditor(`<img src="${SRC}" alt="figura">`);
    e1.commands.setNodeSelection(0);
    e1.commands.updateAttributes("image", { width: 300, height: 180 });
    const saved = e1.getHTML();
    e1.destroy();

    const e2 = makeEditor(saved); // restore
    const restored = e2.getHTML();
    expect(restored).toContain('width="300"');
    expect(restored).toContain('height="180"');
    e2.destroy();
  });
});
