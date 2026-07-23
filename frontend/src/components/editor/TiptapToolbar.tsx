"use client";

import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  IndentIncrease,
  IndentDecrease,
  RemoveFormatting,
  Baseline,
  Highlighter,
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EditorInsertMenu } from "./EditorInsertMenu";

/** Re-randare toolbar la fiecare tranzactie a editorului (pt. stari active). */
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

const FONTS = [
  "Times New Roman",
  "Georgia",
  "Cambria",
  "Calibri",
  "Arial",
  "Verdana",
  "Courier New",
];
const SIZES = [
  "8",
  "9",
  "10",
  "11",
  "12",
  "14",
  "16",
  "18",
  "20",
  "24",
  "28",
  "36",
  "48",
  "72",
];
const TEXT_COLORS = [
  "#111827",
  "#ef4444",
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#7c3aed",
  "#db2777",
  "#0891b2",
];
const HL_COLORS = [
  "#fef08a",
  "#bbf7d0",
  "#bfdbfe",
  "#fbcfe8",
  "#fed7aa",
  "#e9d5ff",
];

/**
 * Bara de formatare (G1) — folosita atat pe desktop (bara sus) cat si pe mobil
 * (in bottom Sheet). `variant="sheet"` layout vertical/mai spatiat pt. atingere.
 */
