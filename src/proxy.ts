import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getAllowedOrigins, getOriginFromUrl, isAllowedRequestOrigin } from '@/lib/cors'
import { env } from '@/lib/env'
import { ms } from '@/utils/time'
import type { NextRequest, NextFetchEvent } from 'next/server'

// Process-local rate limiting only; counts are not shared across server instances.
// TODO: For production abuse control, prefer provider/WAF rate limits before traffic reaches Next.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const IS_AUTOMATED_TEST_ENVIRONMENT =
  env.APP_ENV === 'test' || env.IS_TEST_BUILD || process.env.PLAYWRIGHT_TEST === 'true'
const IS_LOCAL_DEVELOPMENT_ENVIRONMENT = env.APP_ENV === 'local' || env.IS_DEVELOPMENT_BUILD
const RATE_LIMIT_REQUESTS = IS_AUTOMATED_TEST_ENVIRONMENT ? 10000 : 100
const RATE_LIMIT_WINDOW = ms.minutes(3)
const RATE_LIMIT_CLEANUP_SAMPLE_RATE = 0.01
const DEV_NO_STORE_HOSTS = new Set(['dev.emuready.com'])
const LOCAL_RATE_LIMIT_BYPASS_IDENTIFIERS = new Set(['::1', '127.0.0.1', 'localhost', 'unknown'])

function applyDevNoStoreHeader<T extends NextResponse | Response>(
  response: T,
  req: NextRequest,
): T {
  const host = req.headers.get('host')
  if (!host) return response

  const hostname = host.split(':')[0]
  if (!DEV_NO_STORE_HOSTS.has(hostname)) return response

  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  return response
}

export function getClientIdentifier(req: NextRequest): string {
  // Prefer cf-connecting-ip only when the origin is reachable exclusively
  // through Cloudflare, signaled by TRUST_CF_CONNECTING_IP=true. On deployments
  // without that restriction (e.g. Vercel) the header is client-settable and
  // forgeable, so the default order is x-forwarded-for (populated by the
  // platform) first.
  if (process.env.TRUST_CF_CONNECTING_IP === 'true') {
    const cfConnectingIp = req.headers.get('cf-connecting-ip')
    if (cfConnectingIp) return cfConnectingIp.trim()
  }

  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()

  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  return 'unknown'
}

function shouldBypassRateLimit(identifier: string): boolean {
  if (process.env.DISABLE_RATE_LIMIT === 'true') return true

  if (!IS_AUTOMATED_TEST_ENVIRONMENT && !IS_LOCAL_DEVELOPMENT_ENVIRONMENT) return false

  return LOCAL_RATE_LIMIT_BYPASS_IDENTIFIERS.has(identifier)
}

function checkRateLimit(identifier: string): boolean {
  if (shouldBypassRateLimit(identifier)) return true

  const now = Date.now()

  if (Math.random() < RATE_LIMIT_CLEANUP_SAMPLE_RATE) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) rateLimitMap.delete(key)
    }
  }

  const userLimit = rateLimitMap.get(identifier)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    })
    return true
  }

  if (userLimit.count >= RATE_LIMIT_REQUESTS) return false

  userLimit.count++
  return true
}

function hasRequestOriginMetadata(req: NextRequest): boolean {
  return Boolean(req.headers.get('origin') || req.headers.get('referer'))
}

function isValidOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')

  const allowedOrigins = getAllowedOrigins()

  if (isSameOriginSource(req, origin) || isSameOriginSource(req, referer)) {
    return true
  }

  if (isAllowedRequestOrigin({ allowedOrigins, source: origin })) {
    return true
  }

  if (isAllowedRequestOrigin({ allowedOrigins, source: referer })) {
    return true
  }

  if (!origin && !referer) {
    const apiKey = req.headers.get('x-api-key')
    const internalApiKey = process.env.INTERNAL_API_KEY
    return Boolean(internalApiKey && apiKey === internalApiKey)
  }

  return false
}

function isMobileTRPCPath(pathname: string): boolean {
  return pathname.startsWith('/api/mobile/trpc/') || pathname.startsWith('/api/trpc/mobile.')
}

function isProtectedTRPCPath(pathname: string): boolean {
  return pathname.startsWith('/api/trpc/') || pathname.startsWith('/api/mobile/trpc/')
}

function isSameOriginSource(req: NextRequest, source: string | null): boolean {
  const sourceOrigin = getOriginFromUrl(source ?? '')
  if (!sourceOrigin) return false

  const host = req.headers.get('host')
  if (!host) return false

  return sourceOrigin === `${req.nextUrl.protocol}//${host}`
}

function protectTRPCAPI(req: NextRequest): NextResponse | null {
  const pathname = req.nextUrl.pathname
  const isMobileTRPC = isMobileTRPCPath(pathname)

  if (!isProtectedTRPCPath(pathname)) return null

  if (isMobileTRPC && req.method === 'OPTIONS') return null

  const clientId = getClientIdentifier(req)

  const skipRateLimit = shouldBypassRateLimit(clientId)

  if (!skipRateLimit && !checkRateLimit(clientId)) {
    console.warn(`Rate limit exceeded for client: ${clientId}, path: ${pathname}`)
    return applyDevNoStoreHeader(
      NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.floor(RATE_LIMIT_WINDOW / 1000).toString(),
            'X-RateLimit-Limit': RATE_LIMIT_REQUESTS.toString(),
            'X-RateLimit-Window': RATE_LIMIT_WINDOW.toString(),
          },
        },
      ),
      req,
    )
  }

  const hasInvalidOrigin =
    !IS_AUTOMATED_TEST_ENVIRONMENT &&
    (isMobileTRPC ? hasRequestOriginMetadata(req) && !isValidOrigin(req) : !isValidOrigin(req))

  if (hasInvalidOrigin) {
    console.warn(
      `Invalid origin for client: ${clientId}, origin: ${req.headers.get('origin')}, referer: ${req.headers.get('referer')}, path: ${pathname}`,
    )
    return applyDevNoStoreHeader(
      NextResponse.json(
        { error: 'Access denied. Invalid origin.' },
        {
          status: 403,
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
          },
        },
      ),
      req,
    )
  }

  const response = applyDevNoStoreHeader(NextResponse.next(), req)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-RateLimit-Limit', RATE_LIMIT_REQUESTS.toString())
  response.headers.set('X-RateLimit-Window', RATE_LIMIT_WINDOW.toString())
  return response
}

const isAdminRoute = createRouteMatcher(['/admin(.*)'])

const handleClerkAuth = clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req)) {
    await auth.protect()
  }

  const apiProtectionResponse = protectTRPCAPI(req)
  if (apiProtectionResponse) return apiProtectionResponse
  return
})

export async function proxy(req: NextRequest, evt: NextFetchEvent) {
  const pathname = req.nextUrl.pathname

  if (pathname === '/api/mobile/auth') {
    const response = await handleClerkAuth(req, evt)
    if (!response) return applyDevNoStoreHeader(NextResponse.next(), req)
    return applyDevNoStoreHeader(response, req)
  }

  if (pathname.startsWith('/api/mobile/')) {
    const apiProtectionResponse = protectTRPCAPI(req)
    if (apiProtectionResponse) return apiProtectionResponse
    return applyDevNoStoreHeader(NextResponse.next(), req)
  }

  if (pathname.startsWith('/api/webhooks/')) {
    return applyDevNoStoreHeader(NextResponse.next(), req)
  }

  const response = await handleClerkAuth(req, evt)
  if (!response) {
    return applyDevNoStoreHeader(NextResponse.next(), req)
  }
  return applyDevNoStoreHeader(response, req)
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
