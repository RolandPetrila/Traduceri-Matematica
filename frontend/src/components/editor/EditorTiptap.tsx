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
import { FigureEditDialog } from "./FigureEditDialog";
import { installMathAutoFit } from "./math-fit";
import {
  EditorTranslateProvider,
  useEditorTranslate,
} from "./editor-translate-state";
import { LanguageSwitch } from "./LanguageSwitch";
import { EditorImportProvider } from "./editor-import";
import { ImportDropZone, ImportStatus } from "./ImportUI";
import { INITIAL } from "./editor-initial";
import {
  setEditorCommandHandler,
  setEditorImageInserter,
  setEditorTextInserter,
  type EditorCommandId,
} from "@/lib/editor-commands";

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
  const { isOpen, openFind, onEditorKeyDown } = useEditorFind();
  const { switchLanguage } = useEditorTranslate();
  const {
    legacyImportedName,
    dismissLegacyNotice,
    legacyAvailableName,
    bringLegacy,
    dismissLegacyAvailable,
  } = useEditorDocument();
  const [confirmBring, setConfirmBring] = useState(false);

  // R6 — comenzile paletei globale (Ctrl+K) ajung la editor prin acest handler.
  // EditorShell e mereu montat (taburile `display:none`), deci handler-ul e mereu
  // activ; paleta comută pe tabul Editor înainte să cheme comanda.
  useEffect(() => {
    const exec = (id: EditorCommandId) => {
      if (!editor) return;
      // Comenzi SEPARATE (nu `.chain()`): într-un chain, dacă `focus()` întoarce false
      // (view ProseMirror neașezat imediat după display:none→block la comutarea de tab),
      // chain-ul se ABANDONEAZĂ înainte de insert → tabelul/formula NU se inserează.
      // Separate, `focus('end')` setează selecția la sfârșit (nivel de STARE, chiar dacă
      // focus-ul DOM eșuează), iar `insertTable`/`insertInlineMath` rulează oricum.
      switch (id) {
        case "bold":
          editor.commands.focus();
          editor.commands.toggleBold();
          break;
        case "italic":
          editor.commands.focus();
          editor.commands.toggleItalic();
          break;
        case "table":
          editor.commands.focus("end");
          editor.commands.insertTable({
            rows: 3,
            cols: 3,
            withHeaderRow: true,
          });
          break;
        case "math":
          // Formulă-început editabilă (click → dialog de editare).
          editor.commands.focus("end");
          editor.commands.insertInlineMath({ latex: "x" });
          break;
        case "import": {
          // Deschide selectorul de fișiere al importului (F9) — input ascuns, țintit
          // prin id UNIC (nu querySelector pe accept — robust dacă alt modul are input).
          const inp = document.getElementById(
            "editor-ocr-import-input",
          ) as HTMLInputElement | null;
          inp?.click();
          break;
        }
        case "translate-sk":
          switchLanguage("sk");
          break;
        case "translate-en":
          switchLanguage("en");
          break;
        case "translate-de":
          switchLanguage("de");
          break;
        case "find":
          openFind();
          break;
      }
    };
    // Comanda vine din paletă IMEDIAT după `switchModule('editor')`.
    //  • Cazul COMUN (ești deja în editor → editorul e vizibil): rulează IMEDIAT (snappy).
    //  • Cazul CROSS-MODUL (veneai de pe alt tab, editorul era `display:none`): `.focus()`
    //    și `insertTable` NU se aplică pe un editor care tocmai a trecut din ascuns în
    //    vizibil (ProseMirror trebuie să se re-așeze — dovedit: cu settle merge, fără nu).
    //    Deci: așteaptă vizibilitatea (poll rAF) + un mic settle înainte de execuție.
    const run: (id: EditorCommandId) => void = (id) => {
      const dom0 = editor?.view?.dom as HTMLElement | undefined;
      if (dom0 && dom0.offsetParent !== null) {
        exec(id); // deja vizibil → fără întârziere
        return;
      }
      let tries = 0;
      const whenReady = () => {
        const dom = editor?.view?.dom as HTMLElement | undefined;
        if (dom && dom.offsetParent !== null) {
          // Vizibil acum → lasă ProseMirror să se re-așeze după display:none→block.
          window.setTimeout(() => exec(id), 150);
        } else if (tries < 30) {
          tries += 1;
          requestAnimationFrame(whenReady);
        } else {
          exec(id); // fallback: încearcă oricum
        }
      };
      whenReady();
    };
    setEditorCommandHandler(run);
    return () => setEditorCommandHandler(null);
  }, [editor, switchLanguage, openFind]);

  // Punte imagine (Calculator → grafic ca figură în editor). Poate veni cross-tab
  // → așteaptă vizibilitatea editorului (poll rAF + settle), apoi inserează ca <img>.
  useEffect(() => {
    if (!editor) return;
    const insertImg = (src: string, alt?: string) => {
      const doInsert = () =>
        editor
          .chain()
          .focus()
          .insertContent({ type: "image", attrs: { src, alt: alt ?? "" } })
          .run();
      const dom0 = editor.view?.dom as HTMLElement | undefined;
      if (dom0 && dom0.offsetParent !== null) {
        doInsert();
        return;
      }
      let tries = 0;
      const whenReady = () => {
        const dom = editor.view?.dom as HTMLElement | undefined;
        if (dom && dom.offsetParent !== null) window.setTimeout(doInsert, 150);
        else if (tries++ < 30) requestAnimationFrame(whenReady);
        else doInsert();
      };
      whenReady();
    };
    setEditorImageInserter(insertImg);

    // Text (ex. test generat) → paragrafe, cu $...$ transformat în inlineMath.
    const textToContent = (text: string) =>
      text.split(/\r?\n/).map((line) => {
        const content: Record<string, unknown>[] = [];
        const re = /\$([^$]+)\$/g;
        let last = 0;
        let mm: RegExpExecArray | null;
        while ((mm = re.exec(line)) !== null) {
          if (mm.index > last)
            content.push({ type: "text", text: line.slice(last, mm.index) });
          content.push({ type: "inlineMath", attrs: { latex: mm[1] } });
          last = re.lastIndex;
        }
        if (last < line.length)
          content.push({ type: "text", text: line.slice(last) });
        return content.length
          ? { type: "paragraph", content }
          : { type: "paragraph" };
      });
    const insertTxt = (text: string) => {
      const doInsert = () =>
        editor.chain().focus().insertContent(textToContent(text)).run();
      const dom0 = editor.view?.dom as HTMLElement | undefined;
      if (dom0 && dom0.offsetParent !== null) {
        doInsert();
        return;
      }
      let tries = 0;
      const whenReady = () => {
        const dom = editor.view?.dom as HTMLElement | undefined;
        if (dom && dom.offsetParent !== null) window.setTimeout(doInsert, 150);
        else if (tries++ < 30) requestAnimationFrame(whenReady);
        else doInsert();
      };
      whenReady();
    };
    setEditorTextInserter(insertTxt);
    return () => {
      setEditorImageInserter(null);
      setEditorTextInserter(null);
    };
  }, [editor]);

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

      {/* Switch de limbi (F8) — pe DESKTOP e mutat în rândul de sus al TiptapToolbar
          (R5, ca bara să nu coboare). Aici rămâne DOAR pentru mobil (always-visible,
          fără regresie de descoperire — nu-l ascundem în Sheet). */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border px-2 py-1 md:hidden">
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
      {/* Editarea unei figuri existente (click pe figură → figure:edit, M5). */}
      <FigureEditDialog editor={editor} />
    </div>
  );
}
