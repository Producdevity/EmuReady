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
  'https://eden-emu.dev', // Eden website
  'https://eden-emulator-github-io.vercel.app', // Eden staging website
]

function getClientIdentifier(req: NextRequest): string {
  // Use IP from forwarded headers or fallback
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const cfConnectingIp = req.headers.get('cf-connecting-ip') // Cloudflare

  if (forwarded) return forwarded.split(',')[0].trim()

  return realIp || cfConnectingIp || 'unknown'
}

function checkRateLimit(identifier: string): boolean {
  const now = Date.now()

  // Clean up expired entries to prevent memory leaks
  // Only clean every 100 requests to avoid performance impact
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

  // Helper function to check if a URL exactly matches an allowed origin
  const isExactOriginMatch = (url: string): boolean => {
    try {
      const urlObj = new URL(url)
      const baseUrl = `${urlObj.protocol}//${urlObj.host}`
      return ALLOWED_ORIGINS.includes(baseUrl)
    } catch {
      // Invalid URL, check for exact string match
      return ALLOWED_ORIGINS.includes(url)
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
  if (apiProtectionResponse) return apiProtectionResponse

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
