/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost', '192.168.1.100'],
  logging: {
    browserToTerminal: true,
  },
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

  // ── Static Asset Cache Headers ───────────────────────────────────────────────
  // FIX: Next.js uses path-to-regexp syntax — no capturing groups (\.) allowed.
  // Use simple path prefixes instead of extension-matching regex.
  async headers() {
    return [
      {
        // Cache all Next.js static chunks for 1 year (content-hashed filenames)
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache Next.js optimized images for 30 days
        source: '/_next/image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
