"use client";

/**
 * Editor matematic — modul izolat (Faza G). Wrapper subțire peste iframe-ul
 * standalone (frontend/public/editor/index.html), embedat same-origin.
 *
 * Pe mobil: antet MINIMAL (doar titlu scurt + buton „tot ecranul") și iframe-ul
 * ocupă cât mai mult din ecran (dvh — ține cont de barele browserului), ca foaia
 * de scris să aibă spațiu maxim. Layout-ul intern al editorului (toolbar → panou
 * de jos on-demand) e în public/editor/index.html.
 */
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
            Editor A4 tip Word &mdash; 103 simboluri, 20 structuri editabile,
            214 formule (clasele V&ndash;XII).
          </p>
        </div>
        <a
          href="/editor/index.html"
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

      <div className="rounded-lg overflow-hidden border-2 border-chalk-white/20 bg-white h-[calc(100dvh-150px)] sm:h-[calc(100vh-230px)] min-h-[420px] sm:min-h-[560px]">
        <iframe
          src="/editor/index.html"
          title="Editor Documente Matematic"
          className="block w-full h-full"
          style={{ border: "none" }}
        />
      </div>
    </div>
  );
}
