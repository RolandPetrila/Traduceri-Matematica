"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { FileDown, FileText, FileType, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { exportPdf, exportHtml, exportDocx } from "@/lib/editor-export";

/**
 * Meniul „Fișier" (F4a) — export din conținutul EDITAT: PDF (print vectorial),
 * Word (.docx via turbodocx), HTML standalone. Numele documentului e provizoriu
 * „Document" (câmpul editabil vine la F4b: nou/salvare/auto-save).
 * DOCX e async (import dinamic) → arătăm un spinner cât se generează.
 */
export function EditorFileMenu({ editor }: { editor: Editor | null }) {
  const [busy, setBusy] = useState(false);
  if (!editor) return null;

  const title = "Document";

  const onPdf = () => exportPdf(editor.getHTML(), title);
  const onHtml = () => exportHtml(editor.getHTML(), title);
  const onDocx = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await exportDocx(editor.getHTML(), title);
    } catch (err) {
      console.error("[editor] export DOCX a eșuat:", err);
      alert("Exportul Word a eșuat. Încearcă PDF sau HTML.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 px-2"
          title="Fișier (export)"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          Fișier ▾
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuLabel>Export</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onPdf}>
          <FileText className="mr-2 h-4 w-4" />
          Export PDF
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            onDocx();
          }}
          disabled={busy}
        >
          <FileType className="mr-2 h-4 w-4" />
          Export Word (.docx)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onHtml}>
          <Globe className="mr-2 h-4 w-4" />
          Export HTML
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
