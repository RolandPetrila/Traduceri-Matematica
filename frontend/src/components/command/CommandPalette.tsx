"use client";

/**
 * R6 — Command palette globală (Ctrl+K). Caută peste TOATĂ aplicația: module
 * (comută tabul), acțiuni de editor (formatare/tabel/formulă/import/traducere/găsește)
 * și acțiuni globale (tot ecranul). Mock §17 confirmat de Roland (2026-07-30).
 *
 * FĂRĂ `cmdk` (nu e în proiect; R-COST = nu adăug pachete) — construită pe `Dialog`-ul
 * existent + input/listă/navigare la tastatură proprii. Fuzzy match diacritic-insensitiv.
 *
 * Punte spre editor: comenzile de editor comută întâi pe tabul Editor, apoi cheamă
 * `runEditorCommand` (handler înregistrat de EditorShell) pe tick-ul următor — editorul
 * trebuie vizibil (tabul e `display:none` până la comutare) ca `.focus()` să prindă.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Bold,
  FileUp,
  Italic,
  Languages,
  Maximize2,
  Search,
  Sigma,
  Table as TableIcon,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { TABS } from "@/lib/tab-config";
import { runEditorCommand, type EditorCommandId } from "@/lib/editor-commands";

interface Command {
  id: string;
  group: "Module" | "Acțiuni editor" | "Acțiuni";
  label: string;
  hint?: string;
  icon: ReactNode;
  keywords?: string;
  run: () => void;
}

/** Normalizează pt căutare: lowercase + fără diacritice (NFD → scoate combinantele). */
function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Toate cuvintele din query apar (în ordine oarecare) în textul comenzii. */
function matches(cmd: Command, query: string): boolean {
  const q = norm(query).trim();
  if (!q) return true;
  const hay = norm(`${cmd.label} ${cmd.keywords ?? ""} ${cmd.group}`);
  return q.split(/\s+/).every((w) => hay.includes(w));
}

