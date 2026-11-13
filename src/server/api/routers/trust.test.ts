import { describe, expect, it, beforeEach, vi } from 'vitest'
import { TRUST_LEVELS } from '@/lib/trust/config'
import { prisma } from '@/server/db'
import { Role, TrustAction } from '@orm'

vi.unmock('@/server/api/trpc')
vi.unmock('@/server/api/root')

const mockApplyMonthlyActiveBonus = vi.fn().mockResolvedValue({ processedUsers: 0, errors: [] })
const mockApplyManualAdjustment = vi.fn().mockResolvedValue(undefined)

vi.mock('@/lib/trust/service', () => ({
  applyMonthlyActiveBonus: (...args: unknown[]) => mockApplyMonthlyActiveBonus(...args),
  TrustService: vi.fn().mockImplementation(function MockTrustService() {
    return {
      applyManualAdjustment: (...args: unknown[]) => mockApplyManualAdjustment(...args),
    }
  }),
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

function createCaller(role: Role | null) {
  return trustRouter.createCaller({
    session: role
      ? {
          user: {
            id: USER_ID,
            email: 'test@test.com',
            name: 'Test User',
            role,
            permissions: [],
            showNsfw: false,
          },
        }
      : null,
    prisma,
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

  it('rejects unauthenticated admin operations before accessing persistence', async () => {
    const caller = createCaller(null)
    await expect(caller.getTrustLogs(VALID_PAGINATION)).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
    await expect(caller.getTrustStats({})).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    await expect(caller.runMonthlyActiveBonus({})).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    await expect(
      caller.adjustTrustScore({
        userId: TARGET_USER_ID,
        adjustment: 1,
        reason: 'Not authenticated',
      }),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    expect(mockPrismaTrustActionLogFindMany).not.toHaveBeenCalled()
    expect(mockPrismaTrustActionLogCount).not.toHaveBeenCalled()
    expect(mockApplyMonthlyActiveBonus).not.toHaveBeenCalled()
    expect(mockApplyManualAdjustment).not.toHaveBeenCalled()
  })

  it('keeps trust level configuration available to signed-in users', async () => {
    await expect(createCaller(Role.USER).getTrustLevels()).resolves.toEqual(TRUST_LEVELS)
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

    it('applies search and action filters to both the page and total', async () => {
      mockPrismaTrustActionLogCount.mockResolvedValueOnce(21)
      const result = await createCaller(Role.SUPER_ADMIN).getTrustLogs({
        page: 2,
        limit: 10,
        search: 'Alice',
        action: TrustAction.LISTING_APPROVED,
        sortField: 'user.trustScore',
        sortDirection: 'desc',
      })
      const where = {
        action: TrustAction.LISTING_APPROVED,
        user: {
          OR: [
            { name: { contains: 'Alice', mode: 'insensitive' } },
            { email: { contains: 'Alice', mode: 'insensitive' } },
          ],
        },
      }
      expect(mockPrismaTrustActionLogFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where,
          orderBy: { user: { trustScore: 'desc' } },
          skip: 10,
          take: 10,
        }),
      )
      expect(mockPrismaTrustActionLogCount).toHaveBeenCalledWith({ where })
      expect(result.pagination).toMatchObject({ page: 2, limit: 10, total: 21, pages: 3 })
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

    it('assigns score groups to the correct trust level at each boundary', async () => {
      mockPrismaUserGroupBy.mockResolvedValueOnce([
        { trustScore: 0, _count: { id: 2 } },
        { trustScore: 99, _count: { id: 3 } },
        { trustScore: 100, _count: { id: 4 } },
        { trustScore: 250, _count: { id: 5 } },
        { trustScore: 1500, _count: { id: 6 } },
      ])
      const result = await createCaller(Role.SUPER_ADMIN).getTrustStats({})
      expect(result.levelDistribution.map((level) => level.count)).toEqual([5, 4, 5, 0, 0, 6])
    })

    it('includes users with negative scores in the Newcomer total', async () => {
      mockPrismaUserCount.mockResolvedValueOnce(5)
      mockPrismaUserGroupBy.mockResolvedValueOnce([
        { trustScore: -10, _count: { id: 3 } },
        { trustScore: 100, _count: { id: 2 } },
      ])

      const result = await createCaller(Role.SUPER_ADMIN).getTrustStats({})

      expect(result.levelDistribution.map((level) => level.count)).toEqual([3, 2, 0, 0, 0, 0])
      expect(result.levelDistribution.reduce((total, level) => total + level.count, 0)).toBe(
        result.totalUsers,
      )
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
