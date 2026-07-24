"use client";

import dynamic from "next/dynamic";

/**
 * Tabul „Editor" — editor matematic NATIV (TipTap + shadcn), fără iframe.
 *
 * Rescriere F0–F6 (2026-07): a înlocuit aplicația HTML-vanilla-în-iframe
 * (`public/editor/index.html`, retrasă la F6) care dădea chrome triplu pe telefon.
 * Acum: o singură bară, responsive nativ. „Tot ecranul" = ruta `/editor-nou`
 * (aceeași componentă, pe toată pagina). SSR off (immediatelyRender:false).
 */
const EditorTiptap = dynamic(() => import("@/components/editor/EditorTiptap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-chalk-white/60">
      Se încarcă editorul…
    </div>
  ),
});

export default function EditorPage() {
  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base sm:text-2xl font-bold chalk-text truncate">
            <span className="text-chalk-yellow">&#x270F;</span> Editor{" "}
            <span className="hidden sm:inline">Documente Matematic</span>
          </h2>
          <p className="hidden sm:block text-sm opacity-60">
            Editor A4 tip Word &mdash; 103 simboluri, 214 formule (clasele
            V&ndash;XII), tabele, dictare, export PDF/Word/HTML.
          </p>
        </div>
        <a
          href="/editor-nou"
          target="_blank"
          rel="noopener noreferrer"
          className="chalk-btn text-xs sm:text-sm whitespace-nowrap shrink-0"
          title="Deschide editorul pe tot ecranul (fereastră separată)"
        >
          &#x26F6;{" "}
          <span className="hidden sm:inline">Deschide in fereastra noua</span>
          <span className="sm:hidden">Tot ecranul</span>
        </a>
      </div>

      <div className="h-[calc(100dvh-150px)] sm:h-[calc(100vh-230px)] min-h-[420px] sm:min-h-[560px]">
        <EditorTiptap />
      </div>
    </div>
  );
}
