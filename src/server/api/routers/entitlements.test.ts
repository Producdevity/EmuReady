import { afterEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/server/db'
import { EntitlementSource, Role } from '@orm'

vi.unmock('@/server/api/trpc')
vi.unmock('@/server/api/root')
vi.unmock('@/server/db')
vi.unmock('@orm')
vi.unmock('@orm/client')

const entitlementMocks = vi.hoisted(() => ({
  fetchPlayOrder: vi.fn(),
  isPaidAppOrder: vi.fn(),
  grant: vi.fn(),
}))
const TEST_ORDER_ID = 'GPA.1234-5678'
const TEST_USER = {
  id: '00000000-0000-4000-a000-000000000001',
  email: 'test@test.com',
  name: 'Test User',
  role: Role.USER,
  permissions: [],
  showNsfw: false,
}

vi.mock('@/server/services/googlePlayOrders.service', () => ({
  fetchPlayOrder: entitlementMocks.fetchPlayOrder,
  isPaidAppOrder: entitlementMocks.isPaidAppOrder,
}))

vi.mock('@/server/repositories/entitlements.repository', () => ({
  EntitlementsRepository: class MockEntitlementsRepository {
    grant = entitlementMocks.grant
  },
}))

const { entitlementsRouter } = await import('./entitlements')

function createCaller() {
  return entitlementsRouter.createCaller({
    session: {
      user: TEST_USER,
    },
    prisma,
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
    expect(entitlementMocks.fetchPlayOrder).not.toHaveBeenCalled()
    expect(entitlementMocks.grant).not.toHaveBeenCalled()
  })

  it('grants an entitlement for a paid Google Play order when verification is enabled', async () => {
    vi.stubEnv('ENABLE_ANDROID_ENTITLEMENT_VERIFICATION', 'true')
    vi.stubEnv('ANDROID_PACKAGE_NAME', 'com.example.emuready')
    entitlementMocks.fetchPlayOrder.mockResolvedValueOnce({ orderId: TEST_ORDER_ID })
    entitlementMocks.isPaidAppOrder.mockReturnValueOnce(true)
    entitlementMocks.grant.mockResolvedValueOnce({})

    await expect(createCaller().claimPlayOrder({ orderId: TEST_ORDER_ID })).resolves.toEqual({
      ok: true,
    })
    expect(entitlementMocks.fetchPlayOrder).toHaveBeenCalledWith(
      'com.example.emuready',
      TEST_ORDER_ID,
    )
    expect(entitlementMocks.grant).toHaveBeenCalledWith(TEST_USER.id, EntitlementSource.PLAY, {
      referenceId: TEST_ORDER_ID,
    })
  })

  it('rejects a Google Play order that is not recognized as paid', async () => {
    vi.stubEnv('ENABLE_ANDROID_ENTITLEMENT_VERIFICATION', 'true')
    vi.stubEnv('ANDROID_PACKAGE_NAME', 'com.example.emuready')
    entitlementMocks.fetchPlayOrder.mockResolvedValueOnce({ orderId: TEST_ORDER_ID })
    entitlementMocks.isPaidAppOrder.mockReturnValueOnce(false)

    await expect(createCaller().claimPlayOrder({ orderId: TEST_ORDER_ID })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Order not recognized as paid app',
    })
    expect(entitlementMocks.grant).not.toHaveBeenCalled()
  })
})
