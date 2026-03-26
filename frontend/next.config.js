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
        { source: '/api/translate-text', destination: `${apiUrl}/api/translate-text` },
        { source: '/api/translate', destination: `${apiUrl}/api/translate` },
        { source: '/api/convert', destination: `${apiUrl}/api/convert` },
        { source: '/api/health', destination: `${apiUrl}/api/health` },
      ],
    };
  },
};

module.exports = nextConfig;
