import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/**
 * Extensii de tabel (G3) — dungi alternante + culoare de fundal pe celulă.
 *
 * Ambele sunt ATRIBUTE pe noduri (nu comenzi care rescriu structura tabelului),
 * deci se serializează în HTML → supraviețuiesc salvării, restore-ului și
 * exportului, fără risc pe celule unite / conținut matematic.
 *
 * Sortarea și rândul-total din editorul vechi sunt RETRASE INTENȚIONAT
 * (decizie Roland, 2026-07-24): rescriu structura tabelului (risc real pe
 * celule unite/formule) pentru unelte de foaie de calcul rar folosite pe fișe.
 */

const zebraPluginKey = new PluginKey("tableZebraDecoration");

/**
 * Zebra: atribut pe `table`, randat ca `data-zebra` (CSS `nth-child` face dungile).
 *
 * `renderHTML` pune `data-zebra` în `getHTML()` → salvare/restore/export corecte.
 * DAR tabelul e desenat în editor de un nodeView (`TableView`, activat de
 * `resizable:true`), care își construiește singur DOM-ul și IGNORĂ atributele HTML
 * custom → pe ecran atributul lipsea și dungile nu apăreau (WYSIWYG rupt).
 * Fix: o DECORAȚIE de nod adaugă `data-zebra` pe DOM-ul viu (decorațiile se aplică
 * și peste nodeView) → același CSS prinde și în editor. getHTML rămâne neatins.
 */
export const TableWithZebra = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      zebra: {
        default: false,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-zebra") === "true",
        renderHTML: (attributes: Record<string, unknown>) =>
          attributes.zebra ? { "data-zebra": "true" } : {},
      },
    };
  },
  addProseMirrorPlugins() {
    const parent = this.parent?.() ?? [];
    const typeName = this.name;
    return [
      ...parent,
      new Plugin({
        key: zebraPluginKey,
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];
            state.doc.descendants((node, pos) => {
              if (node.type.name === typeName && node.attrs.zebra) {
                decorations.push(
                  Decoration.node(pos, pos + node.nodeSize, {
                    "data-zebra": "true",
                  }),
                );
              }
            });
            return decorations.length
              ? DecorationSet.create(state.doc, decorations)
              : null;
          },
        },
      }),
    ];
  },
}).configure({ resizable: true });

/**
 * Fundal de celulă ca `style` inline — singura formă care supraviețuiește
 * conversiei în .docx (selectorii CSS nu se aplică acolo).
 */
const backgroundColorAttribute = {
  backgroundColor: {
    default: null,
    parseHTML: (element: HTMLElement) => element.style.backgroundColor || null,
    renderHTML: (attributes: Record<string, unknown>) =>
      attributes.backgroundColor
        ? { style: `background-color: ${attributes.backgroundColor}` }
        : {},
  },
};

export const TableCellWithBg = TableCell.extend({
  addAttributes() {
    return { ...this.parent?.(), ...backgroundColorAttribute };
  },
});

export const TableHeaderWithBg = TableHeader.extend({
  addAttributes() {
    return { ...this.parent?.(), ...backgroundColorAttribute };
  },
});

/** Culoarea dungilor — ținută sincronă cu globals.css și cu export-ul. */
export const ZEBRA_COLOR = "#f1f5f9";

/** Paletă pentru fundalul de celulă (ultima = „fără culoare"). */
export const CELL_COLORS: { value: string | null; label: string }[] = [
  { value: "#fee2e2", label: "Roșu deschis" },
  { value: "#ffedd5", label: "Portocaliu deschis" },
  { value: "#fef9c3", label: "Galben deschis" },
  { value: "#dcfce7", label: "Verde deschis" },
  { value: "#dbeafe", label: "Albastru deschis" },
  { value: "#f3e8ff", label: "Mov deschis" },
  { value: "#e2e8f0", label: "Gri" },
  { value: null, label: "Fără culoare" },
];
