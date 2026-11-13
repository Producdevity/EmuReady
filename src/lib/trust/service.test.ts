import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { prisma } from '@/server/db'
import { type TrustScoreChange } from '@/server/utils/trust-score-analytics'
import { TrustAction } from '@orm'
import { type Prisma } from '@orm/client'

vi.mock('@/lib/analytics', () => ({
  default: {
    trust: {
      trustScoreChanged: vi.fn(),
      trustLevelChanged: vi.fn(),
    },
  },
}))

const database = vi.hoisted(() => ({
  $transaction: vi.fn(),
  user: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  trustActionLog: { create: vi.fn(), createMany: vi.fn() },
}))
vi.mock('@/server/db', () => ({ prisma: database }))

function createMockPrismaCtx() {
  const models = {
    user: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({ trustScore: 50 }),
    },
    trustActionLog: {
      create: vi.fn().mockResolvedValue({}),
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  }
  const transaction: Prisma.TransactionClient = {
    ...prisma,
    user: { ...prisma.user, ...models.user },
    trustActionLog: { ...prisma.trustActionLog, ...models.trustActionLog },
  }
  database.$transaction
    .mockReset()
    .mockImplementation(async (operation: (tx: Prisma.TransactionClient) => Promise<unknown>) =>
      operation(transaction),
    )
  return { ...models, transaction, $transaction: database.$transaction }
}

afterEach(() => {
  expect(database.user.findUnique).not.toHaveBeenCalled()
  expect(database.user.findMany).not.toHaveBeenCalled()
  expect(database.user.update).not.toHaveBeenCalled()
  expect(database.trustActionLog.create).not.toHaveBeenCalled()
  expect(database.trustActionLog.createMany).not.toHaveBeenCalled()
})

type MockPrismaCtx = ReturnType<typeof createMockPrismaCtx>

describe('canUserAutoApprove', () => {
  let prismaCtx: MockPrismaCtx

  beforeEach(() => {
    vi.clearAllMocks()
    prismaCtx = createMockPrismaCtx()
  })

  it('uses the provided prisma client when checking trust score', async () => {
    prismaCtx.user.findUnique.mockResolvedValue({ trustScore: 250 })
    const { canUserAutoApprove } = await import('./service')

    const result = await canUserAutoApprove('user-1', prismaCtx)

    expect(result).toBe(true)
    expect(prismaCtx.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { trustScore: true },
    })
  })

  it('returns false when the user does not exist', async () => {
    prismaCtx.user.findUnique.mockResolvedValue(null)
    const { canUserAutoApprove } = await import('./service')

    await expect(canUserAutoApprove('missing-user', prismaCtx)).resolves.toBe(false)
  })
})

