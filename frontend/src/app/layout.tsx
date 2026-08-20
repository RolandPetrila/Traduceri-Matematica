import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, STIX_Two_Text } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "@/components/monitoring/ErrorBoundary";
import { MonitoringInit } from "@/components/monitoring/MonitoringInit";

// Tipografie — self-hosted prin next/font (zero request extern, zero layout-shift).
// UI (butoane, meniuri, tot shell-ul): Atkinson Hyperlegible — proiectat de Braille
// Institute pt lizibilitate maximă + disambiguarea caracterelor (l/1/I, 0/O) → clar pe telefon.
const fontUI = Atkinson_Hyperlegible({
  subsets: ["latin", "latin-ext"], // latin-ext = diacriticele RO (ă â î ș ț)
  weight: ["400", "700"],
  variable: "--font-ui",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});
// Document + termeni matematici (foaia editor, fișe): STIX Two Text — fontul revistelor
// academice de matematică; se potrivește nativ cu formulele KaTeX (aceeași estetică LaTeX).
const fontDoc = STIX_Two_Text({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-doc",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

export const metadata: Metadata = {
  title: "Sistem Traduceri",
  description: "Traducere documente matematica cu AI — RO, SK, EN, DE",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sistem Traduceri",
  },
};

export const viewport: Viewport = {
  themeColor: "#2d5016",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro" className={`${fontUI.variable} ${fontDoc.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                // If a NEW service worker takes control, auto-reload ONCE so the
                // fresh build loads immediately — no stale shell can persist. Guard:
                // only reload when a controller already existed (an UPDATE), never on
                // first-ever install. This is what makes deploys reach every device
                // (fixes the "stuck on old version" class of bug).
                var __hadController = !!navigator.serviceWorker.controller;
                var __refreshing = false;
                navigator.serviceWorker.addEventListener('controllerchange', function() {
                  if (__refreshing || !__hadController) return;
                  __refreshing = true;
                  window.location.reload();
                });
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    reg.update();
                    setInterval(function() { reg.update(); }, 60000);
                    // A newly installed worker (while an old one controls) = update
                    // ready: tell it to activate now instead of waiting.
                    reg.addEventListener('updatefound', function() {
                      var nw = reg.installing;
                      if (!nw) return;
                      nw.addEventListener('statechange', function() {
                        if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                          nw.postMessage({ type: 'SKIP_WAITING' });
                        }
                      });
                    });
                  }).catch(function() {});
                });
              }
            `,
          }}
        />
      </head>
      <body className="chalkboard-bg min-h-screen">
        {/* Math decorations */}
        <span className="math-decoration" style={{ top: "10%", left: "5%" }}>
          {"∫ f(x)dx"}
        </span>
        <span className="math-decoration" style={{ top: "30%", right: "8%" }}>
          {"△ ABC"}
        </span>
        <span
          className="math-decoration"
          style={{ bottom: "20%", left: "12%" }}
        >
          {"π · r²"}
        </span>
        <span
          className="math-decoration"
          style={{ bottom: "40%", right: "15%" }}
        >
          {"∑ n²"}
        </span>

        <MonitoringInit />
        <ErrorBoundary>
          <div className="relative z-10">{children}</div>
        </ErrorBoundary>
      </body>
    </html>
  );
}
