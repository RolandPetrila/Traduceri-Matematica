"use client";

import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  Plus,
  Table as TableIcon,
  Link2,
  Image as ImageIcon,
  Calendar,
  Minus,
  Rows3,
  Rows4,
  Columns3,
  Trash2,
  Merge,
  Split,
  Heading,
  SeparatorHorizontal,
  PaintBucket,
  FileUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CELL_COLORS } from "./table-extensions";
import { trackEditor } from "./editor-telemetry";
import { useEditorImport } from "./editor-import";

/**
 * G4 Inserare (link/imagine/dată/linie) + G3 Tabele (Excel-like: inserare,
 * rânduri/coloane, unire/split, antet, ștergere) — două DropdownMenu shadcn,
 * folosite atât pe desktop cât și în bottom Sheet-ul mobil.
 */
export function EditorInsertMenu({ editor }: { editor: Editor | null }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const { importFiles } = useEditorImport();
  // Meniu controlat: paleta de fundal nu e un DropdownMenuItem (e o grilă), deci
  // trebuie închis explicit după alegerea culorii.
  const [tableMenuOpen, setTableMenuOpen] = useState(false);
  if (!editor) return null;

  const zebraOn = Boolean(editor.getAttributes("table").zebra);

  const addLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Adresa link (URL):", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    trackEditor("insert", { type: "link" });
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      editor
        .chain()
        .focus()
        .setImage({ src: String(reader.result) })
        .run();
      trackEditor("insert", { type: "image" });
    };
    reader.readAsDataURL(f);
    e.target.value = "";
  };

  const onImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length) importFiles(files);
    e.target.value = "";
  };

  const insertDate = () => {
    const d = new Date().toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    editor.chain().focus().insertContent(d).run();
    trackEditor("insert", { type: "date" });
  };

  return (
    <div className="flex items-center gap-1">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={onFile}
        className="hidden"
      />
      <input
        // id unic → command palette-ul (R6) deschide EXACT acest selector (nu prin
        // querySelector pe accept, care ar putea prinde alt input al altui modul).
        id="editor-ocr-import-input"
        ref={importRef}
        type="file"
        multiple
        accept=".pdf,.docx,.txt,.md,.csv,.json,image/*"
        onChange={onImportFile}
        className="hidden"
      />

      {/* Inserare */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 px-2"
            title="Inserare"
          >
            <Plus className="h-4 w-4" /> Inserare
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={addLink}>
            <Link2 className="mr-2 h-4 w-4" /> Link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => fileRef.current?.click()}>
            <ImageIcon className="mr-2 h-4 w-4" /> Imagine
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => importRef.current?.click()}>
            <FileUp className="mr-2 h-4 w-4" /> Import fișier (OCR)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={insertDate}>
            <Calendar className="mr-2 h-4 w-4" /> Data de azi
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              editor.chain().focus().setHorizontalRule().run();
              trackEditor("insert", { type: "hr" });
            }}
          >
            <Minus className="mr-2 h-4 w-4" /> Linie orizontală
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              editor.chain().focus().setPageBreak().run();
              trackEditor("insert", { type: "page_break" });
            }}
          >
            <SeparatorHorizontal className="mr-2 h-4 w-4" /> Întrerupere de
            pagină
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Tabel */}
      <DropdownMenu open={tableMenuOpen} onOpenChange={setTableMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 px-2"
            title="Tabel"
          >
            <TableIcon className="h-4 w-4" /> Tabel
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem
            onClick={() => {
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run();
              trackEditor("insert", { type: "table" });
            }}
          >
            <TableIcon className="mr-2 h-4 w-4" /> Inserează tabel 3×3
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Coloane</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().addColumnAfter().run()}
          >
            <Columns3 className="mr-2 h-4 w-4" /> Adaugă coloană
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().deleteColumn().run()}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Șterge coloana
          </DropdownMenuItem>
          <DropdownMenuLabel>Rânduri</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().addRowAfter().run()}
          >
            <Rows3 className="mr-2 h-4 w-4" /> Adaugă rând
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().deleteRow().run()}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Șterge rândul
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => editor.chain().focus().mergeCells().run()}
          >
            <Merge className="mr-2 h-4 w-4" /> Unește celulele
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().splitCell().run()}
          >
            <Split className="mr-2 h-4 w-4" /> Împarte celula
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleHeaderRow().run()}
          >
            <Heading className="mr-2 h-4 w-4" /> Comută rând-antet
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Aspect</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => {
              editor
                .chain()
                .focus()
                .updateAttributes("table", { zebra: !zebraOn })
                .run();
              trackEditor("insert", { type: "table_zebra", on: !zebraOn });
            }}
          >
            <Rows4 className="mr-2 h-4 w-4" /> Dungi alternante
            {zebraOn && <span className="ml-auto pl-2">✓</span>}
          </DropdownMenuItem>
          <div className="px-2 py-1.5">
            <div className="mb-1.5 flex items-center text-xs opacity-70">
              <PaintBucket className="mr-2 h-4 w-4" /> Fundal celulă
            </div>
            <div className="flex flex-wrap gap-1">
              {CELL_COLORS.map((color) => (
                <button
                  key={color.label}
                  type="button"
                  title={color.label}
                  aria-label={color.label}
                  onClick={() => {
                    editor
                      .chain()
                      .focus()
                      .setCellAttribute("backgroundColor", color.value)
                      .run();
                    trackEditor("insert", {
                      type: "cell_bg",
                      color: color.value,
                    });
                    setTableMenuOpen(false);
                  }}
                  className="h-6 w-6 rounded border border-border text-[10px] leading-none"
                  style={
                    color.value
                      ? { background: color.value }
                      : { background: "transparent" }
                  }
                >
                  {color.value ? "" : "✕"}
                </button>
              ))}
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => editor.chain().focus().deleteTable().run()}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Șterge tabelul
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
