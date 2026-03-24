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
  // Proxy Python API routes to backend service
  // On Vercel: vercel.json handles Python functions
  // On Render/local: proxy to Python backend URL
  async rewrites() {
    if (process.env.VERCEL) return [];
    const apiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
    return {
      fallback: [
        { source: '/api/translate', destination: `${apiUrl}/api/translate` },
        { source: '/api/convert', destination: `${apiUrl}/api/convert` },
        { source: '/api/health', destination: `${apiUrl}/api/health` },
      ],
    };
  },
};

module.exports = nextConfig;
