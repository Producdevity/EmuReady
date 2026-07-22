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
