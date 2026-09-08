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
import { trackEditor, docShape } from "./editor-telemetry";
import { classifyFailure, reportFailure } from "@/lib/failure";
import {
  getCachedDocTranslation,
  cacheDocTranslation,
} from "@/lib/translation-cache";
import {
  readSourceSnapshot,
  saveSourceSnapshot,
} from "@/lib/editor-source-store";

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
  /** (2b) Limba în care traducerea tocmai a eșuat — null dacă n-a eșuat nimic. */
  failedTarget: LangCode | null;
  /** (2b) Reia traducerea care a eșuat, fără ca Cristina să reîncarce pagina. */
  retryTranslation: () => void;
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
  // (2b) Ținem minte ÎN CE limbă a eșuat, ca butonul „Încearcă din nou" să reia
  // exact acea traducere. Fără asta, singura reîncercare posibilă era reîncărcarea
  // paginii — iar la reload se pierdea originalul (vezi 2.A). Două defecte care
  // se hrăneau unul pe altul.
  const [failedTarget, setFailedTarget] = useState<LangCode | null>(null);
  const cacheRef = useRef<Map<LangCode, JSONContent>>(new Map());
  const abortRef = useRef<AbortController | null>(null);

  // FAZA 2 (2.A) — la reload, limba AFIȘATĂ vine din `editor_nou_lang_v1`, dar
  // limba-SURSĂ și documentul original vin din magazia separată. Înainte, ambele
  // erau puse pe limba afișată: dacă documentul fusese tradus, originalul devenea
  // „sursă" și varianta românească se pierdea definitiv. Acum o repunem în cache,
  // deci butonul RO o readuce instant.
  useEffect(() => {
    const afisat = readLang();
    setDisplayLang(afisat);

    const snap = readSourceSnapshot();
    const sursaValida =
      snap && LANGS.some((l) => l.code === snap.lang)
        ? (snap.lang as LangCode)
        : null;

    if (snap && sursaValida) {
      cacheRef.current.set(sursaValida, snap.doc);
      setSourceLang(sursaValida);
    } else {
      setSourceLang(afisat);
    }
  }, []);

  const changeSource = useCallback(
    (lang: LangCode) => {
      if (!editor) return;
      // Conținutul curent E declarat ca fiind în `lang`. Resetez cache-ul (traducerile
      // vechi erau raportate la altă sursă).
      const doc = editor.getJSON();
      cacheRef.current = new Map([[lang, doc]]);
      setSourceLang(lang);
      setDisplayLang(lang);
      writeLang(lang);
      // 2.A: originalul declarat acum devine cel care trebuie să supraviețuiască.
      saveSourceSnapshot(lang, doc);
    },
    [editor],
  );

  const switchLanguage = useCallback(
    async (target: LangCode) => {
      if (!editor || target === displayLang || isTranslating) return;
      // Capturez editările din vederea curentă înainte de a comuta.
      const vedereCurenta = editor.getJSON();
      cacheRef.current.set(displayLang, vedereCurenta);
      // 2.A — momentul CRITIC: dacă plec DIN limba-sursă, asta e ultima ocazie de
      // a pune originalul la adăpost. Din secunda următoare, autosalvarea va scrie
      // peste el varianta tradusă. Aici se pierdea munca Cristinei.
      if (displayLang === sourceLang) {
        saveSourceSnapshot(sourceLang, vedereCurenta);
      }

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
      setFailedTarget(null);
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
          // FAZA 1: eroarea NU se mai aruncă la gunoi. Mesajul reflectă mecanismul
          // real (dacă n-a plecat nicio cerere, nu mai dăm vina pe internet), iar
          // logul primește cod + cauză + structura documentului care a picat.
          // Eșec în browser (bug de cod SAU răspuns corupt de la server) vs. eșec
          // de rețea/HTTP — sunt probleme diferite, deci coduri diferite.
          const localKind = classifyFailure(e);
          // (2e) Mesajul îi spune Cristinei CE ARE DE FĂCUT, nu doar că a eșuat.
          // Cerința ei, în cuvintele lui Roland: „să îi scrie acolo clar că
          // trebuie să mai apese o dată, sau că este o eroare, sau să reîncerce
          // în 5 secunde".
          const indicatie =
            localKind === "badResponse"
              ? "Serverul a pornit greu și a trimis un răspuns deteriorat. Apasă „Încearcă din nou” — de obicei reușește din a doua."
              : localKind === "network" || localKind === "http"
                ? "Traducerea nu a ajuns la server. Așteaptă ~5 secunde și apasă „Încearcă din nou”."
                : localKind === "timeout"
                  ? "Documentul e mare și traducerea a durat prea mult. Apasă „Încearcă din nou”; dacă se repetă, împarte documentul în două."
                  : undefined;
          const f = reportFailure({
            code:
              localKind === "logic" || localKind === "badResponse"
                ? "E-TRANS-005"
                : "E-TRANS-001",
            flow: "editor.translate",
            error: e,
            context: {
              to: target,
              from: sourceLang,
              ...docShape(sourceDoc),
            },
            sample: JSON.stringify(sourceDoc),
            userHint: indicatie,
          });
          setError(f.userMessage);
          // (2b) Butonul de reîncercare are nevoie să știe ce anume să reia.
          setFailedTarget(target);
        }
      } finally {
        setIsTranslating(false);
      }
    },
    [editor, displayLang, sourceLang, isTranslating],
  );

  // 2.A — cât timp pe ecran e limba-sursă, orice editare schimbă ORIGINALUL.
  // Îl reîmprospătăm cu aceeași temporizare ca autosalvarea documentului (1,5 s),
  // ca cele două să nu se desincronizeze. Fără asta, originalul salvat ar fi cel
  // de dinaintea ultimelor corecturi ale Cristinei.
  useEffect(() => {
    if (!editor || displayLang !== sourceLang) return;
    let t: ReturnType<typeof setTimeout> | null = null;
    const onUpdate = () => {
      if (t) clearTimeout(t);
      t = setTimeout(
        () => saveSourceSnapshot(sourceLang, editor.getJSON()),
        1500,
      );
    };
    editor.on("update", onUpdate);
    return () => {
      editor.off("update", onUpdate);
      if (t) clearTimeout(t);
    };
  }, [editor, displayLang, sourceLang]);

  const clearError = useCallback(() => {
    setError(null);
    setFailedTarget(null);
  }, []);

  // (2b) Reia EXACT traducerea care a picat, pe loc. Înainte, singura reîncercare
  // posibilă era reîncărcarea paginii — iar reload-ul ducea la pierderea
  // originalului (2.A). Butonul rupe acest lanț.
  const retryTranslation = useCallback(() => {
    if (!failedTarget || isTranslating) return;
    const tinta = failedTarget;
    setError(null);
    setFailedTarget(null);
    void switchLanguage(tinta);
  }, [failedTarget, isTranslating, switchLanguage]);

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
        failedTarget,
        retryTranslation,
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
