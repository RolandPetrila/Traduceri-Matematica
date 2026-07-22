"use client";

/**
 * Asistent Text AI — modul izolat (Faza G).
 *
 * Asistentul e o PWA standalone matura (vanilla HTML/JS, ~3600 linii) servita ca
 * fisier static din /public/asistent/index.html, embedata same-origin.
 *
 * Cheile AI stau DOAR server-side in ruta Next `pages/api/proxy.js` (same-origin
 * cu iframe-ul). Dictarea vocala are nevoie de microfon → iframe-ul cere
 * `allow="microphone"` (Permissions-Policy pt /asistent e permisiv in next.config.js).
 *
 * Pe mobil: antet MINIMAL + iframe pe cat mai mult din ecran (dvh), ca modulul sa
 * aiba spatiu maxim (la fel ca Editor).
 */
export default function AsistentPage() {
  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base sm:text-2xl font-bold chalk-text truncate">
            <span className="text-chalk-yellow">&#x1F916;</span> Asistent{" "}
            <span className="hidden sm:inline">Text AI</span>
          </h2>
          <p className="hidden sm:block text-sm opacity-60">
            Dictare vocala + procesare AI (corectura, rezumat, traducere, OCR,
            deep research) &mdash; multi-provider.
          </p>
        </div>
        <a
          href="/asistent/index.html"
          target="_blank"
          rel="noopener noreferrer"
          className="chalk-btn text-xs sm:text-sm whitespace-nowrap shrink-0"
          title="Deschide asistentul pe tot ecranul (fereastră separată)"
        >
          &#x26F6;{" "}
          <span className="hidden sm:inline">Deschide in fereastra noua</span>
          <span className="sm:hidden">Tot ecranul</span>
        </a>
      </div>

      <div className="rounded-lg overflow-hidden border-2 border-chalk-white/20 bg-white h-[calc(100dvh-150px)] sm:h-[calc(100vh-230px)] min-h-[420px] sm:min-h-[560px]">
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