export function CommandPalette({
  open,
  onClose,
  switchModule,
  activeTab,
}: {
  open: boolean;
  onClose: () => void;
  switchModule: (tabId: string) => void;
  activeTab: string;
}) {
  const [query, setQuery] = useState("");
  // -1 = nimic preselectat (deschidere cu query gol). Enter NU face nimic la -1 —
  // altfel Ctrl+K în timpul scrisului + Enter ar comuta modulul (advisor). Devine 0
  // (prima potrivire) când utilizatorul tastează sau apasă săgeata.
  const [selected, setSelected] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Comenzi de editor: comută pe Editor, închide, apoi cheamă comanda. EditorShell
  // așteaptă intern ca editorul să devină VIZIBIL înainte s-o execute (poll rAF pe
  // `offsetParent`), deci NU e nevoie de un timing magic aici — robust chiar și când
  // veneam de pe un modul iframe (planse/asistent) mai lent (advisor).
  const runEditor = (id: EditorCommandId) => {
    switchModule("editor");
    onClose();
    runEditorCommand(id);
  };

  const commands: Command[] = useMemo(() => {
    const modules: Command[] = TABS.map((t) => ({
      id: `mod-${t.id}`,
      group: "Module",
      label: t.label,
      hint: t.id === activeTab ? "activ" : undefined,
      icon: <span className="text-base leading-none">{t.icon}</span>,
      keywords: "modul comuta " + t.id,
      run: () => {
        switchModule(t.id);
        onClose();
      },
    }));

    const editorActions: Command[] = [
      {
        id: "ed-bold",
        group: "Acțiuni editor",
        label: "Îngroșat (Bold)",
        hint: "Ctrl+B",
        icon: <Bold className="h-4 w-4" />,
        keywords: "bold ingrosat aldin",
        run: () => runEditor("bold"),
      },
      {
        id: "ed-italic",
        group: "Acțiuni editor",
        label: "Cursiv (Italic)",
        hint: "Ctrl+I",
        icon: <Italic className="h-4 w-4" />,
        keywords: "italic cursiv inclinat",
        run: () => runEditor("italic"),
      },
      {
        id: "ed-table",
        group: "Acțiuni editor",
        label: "Inserează tabel",
        icon: <TableIcon className="h-4 w-4" />,
        keywords: "tabel table insereaza rand coloana",
        run: () => runEditor("table"),
      },
      {
        id: "ed-math",
        group: "Acțiuni editor",
        label: "Inserează formulă matematică",
        icon: <Sigma className="h-4 w-4" />,
        keywords: "formula matematica ecuatie latex katex",
        run: () => runEditor("math"),
      },
      {
        id: "ed-import",
        group: "Acțiuni editor",
        label: "Import fișier (OCR / .docx)",
        icon: <FileUp className="h-4 w-4" />,
        keywords: "import fisier docx ocr pdf imagine incarca deschide",
        run: () => runEditor("import"),
      },
      {
        id: "ed-tr-sk",
        group: "Acțiuni editor",
        label: "Traducere → Slovacă (SK)",
        icon: <Languages className="h-4 w-4" />,
        keywords: "traducere translate slovaca sk limba",
        run: () => runEditor("translate-sk"),
      },
      {
        id: "ed-tr-en",
        group: "Acțiuni editor",
        label: "Traducere → Engleză (EN)",
        icon: <Languages className="h-4 w-4" />,
        keywords: "traducere translate engleza en limba",
        run: () => runEditor("translate-en"),
      },
      {
        id: "ed-tr-de",
        group: "Acțiuni editor",
        label: "Traducere → Germană (DE)",
        icon: <Languages className="h-4 w-4" />,
        keywords: "traducere translate germana de limba",
        run: () => runEditor("translate-de"),
      },
      {
        id: "ed-find",
        group: "Acțiuni editor",
        label: "Găsește în document",
        hint: "Ctrl+F",
        icon: <Search className="h-4 w-4" />,
        keywords: "gaseste cauta find inlocuieste search",
        run: () => runEditor("find"),
      },
    ];

    const globalActions: Command[] = [
      {
        id: "g-fullscreen",
        group: "Acțiuni",
        label: "Tot ecranul",
        icon: <Maximize2 className="h-4 w-4" />,
        keywords: "fullscreen tot ecranul maximizeaza",
        run: () => {
          if (typeof document !== "undefined") {
            if (document.fullscreenElement) document.exitFullscreen?.();
            else document.documentElement.requestFullscreen?.();
          }
          onClose();
        },
      },
    ];

    return [...modules, ...editorActions, ...globalActions];
    // `onClose`/`switchModule` sunt stabile de la părinte; `activeTab` reface lista
    // ca să actualizeze eticheta „activ".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const filtered = useMemo(
    () => commands.filter((c) => matches(c, query)),
    [commands, query],
  );

  // La deschidere: focus pe input, resetează query + selecția (NIMIC preselectat).
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(-1);
      // focus după ce Dialog-ul montează conținutul
      const t = window.setTimeout(() => inputRef.current?.focus(), 20);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  // Clamp selecția când lista filtrată se scurtează (păstrează -1 = nimic selectat).
  useEffect(() => {
    setSelected((s) => (s < 0 ? -1 : Math.min(s, filtered.length - 1)));
  }, [filtered.length]);

  // Scroll elementul selectat în vizor.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-idx="${selected}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      // -1 → 0; altfel ciclează.
      setSelected((s) =>
        !filtered.length ? -1 : s < 0 ? 0 : (s + 1) % filtered.length,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) =>
        !filtered.length ? -1 : s <= 0 ? filtered.length - 1 : s - 1,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      // Doar dacă e ceva selectat explicit (tastare sau săgeți) — NU la query gol.
      if (selected >= 0) filtered[selected]?.run();
    }
  };

  // Grupează filtrat, păstrând un index GLOBAL (pt selecție/tastatură).
  let running = -1;
  const groups: { name: string; items: { cmd: Command; idx: number }[] }[] = [];
  for (const cmd of filtered) {
    running += 1;
    const idx = running;
    let g = groups.find((x) => x.name === cmd.group);
    if (!g) {
      g = { name: cmd.group, items: [] };
      groups.push(g);
    }
    g.items.push({ cmd, idx });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        // `!translate-*`: animația `enter` (tailwindcss-animate) hijack-uiește `transform`
        // la identity (dialog.tsx n-are `slide-in-from-*` care să seteze enter-translate)
        // → centrarea `translate-x-[-50%]` NU se aplică. `!important` bate animația în
        // cascadă (author !important > CSS animations). Bug project-wide al DialogContent;
        // aici îl repar scoped pt paletă (fără să ating dialog.tsx / celelalte dialoguri).
        className="max-w-xl gap-0 overflow-hidden p-0 !translate-x-[-50%] !translate-y-[-50%]"
        aria-label="Căutare globală"
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              const v = e.target.value;
              setQuery(v);
              // Tastare → auto-selectează prima potrivire (Enter rulează top match);
              // query golit → nimic preselectat (Enter = no-op).
              setSelected(v ? 0 : -1);
            }}
            onKeyDown={onKeyDown}
            placeholder="Caută o comandă sau un modul…"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:opacity-60"
            aria-label="Caută"
          />
        </div>

        <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-1">
          {filtered.length === 0 && (
            <div className="px-3 py-6 text-center text-sm opacity-60">
              Niciun rezultat pentru „{query}".
            </div>
          )}
          {groups.map((g) => (
            <div key={g.name} className="mb-1">
              <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide opacity-50">
                {g.name}
              </div>
              {g.items.map(({ cmd, idx }) => (
                <button
                  key={cmd.id}
                  data-idx={idx}
                  type="button"
                  onClick={() => cmd.run()}
                  onMouseMove={() => setSelected(idx)}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm ${
                    idx === selected ? "bg-primary/15" : "hover:bg-muted/50"
                  }`}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center opacity-80">
                    {cmd.icon}
                  </span>
                  <span className="flex-1 truncate">{cmd.label}</span>
                  {cmd.hint && (
                    <span className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] opacity-60">
                      {cmd.hint}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-border px-3 py-1.5 text-[11px] opacity-55">
          <span>↑↓ navighează · Enter execută · Esc închide</span>
          <span>Ctrl+K</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