describe('TrustService.applyBulkManualAdjustments', () => {
  let prismaCtx: MockPrismaCtx

  beforeEach(async () => {
    vi.clearAllMocks()
    prismaCtx = createMockPrismaCtx()
  })

  async function createService() {
    const { TrustService } = await import('./service')
    return new TrustService(prisma)
  }

  it('returns 0 and makes no DB calls for an empty map', async () => {
    const service = await createService()

    const result = await service.applyBulkManualAdjustments({
      adjustments: new Map(),
      reason: 'test',
      adminUserId: 'admin-1',
    })

    expect(result).toBe(0)
    expect(prismaCtx.user.findMany).not.toHaveBeenCalled()
    expect(prismaCtx.trustActionLog.createMany).not.toHaveBeenCalled()
  })

  it('returns 0 and makes no DB calls when all adjustments are zero', async () => {
    const service = await createService()

    const result = await service.applyBulkManualAdjustments({
      adjustments: new Map([
        ['user-1', 0],
        ['user-2', 0],
      ]),
      reason: 'test',
      adminUserId: 'admin-1',
    })

    expect(result).toBe(0)
    expect(prismaCtx.user.findMany).not.toHaveBeenCalled()
  })

  it('skips non-existent users gracefully', async () => {
    prismaCtx.user.update.mockResolvedValue({ trustScore: 40 })
    prismaCtx.user.findMany.mockResolvedValue([{ id: 'user-1', trustScore: 50 }])
    prismaCtx.user.findUnique.mockResolvedValue({ name: 'Admin', email: 'admin@test.com' })

    const service = await createService()

    const result = await service.applyBulkManualAdjustments({
      adjustments: new Map([
        ['user-1', -10],
        ['deleted-user', -5],
      ]),
      reason: 'test',
      adminUserId: 'admin-1',
    })

    expect(result).toBe(1)
    expect(prismaCtx.user.update).toHaveBeenCalledTimes(1)
    expect(prismaCtx.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { trustScore: { increment: -10 }, lastActiveAt: expect.any(Date) },
      select: { trustScore: true },
    })
  })

  it('returns 0 when all users in map are non-existent', async () => {
    prismaCtx.user.findMany.mockResolvedValue([])

    const service = await createService()

    const result = await service.applyBulkManualAdjustments({
      adjustments: new Map([['deleted-user', -5]]),
      reason: 'test',
      adminUserId: 'admin-1',
    })

    expect(result).toBe(0)
    expect(prismaCtx.user.findUnique).not.toHaveBeenCalled()
    expect(prismaCtx.user.update).not.toHaveBeenCalled()
    expect(prismaCtx.trustActionLog.createMany).not.toHaveBeenCalled()
  })

  it('applies a single adjustment correctly', async () => {
    prismaCtx.user.update.mockResolvedValue({ trustScore: 40 })
    prismaCtx.user.findMany.mockResolvedValue([{ id: 'user-1', trustScore: 50 }])
    prismaCtx.user.findUnique.mockResolvedValue({ name: 'Admin', email: 'admin@test.com' })

    const service = await createService()

    const result = await service.applyBulkManualAdjustments({
      adjustments: new Map([['user-1', -10]]),
      reason: 'Vote nullification: Spam',
      adminUserId: 'admin-1',
    })

    expect(result).toBe(1)

    expect(prismaCtx.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { trustScore: { increment: -10 }, lastActiveAt: expect.any(Date) },
      select: { trustScore: true },
    })

    expect(prismaCtx.trustActionLog.createMany).toHaveBeenCalledWith({
      data: [
        {
          userId: 'user-1',
          action: TrustAction.ADMIN_ADJUSTMENT_NEGATIVE,
          weight: -10,
          metadata: {
            reason: 'Vote nullification: Spam',
            adminUserId: 'admin-1',
            adminName: 'Admin',
            adjustment: -10,
          },
        },
      ],
    })
  })

  it('applies multiple adjustments with one createMany call', async () => {
    prismaCtx.user.findMany.mockResolvedValue([
      { id: 'user-1', trustScore: 100 },
      { id: 'user-2', trustScore: 200 },
    ])
    prismaCtx.user.findUnique.mockResolvedValue({ name: 'Admin', email: 'admin@test.com' })

    const service = await createService()

    const result = await service.applyBulkManualAdjustments({
      adjustments: new Map([
        ['user-1', -5],
        ['user-2', 10],
      ]),
      reason: 'Vote nullification: test',
      adminUserId: 'admin-1',
    })

    expect(result).toBe(2)
    expect(prismaCtx.user.update).toHaveBeenCalledTimes(2)
    expect(prismaCtx.trustActionLog.createMany).toHaveBeenCalledTimes(1)

    const logData = prismaCtx.trustActionLog.createMany.mock.calls[0][0].data as {
      userId: string
      action: TrustAction
    }[]
    expect(logData).toHaveLength(2)
    expect(logData[0].userId).toBe('user-1')
    expect(logData[0].action).toBe(TrustAction.ADMIN_ADJUSTMENT_NEGATIVE)
    expect(logData[1].userId).toBe('user-2')
    expect(logData[1].action).toBe(TrustAction.ADMIN_ADJUSTMENT_POSITIVE)
  })

  it('allows negative trust scores when adjustment exceeds current score (no clamping)', async () => {
    prismaCtx.user.update.mockResolvedValue({ trustScore: -95 })
    prismaCtx.user.findMany.mockResolvedValue([{ id: 'user-1', trustScore: 5 }])
    prismaCtx.user.findUnique.mockResolvedValue({ name: 'Admin', email: 'admin@test.com' })

    const service = await createService()

    await service.applyBulkManualAdjustments({
      adjustments: new Map([['user-1', -100]]),
      reason: 'test',
      adminUserId: 'admin-1',
    })

    // 5 + (-100) = -95 — negative scores are allowed (used for author-risk signals)
    expect(prismaCtx.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { trustScore: { increment: -100 }, lastActiveAt: expect.any(Date) },
      select: { trustScore: true },
    })

    const logData = prismaCtx.trustActionLog.createMany.mock.calls[0][0].data as {
      weight: number
      metadata: { adjustment: number }
    }[]
    expect(logData[0].weight).toBe(-100)
    expect(logData[0].metadata.adjustment).toBe(-100)
  })

  it('emits trustLevelChanged analytics when level changes', async () => {
    prismaCtx.user.update.mockResolvedValue({ trustScore: 105 })
    const analytics = (await import('@/lib/analytics')).default

    prismaCtx.user.findMany.mockResolvedValue([{ id: 'user-1', trustScore: 95 }])
    prismaCtx.user.findUnique.mockResolvedValue({ name: 'Admin', email: 'admin@test.com' })

    const service = await createService()

    await service.applyBulkManualAdjustments({
      adjustments: new Map([['user-1', 10]]),
      reason: 'test',
      adminUserId: 'admin-1',
    })

    // 95 + 10 = 105, crosses from Newcomer (0) to Contributor (100)
    expect(analytics.trust.trustLevelChanged).toHaveBeenCalledWith({
      userId: 'user-1',
      oldLevel: 'Newcomer',
      newLevel: 'Contributor',
      score: 105,
      direction: 'up',
    })
  })

  it('does not emit trustLevelChanged when level stays the same', async () => {
    prismaCtx.user.update.mockResolvedValue({ trustScore: 60 })
    const analytics = (await import('@/lib/analytics')).default

    prismaCtx.user.findMany.mockResolvedValue([{ id: 'user-1', trustScore: 50 }])
    prismaCtx.user.findUnique.mockResolvedValue({ name: 'Admin', email: 'admin@test.com' })

    const service = await createService()

    await service.applyBulkManualAdjustments({
      adjustments: new Map([['user-1', 10]]),
      reason: 'test',
      adminUserId: 'admin-1',
    })

    // 50 + 10 = 60, still Newcomer
    expect(analytics.trust.trustLevelChanged).not.toHaveBeenCalled()
  })

  it('owns the transaction for root-client operations', async () => {
    prismaCtx.user.findMany.mockResolvedValue([{ id: 'user-1', trustScore: 50 }])
    prismaCtx.user.findUnique.mockResolvedValue({ name: 'Admin', email: 'admin@test.com' })

    const service = await createService()

    await service.applyBulkManualAdjustments({
      adjustments: new Map([['user-1', 5]]),
      reason: 'test',
      adminUserId: 'admin-1',
    })

    expect(prismaCtx.$transaction).toHaveBeenCalledOnce()
  })

  it('records changes without opening a transaction for an explicit transaction owner', async () => {
    prismaCtx.user.findMany.mockResolvedValue([{ id: 'user-1', trustScore: 50 }])
    prismaCtx.user.findUnique.mockResolvedValue({ name: 'Admin', email: 'admin@test.com' })

    const { TrustService } = await import('./service')
    const changes: TrustScoreChange[] = []
    const service = TrustService.inTransaction(prismaCtx.transaction, changes)

    const result = await service.applyBulkManualAdjustments({
      adjustments: new Map([['user-1', 5]]),
      reason: 'test',
      adminUserId: 'admin-1',
    })

    expect(result).toBe(1)
    expect(prismaCtx.user.update).toHaveBeenCalled()
    expect(prismaCtx.$transaction).not.toHaveBeenCalled()
    expect(changes).toHaveLength(1)
    const analytics = (await import('@/lib/analytics')).default
    expect(analytics.trust.trustScoreChanged).not.toHaveBeenCalled()
  })

  it('uses positive action type for positive adjustments', async () => {
    prismaCtx.user.findMany.mockResolvedValue([{ id: 'user-1', trustScore: 50 }])
    prismaCtx.user.findUnique.mockResolvedValue({ name: 'Admin', email: 'admin@test.com' })

    const service = await createService()

    await service.applyBulkManualAdjustments({
      adjustments: new Map([['user-1', 10]]),
      reason: 'test',
      adminUserId: 'admin-1',
    })

    const logData = prismaCtx.trustActionLog.createMany.mock.calls[0][0].data as {
      action: TrustAction
    }[]
    expect(logData[0].action).toBe(TrustAction.ADMIN_ADJUSTMENT_POSITIVE)
  })

  it('falls back to email when admin has no name', async () => {
    prismaCtx.user.findMany.mockResolvedValue([{ id: 'user-1', trustScore: 50 }])
    prismaCtx.user.findUnique.mockResolvedValue({ name: null, email: 'admin@test.com' })

    const service = await createService()

    await service.applyBulkManualAdjustments({
      adjustments: new Map([['user-1', -5]]),
      reason: 'test',
      adminUserId: 'admin-1',
    })

    const logData = prismaCtx.trustActionLog.createMany.mock.calls[0][0].data as {
      metadata: { adminName: string }
    }[]
    expect(logData[0].metadata.adminName).toBe('admin@test.com')
  })

  it('uses "Unknown Admin" when admin not found', async () => {
    prismaCtx.user.findMany.mockResolvedValue([{ id: 'user-1', trustScore: 50 }])
    prismaCtx.user.findUnique.mockResolvedValue(null)

    const service = await createService()

    await service.applyBulkManualAdjustments({
      adjustments: new Map([['user-1', -5]]),
      reason: 'test',
      adminUserId: 'admin-1',
    })

    const logData = prismaCtx.trustActionLog.createMany.mock.calls[0][0].data as {
      metadata: { adminName: string }
    }[]
    expect(logData[0].metadata.adminName).toBe('Unknown Admin')
  })
})

