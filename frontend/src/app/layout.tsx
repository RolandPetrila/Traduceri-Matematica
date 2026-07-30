import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ErrorBoundary } from "@/components/monitoring/ErrorBoundary";
import { MonitoringInit } from "@/components/monitoring/MonitoringInit";

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
    <html lang="ro">
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
