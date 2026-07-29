"use client";

import { useEffect, useState } from "react";
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
import { MathEditDialog } from "./MathEditDialog";
import { installMathAutoFit } from "./math-fit";
import { EditorTranslateProvider } from "./editor-translate-state";
import { LanguageSwitch } from "./LanguageSwitch";
import { EditorImportProvider } from "./editor-import";
import { ImportDropZone, ImportStatus } from "./ImportUI";
import { INITIAL } from "./editor-initial";

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
          <EditorTranslateProvider editor={editor}>
            {/* Import (F9) e ÎN interiorul Translate: după import cheamă `changeSource`
                ca switch-ul de limbă să nu șteargă conținutul importat (R-EDIT). */}
            <EditorImportProvider editor={editor}>
              <EditorFindProvider editor={editor}>
                <EditorShell editor={editor} />
              </EditorFindProvider>
            </EditorImportProvider>
          </EditorTranslateProvider>
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

  // Auto-fit al formulelor lungi pe foaie (#2): le micșorează cât să încapă în
  // chenarul A4 (fără să spargă layout-ul). Se reaplică la re-randarea nodurilor.
  // Robust la `immediatelyRender:false` (editor.view poate lipsi la primul efect →
  // instalăm și pe evenimentul `create`, capcană cunoscută).
  useEffect(() => {
    if (!editor) return;
    let cleanup: (() => void) | undefined;
    const install = () => {
      if (cleanup) return;
      const dom = editor.view?.dom;
      if (dom instanceof HTMLElement) cleanup = installMathAutoFit(dom);
    };
    install();
    editor.on("create", install);
    return () => {
      editor.off("create", install);
      cleanup?.();
    };
  }, [editor]);

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

      {/* Switch de limbi (F8) — traducere-în-editor, desktop + mobil */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border px-2 py-1">
        <LanguageSwitch />
      </div>

      {/* Găsește & înlocuiește (G8) — montată doar cât e deschisă (primește focusul) */}
      {isOpen && <EditorFindBar />}

      {/* Import OCR (F9) — progres + eroare + banner rezultat + dialog destinație */}
      <ImportStatus />

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
      Lățimea o dictează `.editor-sheet` (210mm pe desktop, fluid pe mobil).
      Învelită în ImportDropZone (F9): drag&drop de fișier → overlay + OCR. */}
      <ImportDropZone>
        <div className="h-full overflow-auto bg-muted p-2 sm:p-6">
          <div className="editor-sheet mx-auto w-full">
            <EditorContent editor={editor} />
            <EditorPageGuides />
          </div>
        </div>
      </ImportDropZone>

      {/* Editarea unei formule existente (click pe formulă → math:edit). */}
      <MathEditDialog editor={editor} />
    </div>
  );
}
