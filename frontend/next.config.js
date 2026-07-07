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
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' https://cdn.jsdelivr.net; connect-src ${connectSrc}; frame-src 'self' blob:; frame-ancestors 'self'`,
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
