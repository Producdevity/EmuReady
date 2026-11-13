import { describe, expect, it, vi } from 'vitest'
import { prisma } from '@/server/db'
import { ApprovalStatus, TrustAction, type TrustActionLog } from '@orm'
import { ApprovalTrustRepository } from './approval-trust.repository'
import { ApprovalTrustService } from './approval-trust.service'
import { APPROVAL_TRUST_SOURCE } from '../shared/approval-trust.types'

vi.mock('@/server/db', () => ({ prisma: {} }))

function setup(initialContribution: number) {
  const repository = new ApprovalTrustRepository(prisma)
  let contribution = initialContribution
  let score = 100 + initialContribution
  const history: Pick<TrustActionLog, 'action' | 'weight'>[] = []
  const read = vi
    .spyOn(repository, 'statusContribution')
    .mockImplementation(async () => contribution)
  const append = vi
    .spyOn(repository, 'appendReconciliation')
    .mockImplementation(async (_authorId, entries) => {
      const delta = entries.reduce((sum, entry) => sum + entry.weight, 0)
      history.push(...entries.map((entry) => ({ action: entry.action, weight: entry.weight })))
      contribution += entries.reduce((sum, entry) => sum + entry.weight, 0)
      score += delta
      return score
    })
  return {
    service: new ApprovalTrustService(repository),
    history,
    read,
    append,
    contribution: () => contribution,
    score: () => score,
  }
}

const statuses = [
  { status: ApprovalStatus.PENDING, contribution: 0 },
  { status: ApprovalStatus.APPROVED, contribution: 6 },
  { status: ApprovalStatus.REJECTED, contribution: -8 },
]

describe.each(['handheld', 'pc'] as const)('%s report approval trust', (reportType) => {
  for (const previous of statuses) {
    for (const next of statuses) {
      it(`${previous.status} → ${next.status} contributes ${next.contribution}`, async () => {
        const run = setup(previous.contribution)
        const input = {
          reportId: 'report-1',
          reportType,
          authorId: 'author-1',
          actorId: 'reviewer-1',
          previousStatus: previous.status,
          newStatus: next.status,
        }
        const result = await run.service.reconcile(input)

        expect(run.contribution()).toBe(next.contribution)
        expect(run.score()).toBe(100 + next.contribution)
        if (previous.status === next.status) {
          expect(result).toBeNull()
          expect(run.read).not.toHaveBeenCalled()
          expect(run.append).not.toHaveBeenCalled()
          return
        }

        expect(result?.delta).toBe(next.contribution - previous.contribution)
        expect(run.read).toHaveBeenCalledWith(input.authorId, input)
        const expectedWeights = [
          ...(previous.contribution === 0 ? [] : [-previous.contribution]),
          ...(next.contribution === 0 ? [] : [next.contribution]),
        ]
        expect(run.history.map((entry) => entry.weight)).toEqual(expectedWeights)
        const expectedActions = [
          ...(previous.contribution === 0
            ? []
            : [
                previous.contribution < 0
                  ? TrustAction.ADMIN_ADJUSTMENT_POSITIVE
                  : TrustAction.ADMIN_ADJUSTMENT_NEGATIVE,
              ]),
          ...(next.status === ApprovalStatus.PENDING
            ? []
            : [
                next.status === ApprovalStatus.APPROVED
                  ? TrustAction.LISTING_APPROVED
                  : TrustAction.LISTING_REJECTED,
              ]),
        ]
        expect(run.append).toHaveBeenCalledWith(
          input.authorId,
          expectedWeights.map((weight, index) =>
            expect.objectContaining({
              action: expectedActions[index],
              weight,
              metadata: expect.objectContaining({
                [reportType === 'handheld' ? 'listingId' : 'pcListingId']: input.reportId,
                source: APPROVAL_TRUST_SOURCE,
                adminUserId: input.actorId,
                previousStatus: previous.status,
                newStatus: next.status,
              }),
            }),
          ),
        )
      })
    }
  }

  it('reverses actual logged impact when historical actions do not match the old status', async () => {
    const run = setup(-2)
    await run.service.reconcile({
      reportId: 'report-1',
      reportType,
      authorId: 'author-1',
      actorId: 'reviewer-1',
      previousStatus: ApprovalStatus.APPROVED,
      newStatus: ApprovalStatus.REJECTED,
    })
    expect(run.history).toEqual([
      { action: TrustAction.ADMIN_ADJUSTMENT_POSITIVE, weight: 2 },
      { action: TrustAction.LISTING_REJECTED, weight: -8 },
    ])
    expect(run.contribution()).toBe(-8)
  })

  it('does not remove an approval reward that was never logged for an automatic approval', async () => {
    const run = setup(0)
    await run.service.reconcile({
      reportId: 'report-1',
      reportType,
      authorId: 'author-1',
      actorId: 'reviewer-1',
      previousStatus: ApprovalStatus.APPROVED,
      newStatus: ApprovalStatus.PENDING,
    })
    expect(run.append).not.toHaveBeenCalled()
    expect(run.score()).toBe(100)
  })

  it('preserves action history through repeated status changes', async () => {
    const run = setup(0)
    let previousStatus: ApprovalStatus = ApprovalStatus.PENDING
    for (const nextStatus of [
      ApprovalStatus.APPROVED,
      ApprovalStatus.REJECTED,
      ApprovalStatus.APPROVED,
      ApprovalStatus.PENDING,
      ApprovalStatus.REJECTED,
      ApprovalStatus.PENDING,
    ]) {
      await run.service.reconcile({
        reportId: 'report-1',
        reportType,
        authorId: 'author-1',
        actorId: 'reviewer-1',
        previousStatus,
        newStatus: nextStatus,
      })
      previousStatus = nextStatus
    }
    expect(run.history).toHaveLength(8)
    expect(run.history[0]).toEqual({ action: TrustAction.LISTING_APPROVED, weight: 6 })
    expect(run.contribution()).toBe(0)
    expect(run.score()).toBe(100)
  })

  it('does not query or write trust for a report without an author', async () => {
    const run = setup(0)
    await run.service.reconcile({
      reportId: 'report-1',
      reportType,
      authorId: null,
      actorId: 'reviewer-1',
      previousStatus: ApprovalStatus.PENDING,
      newStatus: ApprovalStatus.APPROVED,
    })
    expect(run.read).not.toHaveBeenCalled()
    expect(run.append).not.toHaveBeenCalled()
  })
})
