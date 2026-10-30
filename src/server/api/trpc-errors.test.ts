import { initTRPC, TRPCError } from '@trpc/server'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { reportTRPCError } from './trpc-errors'

const mocks = vi.hoisted(() => ({ error: vi.fn() }))
vi.mock('@/lib/logger', () => ({ logger: { error: mocks.error } }))

const trpc = initTRPC.create()
const inputSchema = z.object({ receipt: z.string() })

async function requestFailure(error: Error) {
  const router = trpc.router({
    probe: trpc.procedure.input(inputSchema).query(() => {
      throw error
    }),
  })
  const url = new URL('https://example.test/api/trpc/probe')
  url.searchParams.set('input', JSON.stringify({ receipt: 'private-test-receipt' }))

  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: new Request(url),
    router,
    createContext: () => ({}),
    onError: (options) => reportTRPCError(options.error, options.path),
  })
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('tRPC server error reporting', () => {
  it('reports a handled HTTP 500 with its original cause and no request input', async () => {
    const error = new Error('Provider connection failed')
    const response = await requestFailure(error)

    expect(response.status).toBe(500)
    expect(mocks.error).toHaveBeenCalledExactlyOnceWith('[tRPC] Server error', error, {
      procedure: 'probe',
      code: 'INTERNAL_SERVER_ERROR',
    })
  })

  it('reports a plain-object cause normalized by tRPC as an exception', async () => {
    const error = new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      cause: { message: 'Provider connection failed', code: 'ECONNRESET' },
    })
    const response = await requestFailure(error)

    expect(response.status).toBe(500)
    expect(error.cause).toBeInstanceOf(Error)
    expect(error.cause?.message).toBe('Provider connection failed')
    expect(mocks.error).toHaveBeenCalledExactlyOnceWith('[tRPC] Server error', error.cause, {
      procedure: 'probe',
      code: 'INTERNAL_SERVER_ERROR',
    })
  })

  it.each([
    ['SERVICE_UNAVAILABLE', 503],
    ['GATEWAY_TIMEOUT', 504],
  ] as const)('reports %s responses', async (code, status) => {
    const error = new TRPCError({ code })
    const response = await requestFailure(error)

    expect(response.status).toBe(status)
    expect(mocks.error).toHaveBeenCalledExactlyOnceWith('[tRPC] Server error', error, {
      procedure: 'probe',
      code,
    })
  })

  it.each([
    ['BAD_REQUEST', 400],
    ['UNAUTHORIZED', 401],
    ['FORBIDDEN', 403],
    ['NOT_FOUND', 404],
    ['CONFLICT', 409],
    ['TOO_MANY_REQUESTS', 429],
  ] as const)('does not report expected %s responses', async (code, status) => {
    const response = await requestFailure(new TRPCError({ code }))

    expect(response.status).toBe(status)
    expect(mocks.error).not.toHaveBeenCalled()
  })
})
