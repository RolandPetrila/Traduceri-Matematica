/** @type {import('next').NextConfig} */
// Build connect-src from env so CSP follows the deployed API + Supabase domains.
// On Vercel set NEXT_PUBLIC_API_URL (Python API project) and NEXT_PUBLIC_SUPABASE_URL.
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const connectSrc = ["'self'", apiUrl, supabaseUrl, "https://*.supabase.co"]
  .filter(Boolean)
  .join(" ");

const nextConfig = {
  reactStrictMode: true,
  // NU seta outputFileTracingRoot la părinte (încercat 2026-08-07, revert imediat):
  // rezolvă warning-ul cosmetic de workspace-root LOCAL, dar rupe deploy-ul real pe
  // Vercel (ENOENT .next/path0/path0/routes-manifest.json — Root Directory-ul
  // proiectului `traduceri-frontend` e deja `frontend/`, suprascrierea intră în
  // conflict cu rezolvarea de căi a build-ului Vercel). Warning-ul rămâne, inofensiv.
  // Expose the Vercel deploy commit SHA to the client (VersionBadge). Vercel sets
  // VERCEL_GIT_COMMIT_SHA at build time; Next inlines NEXT_PUBLIC_* into the bundle.
  env: {
    NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA || "",
  },
  // Lint does NOT run during `next build` (a style nit never blocks a deploy).
  // ⚠️ HONEST (S8, verificat 2026-08-01): NU există CI/pre-push hook — `.git/hooks`
  // are doar `*.sample`, fără `.husky`, fără `.github/workflows`; iar `npm run lint`
  // are 12 erori pre-existente (unescaped-entities + no-explicit-any în dictare).
  // Lint = pas MANUAL/advisory (`npm run lint`). Gate-ul REAL impus per-schimbare =
  // `tsc --noEmit` + `jest` + `next build` (vezi PLAN_MASTER §10). Un CI care rulează
  // tsc+jest+lint = backlog (cere întâi curățarea celor 12 erori).
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: "/manifest.json",
        headers: [{ key: "Content-Type", value: "application/manifest+json" }],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
      },
      {
        // Global CSP — aplicat pretutindeni. Excepția pt /asistent/ (relaxată,
        // pt CDN-urile iframe-ului vechi) a fost eliminată odată cu modulul
        // (2026-08-07, /improve #16) — /asistent + public/asistent nu mai există.
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob:; font-src 'self' https://cdn.jsdelivr.net https://fonts.gstatic.com; connect-src ${connectSrc}; frame-src 'self' blob:; frame-ancestors 'self'`,
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
  // Proxy Python API routes to backend service (local dev only).
  // On Vercel: frontend calls the API project directly via NEXT_PUBLIC_API_URL
  // (absolute URL), so these rewrites are a local-dev fallback only.
  // Note: /api/logs is a Next.js route (Supabase forwarder) — intentionally NOT rewritten.
  async rewrites() {
    const apiUrl = process.env.PYTHON_API_URL || "http://localhost:8000";
    return {
      fallback: [
        { source: "/api/ocr", destination: `${apiUrl}/api/ocr` },
        {
          source: "/api/translate-text",
          destination: `${apiUrl}/api/translate-text`,
        },
        { source: "/api/translate", destination: `${apiUrl}/api/translate` },
        { source: "/api/convert", destination: `${apiUrl}/api/convert` },
        { source: "/api/health", destination: `${apiUrl}/api/health` },
        {
          source: "/api/deepl-usage",
          destination: `${apiUrl}/api/deepl-usage`,
        },
        {
          source: "/api/gemini-usage",
          destination: `${apiUrl}/api/gemini-usage`,
        },
      ],
    };
  },
};

module.exports = nextConfig;
