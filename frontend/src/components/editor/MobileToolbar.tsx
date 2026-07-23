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

      <div className="ml-auto">
        <Sheet>
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
