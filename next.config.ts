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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://va.vercel-scripts.com https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://*.clerk.com https://*.clerk.accounts.dev",
              "img-src 'self' data: https://placehold.co https://*.clerk.com https://*.clerk.accounts.dev https://img.clerk.com",
              "font-src 'self' https://*.clerk.com https://*.clerk.accounts.dev data:",
              "connect-src 'self' https://*.google-analytics.com https://*.clerk.com https://*.clerk.accounts.dev wss://*.clerk.accounts.dev https://challenges.cloudflare.com https://clerk-telemetry.com", // Added clerk-telemetry.com
              "frame-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com",
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
