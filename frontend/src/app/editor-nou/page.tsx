"use client";

import dynamic from "next/dynamic";

// TipTap are nevoie de client (SSR off) — la fel ca Mösslein (immediatelyRender:false).
const EditorTiptap = dynamic(() => import("@/components/editor/EditorTiptap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-chalk-white/60">
      Se încarcă editorul…
    </div>
  ),
});

/**
 * Rută FULL-SCREEN a editorului nativ (TipTap + shadcn) — aceeași componentă
 * `EditorTiptap` ca tabul „Editor" (`/editor`), dar pe toată pagina. Deschisă din
 * tabul Editor prin butonul „Tot ecranul" (fereastră separată). NU e o rută moartă
 * și NU e duplicat de unificat cu `/editor` — cele două sunt intenționate: `/editor`
 * = embedded în taburi (cu antet), `/editor-nou` = vederea maximizată. (C6 clarificat
 * 2026-08-03; comentariul vechi „preview în dezvoltare până la F6" era stale — F6 gata.)
 */
export default function EditorNouPage() {
  return (
    <main className="chalkboard-bg min-h-screen p-2 sm:p-4">
      <div className="mx-auto h-[calc(100dvh-16px)] max-w-5xl sm:h-[calc(100vh-32px)]">
        <EditorTiptap />
      </div>
    </main>
  );
}
