import { describe, expect, it, vi } from 'vitest'
import analytics from '@/lib/analytics'
import { prisma } from '@/server/db'
import { TrustAction, type Prisma } from '@orm'
import { TrustService } from './service'

vi.mock('@/lib/analytics', () => ({
  default: { trust: { trustScoreChanged: vi.fn(), trustLevelChanged: vi.fn() } },
}))

const database = vi.hoisted(() => ({
  $transaction: vi.fn(),
  user: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
  trustActionLog: { create: vi.fn(), createMany: vi.fn() },
}))
vi.mock('@/server/db', () => ({ prisma: database }))

function createService() {
  vi.clearAllMocks()
  database.$transaction.mockImplementation(
    async (operation: (transaction: typeof database) => Promise<unknown>) => operation(database),
  )
  let score = 100
  database.user.findUnique.mockResolvedValue({
    trustScore: 100,
    name: 'User',
    email: 'user@example.com',
  })
  database.user.findMany.mockResolvedValue([{ id: 'user-1', trustScore: 100 }])
  database.user.update.mockImplementation(async (input: Prisma.UserUpdateArgs) => {
    const update = input.data.trustScore
    if (typeof update === 'number') score = update
    else if (typeof update?.increment === 'number') score += update.increment
    else throw new Error('Expected a trust-score update')
    return { trustScore: score }
  })
  return { service: new TrustService(prisma), score: () => score }
}

describe('concurrent trust deltas with stale reads', () => {
  it('preserves two concurrent action rewards', async () => {
    const run = createService()
    await Promise.all([
      run.service.logAction({ userId: 'user-1', action: TrustAction.UPVOTE }),
      run.service.logAction({ userId: 'user-1', action: TrustAction.LISTING_APPROVED }),
    ])
    expect(run.score()).toBe(107)
  })

  it('preserves a reversal concurrent with an approval reward', async () => {
    const run = createService()
    await Promise.all([
      run.service.reverseLogAction({ userId: 'user-1', originalAction: TrustAction.UPVOTE }),
      run.service.logAction({ userId: 'user-1', action: TrustAction.LISTING_APPROVED }),
    ])
    expect(run.score()).toBe(105)
  })

  it('preserves a manual adjustment concurrent with an approval reward', async () => {
    const run = createService()
    await Promise.all([
      run.service.applyManualAdjustment({
        userId: 'user-1',
        adjustment: -10,
        reason: 'Correction',
        adminUserId: 'admin-1',
      }),
      run.service.logAction({ userId: 'user-1', action: TrustAction.LISTING_APPROVED }),
    ])
    expect(run.score()).toBe(96)
  })

  it('preserves a bulk adjustment concurrent with an approval reward', async () => {
    const run = createService()
    await Promise.all([
      run.service.applyBulkManualAdjustments({
        adjustments: new Map([['user-1', -10]]),
        reason: 'Correction',
        adminUserId: 'admin-1',
      }),
      run.service.logAction({ userId: 'user-1', action: TrustAction.LISTING_APPROVED }),
    ])
    expect(run.score()).toBe(96)
  })
})

describe('committed trust analytics', () => {
  it('uses the actual increment results when concurrent actions read the same old score', async () => {
    const run = createService()
    await Promise.all([
      run.service.logAction({ userId: 'user-1', action: TrustAction.UPVOTE }),
      run.service.logAction({ userId: 'user-1', action: TrustAction.LISTING_APPROVED }),
    ])
    expect(
      vi.mocked(analytics.trust.trustScoreChanged).mock.calls.map(([change]) => change.newScore),
    ).toEqual([101, 107])
  })

  it('waits for its transaction to commit before emitting analytics', async () => {
    const run = createService()
    const commit = Promise.withResolvers<void>()
    database.$transaction.mockImplementationOnce(
      async (operation: (transaction: typeof database) => Promise<unknown>) => {
        const result = await operation(database)
        await commit.promise
        return result
      },
    )
    const action = run.service.logAction({ userId: 'user-1', action: TrustAction.UPVOTE })
    try {
      await vi.waitFor(() => expect(database.trustActionLog.create).toHaveBeenCalledOnce())
      expect(analytics.trust.trustScoreChanged).not.toHaveBeenCalled()
    } finally {
      commit.resolve()
      await action
    }
    expect(analytics.trust.trustScoreChanged).toHaveBeenCalledOnce()
  })

  it('does not emit for a transaction that fails to commit', async () => {
    const run = createService()
    database.$transaction.mockImplementationOnce(
      async (operation: (transaction: typeof database) => Promise<unknown>) => {
        await operation(database)
        throw new Error('commit failed')
      },
    )
    await expect(
      run.service.logAction({ userId: 'user-1', action: TrustAction.UPVOTE }),
    ).rejects.toThrow('commit failed')
    expect(analytics.trust.trustScoreChanged).not.toHaveBeenCalled()
    expect(analytics.trust.trustLevelChanged).not.toHaveBeenCalled()
  })
})
