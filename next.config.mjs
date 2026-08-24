/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost', '192.168.1.100'],
  logging: {
    browserToTerminal: true,
  },
  staticPageGenerationTimeout: 120,
  cacheComponents: true,
  cacheLife: {
    foreverish: {
      stale: 60 * 60 * 24 * 30,
      revalidate: 60 * 60 * 24 * 365,
      expire: 60 * 60 * 24 * 365 * 2,
    },
  },
  reactCompiler: true,

  experimental: {
    turbopackFileSystemCacheForDev: true,
    turbopackFileSystemCacheForBuild: true,
    cachedNavigations: true,
    appNewScrollHandler: true,
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
    // FIX: optimizePackageImports belongs inside experimental, NOT top-level
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'date-fns',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
    ],
  },

  // ── Keep heavy server-only libs out of the client bundle ─────────────────────
  serverExternalPackages: [
    'mongoose',
    'mongodb',
    'cloudinary',
    'exceljs',
    'jspdf',
    'jspdf-autotable',
    'html2canvas',
    'html-to-image',
    'sanitize-html',
    'resend',
  ],

  // ── Image Optimization ───────────────────────────────────────────────────────
  // Removed `unoptimized: true` — was bypassing ALL Next.js image optimization.
  images: {
    formats: ['image/avif', 'image/webp'],
    // Mobile-first device sizes: phones (360-428px) → tablet (768px) → desktop
    deviceSizes: [360, 428, 640, 768, 1024, 1280, 1920],
    // For fill/fixed images — product cards, thumbnails
    imageSizes: [16, 32, 64, 96, 128, 180, 256, 384],
    // Cache optimized images for 30 days
    minimumCacheTTL: 2592000,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },

  poweredByHeader: false,

  // ── HTTP Caching & Security Headers ──────────────────────────────────────────
  async headers() {
    const securityHeaders = [
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ];

    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.(png|jpg|jpeg|svg|webp|avif|ico|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
