import { afterAll, afterEach, describe, expect, it, vi } from 'vitest'
import { Role } from '@orm'

vi.unmock('@/server/api/trpc')
vi.unmock('@/server/api/root')
vi.unmock('@/server/db')
vi.unmock('@orm')
vi.unmock('@orm/client')

vi.stubEnv('NEXT_PUBLIC_ENABLE_ANDROID_DOWNLOADS', 'false')
vi.resetModules()

const { prisma } = await import('@/server/db')
const releaseFindFirst = vi.spyOn(prisma.release, 'findFirst')
const entitlementCount = vi.spyOn(prisma.entitlement, 'count')
const TEST_USER = {
  id: '00000000-0000-4000-a000-000000000001',
  email: 'test@test.com',
  name: 'Test User',
  role: Role.USER,
  permissions: [],
  showNsfw: false,
}

const { releasesRouter } = await import('./releases')

function createCaller() {
  return releasesRouter.createCaller({
    session: {
      user: TEST_USER,
    },
    prisma,
    headers: new Headers(),
  })
}

describe('releases router', () => {
  afterAll(() => {
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('does not expose release metadata when Android downloads are disabled', async () => {
    await expect(createCaller().latest({})).resolves.toBeUndefined()
    expect(releaseFindFirst).not.toHaveBeenCalled()
  })

  it('does not sign downloads when Android downloads are disabled', async () => {
    await expect(
      createCaller().signDownload({ releaseId: '00000000-0000-4000-a000-000000000002' }),
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Operation not allowed: Android downloads are disabled',
    })
    expect(entitlementCount).not.toHaveBeenCalled()
  })
})
