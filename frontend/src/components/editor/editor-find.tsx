"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import type { Editor } from "@tiptap/react";
import { Search, ChevronUp, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getFindState,
  setFindState,
  goToMatch,
  replaceAllMatches,
  replaceCurrentMatch,
} from "./search-find";
import { trackEditor } from "./editor-telemetry";

/**
 * G8 Găsește & Înlocuiește — UI (F6).
 *
 * Formă confirmată §17 (Roland, 2026-07-24): bară sub toolbar, aceeași pe
 * desktop și pe mobil (un dialog ar acoperi exact textul căutat pe telefon),
 * ca în editorul vechi. Ctrl+F deschide, Escape închide.
 */

type FindApi = {
  editor: Editor | null;
  isOpen: boolean;
  openFind: () => void;
  closeFind: () => void;
  query: string;
  setQuery: (value: string) => void;
  replaceWith: string;
  setReplaceWith: (value: string) => void;
  caseSensitive: boolean;
  setCaseSensitive: (value: boolean) => void;
  /**
   * Handler de tastatură pentru CONTAINERUL editorului — NU pentru `window`.
   * Aplicația randează toate taburile simultan (`display:none` pe cele inactive,
   * vezi app/page.tsx), deci editorul e mereu montat: un listener global pe
   * window ar fura Ctrl+F și când ești pe Traduceri sau Convertor.
   */
  onEditorKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => void;
};

const FindContext = createContext<FindApi | null>(null);

export function useEditorFind(): FindApi {
  const ctx = useContext(FindContext);
  if (!ctx) {
    throw new Error("useEditorFind trebuie folosit în EditorFindProvider");
  }
  return ctx;
}

export function EditorFindProvider({
  editor,
  children,
}: {
  editor: Editor | null;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQueryState] = useState("");
  const [replaceWith, setReplaceWith] = useState("");
  const [caseSensitive, setCaseSensitiveState] = useState(false);

  const applySearch = useCallback(
    (nextQuery: string, nextCase: boolean) => {
      setFindState(editor, {
        query: nextQuery,
        caseSensitive: nextCase,
        index: 0,
      });
    },
    [editor],
  );

  const setQuery = useCallback(
    (value: string) => {
      setQueryState(value);
      applySearch(value, caseSensitive);
    },
    [applySearch, caseSensitive],
  );

  const setCaseSensitive = useCallback(
    (value: boolean) => {
      setCaseSensitiveState(value);
      applySearch(query, value);
    },
    [applySearch, query],
  );

  const openFind = useCallback(() => {
    setIsOpen(true);
    applySearch(query, caseSensitive); // re-evidențiere la redeschidere
    trackEditor("find_open");
  }, [applySearch, query, caseSensitive]);

  const closeFind = useCallback(() => {
    setIsOpen(false);
    setFindState(editor, { query: "" }); // curăță evidențierile
    editor?.chain().focus().run();
  }, [editor]);

  const onEditorKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLElement>) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        openFind();
        return;
      }
      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        closeFind();
      }
    },
    [closeFind, isOpen, openFind],
  );

  return (
    <FindContext.Provider
      value={{
        editor,
        isOpen,
        openFind,
        closeFind,
        query,
        setQuery,
        replaceWith,
        setReplaceWith,
        caseSensitive,
        setCaseSensitive,
        onEditorKeyDown,
      }}
    >
      {children}
    </FindContext.Provider>
  );
}

/** Bara propriu-zisă — randată doar cât e deschisă (montarea îi dă focusul). */
export function EditorFindBar() {
  const {
    editor,
    closeFind,
    query,
    setQuery,
    replaceWith,
    setReplaceWith,
    caseSensitive,
    setCaseSensitive,
  } = useEditorFind();
  const inputRef = useRef<HTMLInputElement>(null);
  const [, setTick] = useState(0);

  // Contorul „N/M" urmărește starea pluginului → re-randare la fiecare
  // tranzacție (tastare în document, înlocuire, navigare între potriviri).
  useEffect(() => {
    if (!editor) return;
    const onTransaction = () => setTick((t) => t + 1);
    editor.on("transaction", onTransaction);
    return () => {
      editor.off("transaction", onTransaction);
    };
  }, [editor]);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const state = getFindState(editor);
  const total = state.matches.length;
  const position = total ? state.index + 1 : 0;
  const noResults = query.length > 0 && total === 0;

  const onSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      goToMatch(editor, event.shiftKey ? -1 : 1);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-border bg-muted/40 px-2 py-1.5">
      {/* Rândul 1: câmpurile + navigarea */}
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <Search className="h-4 w-4 shrink-0 opacity-60" aria-hidden="true" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onSearchKeyDown}
          placeholder="Găsește…"
          aria-label="Text de căutat"
          className={`h-8 min-w-0 flex-1 ${noResults ? "border-destructive" : ""}`}
        />
        <span className="shrink-0 opacity-60" aria-hidden="true">
          →
        </span>
        <Input
          value={replaceWith}
          onChange={(e) => setReplaceWith(e.target.value)}
          placeholder="Înlocuiește cu…"
          aria-label="Text de înlocuire"
          className="h-8 min-w-0 flex-1"
        />
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <span
          className="min-w-[3.25rem] text-center text-xs tabular-nums opacity-70"
          aria-live="polite"
        >
          {position}/{total}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => goToMatch(editor, -1)}
          disabled={total === 0}
          title="Potrivirea anterioară (Shift+Enter)"
          aria-label="Potrivirea anterioară"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => goToMatch(editor, 1)}
          disabled={total === 0}
          title="Potrivirea următoare (Enter)"
          aria-label="Potrivirea următoare"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={closeFind}
          title="Închide căutarea (Escape)"
          aria-label="Închide căutarea"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Rândul 2: opțiune + acțiuni de înlocuire */}
      <div className="flex w-full items-center gap-2">
        <label className="flex cursor-pointer select-none items-center gap-1.5 text-xs opacity-80">
          <input
            type="checkbox"
            checked={caseSensitive}
            onChange={(e) => setCaseSensitive(e.target.checked)}
            className="h-3.5 w-3.5"
          />
          potrivire exactă
        </label>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => replaceCurrentMatch(editor, replaceWith)}
          disabled={total === 0}
          title="Înlocuiește potrivirea curentă"
        >
          Înlocuiește
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => {
            const replaced = replaceAllMatches(editor, replaceWith);
            trackEditor("find_replace_all", { query, replaced });
          }}
          disabled={total === 0}
          title="Înlocuiește toate potrivirile"
        >
          Toate
        </Button>
        {noResults && (
          <span className="text-xs text-destructive">Niciun rezultat</span>
        )}
      </div>
    </div>
  );
}
