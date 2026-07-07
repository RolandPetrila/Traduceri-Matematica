"use client";

/**
 * Asistent Text AI — modul izolat (Faza G).
 *
 * Asistentul e o PWA standalone matura (vanilla HTML/JS, ~3600 linii) servita ca
 * fisier static din /public/asistent/index.html. O embed-uim intr-un iframe
 * same-origin ca sa ramana 100% functionala si izolata de restul aplicatiei
 * (R-EXT: modul separat, fara a atinge pipeline-ul de traducere).
 *
 * Cheile AI stau DOAR server-side in ruta Next `pages/api/proxy.js` (same-origin
 * cu iframe-ul). Dictarea vocala are nevoie de microfon → iframe-ul cere
 * `allow="microphone"` (Permissions-Policy pt /asistent e permisiv in next.config.js).
 * CSP-ul pentru /asistent e relaxat separat (CDN-uri Tailwind/marked/Tesseract) —
 * vezi blocul dedicat din next.config.js.
 */
export default function AsistentPage() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold chalk-text">
            <span className="text-chalk-yellow">&#x1F916;</span> Asistent Text
            AI
          </h2>
          <p className="text-sm opacity-60">
            Dictare vocala + procesare AI (corectura, rezumat, traducere, OCR,
            deep research) &mdash; multi-provider.
          </p>
        </div>
        <a
          href="/asistent/index.html"
          target="_blank"
          rel="noopener noreferrer"
          className="chalk-btn text-sm whitespace-nowrap"
          title="Deschide asistentul intr-o fereastra separata (ecran complet)"
        >
          &#x26F6; Deschide in fereastra noua
        </a>
        <a
          href="/"
          className="chalk-btn text-sm whitespace-nowrap"
          title="Inapoi la aplicatie (Traduceri / Convertor)"
        >
          &#x2190; Inapoi la aplicatie
        </a>
      </div>

      <div
        className="rounded-lg overflow-hidden border-2 border-chalk-white/20 bg-white"
        style={{ height: "calc(100vh - 230px)", minHeight: "560px" }}
      >
        <iframe
          src="/asistent/index.html"
          title="Asistent Text AI"
          className="block w-full h-full"
          style={{ border: "none" }}
          allow="microphone; clipboard-write"
        />
      </div>
    </div>
  );
}
