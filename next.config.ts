import type { NextConfig } from 'next'

// TODO: this isn't maintainable, decide if we want to support urls for images or only local images
const urls = [
  new URL('https://placehold.co/**'),
  new URL('https://shared.cloudflare.steamstatic.com/**'),
  new URL('https://cdn.cloudflare.steamstatic.com/**'),
  new URL('https://media.steampowered.com/**'),
  new URL('https://images.igdb.com/**'),
  new URL('https://static-cdn.jtvnw.net/**'),
  new URL('https://assets.nintendo.com/**'),
  new URL('https://nintendo.com/**'),
  new URL('https://image.api.playstation.com/**'),
  new URL('https://store.playstation.com/**'),
  new URL('https://compass-ssl.xbox.com/**'),
  new URL('https://www.xbox.com/**'),
  new URL('https://media.rockstargames.com/**'),
  new URL('https://static.bandainamcoent.eu/**'),
  new URL('https://cdn.mobygames.com/**'),
  new URL('https://upload.wikimedia.org/**'),
]

const remotePatterns = urls.map(
  (url): URL => ({ ...url, protocol: url.protocol.replace(':', '') }),
)

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns,
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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline'", // Needed for styled-components
              "img-src 'self' data: https://placehold.co",
              "font-src 'self'",
              "connect-src 'self' https://*.google-analytics.com",
              "connect-src 'self'",
              "frame-src 'self'",
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
            key: 'X-Frame-Options',
            value: 'DENY',
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
