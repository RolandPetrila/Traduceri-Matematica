/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' https://cdn.jsdelivr.net; connect-src 'self' https://traduceri-api.onrender.com https://traduceri-matematica-7sh7.onrender.com; frame-src 'self' blob:; frame-ancestors 'none'"
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
  // Proxy Python API routes to backend service (local dev only)
  // On Render: frontend calls API directly via NEXT_PUBLIC_API_URL
  async rewrites() {
    const apiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
    return {
      fallback: [
        { source: '/api/ocr', destination: `${apiUrl}/api/ocr` },
        { source: '/api/translate-text', destination: `${apiUrl}/api/translate-text` },
        { source: '/api/translate', destination: `${apiUrl}/api/translate` },
        { source: '/api/convert', destination: `${apiUrl}/api/convert` },
        { source: '/api/health', destination: `${apiUrl}/api/health` },
        { source: '/api/deepl-usage', destination: `${apiUrl}/api/deepl-usage` },
      ],
    };
  },
};

module.exports = nextConfig;
