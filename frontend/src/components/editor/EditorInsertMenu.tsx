"use client";

import { useRef } from "react";
import type { Editor } from "@tiptap/react";
import {
  Plus,
  Table as TableIcon,
  Link2,
  Image as ImageIcon,
  Calendar,
  Minus,
  Rows3,
  Columns3,
  Trash2,
  Merge,
  Split,
  Heading,
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

/**
 * G4 Inserare (link/imagine/dată/linie) + G3 Tabele (Excel-like: inserare,
 * rânduri/coloane, unire/split, antet, ștergere) — două DropdownMenu shadcn,
 * folosite atât pe desktop cât și în bottom Sheet-ul mobil.
 */
export function EditorInsertMenu({ editor }: { editor: Editor | null }) {
  const fileRef = useRef<HTMLInputElement>(null);
  if (!editor) return null;

  const addLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Adresa link (URL):", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () =>
      editor
        .chain()
        .focus()
        .setImage({ src: String(reader.result) })
        .run();
    reader.readAsDataURL(f);
    e.target.value = "";
  };

  const insertDate = () => {
    const d = new Date().toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    editor.chain().focus().insertContent(d).run();
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
          <DropdownMenuItem onClick={insertDate}>
            <Calendar className="mr-2 h-4 w-4" /> Data de azi
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            <Minus className="mr-2 h-4 w-4" /> Linie orizontală
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Tabel */}
      <DropdownMenu>
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
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
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
