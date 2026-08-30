import NextBundleAnalyzer from '@next/bundle-analyzer'
import { withSentryConfig } from '@sentry/nextjs'
import { NEXT_IMAGE_REMOTE_PATTERNS } from '@config/image-hosts'
import type { NextConfig } from 'next'
import type { Configuration as WebpackConfiguration } from 'webpack'

type Header = Awaited<ReturnType<NonNullable<NextConfig['headers']>>>[number]

const isVercelBuild = process.env.VERCEL === '1'
const isSentryEnabled = process.env.NEXT_PUBLIC_ENABLE_SENTRY === 'true'
const nextBuildId = process.env.NEXT_BUILD_ID

const contentSecurityPolicyDirectives = [
  {
    name: 'default-src',
    sources: ["'self'"],
  },
  {
    name: 'script-src',
    sources: [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      'https://www.googletagmanager.com',
      'https://static.cloudflareinsights.com',
      'https://*.clerk.com',
      'https://*.clerk.accounts.dev',
      'https://clerk.emuready.com',
      'https://challenges.cloudflare.com',
      'https://vercel.live',
      'https://*.vercel.live',
      'https://storage.ko-fi.com',
      'https://ko-fi.com',
      'https://unpkg.com',
    ],
  },
  {
    name: 'style-src',
    sources: [
      "'self'",
      "'unsafe-inline'",
      'https://*.clerk.com',
      'https://*.clerk.accounts.dev',
      'https://clerk.emuready.com',
      'https://storage.ko-fi.com',
      'https://fonts.googleapis.com',
      'https://unpkg.com',
    ],
  },
  {
    name: 'img-src',
    sources: ["'self'", 'data:', 'https:'],
  },
  {
    name: 'font-src',
    sources: [
      "'self'",
      'https://*.clerk.com',
      'https://*.clerk.accounts.dev',
      'https://clerk.emuready.com',
      'https://fonts.gstatic.com',
      'https://fonts.googleapis.com',
      'https://vercel.live',
      'data:',
    ],
  },
  {
    name: 'connect-src',
    sources: [
      "'self'",
      'https://*.google-analytics.com',
      'https://www.googletagmanager.com',
      'https://api.mymemory.translated.net',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://*.clerk.com',
      'https://*.clerk.accounts.dev',
      'https://clerk.emuready.com',
      'wss://*.clerk.accounts.dev',
      'wss://clerk.emuready.com',
      'https://challenges.cloudflare.com',
      'https://storage.ko-fi.com',
      'https://clerk-telemetry.com',
      'https://vercel.live',
      'https://*.vercel.live',
      'wss://ws-us3.pusher.com',
      'https://api.github.com',
      'https://*.ingest.sentry.io',
      'https://*.ingest.us.sentry.io',
      'https://*.r2.cloudflarestorage.com',
      'https://cdn.emuready.com',
      'https://retrocatalog.com',
    ],
  },
  {
    name: 'frame-src',
    sources: [
      "'self'",
      'blob:',
      'https://*.clerk.com',
      'https://*.clerk.accounts.dev',
      'https://clerk.emuready.com',
      'https://challenges.cloudflare.com',
      'https://vercel.live',
      'https://*.vercel.live',
      'https://ko-fi.com',
    ],
  },
  {
    name: 'worker-src',
    sources: ["'self'", 'blob:'],
  },
  {
    name: 'object-src',
    sources: ["'none'"],
  },
  {
    name: 'base-uri',
    sources: ["'self'"],
  },
  {
    name: 'form-action',
    sources: ["'self'"],
  },
  {
    name: 'frame-ancestors',
    sources: ["'none'"],
  },
  {
    name: 'block-all-mixed-content',
    sources: [],
  },
  {
    name: 'upgrade-insecure-requests',
    sources: [],
  },
]

function formatContentSecurityPolicyDirective(directive: {
  name: string
  sources: string[]
}): string {
  return [directive.name, ...directive.sources].join(' ')
}

function createContentSecurityPolicy(): string {
  return contentSecurityPolicyDirectives.map(formatContentSecurityPolicyDirective).join('; ')
}

const nextConfig: NextConfig = {
  output: 'standalone',

  // Keep build identity stable and protect clients from version skew while
  // Coolify briefly overlaps the old and new containers during deployment.
  ...(nextBuildId ? { deploymentId: nextBuildId, generateBuildId: () => nextBuildId } : {}),

  images: {
    unoptimized: process.env.NEXT_IMAGE_UNOPTIMIZED === 'true',
    qualities: [50, 75, 85, 100],
    maximumRedirects: 0,
    maximumResponseBody: 5_000_000,
    localPatterns: [
      { pathname: '/_next/**' },
      { pathname: '/placeholder/**' },
      { pathname: '/assets/android-app/**' },
      { pathname: '/uploads/**' },
    ],
    remotePatterns: NEXT_IMAGE_REMOTE_PATTERNS,
  },

  allowedDevOrigins: ['dev.emuready.com', '127.0.0.1'],

  cacheComponents: true,

  cacheLife: {
    'seo-record': {
      stale: 300,
      revalidate: 3600,
      expire: 86400,
    },
    'seo-report': {
      stale: 300,
      revalidate: 1800,
      expire: 43200,
    },
    'seo-sitemap': {
      stale: 300,
      revalidate: 21600,
      expire: 172800,
    },
    'seo-miss': {
      stale: 30,
      revalidate: 60,
      expire: 300,
    },
  },

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

  transpilePackages: ['import-in-the-middle', 'require-in-the-middle'],

  serverExternalPackages: ['@prisma/client', 'jsdom', 'markdown-it', 'dompurify'],

  outputFileTracingIncludes: {
    '/*': ['docs/**/*.md', 'prisma/generated/client/**'],
  },

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

  webpack: (config: WebpackConfiguration) => {
    config.module?.rules?.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })

    return config
  },

  async headers() {
    const isProduction = process.env.NODE_ENV === 'production'
    const headers: Header[] = [
      {
        source: '/sw.js',
        headers: [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' }],
      },
      // Images and other assets - cache with revalidation
      {
        source: '/favicon/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, must-revalidate' }],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: createContentSecurityPolicy(),
          },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]

    // In dev disable HTML caching to avoid stale content via proxies
    if (!isProduction) {
      headers.push({
        source: '/:path*',
        has: [{ type: 'header', key: 'accept', value: '.*text/html.*' }],
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      })
    }

    return headers
  },
}

const withBundleAnalyzer = NextBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const analyzedConfig = withBundleAnalyzer(nextConfig)

const sentryBuildOptions = {
  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/build/

  org: 'hexelnet',
  project: 'emuready',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  sourcemaps: {
    disable: !isVercelBuild,
  },

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  bundleSizeOptimizations: {
    excludeDebugStatements: true,
  },

  telemetry: false,
}

export default isSentryEnabled
  ? withSentryConfig(analyzedConfig, sentryBuildOptions)
  : analyzedConfig
