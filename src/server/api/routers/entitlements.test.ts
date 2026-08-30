import { afterEach, describe, expect, it, vi } from 'vitest'
import { Role } from '@orm'

vi.unmock('@/server/api/trpc')
vi.unmock('@/server/api/root')
vi.unmock('@orm')
vi.unmock('@orm/client')

const mockFetchPlayOrder = vi.fn()

vi.mock('@/server/services/googlePlayOrders.service', () => ({
  fetchPlayOrder: (...args: unknown[]) => mockFetchPlayOrder(...args),
  isPaidAppOrder: vi.fn(),
}))

const { entitlementsRouter } = await import('./entitlements')

function createCaller() {
  return entitlementsRouter.createCaller({
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
    prisma: {} as never,
    headers: new Headers(),
  })
}

describe('entitlements router', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it('rejects Google Play claims when Android entitlement verification is disabled', async () => {
    vi.stubEnv('ENABLE_ANDROID_ENTITLEMENT_VERIFICATION', 'false')

    await expect(
      createCaller().claimPlayOrder({ orderId: 'GPA.1234-5678-9012-34567' }),
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Operation not allowed: Android entitlement verification is disabled',
    })
    expect(mockFetchPlayOrder).not.toHaveBeenCalled()
  })
})
