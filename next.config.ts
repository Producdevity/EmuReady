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
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://va.vercel-scripts.com https://*.clerk.com https://*.clerk.accounts.dev https://clerk.emuready.com https://challenges.cloudflare.com https://vercel.live https://*.vercel.live",
              "style-src 'self' 'unsafe-inline' https://*.clerk.com https://*.clerk.accounts.dev https://clerk.emuready.com",
              "img-src 'self' data: https://placehold.co https://*.clerk.com https://*.clerk.accounts.dev https://img.clerk.com https://clerk.emuready.com",
              "font-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://clerk.emuready.com data:",
              "connect-src 'self' https://*.google-analytics.com https://*.clerk.com https://*.clerk.accounts.dev https://clerk.emuready.com wss://*.clerk.accounts.dev wss://clerk.emuready.com https://challenges.cloudflare.com https://clerk-telemetry.com https://vercel.live https://*.vercel.live",
              "frame-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://clerk.emuready.com https://challenges.cloudflare.com https://vercel.live https://*.vercel.live",
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
