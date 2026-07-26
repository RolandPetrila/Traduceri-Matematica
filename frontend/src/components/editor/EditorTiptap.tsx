"use client";

import { useState } from "react";
import "katex/dist/katex.min.css"; // stiluri KaTeX (fonturile sunt bundle-uite de Next din pachet)
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  const {
    legacyImportedName,
    dismissLegacyNotice,
    legacyAvailableName,
    bringLegacy,
    dismissLegacyAvailable,
  } = useEditorDocument();
  const [confirmBring, setConfirmBring] = useState(false);

  // „Adu-l": dacă editorul e gol, aduc direct (nimic de pierdut); dacă are
  // conținut, cer confirmare (R-EDIT — nu suprascriu munca fără consimțământ).
  const onBringLegacy = () => {
    if (editor && !editor.isEmpty) setConfirmBring(true);
    else bringLegacy();
  };

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

      {/* Oferta de aducere: editorul nou avea deja conținut, deci auto-importul
          nu a rulat, dar există un document în editorul vechi. */}
      {legacyAvailableName && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-amber-500/10 px-3 py-2 text-xs">
          <span className="flex-1 min-w-[12rem]">
            Ai un document salvat în editorul vechi:{" "}
            <strong>„{legacyAvailableName}"</strong>. Îl aduci aici?
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 shrink-0 gap-1 px-2"
            onClick={onBringLegacy}
            title="Adu documentul din editorul vechi"
          >
            <Download className="h-3.5 w-3.5" /> Adu-l
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 shrink-0 p-0"
            onClick={dismissLegacyAvailable}
            aria-label="Ignoră"
            title="Ignoră"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Confirmare înainte de a înlocui conținutul curent cu documentul vechi. */}
      <Dialog open={confirmBring} onOpenChange={setConfirmBring}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Înlocuiești documentul curent?</DialogTitle>
            <DialogDescription>
              Documentul curent va fi înlocuit cu{" "}
              <strong>„{legacyAvailableName}"</strong> din editorul vechi.
              Acțiunea nu se poate anula.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmBring(false)}>
              Anulează
            </Button>
            <Button
              onClick={() => {
                bringLegacy();
                setConfirmBring(false);
              }}
            >
              Înlocuiește
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
