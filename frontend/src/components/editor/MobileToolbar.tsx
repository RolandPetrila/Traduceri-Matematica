"use client";

import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Undo2,
  Redo2,
  SlidersHorizontal,
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TiptapToolbar } from "./TiptapToolbar";
import { EditorDictateButton } from "./editor-dictation";
import { useEditorFind } from "./editor-find";
import { useEditorDocument } from "./editor-document";

/**
 * Alarmă de salvare eșuată, în bara slim MEREU-vizibilă de pe telefon.
 *
 * Insigna de salvare completă trăiește în `EditorFileMenu`, care pe telefon e
 * îngropat în Sheet-ul „Format", închis — deci un eșec de salvare rămânea invizibil
 * pentru Cristina până dădea tap pe Format. Un mesaj despre pierderea de date pe
 * care utilizatorul mobil nu-l vede e aproape la fel de rău ca lipsa lui (semnalat
 * de auditorul de regresie, care a prins că afirmam „vizibil pe telefon" fără să
 * fie adevărat). Apare DOAR la eșec, deci nu fură spațiu din bară în restul timpului.
 */
function MobileSaveAlarm() {
  const { saveFailed } = useEditorDocument();
  if (!saveFailed) return null;
  return (
    <span
      role="alert"
      aria-live="assertive"
      className="flex items-center gap-1 rounded bg-destructive/15 px-1.5 py-0.5 text-xs font-medium text-destructive"
      title="Documentul nu se mai salvează — exportă-l acum (Format → Export)"
    >
      ⚠ nu se salvează
    </span>
  );
}

function useEditorTick(editor: Editor | null) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const cb = () => setTick((t) => t + 1);
    editor.on("transaction", cb);
    return () => {
      editor.off("transaction", cb);
    };
  }, [editor]);
}

/**
 * Toolbar MOBIL (§17): bară slim mereu-vizibilă (undo/redo + B I U + „Format")
 * → foaia rămâne primară. „Format" deschide un bottom Sheet cu toate uneltele
 * (TiptapToolbar variant=sheet). Model Google-Docs-mobil, mai bun decât Mösslein.
 */
export function MobileToolbar({ editor }: { editor: Editor | null }) {
  useEditorTick(editor);
  const { isOpen: findOpen } = useEditorFind();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Când se deschide Găsește (tap pe 🔍 din Sheet), închidem Sheet-ul: altfel
  // overlay-ul lui ar acoperi și ar bloca bara de căutare care apare sus.
  useEffect(() => {
    if (findOpen) setSheetOpen(false);
  }, [findOpen]);

  if (!editor) return null;

  return (
    <div className="flex items-center gap-1 p-1.5">
      <Button
        variant="ghost"
        size="sm"
        className="h-9 w-9 p-0"
        title="Anulează"
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-9 w-9 p-0"
        title="Refă"
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 className="h-4 w-4" />
      </Button>
      <Separator orientation="vertical" className="h-6" />
      <Toggle
        size="sm"
        className="h-9 w-9"
        pressed={editor.isActive("bold")}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        aria-label="Îngroșat"
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        className="h-9 w-9"
        pressed={editor.isActive("italic")}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Înclinat"
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        className="h-9 w-9"
        pressed={editor.isActive("underline")}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
        aria-label="Subliniat"
      >
        <Underline className="h-4 w-4" />
      </Toggle>

      {/* Dictarea e scopul principal pe telefon → microfon DIRECT în bara slim,
          nu îngropat în Sheet (un tap, nu două). */}
      <Separator orientation="vertical" className="h-6" />
      <EditorDictateButton variant="slim" />

      {/* Alarma de salvare eșuată — între unelte și „Format", vizibilă fără niciun tap. */}
      <div className="ml-auto flex items-center gap-1.5">
        <MobileSaveAlarm />
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button
              size="sm"
              className="h-9 gap-1.5 px-3"
              title="Toate uneltele de formatare"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Format
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[62vh] overflow-y-auto">
            <SheetHeader className="text-left">
              <SheetTitle>Format</SheetTitle>
            </SheetHeader>
            <div className="pb-4">
              <TiptapToolbar editor={editor} variant="sheet" />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
