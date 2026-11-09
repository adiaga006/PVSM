/** @type {import('next').NextConfig} */
const longCache = 'public, max-age=31536000, immutable';
// app.js / theme.js được gắn ?v=<commit> khi chạy trên Vercel → cache lâu dài an toàn. Ở máy local thì luôn tải lại.
const appCache = process.env.VERCEL ? longCache : 'no-cache';

const nextConfig = {
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'same-origin' },
        ],
      },
      { source: '/vendor/:file*', headers: [{ key: 'Cache-Control', value: longCache }] },
      { source: '/app.js', headers: [{ key: 'Cache-Control', value: appCache }] },
      { source: '/theme.js', headers: [{ key: 'Cache-Control', value: appCache }] },
    ];
  },
};
export default nextConfig;
