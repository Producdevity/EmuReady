import { type NextRequest } from 'next/server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * Only allow http and https URLs to prevent SSRF attacks
 * @param raw
 */
function isAllowedUrl(raw?: string | null): URL | null {
  if (!raw) return null
  try {
    const u = new URL(raw)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return u
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get('url')
  const url = isAllowedUrl(src)
  if (!url) return new Response('Invalid or missing url parameter', { status: 400 })

  try {
    const upstream = await fetch(url.toString(), {
      // In dev, always bypass caches to avoid stale images; in prod let CDN cache images
      cache: process.env.NODE_ENV !== 'production' ? 'no-store' : 'force-cache',
      redirect: 'follow',
      headers: {
        'User-Agent': 'EmuReadyImageProxy/1.0 (+https://emuready.com)',
      },
    })

    if (!upstream.ok || !upstream.body) {
      return new Response('Upstream fetch failed', { status: upstream.status || 502 })
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream'
    const cacheControl =
      process.env.NODE_ENV !== 'production'
        ? 'no-store, no-cache, must-revalidate'
        : 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600'

    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
        // Help common CDNs respect our intent
        'CDN-Cache-Control': cacheControl,
        'Vercel-CDN-Cache-Control': cacheControl,
      },
    })
  } catch (error) {
    logger.error('[proxy-image] Error fetching image:', error)
    return new Response('Bad Gateway', { status: 502 })
  }
}
