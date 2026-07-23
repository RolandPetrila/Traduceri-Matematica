import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import { FontFamily } from "@tiptap/extension-font-family";
import { TextAlign } from "@tiptap/extension-text-align";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Image } from "@tiptap/extension-image";
import { Link } from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { FontSize } from "@/lib/tiptap-font-size";

/**
 * Setul de extensii TipTap — portat din config-ul dovedit Mösslein
 * (StudioEditor.tsx:210-236). StarterKit include Underline in TipTap 3.
 * Tabele + inserare (link/imagine) sunt incluse aici; UI-ul lor vine in F2.
 */
export const editorExtensions = [
  StarterKit,
  TextStyle,
  Color,
  FontFamily,
  FontSize,
  Highlight.configure({ multicolor: true }),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Subscript,
  Superscript,
  Image.configure({ allowBase64: true }),
  Link.configure({ openOnClick: false, autolink: true }),
  Table.configure({ resizable: true }),
  TableRow,
  TableHeader,
  TableCell,
];