describe('TrustService.applyManualAdjustment', () => {
  let prismaCtx: MockPrismaCtx

  beforeEach(async () => {
    vi.clearAllMocks()
    prismaCtx = createMockPrismaCtx()
  })

  async function createService() {
    const { TrustService } = await import('./service')
    return new TrustService(prisma)
  }

  it('throws when adjustment is zero', async () => {
    const service = await createService()

    await expect(
      service.applyManualAdjustment({
        userId: 'user-1',
        adjustment: 0,
        reason: 'test',
        adminUserId: 'admin-1',
      }),
    ).rejects.toThrow()
  })

  it('throws when user not found', async () => {
    prismaCtx.user.findUnique.mockResolvedValueOnce(null)
    const service = await createService()

    await expect(
      service.applyManualAdjustment({
        userId: 'user-1',
        adjustment: 5,
        reason: 'test',
        adminUserId: 'admin-1',
      }),
    ).rejects.toThrow()
  })

  it('allows negative trust score when adjustment goes below zero (no clamping)', async () => {
    prismaCtx.user.update.mockResolvedValue({ trustScore: -95 })
    prismaCtx.user.findUnique
      .mockResolvedValueOnce({ trustScore: 5, name: 'User', email: 'user@test.com' })
      .mockResolvedValueOnce({ name: 'Admin', email: 'admin@test.com' })
    const service = await createService()

    await service.applyManualAdjustment({
      userId: 'user-1',
      adjustment: -100,
      reason: 'test',
      adminUserId: 'admin-1',
    })

    // 5 + (-100) = -95, not clamped to 0
    expect(prismaCtx.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { trustScore: { increment: -100 }, lastActiveAt: expect.any(Date) },
      select: { trustScore: true },
    })
  })

  it('logs the raw adjustment weight (no clamping adjustment)', async () => {
    prismaCtx.user.findUnique
      .mockResolvedValueOnce({ trustScore: 10, name: 'User', email: 'user@test.com' })
      .mockResolvedValueOnce({ name: 'Admin', email: 'admin@test.com' })
    const service = await createService()

    await service.applyManualAdjustment({
      userId: 'user-1',
      adjustment: -50,
      reason: 'Vote nullification',
      adminUserId: 'admin-1',
    })

    expect(prismaCtx.trustActionLog.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        action: TrustAction.ADMIN_ADJUSTMENT_NEGATIVE,
        weight: -50,
        metadata: {
          reason: 'Vote nullification',
          adminUserId: 'admin-1',
          adminName: 'Admin',
          adjustment: -50,
        },
      },
    })
  })
})

