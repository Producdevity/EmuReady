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
        hostname: 'assets.nintendo.com',
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

  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV !== 'production',
  },

  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  serverExternalPackages: ['@prisma/client'],

  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })
    return config
  },

  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  async headers() {
    return [
      {
        source: '/api/mobile/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, x-trpc-source',
          },
          {
            key: 'Access-Control-Expose-Headers',
            value: 'x-trpc-source',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://static.cloudflareinsights.com https://va.vercel-scripts.com https://*.clerk.com https://*.clerk.accounts.dev https://clerk.emuready.com https://challenges.cloudflare.com https://vercel.live https://*.vercel.live https://storage.ko-fi.com https://ko-fi.com https://unpkg.com",
              "style-src 'self' 'unsafe-inline' https://*.clerk.com https://*.clerk.accounts.dev https://clerk.emuready.com https://storage.ko-fi.com https://fonts.googleapis.com https://unpkg.com",
              "img-src 'self' data: https://placehold.co https://*.clerk.com https://*.clerk.accounts.dev https://img.clerk.com https://clerk.emuready.com https://cdn.thegamesdb.net https://media.rawg.io https://www.googletagmanager.com https://assets.nintendo.com https://*.google-analytics.com https://storage.ko-fi.com https://vercel.com",
              "font-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://clerk.emuready.com https://fonts.gstatic.com https://fonts.googleapis.com https://vercel.live data:",
              "connect-src 'self' https://*.google-analytics.com https://www.googletagmanager.com https://api.mymemory.translated.net https://fonts.googleapis.com https://fonts.gstatic.com https://*.clerk.com https://*.clerk.accounts.dev https://clerk.emuready.com wss://*.clerk.accounts.dev wss://clerk.emuready.com https://va.vercel-scripts.com https://challenges.cloudflare.com https://clerk-telemetry.com https://storage.ko-fi.com https://vercel.live https://*.vercel.live wss://ws-us3.pusher.com",
              "frame-src 'self' blob: https://*.clerk.com https://*.clerk.accounts.dev https://clerk.emuready.com https://challenges.cloudflare.com https://vercel.live https://*.vercel.live https://ko-fi.com",
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
