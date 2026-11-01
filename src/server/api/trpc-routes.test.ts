import { TRPCError } from '@trpc/server'
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET as mobileGET } from '@/app/api/mobile/trpc/[trpc]/route'
import { GET as webGET } from '@/app/api/trpc/[trpc]/route'
import type * as NextServer from 'next/server'

const mocks = vi.hoisted(() => ({
  error: new Error('Provider unavailable'),
  loggerError: vi.fn(),
  connection: vi.fn(async () => {}),
}))

vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof NextServer>()),
  connection: mocks.connection,
}))
vi.mock('@/lib/logger', () => ({ logger: { error: mocks.loggerError } }))
vi.mock('@/server/api/trpc', () => ({ createAppRouterTRPCContext: () => ({}) }))
vi.mock('@/server/api/mobileContext', () => ({ createMobileTRPCFetchContext: () => ({}) }))
vi.mock('@/server/api/root', async () => {
  const trpc = (await import('@trpc/server')).initTRPC.create()
  return {
    appRouter: trpc.router({
      probe: trpc.procedure.query(() => {
        throw mocks.error
      }),
    }),
  }
})
vi.mock('@/server/api/routers/mobile', async () => {
  const trpc = (await import('@trpc/server')).initTRPC.create()
  return {
    mobileRouter: trpc.router({
      probe: trpc.procedure.query(() => {
        throw mocks.error
      }),
    }),
  }
})

beforeEach(() => {
  vi.clearAllMocks()
  mocks.error = new Error('Provider unavailable')
})

describe.each([
  { name: 'web', get: webGET, endpoint: '/api/trpc' },
  { name: 'mobile', get: mobileGET, endpoint: '/api/mobile/trpc' },
])('$name tRPC route reporting', (route) => {
  it('reports handled 500 responses through the exported GET handler', async () => {
    const response = await route.get(new NextRequest(`https://example.test${route.endpoint}/probe`))

    expect(response.status).toBe(500)
    expect(mocks.connection).toHaveBeenCalledTimes(1)
    expect(mocks.loggerError).toHaveBeenCalledExactlyOnceWith('[tRPC] Server error', mocks.error, {
      procedure: 'probe',
      code: 'INTERNAL_SERVER_ERROR',
    })
  })

  it('excludes expected 401 responses from server-error reporting', async () => {
    mocks.error = new TRPCError({ code: 'UNAUTHORIZED' })

    const response = await route.get(new NextRequest(`https://example.test${route.endpoint}/probe`))

    expect(response.status).toBe(401)
    expect(mocks.loggerError).not.toHaveBeenCalled()
  })
})
