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
import { trackEditor } from "./editor-telemetry";

/**
 * Persistență document (F4b) — cheie NOUĂ separată de editorul vechi (`editor_documente_v1`),
 * ca cele două editoare să coexiste fără coruptie (formatul HTML diferă). La retragerea
 * iframe-ului vechi (F6) se poate migra. Model: auto-save debounce 1.5s pe `update` +
 * salvare manuală + restore la încărcare. Sursa = `editor.getHTML()` (conținut editat).
 */
const STORAGE_KEY = "editor_nou_v1";
const DEFAULT_NAME = "Document";
const AUTOSAVE_MS = 1500;

/**
 * Migrare de la editorul vechi (iframe), retras în F6. Aceeași origine → aceeași
 * zonă localStorage: fără import, documentul salvat acolo ar rămâne în browser
 * dar n-ar mai fi citit de nimeni (dispariție silențioasă din interfață).
 * Flag-ul împiedică re-importul după un „Document nou".
 */
const LEGACY_KEY = "editor_documente_v1";
const LEGACY_FLAG = "editor_nou_legacy_imported_v1";

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
  /** Numele documentului adus AUTOMAT din editorul vechi (null = niciun import). */
  legacyImportedName: string | null;
  /** Ascunde anunțul de import automat. */
  dismissLegacyNotice: () => void;
  /**
   * Numele unui document din editorul vechi care EXISTĂ dar NU s-a adus automat
   * (fiindcă editorul nou avea deja conținut) — se oferă aducerea la cerere.
   */
  legacyAvailableName: string | null;
  /** Aduce documentul vechi ÎN LOCUL celui curent (înlocuire, după confirmare în UI). */
  bringLegacy: () => void;
  /** Ascunde oferta de aducere (pentru sesiunea curentă). */
  dismissLegacyAvailable: () => void;
  /**
   * O ALTĂ filă/fereastră (ex. `/editor` → „tot ecranul" deschide `/editor-nou`
   * separat) tocmai a salvat acest document — autosave-ul local ar putea
   * suprascrie silențios munca din cealaltă fereastră dacă utilizatorul
   * continuă să editeze aici fără să știe.
   */
  externalUpdateWarning: boolean;
  /** Ascunde avertismentul (păstrează conținutul curent din ACEASTĂ fereastră). */
  dismissExternalUpdate: () => void;
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

function legacyHandled(): boolean {
  try {
    return localStorage.getItem(LEGACY_FLAG) === "1";
  } catch {
    return false;
  }
}

function markLegacyHandled(): void {
  try {
    localStorage.setItem(LEGACY_FLAG, "1");
  } catch {
    /* ignore */
  }
}

/** Documentul editorului vechi (format `{name, html}`), indiferent de flag. */
function readLegacyRaw(): { html: string; name: string } | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (d && typeof d.html === "string" && d.html.trim()) {
      return { html: d.html, name: d.name || DEFAULT_NAME };
    }
  } catch {
    /* localStorage indisponibil / JSON corupt → fără import */
  }
  return null;
}

/** Documentul vechi pentru auto-import (o singură dată — respectă flag-ul). */
function readLegacy(): { html: string; name: string } | null {
  if (legacyHandled()) return null;
  return readLegacyRaw();
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
  const [legacyImportedName, setLegacyImportedName] = useState<string | null>(
    null,
  );
  const [legacyAvailableName, setLegacyAvailableName] = useState<string | null>(
    null,
  );
  const [externalUpdateWarning, setExternalUpdateWarning] = useState(false);
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

  const bringLegacy = useCallback(() => {
    if (!editor) return;
    const legacy = readLegacyRaw();
    if (!legacy) {
      setLegacyAvailableName(null);
      return;
    }
    editor.commands.setContent(legacy.html);
    setName(legacy.name);
    persist(legacy.html, legacy.name);
    markLegacyHandled();
    trackEditor("legacy_bring", { name: legacy.name });
    setLegacyAvailableName(null);
  }, [editor, persist]);

  // Restore o singură dată, când editorul e gata.
  useEffect(() => {
    if (!editor || restoredRef.current) return;
    restoredRef.current = true;
    const saved = readSaved();
    if (saved) {
      editor.commands.setContent(saved.html);
      setName(saved.name);
      setLastSavedAt(saved.savedAt || null);
      // Cheia nouă are deja conținut → auto-importul NU rulează (n-am suprascrie
      // munca curentă). Dacă totuși există un document vechi ne-tratat, OFERIM
      // aducerea (banner cu confirmare), fără să atingem nimic acum.
      if (!legacyHandled() && readLegacyRaw()) {
        setLegacyAvailableName(readLegacyRaw()!.name);
      }
      return;
    }
    // Nimic în cheia nouă → aducem documentul din editorul vechi (o singură dată)
    // și îl adoptăm imediat în cheia nouă, ca următoarea deschidere să fie normală.
    const legacy = readLegacy();
    if (legacy) {
      editor.commands.setContent(legacy.html);
      setName(legacy.name);
      persist(legacy.html, legacy.name);
      setLegacyImportedName(legacy.name);
      markLegacyHandled();
      trackEditor("legacy_import_auto", { name: legacy.name });
    }
  }, [editor, persist]);

  // Coliziune autosave (advisor /improve #2): `/editor` deschide `/editor-nou`
  // într-o fereastră NOUĂ, independentă — ambele scriu aceeași cheie STORAGE_KEY,
  // fără niciun lock. Evenimentul `storage` se declanșează DOAR în ferestrele/
  // filele CARE NU AU FĂCUT scrierea (spec DOM) → detectăm sigur o salvare
  // venită din cealaltă fereastră, fără fals-pozitiv pe propriile noastre save-uri.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !restoredRef.current) return;
      if (e.newValue === e.oldValue) return;
      setExternalUpdateWarning(true);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

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
      value={{
        name,
        lastSavedAt,
        saveNow,
        rename,
        newDocument,
        legacyImportedName,
        dismissLegacyNotice: () => setLegacyImportedName(null),
        legacyAvailableName,
        bringLegacy,
        dismissLegacyAvailable: () => setLegacyAvailableName(null),
        externalUpdateWarning,
        dismissExternalUpdate: () => setExternalUpdateWarning(false),
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
}
