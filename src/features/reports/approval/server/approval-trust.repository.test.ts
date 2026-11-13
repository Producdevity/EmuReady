import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/server/db'
import { TrustAction } from '@orm'
import { ApprovalTrustRepository } from './approval-trust.repository'
import { APPROVAL_TRUST_SOURCE } from '../shared/approval-trust.types'

const database = vi.hoisted(() => ({
  trustActionLog: { aggregate: vi.fn(), createMany: vi.fn() },
  user: { update: vi.fn() },
}))
vi.mock('@/server/db', () => ({ prisma: database }))

describe('report approval trust persistence', () => {
  const repository = new ApprovalTrustRepository(prisma)
  beforeEach(() => {
    vi.clearAllMocks()
    database.trustActionLog.aggregate.mockResolvedValue({ _sum: { weight: null } })
    database.trustActionLog.createMany.mockResolvedValue({ count: 1 })
    database.user.update.mockResolvedValue({ trustScore: 106 })
  })

  it.each(['handheld', 'pc'] as const)(
    'isolates %s status actions and this reconciler’s compensations',
    async (reportType) => {
      const result = await repository.statusContribution('author-1', {
        reportType,
        reportId: 'report-1',
      })
      expect(result).toBe(0)
      expect(database.trustActionLog.aggregate).toHaveBeenCalledWith({
        where: {
          userId: 'author-1',
          AND: [
            {
              metadata: {
                path: [reportType === 'handheld' ? 'listingId' : 'pcListingId'],
                equals: 'report-1',
              },
            },
            {
              OR: [
                { action: { in: [TrustAction.LISTING_APPROVED, TrustAction.LISTING_REJECTED] } },
                {
                  action: {
                    in: [
                      TrustAction.ADMIN_ADJUSTMENT_POSITIVE,
                      TrustAction.ADMIN_ADJUSTMENT_NEGATIVE,
                    ],
                  },
                  metadata: { path: ['source'], equals: APPROVAL_TRUST_SOURCE },
                },
              ],
            },
          ],
        },
        _sum: { weight: true },
      })
    },
  )

  it('increments the score and appends the audit entry within its supplied transaction', async () => {
    const entries = [{ action: TrustAction.LISTING_APPROVED, weight: 6 }]
    await expect(repository.appendReconciliation('author-1', entries)).resolves.toBe(106)
    expect(database.user.update).toHaveBeenCalledWith({
      where: { id: 'author-1' },
      data: { trustScore: { increment: 6 }, lastActiveAt: expect.any(Date) },
      select: { trustScore: true },
    })
    expect(database.trustActionLog.createMany).toHaveBeenCalledWith({
      data: entries.map((entry) => ({ ...entry, userId: 'author-1' })),
    })
  })

  it('fails without appending history when the author no longer exists', async () => {
    const error = Object.assign(new Error('Missing author'), { code: 'P2025' })
    database.user.update.mockRejectedValueOnce(error)
    await expect(repository.appendReconciliation('author-1', [])).rejects.toThrow('author-1')
    expect(database.trustActionLog.createMany).not.toHaveBeenCalled()
  })
})
