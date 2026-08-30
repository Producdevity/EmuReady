import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { NextFetchEvent } from 'next/server'

vi.mock('@clerk/nextjs/server', () => ({
  createRouteMatcher: () => () => false,
  clerkMiddleware:
    (handler: (auth: { protect: () => Promise<void> }, req: NextRequest) => Promise<unknown>) =>
    (req: NextRequest) =>
      handler({ protect: vi.fn(async () => undefined) }, req),
}))

async function loadProxy() {
  vi.resetModules()
  vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'production')
  vi.stubEnv('NODE_ENV', 'production')
  vi.stubEnv('PLAYWRIGHT_TEST', '')
  vi.stubEnv('DISABLE_RATE_LIMIT', 'true')
  vi.stubEnv('NEXT_PUBLIC_ALLOWED_ORIGINS', 'https://emuready.com')
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://emuready.com')

  return import('./proxy')
}

function createMobileTRPCRequest(headers: HeadersInit = {}, method = 'GET') {
  return new NextRequest('https://emuready.com/api/mobile/trpc/games.get', {
    method,
    headers,
  })
}

const fetchEvent = { waitUntil: vi.fn() } as unknown as NextFetchEvent

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('proxy mobile tRPC origin handling', () => {
  it('allows native mobile tRPC requests without browser origin metadata', async () => {
    const { proxy } = await loadProxy()

    const response = await proxy(createMobileTRPCRequest(), fetchEvent)

    expect(response.status).toBe(200)
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
  })

  it('rejects mobile tRPC requests that include an untrusted browser origin', async () => {
    const { proxy } = await loadProxy()

    const response = await proxy(
      createMobileTRPCRequest({ origin: 'https://attacker.example' }),
      fetchEvent,
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      error: 'Access denied. Invalid origin.',
    })
  })

  it('lets mobile CORS preflight reach the route handler', async () => {
    const { proxy } = await loadProxy()

    const response = await proxy(
      createMobileTRPCRequest({ origin: 'https://attacker.example' }, 'OPTIONS'),
      fetchEvent,
    )

    expect(response.status).toBe(200)
  })
})

describe('getClientIdentifier', () => {
  it('prefers cf-connecting-ip when TRUST_CF_CONNECTING_IP is true', async () => {
    vi.stubEnv('TRUST_CF_CONNECTING_IP', 'true')
    const { getClientIdentifier } = await loadProxy()

    const req = new NextRequest('https://emuready.com/x', {
      headers: {
        'cf-connecting-ip': '203.0.113.10',
        'x-forwarded-for': '198.51.100.20',
      },
    })

    expect(getClientIdentifier(req)).toBe('203.0.113.10')
  })

  it('ignores forgeable cf-connecting-ip by default and uses x-forwarded-for (Vercel-safe)', async () => {
    vi.stubEnv('TRUST_CF_CONNECTING_IP', '')
    const { getClientIdentifier } = await loadProxy()

    const req = new NextRequest('https://emuready.com/x', {
      headers: {
        'cf-connecting-ip': '203.0.113.10',
        'x-forwarded-for': '198.51.100.20, 10.0.0.1',
      },
    })

    expect(getClientIdentifier(req)).toBe('198.51.100.20')
  })

  it('falls back to x-real-ip then unknown when no trusted header is present', async () => {
    vi.stubEnv('TRUST_CF_CONNECTING_IP', '')
    const { getClientIdentifier } = await loadProxy()

    const withRealIp = new NextRequest('https://emuready.com/x', {
      headers: { 'x-real-ip': '198.51.100.99' },
    })
    expect(getClientIdentifier(withRealIp)).toBe('198.51.100.99')

    const empty = new NextRequest('https://emuready.com/x')
    expect(getClientIdentifier(empty)).toBe('unknown')
  })
})