export function TiptapToolbar({
  editor,
  variant = "bar",
}: {
  editor: Editor | null;
  variant?: "bar" | "sheet";
}) {
  useEditorTick(editor);
  if (!editor) return null;

  const run = (fn: () => void) => () => {
    editor.chain().focus();
    fn();
  };
  const isSheet = variant === "sheet";
  const groupCls = isSheet
    ? "flex flex-wrap items-center gap-1.5"
    : "flex flex-wrap items-center gap-1";

  const paragraphValue = editor.isActive("heading", { level: 1 })
    ? "h1"
    : editor.isActive("heading", { level: 2 })
      ? "h2"
      : editor.isActive("heading", { level: 3 })
        ? "h3"
        : editor.isActive("blockquote")
          ? "quote"
          : "p";

  return (
    <div
      className={
        isSheet
          ? "flex flex-col gap-3 p-1"
          : "flex flex-wrap items-center gap-1.5 p-2"
      }
    >
      {/* Font + marime */}
      <div className={groupCls}>
        <Select
          onValueChange={(v) => editor.chain().focus().setFontFamily(v).run()}
        >
          <SelectTrigger className="h-8 w-[120px] text-sm" aria-label="Font">
            <SelectValue placeholder="Font" />
          </SelectTrigger>
          <SelectContent>
            {FONTS.map((f) => (
              <SelectItem key={f} value={f} style={{ fontFamily: f }}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          onValueChange={(v) =>
            editor
              .chain()
              .focus()
              .setMark("textStyle", { fontSize: `${v}pt` })
              .run()
          }
        >
          <SelectTrigger className="h-8 w-[64px] text-sm" aria-label="Mărime">
            <SelectValue placeholder="pt" />
          </SelectTrigger>
          <SelectContent>
            {SIZES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!isSheet && <Separator orientation="vertical" className="h-6" />}

      {/* Marci: B I U S sub sup */}
      <div className={groupCls}>
        <Toggle
          size="sm"
          pressed={editor.isActive("bold")}
          onPressedChange={run(() => editor.chain().focus().toggleBold().run())}
          aria-label="Îngroșat"
          title="Îngroșat"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("italic")}
          onPressedChange={run(() =>
            editor.chain().focus().toggleItalic().run(),
          )}
          aria-label="Înclinat"
          title="Înclinat"
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("underline")}
          onPressedChange={run(() =>
            editor.chain().focus().toggleUnderline().run(),
          )}
          aria-label="Subliniat"
          title="Subliniat"
        >
          <Underline className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("strike")}
          onPressedChange={run(() =>
            editor.chain().focus().toggleStrike().run(),
          )}
          aria-label="Tăiat"
          title="Tăiat"
        >
          <Strikethrough className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("subscript")}
          onPressedChange={run(() =>
            editor.chain().focus().toggleSubscript().run(),
          )}
          aria-label="Indice"
          title="Indice"
        >
          <Subscript className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("superscript")}
          onPressedChange={run(() =>
            editor.chain().focus().toggleSuperscript().run(),
          )}
          aria-label="Exponent"
          title="Exponent"
        >
          <Superscript className="h-4 w-4" />
        </Toggle>
      </div>

      {!isSheet && <Separator orientation="vertical" className="h-6" />}

      {/* Culori + curatare */}
      <div className={groupCls}>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 px-2"
              title="Culoare text"
            >
              <Baseline className="h-4 w-4 text-red-500" />▾
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="grid grid-cols-4 gap-1">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="h-7 w-7 rounded border border-border"
                  style={{ background: c }}
                  onClick={() => editor.chain().focus().setColor(c).run()}
                  aria-label={`Culoare ${c}`}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 px-2"
              title="Evidențiere"
            >
              <Highlighter className="h-4 w-4" />▾
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="grid grid-cols-3 gap-1">
              {HL_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="h-7 w-7 rounded border border-border"
                  style={{ background: c }}
                  onClick={() =>
                    editor.chain().focus().toggleHighlight({ color: c }).run()
                  }
                  aria-label={`Evidențiere ${c}`}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          title="Șterge formatarea"
          onClick={() => editor.chain().focus().unsetAllMarks().run()}
        >
          <RemoveFormatting className="h-4 w-4" />
        </Button>
      </div>

      {!isSheet && <Separator orientation="vertical" className="h-6" />}

      {/* Stil paragraf + aliniere + liste + indent */}
      <div className={groupCls}>
        <Select
          value={paragraphValue}
          onValueChange={(v) => {
            const c = editor.chain().focus();
            if (v === "p") c.setParagraph().run();
            else if (v === "quote") c.toggleBlockquote().run();
            else
              c.toggleHeading({ level: Number(v.slice(1)) as 1 | 2 | 3 }).run();
          }}
        >
          <SelectTrigger
            className="h-8 w-[120px] text-sm"
            aria-label="Stil paragraf"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="p">Text normal</SelectItem>
            <SelectItem value="h1">Titlu 1</SelectItem>
            <SelectItem value="h2">Titlu 2</SelectItem>
            <SelectItem value="h3">Titlu 3</SelectItem>
            <SelectItem value="quote">Citat</SelectItem>
          </SelectContent>
        </Select>
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: "left" })}
          onPressedChange={run(() =>
            editor.chain().focus().setTextAlign("left").run(),
          )}
          aria-label="Stânga"
          title="Stânga"
        >
          <AlignLeft className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: "center" })}
          onPressedChange={run(() =>
            editor.chain().focus().setTextAlign("center").run(),
          )}
          aria-label="Centru"
          title="Centru"
        >
          <AlignCenter className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: "right" })}
          onPressedChange={run(() =>
            editor.chain().focus().setTextAlign("right").run(),
          )}
          aria-label="Dreapta"
          title="Dreapta"
        >
          <AlignRight className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: "justify" })}
          onPressedChange={run(() =>
            editor.chain().focus().setTextAlign("justify").run(),
          )}
          aria-label="Justify"
          title="Justify"
        >
          <AlignJustify className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("bulletList")}
          onPressedChange={run(() =>
            editor.chain().focus().toggleBulletList().run(),
          )}
          aria-label="Listă"
          title="Listă"
        >
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("orderedList")}
          onPressedChange={run(() =>
            editor.chain().focus().toggleOrderedList().run(),
          )}
          aria-label="Listă numerotată"
          title="Listă numerotată"
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          title="Micșorează indent"
          onClick={() => editor.chain().focus().liftListItem("listItem").run()}
        >
          <IndentDecrease className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          title="Mărește indent"
          onClick={() => editor.chain().focus().sinkListItem("listItem").run()}
        >
          <IndentIncrease className="h-4 w-4" />
        </Button>
      </div>

      {!isSheet && <Separator orientation="vertical" className="h-6" />}

      {/* Inserare + Tabel (G3/G4) */}
      <EditorInsertMenu editor={editor} />
    </div>
  );
}
