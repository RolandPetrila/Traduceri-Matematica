"use client";

import dynamic from "next/dynamic";

/**
 * Tabul „Editor" — editor matematic NATIV (TipTap + shadcn), fără iframe.
 * Antet intern MINIM (decizie Roland 2026-07-26: foaia cât mai mare) — doar un
 * titlu mic + „Tot ecranul"; restul spațiului e al editorului. „Tot ecranul" =
 * ruta `/editor-nou` (aceeași componentă, pe toată pagina).
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
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="chalk-text min-w-0 truncate text-sm font-bold">
          <span className="text-chalk-yellow">&#x270F;</span>{" "}
          <span className="hidden sm:inline">Editor Documente Matematic</span>
          <span className="sm:hidden">Editor</span>
        </h2>
        <a
          href="/editor-nou"
          target="_blank"
          rel="noopener noreferrer"
          className="chalk-btn shrink-0 whitespace-nowrap text-xs"
          title="Deschide editorul pe tot ecranul (fereastră separată)"
        >
          &#x26F6; <span className="hidden sm:inline">Tot ecranul</span>
        </a>
      </div>

      <div className="h-[calc(100dvh-104px)] min-h-[460px] sm:h-[calc(100vh-124px)]">
        <EditorTiptap />
      </div>
    </div>
  );
}
