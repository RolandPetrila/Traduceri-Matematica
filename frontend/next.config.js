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
      // Prevent aggressive caching on HTML pages and API
      {
        source: '/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
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
  // In dev mode, proxy Python API routes to local dev_server.py (port 8000)
  // On Vercel, VERCEL env var is set — skip rewrites (vercel.json handles routing)
  async rewrites() {
    if (process.env.VERCEL) return [];
    return {
      fallback: [
        { source: '/api/translate', destination: 'http://localhost:8000/api/translate' },
        { source: '/api/convert', destination: 'http://localhost:8000/api/convert' },
        { source: '/api/health', destination: 'http://localhost:8000/api/health' },
      ],
    };
  },
};

module.exports = nextConfig;
