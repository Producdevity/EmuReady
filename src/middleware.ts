import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getAllowedOrigins } from '@/lib/cors'
import { ms } from '@/utils/time'
import type { NextRequest, NextFetchEvent } from 'next/server'

// In-memory rate limiting with automatic cleanup
// TODO: For distributed deployments, consider Redis or database-backed rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Rate limiting configuration
const RATE_LIMIT_REQUESTS = process.env.NODE_ENV === 'test' ? 10000 : 100 // Much higher limit for tests
const RATE_LIMIT_WINDOW = ms.minutes(3)
const DEV_NO_STORE_HOSTS = new Set(['dev.emuready.com'])

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

function getClientIdentifier(req: NextRequest): string {
  // Use IP from forwarded headers or fallback
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const cfConnectingIp = req.headers.get('cf-connecting-ip') // Cloudflare

  if (forwarded) return forwarded.split(',')[0].trim()

  return realIp || cfConnectingIp || 'unknown'
}

function checkRateLimit(identifier: string): boolean {
  // Skip rate limiting if explicitly disabled (for E2E tests)
  if (process.env.DISABLE_RATE_LIMIT === 'true') {
    return true
  }

  // Skip rate limiting for localhost in test/development environments
  if (
    (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') &&
    (identifier === '::1' ||
      identifier === '127.0.0.1' ||
      identifier === 'localhost' ||
      identifier === 'unknown')
  ) {
    return true
  }

  const now = Date.now()

  // Clean up expired entries to prevent memory leaks
  // Only clean every 100-ish requests to avoid performance impact
  if (Math.random() < 0.01) {
    // 1% chance per request
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) rateLimitMap.delete(key)
    }
  }

  const userLimit = rateLimitMap.get(identifier)

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new limit window
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    })
    return true
  }
  // Slow down boy, rate limit exceeded
  if (userLimit.count >= RATE_LIMIT_REQUESTS) return false

  userLimit.count++
  return true
}

function isValidOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')

  // Get the centralized allowed origins
  const allowedOrigins = getAllowedOrigins()

  // Helper function to check if a URL exactly matches an allowed origin
  const isExactOriginMatch = (url: string): boolean => {
    try {
      const urlObj = new URL(url)
      const baseUrl = `${urlObj.protocol}//${urlObj.host}`
      return allowedOrigins.includes(baseUrl)
    } catch {
      // Invalid URL, check for exact string match
      return allowedOrigins.includes(url)
    }
  }

  // Allow requests from valid origins (exact match)
  if (origin && isExactOriginMatch(origin)) return true

  // Allow requests with valid referer (exact match)
  if (referer && isExactOriginMatch(referer)) return true

  // Allow requests with no origin/referer (server-side, mobile apps, etc.) but check for the API key
  if (!origin && !referer) {
    const apiKey = req.headers.get('x-api-key')
    const internalApiKey = process.env.INTERNAL_API_KEY
    return Boolean(internalApiKey && apiKey === internalApiKey)
  }

  return false
}

function protectTRPCAPI(req: NextRequest): NextResponse | null {
  const pathname = req.nextUrl.pathname

  // Skip protection for mobile routes - they have their own CORS handling
  if (pathname.startsWith('/api/mobile/trpc/')) return null

  // Only protect TRPC API routes
  if (!pathname.startsWith('/api/trpc/')) return null

  // Skip protection for mobile procedures in the main tRPC router
  if (pathname.startsWith('/api/trpc/mobile.')) return null

  const clientId = getClientIdentifier(req)

  // Check rate limit (skip if disabled or in test/dev environment for localhost)
  const skipRateLimit =
    process.env.DISABLE_RATE_LIMIT === 'true' ||
    ((process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') &&
      (clientId === '::1' ||
        clientId === '127.0.0.1' ||
        clientId === 'localhost' ||
        clientId === 'unknown'))

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

  // Check origin for public API routes (skip in test environment)
  if (process.env.NODE_ENV !== 'test' && !isValidOrigin(req)) {
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

  // Add security headers to successful requests
  const response = applyDevNoStoreHeader(NextResponse.next(), req)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-RateLimit-Limit', RATE_LIMIT_REQUESTS.toString())
  response.headers.set('X-RateLimit-Window', RATE_LIMIT_WINDOW.toString())
  return response
}

const handleClerkAuth = clerkMiddleware((auth, req) => {
  const apiProtectionResponse = protectTRPCAPI(req)
  if (apiProtectionResponse) return apiProtectionResponse
  return
})

export default async function middleware(req: NextRequest, evt: NextFetchEvent) {
  const pathname = req.nextUrl.pathname

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
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
