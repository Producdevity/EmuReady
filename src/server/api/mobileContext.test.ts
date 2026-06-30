import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'

const authorizeApiKeyMock = vi.hoisted(() => vi.fn())

vi.mock('@/server/services/api-access.service', () => ({
  ApiAccessService: vi.fn().mockImplementation(function MockApiAccessService() {
    return {
      authorize: authorizeApiKeyMock,
    }
  }),
}))

const { createMobileTRPCFetchContext } = await import('./mobileContext')

function createFetchContextOptions(headers: HeadersInit = {}): FetchCreateContextFnOptions {
  const req = new Request('https://www.emuready.com/api/mobile/trpc/games.get', { headers })

  return {
    req,
    resHeaders: new Headers(),
    info: {
      accept: null,
      type: 'query',
      isBatchCall: false,
      calls: [],
      connectionParams: null,
      signal: req.signal,
      url: new URL(req.url),
    },
  }
}

describe('createMobileTRPCFetchContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows anonymous public mobile requests when no API key is provided', async () => {
    const context = await createMobileTRPCFetchContext(createFetchContextOptions())

    expect(context.session).toBeNull()
    expect(context.apiKey).toBeNull()
    expect(authorizeApiKeyMock).not.toHaveBeenCalled()
  })

  it('rejects an explicit invalid API key instead of treating it as anonymous', async () => {
    authorizeApiKeyMock.mockResolvedValue(null)

    await expect(
      createMobileTRPCFetchContext(createFetchContextOptions({ 'x-api-key': 'invalid-key' })),
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Invalid API key',
    })

    expect(authorizeApiKeyMock).toHaveBeenCalledWith('invalid-key')
  })
})
