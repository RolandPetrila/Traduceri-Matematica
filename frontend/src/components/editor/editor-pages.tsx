"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Editor } from "@tiptap/react";
import { trackEditor } from "./editor-telemetry";

/**
 * Paginare A4 (F4d) — model „ghidaje peste foaie" (ca editorul vechi): o singură
 * foaie continuă + linii „Pagina N" suprapuse + contor. NU atinge ProseMirror
 * (zero risc de regresie pe tabele/matematică).
 *
 * Fidelitate: pe desktop foaia are metrici A4 REALE, identice cu documentul
 * exportat (A4, margini 20mm/18mm) → linia cade exact unde se rupe PDF-ul.
 * Pe mobil foaia e fluidă (lizibilitate) → textul se reflowează la altă lățime,
 * deci numărul de pagini NU ar fi adevărat: ascundem și ghidajele, și contorul.
 */
const MM_PX = 96 / 25.4; // 1mm în CSS px (definiție CSS: 1mm = 96/25.4px)
const A4_HEIGHT_MM = 297;
const MARGIN_MM = 20; // sus + jos (identic cu @page din editor-export.ts)
/** Înălțimea zonei de CONȚINUT a unei pagini A4 (fără margini), în px. */
export const PAGE_CONTENT_PX = (A4_HEIGHT_MM - 2 * MARGIN_MM) * MM_PX; // ~971px
/** Sub acest prag foaia e fluidă → paginarea nu e fidelă (vezi globals.css). */
const A4_MEDIA = "(min-width: 840px)";

type PagesApi = {
  /** Nr. de pagini A4 estimat din înălțimea conținutului. */
  pageCount: number;
  /** true doar când foaia e la metrici A4 reale (desktop) → contorul e adevărat. */
  accurate: boolean;
};

const PagesContext = createContext<PagesApi>({ pageCount: 1, accurate: false });

export function useEditorPages(): PagesApi {
  return useContext(PagesContext);
}

export function EditorPagesProvider({
  editor,
  children,
}: {
  editor: Editor | null;
  children: ReactNode;
}) {
  const [pageCount, setPageCount] = useState(1);
  const [accurate, setAccurate] = useState(false);
  // Ultimul contor LOGAT — telemetria se emite DOAR când numărul se schimbă
  // (altfel, la always-on, fiecare tastă ar genera un eveniment = zgomot + cotă).
  const lastTrackedPagesRef = useRef(1);

  // Urmărim dacă foaia e la metrici A4 (altfel contorul ar minți).
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(A4_MEDIA);
    const sync = () => setAccurate(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Măsurăm înălțimea conținutului din DOM-ul ProseMirror.
  // ATENȚIE: cu `immediatelyRender:false`, instanța `editor` există ÎNAINTE ca
  // `editor.view` să fie montat. Dacă am ieși devreme pe `!editor.view`, efectul
  // nu s-ar mai re-rula niciodată (referința `editor` nu se schimbă) și nu s-ar
  // atașa niciun listener. Deci: atașăm listenerii necondiționat și rezolvăm
  // elementul LAZY, la fiecare măsurare.
  useEffect(() => {
    if (!editor) return;

    let frame = 0;
    let ro: ResizeObserver | null = null;
    let observed: HTMLElement | null = null;

    const apply = () => {
      const el = editor.view?.dom as HTMLElement | undefined;
      if (!el) return;
      if (ro && observed !== el) {
        if (observed) ro.unobserve(observed);
        ro.observe(el);
        observed = el;
      }
      const next = Math.max(1, Math.ceil(el.scrollHeight / PAGE_CONTENT_PX));
      setPageCount(next);
      if (next !== lastTrackedPagesRef.current) {
        lastTrackedPagesRef.current = next;
        trackEditor("page_count", { pages: next });
      }
    };
    const measure = () => {
      cancelAnimationFrame(frame);
      // Într-un tab de fundal browserul SUSPENDĂ requestAnimationFrame → dacă am
      // batch-ui doar prin rAF, contorul ar rămâne blocat. Măsurăm sincron acolo.
      if (typeof document !== "undefined" && document.hidden) {
        apply();
        return;
      }
      frame = requestAnimationFrame(apply);
    };

    if (typeof ResizeObserver !== "undefined") ro = new ResizeObserver(measure);

    measure();
    editor.on("create", measure);
    editor.on("update", measure);
    window.addEventListener("resize", measure);
    document.addEventListener("visibilitychange", measure);

    return () => {
      cancelAnimationFrame(frame);
      editor.off("create", measure);
      editor.off("update", measure);
      ro?.disconnect();
      window.removeEventListener("resize", measure);
      document.removeEventListener("visibilitychange", measure);
    };
  }, [editor]);

  return (
    <PagesContext.Provider value={{ pageCount, accurate }}>
      {children}
    </PagesContext.Provider>
  );
}

/** Liniile „Pagina N" suprapuse peste foaie (ascunse pe mobil prin CSS). */
export function EditorPageGuides() {
  const { pageCount } = useEditorPages();
  if (pageCount < 2) return null;
  return (
    <div className="page-guides" aria-hidden="true">
      {Array.from({ length: pageCount - 1 }, (_, i) => (
        <div
          key={i}
          className="page-guide"
          style={{ top: `${(i + 1) * PAGE_CONTENT_PX}px` }}
        >
          <span>Pagina {i + 2}</span>
        </div>
      ))}
    </div>
  );
}

/** Badge „📄 N pag. A4" — doar când numărul e adevărat (foaie la metrici A4). */
export function EditorPageCount() {
  const { pageCount, accurate } = useEditorPages();
  if (!accurate) return null;
  return (
    <span className="whitespace-nowrap text-xs text-muted-foreground">
      📄 {pageCount} pag. A4
    </span>
  );
}
