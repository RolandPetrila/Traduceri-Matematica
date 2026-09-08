"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  FileDown,
  FileText,
  FileType,
  Globe,
  Loader2,
  FilePlus2,
  Save,
  Pencil,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { exportPdf, exportHtml, exportDocx } from "@/lib/editor-export";
import { useEditorDocument } from "./editor-document";
import { trackEditor, contentFlags } from "./editor-telemetry";
import { reportFailure } from "@/lib/failure";

/**
 * Meniul „Fișier" (F4a export + F4b fișier) — Document nou / Salvează / Redenumește
 * + Export PDF·Word·HTML, toate din conținutul EDITAT. Numele documentului (context)
 * alimentează numele fișierelor exportate. Status „✓ salvat HH:MM" lângă buton.
 * DOCX e async (import dinamic) → spinner cât se generează.
 */
export function EditorFileMenu({ editor }: { editor: Editor | null }) {
  const { name, lastSavedAt, saveNow, rename, newDocument, saveFailed } =
    useEditorDocument();
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [confirmNewOpen, setConfirmNewOpen] = useState(false);
  const [draftName, setDraftName] = useState(name);

  if (!editor) return null;

  // FAZA 1: PDF și HTML rulau FĂRĂ try/catch — un eșec acolo nu lăsa nicio urmă,
  // nici pe ecran, nici în log-uri. Acum toate trei trec prin aceeași pâlnie.
  const runExport = async (
    format: "pdf" | "html" | "docx",
    run: () => void | Promise<void>,
  ) => {
    const html = editor.getHTML();
    const flags = contentFlags(html);
    trackEditor("export", { format, name, ...flags });
    try {
      await run();
    } catch (err) {
      const f = reportFailure({
        code: "E-CONV-002",
        flow: `editor.export.${format}`,
        error: err,
        context: { format, name, ...flags },
        userHint: `Exportul ${format.toUpperCase()} a eșuat.`,
      });
      alert(f.userMessage);
    }
  };

  const onPdf = () => runExport("pdf", () => exportPdf(editor.getHTML(), name));
  const onHtml = () =>
    runExport("html", () => exportHtml(editor.getHTML(), name));
  const onDocx = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await runExport("docx", () => exportDocx(editor.getHTML(), name));
    } finally {
      setBusy(false);
    }
  };

  const confirmRename = () => {
    rename(draftName);
    setRenameOpen(false);
  };
  const confirmNew = () => {
    newDocument();
    setConfirmNewOpen(false);
  };

  const savedLabel = saveFailed
    ? "⚠ NU se mai salvează — exportă documentul acum"
    : lastSavedAt != null
      ? `✓ salvat ${new Date(lastSavedAt).toLocaleTimeString("ro-RO", {
          hour: "2-digit",
          minute: "2-digit",
        })}`
      : "nesalvat";

  return (
    <>
      <div className="flex items-center gap-1.5">
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 px-2"
              title="Fișier (document + export)"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              Fișier ▾
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuLabel className="truncate" title={name}>
              {name}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* Itemii care deschid un dialog: preventDefault opreste secventa interna
                de dismiss a Radix (altfel dialogul se inchide instant, interpretand
                inchiderea meniului ca click-outside); meniul il inchidem noi, controlat. */}
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                setConfirmNewOpen(true);
              }}
            >
              <FilePlus2 className="mr-2 h-4 w-4" />
              Document nou
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => saveNow()}>
              <Save className="mr-2 h-4 w-4" />
              Salvează
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setDraftName(name);
                setMenuOpen(false);
                setRenameOpen(true);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Redenumește…
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Export</DropdownMenuLabel>
            <DropdownMenuItem onSelect={onPdf}>
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onDocx()} disabled={busy}>
              <FileType className="mr-2 h-4 w-4" />
              Export Word (.docx)
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onHtml}>
              <Globe className="mr-2 h-4 w-4" />
              Export HTML
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status auto-save (mic, discret) */}
        {/* La eșec de salvare NU mai e „discret": e vizibil pe orice ecran,
            inclusiv pe telefon, și anunțat asertiv cititoarelor de ecran. Insigna
            înghețată pe ultima oră reușită o lăsa pe Cristina să scrie ore întregi
            într-un document care nu se mai salva. */}
        <span
          className={
            saveFailed
              ? "flex items-center gap-1 whitespace-nowrap rounded bg-destructive/15 px-1.5 py-0.5 text-xs font-medium text-destructive"
              : "hidden items-center gap-1 whitespace-nowrap text-xs text-muted-foreground sm:flex"
          }
          role={saveFailed ? "alert" : undefined}
          aria-live={saveFailed ? "assertive" : "polite"}
        >
          {!saveFailed && lastSavedAt != null && <Check className="h-3 w-3" />}
          {savedLabel}
        </span>
      </div>

      {/* Dialog Redenumește */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Redenumește documentul</DialogTitle>
            <DialogDescription>
              Numele se folosește și la exportul PDF/Word/HTML.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="Nume document"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmRename();
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Anulează
            </Button>
            <Button onClick={confirmRename}>Salvează numele</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog confirmare Document nou */}
      <Dialog open={confirmNewOpen} onOpenChange={setConfirmNewOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Document nou?</DialogTitle>
            <DialogDescription>
              Conținutul curent se șterge din editor. Salvează sau exportă întâi
              dacă vrei să-l păstrezi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmNewOpen(false)}>
              Anulează
            </Button>
            <Button onClick={confirmNew}>Da, document nou</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
