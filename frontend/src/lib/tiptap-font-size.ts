import { Extension } from "@tiptap/core";

/**
 * FontSize — TipTap n-are FontSize in StarterKit; il adaugam ca atribut pe marca
 * `textStyle` (@tiptap/extension-text-style). Aplicare din toolbar:
 *   editor.chain().focus().setMark("textStyle", { fontSize: "14pt" }).run()
 * (Tipar portat din app-ul de referinta Mösslein — src/lib/tiptap-font-size.ts.)
 */
export const FontSize = Extension.create({
  name: "fontSize",

  addOptions() {
    return { types: ["textStyle"] as string[] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.fontSize || null,
            renderHTML: (attributes: Record<string, unknown>) => {
              const fs = attributes.fontSize;
              return typeof fs === "string" && fs
                ? { style: `font-size: ${fs}` }
                : {};
            },
          },
        },
      },
    ];
  },
});
