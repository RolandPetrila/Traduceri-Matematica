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
import {
  translateEditorDoc,
  extractTranslatable,
  hasTranslatableText,
} from "./editor-translate";
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
import { pruneStaleTranslations } from "@/lib/translation-cache-guard";

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
  /**
   * Cheia sursei din care au fost construite traducerile aflate ACUM în `cacheRef`.
   * `null` = în cache e doar sursa. Dacă sursa e editată, cheia nu mai corespunde și
   * traducerile vechi se aruncă — altfel am servi o versiune fără corectura Cristinei.
   */
  const builtFromRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // FAZA 2 (2.A) — la reload, limba AFIȘATĂ vine din `editor_nou_lang_v1`, dar
  // limba-SURSĂ și documentul original vin din magazia separată. Înainte, ambele
  // erau puse pe limba afișată: dacă documentul fusese tradus, originalul devenea
  // „sursă" și varianta românească se pierdea definitiv. Acum o repunem în cache,
  // deci butonul RO o readuce instant.
  useEffect(() => {
    const displayed = readLang();
    setDisplayLang(displayed);

    const snap = readSourceSnapshot();
    const validSource =
      snap && LANGS.some((l) => l.code === snap.lang)
        ? (snap.lang as LangCode)
        : null;

    if (snap && validSource) {
      cacheRef.current.set(validSource, snap.doc);
      setSourceLang(validSource);
      // CRITIC (defect confirmat live pe v63 de auditorul de dovezi): fără linia
      // asta, după reload `builtFromRef` rămânea `null`, `pruneStaleTranslations`
      // ieșea imediat, iar vederea tradusă restaurată din autosalvare intra în
      // cache ca și cum ar fi fost valabilă pentru orice sursă. Traseul realist al
      // Cristinei — traduce, închide, revine a doua zi, corectează o formulă,
      // apasă SK — îi servea traducerea VECHE, instant, fără corectură și fără
      // niciun mesaj. Fixul din sesiune era real, dar se oprea la reload.
      //
      // Instantaneul a fost scris exact în clipa plecării din limba-sursă, deci
      // traducerea afișată acum provine din el. Declarăm asta explicit: dacă
      // sursa se schimbă, traducerile devin învechite și se retraduc; dacă nu se
      // schimbă, rămân instant, fără să reconsume cota DeepL.
      builtFromRef.current = JSON.stringify(snap.doc);
    } else {
      setSourceLang(displayed);
    }
  }, []);

  const changeSource = useCallback(
    (lang: LangCode) => {
      if (!editor) return;
      // Conținutul curent E declarat ca fiind în `lang`. Resetez cache-ul (traducerile
      // vechi erau raportate la altă sursă).
      const doc = editor.getJSON();
      cacheRef.current = new Map<LangCode, JSONContent>([[lang, doc]]);
      builtFromRef.current = null; // cache golit → nicio traducere de raportat la o sursă
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
      // Golim eroarea veche AICI, nu abia înainte de traducere: altfel, dacă SK a
      // eșuat și apoi se comută pe o limbă deja în cache, mesajul de eroare ȘI
      // butonul „Încearcă din nou" rămâneau pe ecran lipite de o acțiune care
      // REUȘISE. (Găsit de auditorul de cerințe, 08.09.2026.)
      setError(null);
      setFailedTarget(null);

      // Capturez editările din vederea curentă înainte de a comuta.
      const currentView = editor.getJSON();
      cacheRef.current.set(displayLang, currentView);
      // 2.A — momentul CRITIC: dacă plec DIN limba-sursă, asta e ultima ocazie de
      // a pune originalul la adăpost. Din secunda următoare, autosalvarea va scrie
      // peste el varianta tradusă. Aici se pierdea munca Cristinei.
      if (displayLang === sourceLang) {
        const pastrat = saveSourceSnapshot(sourceLang, currentView);
        if (!pastrat) {
          // Memoria browserului e plină. Dacă am comuta totuși, originalul s-ar
          // pierde la următoarea reîncărcare — exact defectul pe care 2.A l-a
          // reparat. Refuzăm comutarea și spunem de ce: mai bine o traducere
          // neefectuată decât munca Cristinei distrusă în tăcere.
          // (Cazul a fost testat de auditorul de dovezi: se scria E-EDIT-003 în
          // jurnal, dar pe ecran rămânea „✓ salvat".)
          setError(
            "Nu am putut păstra originalul: memoria browserului e plină. Exportă documentul (Fișier → Export) ÎNAINTE de a traduce — altfel varianta curentă s-ar pierde la reîncărcare. (cod E-EDIT-003)",
          );
          return;
        }
      }

      const sourceDoc = cacheRef.current.get(sourceLang) ?? editor.getJSON();
      const sourceKey = JSON.stringify(sourceDoc);

      // DEFECT găsit LIVE de auditorul de dovezi (08.09.2026): Cristina traduce în
      // SK, revine pe RO ca să repare o formulă, apasă din nou SK — și primea
      // versiunea SK de DINAINTEA reparației, instant, fără nicio cerere și fără
      // niciun mesaj. Corectura ei dispărea în tăcere. Traducerile din memorie sunt
      // valabile DOAR pentru sursa din care au fost făcute; dacă sursa s-a schimbat,
      // le aruncăm și retraducem.
      pruneStaleTranslations(
        cacheRef.current,
        sourceLang,
        sourceKey,
        builtFromRef.current,
      );

      const cached = cacheRef.current.get(target);
      if (cached) {
        editor.commands.setContent(cached);
        setDisplayLang(target);
        writeLang(target);
        return;
      }

      // Document fără text traductibil (doar figuri / formule / tabel gol):
      // înainte, butonul se aprindea, limba se schimba și NU se afișa nimic —
      // Cristina rămânea convinsă că a tradus. Acum i se spune, iar limba NU se
      // schimbă, ca butonul să nu mintă. (Găsit de auditorul de cerințe.)
      if (!hasTranslatableText(extractTranslatable(sourceDoc).sections)) {
        setError(
          "Nu am ce traduce: documentul conține doar formule sau figuri, fără text. Limba a rămas neschimbată.",
        );
        return;
      }
      // G2 — cache PERSISTENT (cross-reload): dacă am tradus deja ACEST conținut
      // în ACEASTĂ pereche de limbi, îl refolosesc → instant + NU reconsumă DeepL.
      // (Ăsta e indexat DUPĂ conținutul sursei, deci nu suferă de învechirea de mai sus.)
      try {
        const persisted = await getCachedDocTranslation(
          sourceKey,
          sourceLang,
          target,
        );
        if (persisted) {
          const doc = JSON.parse(persisted) as JSONContent;
          cacheRef.current.set(target, doc);
          builtFromRef.current = sourceKey;
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
        builtFromRef.current = sourceKey;
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
          const hint =
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
            userHint: hint,
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
    const pending = failedTarget;
    setError(null);
    setFailedTarget(null);
    void switchLanguage(pending);
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
