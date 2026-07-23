"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Editor } from "@tiptap/react";

/**
 * Persistență document (F4b) — cheie NOUĂ separată de editorul vechi (`editor_documente_v1`),
 * ca cele două editoare să coexiste fără coruptie (formatul HTML diferă). La retragerea
 * iframe-ului vechi (F6) se poate migra. Model: auto-save debounce 1.5s pe `update` +
 * salvare manuală + restore la încărcare. Sursa = `editor.getHTML()` (conținut editat).
 */
const STORAGE_KEY = "editor_nou_v1";
const DEFAULT_NAME = "Document";
const AUTOSAVE_MS = 1500;

type Saved = { html: string; name: string; savedAt: number };

type DocumentApi = {
  name: string;
  lastSavedAt: number | null;
  /** Salvează acum (manual) — feedback prin lastSavedAt. */
  saveNow: () => void;
  /** Redenumește + persistă imediat cu numele nou. */
  rename: (newName: string) => void;
  /** Document nou: golește editorul, resetează numele, șterge salvarea. */
  newDocument: () => void;
};

const DocumentContext = createContext<DocumentApi | null>(null);

export function useEditorDocument(): DocumentApi {
  const ctx = useContext(DocumentContext);
  if (!ctx) {
    throw new Error(
      "useEditorDocument trebuie folosit în EditorDocumentProvider",
    );
  }
  return ctx;
}

function readSaved(): Saved | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (d && typeof d.html === "string") {
      return {
        html: d.html,
        name: d.name || DEFAULT_NAME,
        savedAt: d.savedAt || 0,
      };
    }
  } catch {
    /* localStorage indisponibil / JSON corupt → pornim gol */
  }
  return null;
}

export function EditorDocumentProvider({
  editor,
  children,
}: {
  editor: Editor | null;
  children: ReactNode;
}) {
  const [name, setName] = useState(DEFAULT_NAME);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const nameRef = useRef(name);
  nameRef.current = name;
  const restoredRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback((html: string, docName: string) => {
    try {
      const payload: Saved = { html, name: docName, savedAt: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setLastSavedAt(payload.savedAt);
    } catch {
      /* quota/private mode → ignorăm (fail-open) */
    }
  }, []);

  const saveNow = useCallback(() => {
    if (!editor) return;
    persist(editor.getHTML(), nameRef.current);
  }, [editor, persist]);

  const rename = useCallback(
    (newName: string) => {
      const clean = newName.trim() || DEFAULT_NAME;
      setName(clean);
      if (editor) persist(editor.getHTML(), clean);
    },
    [editor, persist],
  );

  const newDocument = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().clearContent().run();
    setName(DEFAULT_NAME);
    setLastSavedAt(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, [editor]);

  // Restore o singură dată, când editorul e gata.
  useEffect(() => {
    if (!editor || restoredRef.current) return;
    restoredRef.current = true;
    const saved = readSaved();
    if (saved) {
      editor.commands.setContent(saved.html);
      setName(saved.name);
      setLastSavedAt(saved.savedAt || null);
    }
  }, [editor]);

  // Auto-save debounced pe fiecare modificare (după ce restore-ul a rulat).
  useEffect(() => {
    if (!editor) return;
    const onUpdate = () => {
      if (!restoredRef.current) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        persist(editor.getHTML(), nameRef.current);
      }, AUTOSAVE_MS);
    };
    editor.on("update", onUpdate);
    return () => {
      editor.off("update", onUpdate);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [editor, persist]);

  return (
    <DocumentContext.Provider
      value={{ name, lastSavedAt, saveNow, rename, newDocument }}
    >
      {children}
    </DocumentContext.Provider>
  );
}
