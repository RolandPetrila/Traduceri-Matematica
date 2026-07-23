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
 * Rută de PREVIEW pentru editorul nou (TipTap + shadcn), în dezvoltare (F1+).
 * NU e în bara de taburi — tabul „Editor" rămâne pe versiunea veche (iframe)
 * până la paritate completă (F6). Aici verificăm progresul, inclusiv pe mobil.
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
