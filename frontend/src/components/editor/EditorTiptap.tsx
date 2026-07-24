"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { editorExtensions } from "./extensions";
import { TiptapToolbar } from "./TiptapToolbar";
import { MobileToolbar } from "./MobileToolbar";
import { EditorDocumentProvider, useEditorDocument } from "./editor-document";
import { EditorPagesProvider, EditorPageGuides } from "./editor-pages";
import { EditorDictationProvider } from "./editor-dictation";
import {
  EditorFindProvider,
  EditorFindBar,
  useEditorFind,
} from "./editor-find";

const INITIAL = `
<h1>Document nou</h1>
<p>Scrie aici documentul (proces verbal, adresă, ofertă, orice)…</p>
<p>Selectează text și folosește bara de sus. Pe telefon, apasă <strong>Format</strong> pentru toate uneltele.</p>
`;

/**
 * Editor NATIV (TipTap + shadcn) — înlocuiește editorul-iframe (retras în F6).
 * Desktop: toolbar complet sus. Mobil: bară slim + bottom Sheet (foaia = primară).
 */
export default function EditorTiptap() {
  const editor = useEditor({
    extensions: editorExtensions,
    content: INITIAL,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "editor-content focus:outline-none",
      },
    },
  });

  return (
    <EditorDocumentProvider editor={editor}>
      <EditorPagesProvider editor={editor}>
        <EditorDictationProvider editor={editor}>
          <EditorFindProvider editor={editor}>
            <EditorShell editor={editor} />
          </EditorFindProvider>
        </EditorDictationProvider>
      </EditorPagesProvider>
    </EditorDocumentProvider>
  );
}

/**
 * Carcasa vizuală — separată de componenta de sus ca să poată CONSUMA contextele
 * (un component nu-și poate folosi propriile providere).
 */
function EditorShell({ editor }: { editor: Editor | null }) {
  const { isOpen, onEditorKeyDown } = useEditorFind();
  const { legacyImportedName, dismissLegacyNotice } = useEditorDocument();

  return (
    // Ctrl+F e prins pe CONTAINER, nu pe window: toate taburile aplicației sunt
    // montate simultan (display:none), deci un listener global ar fura Ctrl+F
    // și când ești pe Traduceri sau Convertor.
    <div
      className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card"
      onKeyDown={onEditorKeyDown}
    >
      {/* Toolbar desktop */}
      <div className="hidden shrink-0 border-b border-border md:block">
        <TiptapToolbar editor={editor} />
      </div>
      {/* Toolbar mobil (slim + Sheet) */}
      <div className="shrink-0 border-b border-border md:hidden">
        <MobileToolbar editor={editor} />
      </div>

      {/* Găsește & înlocuiește (G8) — montată doar cât e deschisă (primește focusul) */}
      {isOpen && <EditorFindBar />}

      {legacyImportedName && (
        <div className="flex shrink-0 items-start gap-2 border-b border-border bg-primary/10 px-3 py-2 text-xs">
          <span className="flex-1">
            Am adus documentul <strong>„{legacyImportedName}"</strong> din
            editorul vechi. Verifică-l — structurile construite manual (fracții,
            radicali) pot veni ca text simplu.
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 shrink-0 p-0"
            onClick={dismissLegacyNotice}
            aria-label="Închide anunțul"
            title="Închide anunțul"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Zona de scris (foaia A4) — scrollabilă, primară.
      Lățimea o dictează `.editor-sheet` (210mm pe desktop, fluid pe mobil). */}
      <div className="flex-1 overflow-auto bg-muted p-2 sm:p-6">
        <div className="editor-sheet mx-auto w-full">
          <EditorContent editor={editor} />
          <EditorPageGuides />
        </div>
      </div>
    </div>
  );
}
