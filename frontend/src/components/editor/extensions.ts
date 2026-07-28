import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import { FontFamily } from "@tiptap/extension-font-family";
import { TextAlign } from "@tiptap/extension-text-align";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { TableRow } from "@tiptap/extension-table-row";
import { FontSize } from "@/lib/tiptap-font-size";
import { DictationInterim } from "./dictation-interim";
import { Mathematics } from "@tiptap/extension-mathematics";
import { PageBreak } from "./page-break";
import { FindHighlight } from "./search-find";
import { ResizableImage } from "./image-resize";
import {
  TableWithZebra,
  TableCellWithBg,
  TableHeaderWithBg,
} from "./table-extensions";

/**
 * Setul de extensii TipTap — portat din config-ul dovedit Mösslein
 * (StudioEditor.tsx:210-236). StarterKit include Underline in TipTap 3.
 * Tabele + inserare (link/imagine) sunt incluse aici; UI-ul lor vine in F2.
 */
export const editorExtensions = [
  // StarterKit 3 include DEJA Link → îl configurăm aici (nu ca extensie separată,
  // altfel „Duplicate extension names: ['link']" + configul nostru poate fi ignorat).
  StarterKit.configure({
    link: { openOnClick: false, autolink: true },
  }),
  TextStyle,
  Color,
  FontFamily,
  FontSize,
  Highlight.configure({ multicolor: true }),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Subscript,
  Superscript,
  ResizableImage, // Image + atribute width/height + NodeView cu handle de resize (aspect blocat, dublu-click=reset)
  TableWithZebra, // Table + atribut `zebra` (deja configurat resizable)
  TableRow,
  TableHeaderWithBg,
  TableCellWithBg,
  PageBreak, // intrerupere de pagina (G4) — print/PDF/Word
  DictationInterim, // text interimar de dictare ca decoratie (nu intra in document)
  FindHighlight, // gaseste & inlocuieste (G8) — evidentiere ca decoratie
  // Matematica ACADEMICA (KaTeX) — noduri InlineMath/BlockMath (atribut `latex`).
  // Randare fidela (fractii cu bara, lim cu x→a dedesubt, radicali cu overline).
  // throwOnError:false → LaTeX gresit nu darama editorul; strict:false → tolerant.
  //
  // onClick (2026-07-26): click pe orice formula emite `math:edit` (latex + pos) →
  // MathEditDialog o redeschide editabil (nu mai poti DOAR sa o stergi). Event pe
  // window ca sa decuplam config-ul static de React (dialogul asculta si updateaza).
  Mathematics.configure({
    katexOptions: { throwOnError: false, strict: false },
    inlineOptions: {
      onClick: (node, pos) => {
        if (typeof window === "undefined") return;
        window.dispatchEvent(
          new CustomEvent("math:edit", {
            detail: { latex: node.attrs.latex, pos, kind: "inline" },
          }),
        );
      },
    },
    blockOptions: {
      onClick: (node, pos) => {
        if (typeof window === "undefined") return;
        window.dispatchEvent(
          new CustomEvent("math:edit", {
            detail: { latex: node.attrs.latex, pos, kind: "block" },
          }),
        );
      },
    },
  }),
];
