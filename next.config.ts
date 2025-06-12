import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.rawg.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.clerk.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.clerk.accounts.dev',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.thegamesdb.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.ko-fi.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ko-fi.com',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    optimizePackageImports: [
      '@clerk/nextjs',
      '@tanstack/react-query',
      'date-fns',
      'framer-motion',
      'lucide-react',
    ],
    optimizeCss: true,
  },

  serverExternalPackages: ['@prisma/client'],

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://va.vercel-scripts.com https://*.clerk.com https://*.clerk.accounts.dev https://clerk.emuready.com https://challenges.cloudflare.com https://vercel.live https://*.vercel.live https://storage.ko-fi.com https://ko-fi.com",
              "style-src 'self' 'unsafe-inline' https://*.clerk.com https://*.clerk.accounts.dev https://clerk.emuready.com https://storage.ko-fi.com https://fonts.googleapis.com",
              "img-src 'self' data: https://placehold.co https://*.clerk.com https://*.clerk.accounts.dev https://img.clerk.com https://clerk.emuready.com https://cdn.thegamesdb.net https://www.googletagmanager.com https://*.google-analytics.com https://storage.ko-fi.com",
              "font-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://clerk.emuready.com https://fonts.gstatic.com data:",
              "connect-src 'self' https://*.google-analytics.com https://*.clerk.com https://*.clerk.accounts.dev https://clerk.emuready.com wss://*.clerk.accounts.dev wss://clerk.emuready.com https://challenges.cloudflare.com https://clerk-telemetry.com https://vercel.live https://*.vercel.live",
              "frame-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://clerk.emuready.com https://challenges.cloudflare.com https://vercel.live https://*.vercel.live https://ko-fi.com",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              'block-all-mixed-content',
              'upgrade-insecure-requests',
            ].join('; '),
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

export default nextConfig
