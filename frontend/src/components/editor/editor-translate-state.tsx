"use client";

/**
 * F8 — starea switch-ului de limbi (2026-07-29). Un singur editor; conținutul COMUTĂ
 * în limba aleasă. Cache pe limbă în-sesiune → reversibil, editările se păstrează.
 * Traduc mereu din limba-SURSĂ (fidelitate), nu din cea afișată.
 *
 * Persistență (v1): rețin DOAR limba conținutului curent (`editor_nou_lang_v1`, default
 * `ro` pt salvări vechi). Conținutul îl salvează `editor-document` (neatins). La reload:
 * conținutul restaurat = sursă în limba reținută → sursă=afișat=acea limbă.
 * G2: cache-ul de TRADUCERE se persistă acum cross-reload prin `translation-cache.ts`
 * (cheie SHA-256 pe conținutul-sursă + perechea de limbi) → după reload, comutarea într-o
 * limbă deja tradusă e instant și NU reconsumă cota DeepL. (Editările per-limbă rămân
 * doar în-sesiune + în limba salvată de `editor-document`; cache-ul persistă traducerea-mașină.)
 */

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Editor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import { translateEditorDoc } from "./editor-translate";
import { trackEditor } from "./editor-telemetry";
import {
  getCachedDocTranslation,
  cacheDocTranslation,
} from "@/lib/translation-cache";

export type LangCode = "ro" | "sk" | "en" | "de";
export const LANGS: { code: LangCode; label: string; name: string }[] = [
  { code: "ro", label: "RO", name: "Română" },
  { code: "sk", label: "SK", name: "Slovacă" },
  { code: "en", label: "EN", name: "Engleză" },
  { code: "de", label: "DE", name: "Germană" },
];

const LANG_KEY = "editor_nou_lang_v1";

function readLang(): LangCode {
  if (typeof window === "undefined") return "ro";
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (v && LANGS.some((l) => l.code === v)) return v as LangCode;
  } catch {
    /* localStorage indisponibil */
  }
  return "ro";
}

function writeLang(l: LangCode) {
  try {
    localStorage.setItem(LANG_KEY, l);
  } catch {
    /* ignore */
  }
}

type TranslateCtx = {
  sourceLang: LangCode;
  displayLang: LangCode;
  isTranslating: boolean;
  error: string | null;
  /** Comută limba AFIȘATĂ (traduce din sursă dacă nu e în cache). */
  switchLanguage: (target: LangCode) => void;
  /** „Scris în": declară limba-sursă = limba conținutului curent. */
  changeSource: (lang: LangCode) => void;
  clearError: () => void;
};

const Ctx = createContext<TranslateCtx | null>(null);

export function EditorTranslateProvider({
  editor,
  children,
}: {
  editor: Editor | null;
  children: React.ReactNode;
}) {
  // DEFAULT identic SSR↔client (fără hydration mismatch); citim localStorage în useEffect.
  const [sourceLang, setSourceLang] = useState<LangCode>("ro");
  const [displayLang, setDisplayLang] = useState<LangCode>("ro");
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Map<LangCode, JSONContent>>(new Map());
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const l = readLang();
    setSourceLang(l);
    setDisplayLang(l);
  }, []);

  const changeSource = useCallback(
    (lang: LangCode) => {
      if (!editor) return;
      // Conținutul curent E declarat ca fiind în `lang`. Resetez cache-ul (traducerile
      // vechi erau raportate la altă sursă).
      cacheRef.current = new Map([[lang, editor.getJSON()]]);
      setSourceLang(lang);
      setDisplayLang(lang);
      writeLang(lang);
    },
    [editor],
  );

  const switchLanguage = useCallback(
    async (target: LangCode) => {
      if (!editor || target === displayLang || isTranslating) return;
      // Capturez editările din vederea curentă înainte de a comuta.
      cacheRef.current.set(displayLang, editor.getJSON());

      const cached = cacheRef.current.get(target);
      if (cached) {
        editor.commands.setContent(cached);
        setDisplayLang(target);
        writeLang(target);
        return;
      }

      const sourceDoc = cacheRef.current.get(sourceLang) ?? editor.getJSON();
      // G2 — cache PERSISTENT (cross-reload): dacă am tradus deja ACEST conținut
      // în ACEASTĂ pereche de limbi, îl refolosesc → instant + NU reconsumă DeepL.
      const sourceKey = JSON.stringify(sourceDoc);
      try {
        const persisted = await getCachedDocTranslation(
          sourceKey,
          sourceLang,
          target,
        );
        if (persisted) {
          const doc = JSON.parse(persisted) as JSONContent;
          cacheRef.current.set(target, doc);
          editor.commands.setContent(doc);
          setDisplayLang(target);
          writeLang(target);
          trackEditor("translate", { from: sourceLang, to: target, cached: 1 });
          return;
        }
      } catch {
        /* cache miss / indisponibil → traducem normal */
      }

      setIsTranslating(true);
      setError(null);
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const translated = await translateEditorDoc({
          doc: sourceDoc,
          sourceLang,
          targetLang: target,
          engine: "deepl",
          signal: ac.signal,
        });
        cacheRef.current.set(target, translated);
        editor.commands.setContent(translated);
        setDisplayLang(target);
        writeLang(target);
        // Persist pt reload-uri viitoare (fail-open, nu așteptăm).
        void cacheDocTranslation(
          sourceKey,
          sourceLang,
          target,
          JSON.stringify(translated),
        );
        trackEditor("translate", { from: sourceLang, to: target });
      } catch (e) {
        if ((e as Error)?.name !== "AbortError") {
          setError(
            "Traducerea a eșuat. Verifică internetul și încearcă din nou.",
          );
          trackEditor("translate_error", { to: target });
        }
      } finally {
        setIsTranslating(false);
      }
    },
    [editor, displayLang, sourceLang, isTranslating],
  );

  const clearError = useCallback(() => setError(null), []);

  return (
    <Ctx.Provider
      value={{
        sourceLang,
        displayLang,
        isTranslating,
        error,
        switchLanguage,
        changeSource,
        clearError,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useEditorTranslate(): TranslateCtx {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error(
      "useEditorTranslate trebuie folosit în EditorTranslateProvider",
    );
  return ctx;
}
