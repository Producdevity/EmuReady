import NextBundleAnalyzer from '@next/bundle-analyzer'
import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    qualities: [75, 85, 100],
    localPatterns: [
      // Allow query parameters for proxy URLs
      { pathname: '/api/proxy-image' },
      { pathname: '/_next/**' },
      { pathname: '/placeholder/**' },
    ],
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
        hostname: 'images.igdb.com',
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

  allowedDevOrigins: ['dev.emuready.com'],

  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      '@clerk/nextjs',
      '@tanstack/react-query',
      'date-fns',
      'framer-motion',
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-popover',
      '@radix-ui/react-tooltip',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      'react-hook-form',
      'remeda',
      '@/components/ui',
      '@/components/icons',
      '@/hooks',
      '@/lib',
      '@/utils',
    ],
  },

  serverExternalPackages: ['@prisma/client', 'jsdom', 'markdown-it', 'dompurify'],

  outputFileTracingExcludes: {
    // apply to all server routes
    '/*': [
      'backups/**/*',
      'test-results/**/*',
      'playwright-report/**/*',
      'blob-report/**/*',
      'coverage/**/*',
      '**/*.sql',
      '**/*.pgdump',
      '**/*.data.sql',
      '**/*.zip',
      '**/*.trace.zip',
      '**/*.webm',
      '**/*.png',
      'tsconfig.tsbuildinfo',
      '.next/cache/**/*',
      'node_modules/**/*.md',
      'node_modules/**/*.txt',
      'node_modules/**/README*',
      'node_modules/**/CHANGELOG*',
      'node_modules/**/LICENSE*',
      'node_modules/**/*.test.*',
      'node_modules/**/*.spec.*',
      'node_modules/**/test/**/*',
      'node_modules/**/tests/**/*',
      'node_modules/**/examples/**/*',
      'node_modules/**/docs/**/*',
    ],
  },

  eslint: {
    dirs: ['src', 'tests'],
  },

  webpack: (config) => {
    config.module?.rules?.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })

    // Improve chunk splitting for better caching
    if (config.optimization) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
          },
        },
      }
    }

    return config
  },

  async headers() {
    return [
      // Static assets with hash - cache immutable
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Images and other assets - cache with revalidation
      {
        source: '/favicon/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, must-revalidate',
          },
        ],
      },
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
              "img-src 'self' data: https://placehold.co https://*.clerk.com https://*.clerk.accounts.dev https://img.clerk.com https://clerk.emuready.com https://cdn.thegamesdb.net https://images.igdb.com https://media.rawg.io https://www.googletagmanager.com https://assets.nintendo.com https://*.google-analytics.com https://storage.ko-fi.com https://vercel.com",
              "font-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://clerk.emuready.com https://fonts.gstatic.com https://fonts.googleapis.com https://vercel.live data:",
              "connect-src 'self' https://*.google-analytics.com https://www.googletagmanager.com https://api.mymemory.translated.net https://fonts.googleapis.com https://fonts.gstatic.com https://*.clerk.com https://*.clerk.accounts.dev https://clerk.emuready.com wss://*.clerk.accounts.dev wss://clerk.emuready.com https://va.vercel-scripts.com https://challenges.cloudflare.com https://storage.ko-fi.com https://clerk-telemetry.com https://vercel.live https://*.vercel.live wss://ws-us3.pusher.com https://api.github.com https://*.ingest.sentry.io https://*.ingest.us.sentry.io",
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

const withBundleAnalyzer = NextBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

export default withSentryConfig(withBundleAnalyzer(nextConfig), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: 'hexelnet',
  project: 'emuready',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
})
