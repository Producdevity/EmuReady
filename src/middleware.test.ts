import { NextRequest } from 'next/server'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock Clerk middleware - must use factory function
vi.mock('@clerk/nextjs/server', () => ({
  clerkMiddleware: vi.fn((callback) => callback),
}))

// Mock NextResponse - must use factory function
vi.mock('next/server', async () => {
  const actual = await vi.importActual('next/server')
  return {
    ...actual,
    NextResponse: {
      next: vi.fn(() => ({
        headers: {
          set: vi.fn(),
        },
      })),
      json: vi.fn((body, init) => ({
        status: init?.status || 200,
        headers: init?.headers || {},
        body,
      })),
    },
  }
})

describe('Middleware API Protection', () => {
  // Import middleware after mocks are set up
  let middleware: any
  let mockClerkMiddleware: any
  let mockNextResponse: any

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()

    // Reset modules to ensure fresh imports
    vi.resetModules()

    // Set up environment variables
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')
    vi.stubEnv('INTERNAL_API_KEY', 'test-api-key')

    // Import middleware and mocks after setup
    const middlewareModule = await import('./middleware')
    middleware = middlewareModule.default

    const clerkModule = await import('@clerk/nextjs/server')
    mockClerkMiddleware = clerkModule.clerkMiddleware

    const nextModule = await import('next/server')
    mockNextResponse = nextModule.NextResponse
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('TRPC Route Protection', () => {
    it('should protect TRPC routes with valid origin', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/trpc/listings.get',
        {
          headers: {
            origin: 'http://localhost:3000',
            'x-forwarded-for': '192.168.1.1',
          },
        },
      )

      const mockAuth = { user: { id: 'test-user' } }

      // Call middleware - it should call the callback function
      await middleware(mockAuth, request)

      // Verify Clerk middleware was called with our callback
      expect(mockClerkMiddleware).toHaveBeenCalled()
    })

    it('should block TRPC routes with invalid origin', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/trpc/listings.get',
        {
          headers: {
            origin: 'https://malicious-site.com',
            'x-forwarded-for': '192.168.1.1',
          },
        },
      )

      const mockAuth = { user: { id: 'test-user' } }

      // Call middleware
      await middleware(mockAuth, request)

      // Should return a 403 response
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: 'Access denied. Invalid origin.' },
        expect.objectContaining({
          status: 403,
        }),
      )
    })

    it('should allow TRPC routes with valid API key when no origin', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/trpc/listings.get',
        {
          headers: {
            'x-api-key': 'test-api-key',
            'x-forwarded-for': '192.168.1.1',
          },
        },
      )

      const mockAuth = { user: { id: 'test-user' } }

      // Call middleware
      await middleware(mockAuth, request)

      // Should allow the request through (no JSON response with error)
      expect(mockNextResponse.json).not.toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Access denied'),
        }),
        expect.anything(),
      )
    })

    it('should block TRPC routes with invalid API key', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/trpc/listings.get',
        {
          headers: {
            'x-api-key': 'wrong-key',
            'x-forwarded-for': '192.168.1.1',
          },
        },
      )

      const mockAuth = { user: { id: 'test-user' } }

      // Call middleware
      await middleware(mockAuth, request)

      // Should return a 403 response
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: 'Access denied. Invalid origin.' },
        expect.objectContaining({
          status: 403,
        }),
      )
    })
  })

  describe('Rate Limiting', () => {
    it('should allow requests under rate limit', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/trpc/listings.get',
        {
          headers: {
            origin: 'http://localhost:3000',
            'x-forwarded-for': '192.168.1.1',
          },
        },
      )

      const mockAuth = { user: { id: 'test-user' } }

      // Make multiple requests under the limit
      for (let i = 0; i < 5; i++) {
        vi.clearAllMocks()
        await middleware(mockAuth, request)

        // Should not return rate limit error
        expect(mockNextResponse.json).not.toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.stringContaining('Rate limit'),
          }),
          expect.anything(),
        )
      }
    })

    it('should block requests over rate limit', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/trpc/listings.get',
        {
          headers: {
            origin: 'http://localhost:3000',
            'x-forwarded-for': '192.168.1.100', // Different IP to avoid conflicts
          },
        },
      )

      const mockAuth = { user: { id: 'test-user' } }

      // Make requests to exceed the rate limit (100 requests)
      for (let i = 0; i < 101; i++) {
        vi.clearAllMocks()
        await middleware(mockAuth, request)
      }

      // The last request should be rate limited
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: 'Rate limit exceeded. Please try again later.' },
        expect.objectContaining({
          status: 429,
        }),
      )
    })
  })

  describe('Non-Protected Routes', () => {
    it('should not protect webhook routes', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/webhooks/clerk',
        {
          headers: {
            origin: 'https://malicious-site.com', // Invalid origin
          },
        },
      )

      const mockAuth = { user: { id: 'test-user' } }

      // Call middleware
      await middleware(mockAuth, request)

      // Should not return any protection errors
      expect(mockNextResponse.json).not.toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Access denied'),
        }),
        expect.anything(),
      )
    })

    it('should not protect mobile API routes', async () => {
      const request = new NextRequest('http://localhost:3000/api/mobile/auth', {
        headers: {
          origin: 'https://malicious-site.com', // Invalid origin
        },
      })

      const mockAuth = { user: { id: 'test-user' } }

      // Call middleware
      await middleware(mockAuth, request)

      // Should not return any protection errors
      expect(mockNextResponse.json).not.toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Access denied'),
        }),
        expect.anything(),
      )
    })

    it('should not protect regular pages', async () => {
      const request = new NextRequest('http://localhost:3000/listings')

      const mockAuth = { user: { id: 'test-user' } }

      // Call middleware
      await middleware(mockAuth, request)

      // Should not apply any API protection
      expect(mockNextResponse.json).not.toHaveBeenCalled()
    })
  })

  describe('Origin Validation', () => {
    const validOrigins = [
      'https://emuready.com',
      'https://www.emuready.com',
      'https://dev.emuready.com',
      'http://localhost:3000',
      'http://localhost:3001',
    ]

    validOrigins.forEach((origin) => {
      it(`should allow requests from ${origin}`, async () => {
        const request = new NextRequest(
          'http://localhost:3000/api/trpc/listings.get',
          {
            headers: {
              origin: origin,
              'x-forwarded-for': '192.168.1.1',
            },
          },
        )

        const mockAuth = { user: { id: 'test-user' } }

        await middleware(mockAuth, request)

        // Should not return access denied error
        expect(mockNextResponse.json).not.toHaveBeenCalledWith(
          expect.objectContaining({ error: 'Access denied. Invalid origin.' }),
          expect.anything(),
        )
      })
    })

    it('should allow requests with valid referer when no origin', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/trpc/listings.get',
        {
          headers: {
            referer: 'https://emuready.com/listings',
            'x-forwarded-for': '192.168.1.1',
          },
        },
      )

      const mockAuth = { user: { id: 'test-user' } }

      await middleware(mockAuth, request)

      // Should not return access denied error
      expect(mockNextResponse.json).not.toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Access denied. Invalid origin.' }),
        expect.anything(),
      )
    })
  })

  describe('Security Headers', () => {
    it('should set security headers on successful requests', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/trpc/listings.get',
        {
          headers: {
            origin: 'http://localhost:3000',
            'x-forwarded-for': '192.168.1.1',
          },
        },
      )

      const mockAuth = { user: { id: 'test-user' } }
      const mockHeaderSet = vi.fn()

      // Mock the response with headers
      mockNextResponse.next.mockReturnValue({
        headers: { set: mockHeaderSet },
      })

      await middleware(mockAuth, request)

      // Should set security headers
      expect(mockHeaderSet).toHaveBeenCalledWith(
        'X-Content-Type-Options',
        'nosniff',
      )
      expect(mockHeaderSet).toHaveBeenCalledWith('X-Frame-Options', 'DENY')
      expect(mockHeaderSet).toHaveBeenCalledWith('X-RateLimit-Limit', '100')
      expect(mockHeaderSet).toHaveBeenCalledWith('X-RateLimit-Window', '180000')
    })
  })
})
