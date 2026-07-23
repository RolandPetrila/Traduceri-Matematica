"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { editorExtensions } from "./extensions";
import { TiptapToolbar } from "./TiptapToolbar";
import { MobileToolbar } from "./MobileToolbar";
import { EditorDocumentProvider } from "./editor-document";
import { EditorPagesProvider, EditorPageGuides } from "./editor-pages";

const INITIAL = `
<h1>Document nou</h1>
<p>Scrie aici documentul (proces verbal, adresă, ofertă, orice)…</p>
<p>Selectează text și folosește bara de sus. Pe telefon, apasă <strong>Format</strong> pentru toate uneltele.</p>
`;

/**
 * Editor NATIV (TipTap + shadcn) — F1: G1 formatare. Fără iframe → o singură bară.
 * Desktop: toolbar complet sus. Mobil: bară slim + bottom Sheet (foaia = primară).
 * Tabele/inserare (F2), matematică (F3), dictare/fișier/export (F4) vin ulterior.
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
        <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card">
          {/* Toolbar desktop */}
          <div className="hidden shrink-0 border-b border-border md:block">
            <TiptapToolbar editor={editor} />
          </div>
          {/* Toolbar mobil (slim + Sheet) */}
          <div className="shrink-0 border-b border-border md:hidden">
            <MobileToolbar editor={editor} />
          </div>

          {/* Zona de scris (foaia A4) — scrollabilă, primară.
            Lățimea o dictează `.editor-sheet` (210mm pe desktop, fluid pe mobil). */}
          <div className="flex-1 overflow-auto bg-muted p-2 sm:p-6">
            <div className="editor-sheet mx-auto w-full">
              <EditorContent editor={editor} />
              <EditorPageGuides />
            </div>
          </div>
        </div>
      </EditorPagesProvider>
    </EditorDocumentProvider>
  );
}
