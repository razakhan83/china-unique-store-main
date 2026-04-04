const nextConfig = {
  allowedDevOrigins: ['192.168.1.100'],
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
    viewTransition: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default nextConfig;
