import { describe, expect, it, vi, beforeEach } from 'vitest'
import { Role } from '@orm/client'
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'

const authorizeApiKeyMock = vi.hoisted(() => vi.fn())
const verifyTokenMock = vi.hoisted(() => vi.fn())
const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
  rolePermission: {
    findMany: vi.fn(),
  },
}))

vi.mock('@clerk/backend', () => ({
  verifyToken: verifyTokenMock,
}))

vi.mock('@/server/db', () => ({
  prisma: prismaMock,
}))

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

  it('ignores an invalid x-api-key so public mobile requests still work anonymously', async () => {
    authorizeApiKeyMock.mockResolvedValue(null)

    const context = await createMobileTRPCFetchContext(
      createFetchContextOptions({ 'x-api-key': 'invalid-key' }),
    )

    expect(context.session).toBeNull()
    expect(context.apiKey).toBeNull()
    expect(authorizeApiKeyMock).toHaveBeenCalledWith('invalid-key')
  })

  it('keeps explicit Authorization ApiKey credentials strict', async () => {
    authorizeApiKeyMock.mockResolvedValue(null)

    await expect(
      createMobileTRPCFetchContext(
        createFetchContextOptions({ authorization: 'ApiKey invalid-key' }),
      ),
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Invalid API key',
    })

    expect(authorizeApiKeyMock).toHaveBeenCalledWith('invalid-key')
  })

  it('uses a valid Bearer token even when the optional x-api-key is invalid', async () => {
    authorizeApiKeyMock.mockResolvedValue(null)
    verifyTokenMock.mockResolvedValue({ sub: 'clerk-user-1' })
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'user-1' }).mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@example.com',
      name: 'Test User',
      role: Role.USER,
      settings: { showNsfw: false },
    })
    prismaMock.rolePermission.findMany.mockResolvedValue([
      { permission: { key: 'view_statistics' } },
    ])

    const context = await createMobileTRPCFetchContext(
      createFetchContextOptions({
        authorization: 'Bearer valid-token',
        'x-api-key': 'stale-app-key',
      }),
    )

    expect(context.session?.user.id).toBe('user-1')
    expect(context.apiKey).toBeNull()
    expect(authorizeApiKeyMock).toHaveBeenCalledWith('stale-app-key')
    expect(verifyTokenMock).toHaveBeenCalledWith(
      'valid-token',
      expect.objectContaining({
        clockSkewInMs: 60000,
        skipJwksCache: false,
      }),
    )
  })
})
