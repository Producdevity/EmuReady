import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiting (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Rate limiting configuration
// TODO: experiment with different values
const RATE_LIMIT_REQUESTS = 100 // requests per window
const RATE_LIMIT_WINDOW = 3 * 60 * 1000 // 3 minutes

// Allowed origins for API access
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  'https://emuready.com',
  'https://www.emuready.com',
  'https://dev.emuready.com',
  'http://localhost:3000',
  'http://localhost:3001', // dev server backup
]

function getClientIdentifier(req: NextRequest): string {
  // Use IP from forwarded headers or fallback
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const cfConnectingIp = req.headers.get('cf-connecting-ip') // Cloudflare

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  return realIp || cfConnectingIp || 'unknown'
}

function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(identifier)

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new limit window
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    })
    return true
  }

  if (userLimit.count >= RATE_LIMIT_REQUESTS) {
    return false // Slow down boy, rate limit exceeded
  }

  userLimit.count++
  return true
}

function isValidOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')

  // Allow requests from valid origins
  if (origin && ALLOWED_ORIGINS.some((allowed) => origin.startsWith(allowed))) {
    return true
  }

  // Allow requests with valid referer
  if (
    referer &&
    ALLOWED_ORIGINS.some((allowed) => referer.startsWith(allowed))
  ) {
    return true
  }

  // Allow requests with no origin/referer (server-side, mobile apps, etc.) but check for API key
  if (!origin && !referer) {
    const apiKey = req.headers.get('x-api-key')
    const internalApiKey = process.env.INTERNAL_API_KEY
    return Boolean(internalApiKey && apiKey === internalApiKey)
  }

  return false
}

function protectTRPCAPI(req: NextRequest): NextResponse | null {
  const pathname = req.nextUrl.pathname

  // Only protect TRPC API routes
  if (!pathname.startsWith('/api/trpc/')) return null

  // Skip protection for mobile routes - Mobile app don't send origin headers
  if (pathname.startsWith('/api/trpc/mobile.')) return null

  const clientId = getClientIdentifier(req)

  // Check rate limit
  if (!checkRateLimit(clientId)) {
    console.warn(
      `Rate limit exceeded for client: ${clientId}, path: ${pathname}`,
    )
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': Math.floor(RATE_LIMIT_WINDOW / 1000).toString(),
          'X-RateLimit-Limit': RATE_LIMIT_REQUESTS.toString(),
          'X-RateLimit-Window': RATE_LIMIT_WINDOW.toString(),
        },
      },
    )
  }

  // Check origin for public API routes
  if (!isValidOrigin(req)) {
    console.warn(
      `Invalid origin for client: ${clientId}, origin: ${req.headers.get('origin')}, referer: ${req.headers.get('referer')}, path: ${pathname}`,
    )
    return NextResponse.json(
      { error: 'Access denied. Invalid origin.' },
      {
        status: 403,
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
        },
      },
    )
  }

  // Add security headers to successful requests
  const response = NextResponse.next()
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-RateLimit-Limit', RATE_LIMIT_REQUESTS.toString())
  response.headers.set('X-RateLimit-Window', RATE_LIMIT_WINDOW.toString())
  return response
}

export default clerkMiddleware((auth, req: NextRequest) => {
  const pathname = req.nextUrl.pathname

  // Apply API protection first
  const apiProtectionResponse = protectTRPCAPI(req)
  if (apiProtectionResponse) {
    return apiProtectionResponse
  }

  // Skip Clerk middleware for webhook endpoints
  if (pathname.startsWith('/api/webhooks/')) {
    console.info('Skipping Clerk middleware for webhook:', pathname)
    return
  }

  // Skip Clerk middleware for mobile API routes to prevent CORS issues
  if (pathname.startsWith('/api/mobile/')) {
    console.info('Skipping Clerk middleware for mobile API:', pathname)
    return
  }

  // Skip Clerk middleware for the mobile test endpoint (TODO: remove later)
  if (pathname === '/api/mobile/test') {
    console.info('Skipping Clerk middleware for mobile test:', pathname)
    return
  }

  return
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes, but we'll handle exclusions in the middleware function
    '/(api|trpc)(.*)',
  ],
}
