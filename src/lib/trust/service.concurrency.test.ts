import { describe, expect, it, vi } from 'vitest'
import { prisma } from '@/server/db'
import { TrustAction, type Prisma } from '@orm'
import { TrustService } from './service'

vi.mock('@/lib/analytics', () => ({
  default: { trust: { trustScoreChanged: vi.fn(), trustLevelChanged: vi.fn() } },
}))

const database = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
  trustActionLog: { create: vi.fn(), createMany: vi.fn() },
}))
vi.mock('@/server/db', () => ({ prisma: database }))

function createService() {
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
