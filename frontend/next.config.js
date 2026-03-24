/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // PWA headers
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json' },
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
