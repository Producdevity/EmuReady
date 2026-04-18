import { describe, expect, it, beforeEach, vi } from 'vitest'
import { Role } from '@orm'

vi.unmock('@/server/api/trpc')
vi.unmock('@/server/api/root')

const mockApplyMonthlyActiveBonus = vi.fn().mockResolvedValue({ processedUsers: 0, errors: [] })
const mockApplyManualAdjustment = vi.fn().mockResolvedValue(undefined)

vi.mock('@/lib/trust/service', () => ({
  applyMonthlyActiveBonus: (...args: unknown[]) => mockApplyMonthlyActiveBonus(...args),
  TrustService: vi.fn().mockImplementation(() => ({
    applyManualAdjustment: (...args: unknown[]) => mockApplyManualAdjustment(...args),
  })),
}))

const mockPrismaTrustActionLogFindMany = vi.fn().mockResolvedValue([])
const mockPrismaTrustActionLogCount = vi.fn().mockResolvedValue(0)
const mockPrismaUserCount = vi.fn().mockResolvedValue(0)
const mockPrismaUserGroupBy = vi.fn().mockResolvedValue([])

vi.mock('@/server/db', () => ({
  prisma: {
    trustActionLog: {
      findMany: (...args: unknown[]) => mockPrismaTrustActionLogFindMany(...args),
      count: (...args: unknown[]) => mockPrismaTrustActionLogCount(...args),
    },
    user: {
      count: (...args: unknown[]) => mockPrismaUserCount(...args),
      groupBy: (...args: unknown[]) => mockPrismaUserGroupBy(...args),
    },
  },
}))

const { trustRouter } = await import('./trust')

const USER_ID = '00000000-0000-4000-a000-000000000001'
const TARGET_USER_ID = '00000000-0000-4000-a000-000000000002'

function createCaller(role: Role) {
  return trustRouter.createCaller({
    session: {
      user: {
        id: USER_ID,
        email: 'test@test.com',
        name: 'Test User',
        role,
        permissions: [],
        showNsfw: false,
      },
    },
    prisma: {} as never,
    headers: new Headers(),
  })
}

const VALID_PAGINATION = { page: 1, limit: 20 }

const NON_SUPER_ADMIN_ROLES: Role[] = [
  Role.USER,
  Role.AUTHOR,
  Role.DEVELOPER,
  Role.MODERATOR,
  Role.ADMIN,
]

describe('trust router permission checks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTrustLogs (SUPER_ADMIN only)', () => {
    NON_SUPER_ADMIN_ROLES.forEach((role) => {
      it(`rejects with FORBIDDEN for ${role} and does not query the DB`, async () => {
        const caller = createCaller(role)

        await expect(caller.getTrustLogs(VALID_PAGINATION)).rejects.toThrow(
          /Super Admin|insufficient|forbidden/i,
        )

        expect(mockPrismaTrustActionLogFindMany).not.toHaveBeenCalled()
        expect(mockPrismaTrustActionLogCount).not.toHaveBeenCalled()
      })
    })

    it('proceeds for SUPER_ADMIN', async () => {
      const caller = createCaller(Role.SUPER_ADMIN)

      const result = await caller.getTrustLogs(VALID_PAGINATION)

      expect(result).toHaveProperty('logs')
      expect(result).toHaveProperty('pagination')
      expect(mockPrismaTrustActionLogFindMany).toHaveBeenCalledTimes(1)
    })
  })

  describe('getTrustStats (SUPER_ADMIN only)', () => {
    NON_SUPER_ADMIN_ROLES.forEach((role) => {
      it(`rejects with FORBIDDEN for ${role} and does not query the DB`, async () => {
        const caller = createCaller(role)

        await expect(caller.getTrustStats({})).rejects.toThrow(
          /Super Admin|insufficient|forbidden/i,
        )

        expect(mockPrismaTrustActionLogCount).not.toHaveBeenCalled()
        expect(mockPrismaUserCount).not.toHaveBeenCalled()
        expect(mockPrismaUserGroupBy).not.toHaveBeenCalled()
      })
    })

    it('proceeds for SUPER_ADMIN', async () => {
      const caller = createCaller(Role.SUPER_ADMIN)

      const result = await caller.getTrustStats({})

      expect(result).toHaveProperty('totalActions')
      expect(mockPrismaTrustActionLogCount).toHaveBeenCalledTimes(1)
    })
  })

  describe('runMonthlyActiveBonus (SUPER_ADMIN only)', () => {
    NON_SUPER_ADMIN_ROLES.forEach((role) => {
      it(`rejects with FORBIDDEN for ${role} and does not invoke the bonus job`, async () => {
        const caller = createCaller(role)

        await expect(caller.runMonthlyActiveBonus({})).rejects.toThrow(
          /Super Admin|insufficient|forbidden/i,
        )

        expect(mockApplyMonthlyActiveBonus).not.toHaveBeenCalled()
      })
    })

    it('invokes the bonus job for SUPER_ADMIN', async () => {
      const caller = createCaller(Role.SUPER_ADMIN)

      await caller.runMonthlyActiveBonus({})

      expect(mockApplyMonthlyActiveBonus).toHaveBeenCalledTimes(1)
    })
  })

  describe('adjustTrustScore (SUPER_ADMIN only)', () => {
    NON_SUPER_ADMIN_ROLES.forEach((role) => {
      it(`rejects with FORBIDDEN for ${role} and does not adjust trust`, async () => {
        const caller = createCaller(role)

        await expect(
          caller.adjustTrustScore({
            userId: TARGET_USER_ID,
            adjustment: 50,
            reason: 'attempted bypass',
          }),
        ).rejects.toThrow(/Super Admin|insufficient|forbidden/i)

        expect(mockApplyManualAdjustment).not.toHaveBeenCalled()
      })
    })

    it('invokes the adjustment for SUPER_ADMIN', async () => {
      const caller = createCaller(Role.SUPER_ADMIN)

      await caller.adjustTrustScore({
        userId: TARGET_USER_ID,
        adjustment: 50,
        reason: 'legitimate adjustment',
      })

      expect(mockApplyManualAdjustment).toHaveBeenCalledTimes(1)
      expect(mockApplyManualAdjustment).toHaveBeenCalledWith({
        userId: TARGET_USER_ID,
        adjustment: 50,
        reason: 'legitimate adjustment',
        adminUserId: USER_ID,
      })
    })
  })
})
