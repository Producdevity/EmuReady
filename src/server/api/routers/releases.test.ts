import { afterEach, describe, expect, it, vi } from 'vitest'
import { Role } from '@orm'

vi.unmock('@/server/api/trpc')
vi.unmock('@/server/api/root')
vi.unmock('@orm')
vi.unmock('@orm/client')

const prismaMocks = {
  releaseFindFirst: vi.fn(),
  entitlementCount: vi.fn(),
}

const { releasesRouter } = await import('./releases')

function createCaller() {
  return releasesRouter.createCaller({
    session: {
      user: {
        id: '00000000-0000-4000-a000-000000000001',
        email: 'test@test.com',
        name: 'Test User',
        role: Role.USER,
        permissions: [],
        showNsfw: false,
      },
    },
    prisma: {
      release: {
        findFirst: prismaMocks.releaseFindFirst,
      },
      entitlement: {
        count: prismaMocks.entitlementCount,
      },
    } as never,
    headers: new Headers(),
  })
}

describe('releases router', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it('does not expose release metadata when Android downloads are disabled', async () => {
    vi.stubEnv('NEXT_PUBLIC_ENABLE_ANDROID_DOWNLOADS', 'false')

    await expect(createCaller().latest({})).resolves.toBeUndefined()
    expect(prismaMocks.releaseFindFirst).not.toHaveBeenCalled()
  })

  it('does not sign downloads when Android downloads are disabled', async () => {
    vi.stubEnv('NEXT_PUBLIC_ENABLE_ANDROID_DOWNLOADS', 'false')

    await expect(
      createCaller().signDownload({ releaseId: '00000000-0000-4000-a000-000000000002' }),
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Operation not allowed: Android downloads are disabled',
    })
    expect(prismaMocks.entitlementCount).not.toHaveBeenCalled()
  })
})
