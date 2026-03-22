import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ErrorBoundary } from "@/components/monitoring/ErrorBoundary";
import { MonitoringInit } from "@/components/monitoring/MonitoringInit";

export const metadata: Metadata = {
  title: "Sistem Traduceri",
  description: "Traducere documente matematica cu AI — RO, SK, EN",
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
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </head>
      <body className="chalkboard-bg min-h-screen">
        {/* Math decorations */}
        <span className="math-decoration" style={{ top: '10%', left: '5%' }}>
          {'\\u222B f(x)dx'}
        </span>
        <span className="math-decoration" style={{ top: '30%', right: '8%' }}>
          {'\\u25B3 ABC'}
        </span>
        <span className="math-decoration" style={{ bottom: '20%', left: '12%' }}>
          {'\\u03C0 \\u00B7 r\\u00B2'}
        </span>
        <span className="math-decoration" style={{ bottom: '40%', right: '15%' }}>
          {'\\u2211 n\\u00B2'}
        </span>

        <MonitoringInit />
        <ErrorBoundary>
          <div className="relative z-10">
            {children}
          </div>
        </ErrorBoundary>
      </body>
    </html>
  );
}