describe('TrustService.reverseLogAction', () => {
  let prismaCtx: MockPrismaCtx

  beforeEach(async () => {
    vi.clearAllMocks()
    prismaCtx = createMockPrismaCtx()
  })

  async function createService() {
    const { TrustService } = await import('./service')
    return new TrustService(prisma)
  }

  it('negates positive action weight (LISTING_RECEIVED_UPVOTE: +2 → -2)', async () => {
    prismaCtx.user.update.mockResolvedValue({ trustScore: 8 })
    prismaCtx.user.findUnique.mockResolvedValue({ trustScore: 10 })
    const service = await createService()

    await service.reverseLogAction({
      userId: 'author-1',
      originalAction: TrustAction.LISTING_RECEIVED_UPVOTE,
      metadata: { listingId: 'listing-1' },
    })

    expect(prismaCtx.user.update).toHaveBeenCalledWith({
      where: { id: 'author-1' },
      data: { trustScore: { increment: -2 }, lastActiveAt: expect.any(Date) },
      select: { trustScore: true },
    })
    expect(prismaCtx.trustActionLog.create).toHaveBeenCalledWith({
      data: {
        userId: 'author-1',
        action: TrustAction.VOTE_CHANGE_REVERSAL,
        weight: -2,
        metadata: {
          listingId: 'listing-1',
          originalAction: TrustAction.LISTING_RECEIVED_UPVOTE,
          reversed: true,
        },
      },
    })
  })

  it('negates negative action weight (COMMENT_RECEIVED_DOWNVOTE: -1 → +1)', async () => {
    prismaCtx.user.update.mockResolvedValue({ trustScore: 11 })
    prismaCtx.user.findUnique.mockResolvedValue({ trustScore: 5 })
    const service = await createService()

    await service.reverseLogAction({
      userId: 'author-1',
      originalAction: TrustAction.COMMENT_RECEIVED_DOWNVOTE,
      metadata: { commentId: 'comment-1' },
    })

    expect(prismaCtx.user.update).toHaveBeenCalledWith({
      where: { id: 'author-1' },
      data: { trustScore: { increment: 1 }, lastActiveAt: expect.any(Date) },
      select: { trustScore: true },
    })
    expect(prismaCtx.trustActionLog.create).toHaveBeenCalledWith({
      data: {
        userId: 'author-1',
        action: TrustAction.VOTE_CHANGE_REVERSAL,
        weight: 1,
        metadata: {
          commentId: 'comment-1',
          originalAction: TrustAction.COMMENT_RECEIVED_DOWNVOTE,
          reversed: true,
        },
      },
    })
  })

  it('allows negative trust score on reversal (no clamping)', async () => {
    prismaCtx.user.update.mockResolvedValue({ trustScore: -2 })
    prismaCtx.user.findUnique.mockResolvedValue({ trustScore: 1 })
    const service = await createService()

    await service.reverseLogAction({
      userId: 'author-1',
      originalAction: TrustAction.LISTING_RECEIVED_UPVOTE, // weight +2, reversal = -2
      metadata: {},
    })

    // 1 + (-2) = -1, allowed
    expect(prismaCtx.user.update).toHaveBeenCalledWith({
      where: { id: 'author-1' },
      data: { trustScore: { increment: -2 }, lastActiveAt: expect.any(Date) },
      select: { trustScore: true },
    })
  })

  it('no-ops when original action has weight 0', async () => {
    const service = await createService()

    await service.reverseLogAction({
      userId: 'user-1',
      originalAction: TrustAction.ADMIN_ADJUSTMENT_POSITIVE, // weight 0
      metadata: {},
    })

    expect(prismaCtx.user.update).not.toHaveBeenCalled()
    expect(prismaCtx.trustActionLog.create).not.toHaveBeenCalled()
  })

  it('throws on invalid action', async () => {
    const service = await createService()

    await expect(
      service.reverseLogAction({
        userId: 'user-1',
        originalAction: 'NONEXISTENT_ACTION' as TrustAction,
        metadata: {},
      }),
    ).rejects.toThrow('Invalid trust action')
  })

  it('owns the transaction for root-client operations', async () => {
    prismaCtx.user.findUnique.mockResolvedValue({ trustScore: 10 })

    const service = await createService()

    await service.reverseLogAction({
      userId: 'user-1',
      originalAction: TrustAction.LISTING_RECEIVED_UPVOTE,
      metadata: {},
    })

    expect(prismaCtx.$transaction).toHaveBeenCalledOnce()
  })

  it('records changes without opening a transaction for an explicit transaction owner', async () => {
    prismaCtx.user.findUnique.mockResolvedValue({ trustScore: 10 })
    const { TrustService } = await import('./service')
    const changes: TrustScoreChange[] = []
    const service = TrustService.inTransaction(prismaCtx.transaction, changes)

    await service.reverseLogAction({
      userId: 'user-1',
      originalAction: TrustAction.LISTING_RECEIVED_UPVOTE,
      metadata: {},
    })

    expect(prismaCtx.user.update).toHaveBeenCalled()
    expect(prismaCtx.$transaction).not.toHaveBeenCalled()
    expect(changes).toHaveLength(1)
    const analytics = (await import('@/lib/analytics')).default
    expect(analytics.trust.trustScoreChanged).not.toHaveBeenCalled()
  })

  it('emits trustLevelChanged when crossing a level boundary', async () => {
    prismaCtx.user.update.mockResolvedValue({ trustScore: 99 })
    const analytics = (await import('@/lib/analytics')).default

    prismaCtx.user.findUnique.mockResolvedValue({ trustScore: 101 })
    const service = await createService()

    await service.reverseLogAction({
      userId: 'user-1',
      originalAction: TrustAction.LISTING_RECEIVED_UPVOTE, // -2
      metadata: {},
    })

    // 101 + (-2) = 99, drops from Contributor (>=100) back to Newcomer
    expect(analytics.trust.trustLevelChanged).toHaveBeenCalledWith({
      userId: 'user-1',
      oldLevel: 'Contributor',
      newLevel: 'Newcomer',
      score: 99,
      direction: 'down',
    })
  })
})
