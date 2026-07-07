"use client";

/**
 * Editor matematic — modul izolat (Faza G).
 *
 * Editorul e un artefact standalone (vanilla HTML/JS, ~3100 linii) servit ca fisier
 * static din /public/editor/index.html. Il embed-uim intr-un iframe same-origin ca
 * sa ramana 100% functional si complet izolat de restul aplicatiei
 * (R-EXT: modul separat, fara a atinge pipeline-ul de traducere).
 *
 * Nota: iframe-ul same-origin necesita X-Frame-Options: SAMEORIGIN +
 * CSP frame-ancestors 'self' (vezi next.config.js).
 */
export default function EditorPage() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold chalk-text">
            <span className="text-chalk-yellow">&#x270F;</span> Editor Documente
            Matematic
          </h2>
          <p className="text-sm opacity-60">
            Editor A4 tip Word &mdash; 103 simboluri, 20 structuri editabile,
            214 formule (clasele V&ndash;XII).
          </p>
        </div>
        <a
          href="/editor/index.html"
          target="_blank"
          rel="noopener noreferrer"
          className="chalk-btn text-sm whitespace-nowrap"
          title="Deschide editorul intr-o fereastra separata (ecran complet)"
        >
          &#x26F6; Deschide in fereastra noua
        </a>
      </div>

      <div
        className="rounded-lg overflow-hidden border-2 border-chalk-white/20 bg-white"
        style={{ height: "calc(100vh - 230px)", minHeight: "560px" }}
      >
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
