import { beforeEach, describe, expect, it, vi } from 'vitest'
import analytics from '@/lib/analytics'
import { logger } from '@/lib/logger'
import { invalidateListingSeo, invalidatePcListingSeo } from '@/server/cache/invalidation'
import { notificationEventEmitter } from '@/server/notifications/eventEmitter'
import { ApprovalStatus, TrustAction } from '@orm'
import { completeReportApproval } from './report-approval.effects'

vi.mock('@/lib/analytics', () => ({
  default: { trust: { trustScoreChanged: vi.fn(), trustLevelChanged: vi.fn() } },
}))
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }))
vi.mock('@/server/cache/invalidation', () => ({
  invalidateListingSeo: vi.fn(),
  invalidatePcListingSeo: vi.fn(),
}))
vi.mock('@/server/utils/cache/instances', () => ({
  listingStatsCache: { delete: vi.fn() },
  invalidateCatalogCompatibilityCacheForDevice: vi.fn(),
}))
vi.mock('@/server/notifications/eventEmitter', () => ({
  notificationEventEmitter: { emitNotificationEvent: vi.fn() },
  NOTIFICATION_EVENTS: {
    LISTING_APPROVED: 'handheld-approved',
    LISTING_REJECTED: 'handheld-rejected',
    PC_LISTING_APPROVED: 'pc-approved',
    PC_LISTING_REJECTED: 'pc-rejected',
  },
}))

beforeEach(() => vi.resetAllMocks())

describe.each(['handheld', 'pc'] as const)('%s committed decision effects', (reportType) => {
  function input(status: ApprovalStatus) {
    const common = {
      id: 'report-1',
      status: ApprovalStatus.APPROVED,
      authorId: 'author-1',
      emulatorId: 'emulator-1',
      gameId: 'game-1',
      author: { userBans: [] },
      processedAt: null,
      processedNotes: null,
    }
    const report =
      reportType === 'handheld'
        ? { ...common, reportType, deviceId: 'device-1' }
        : { ...common, reportType, cpuId: 'cpu-1', gpuId: null }
    return {
      report,
      updated: {
        id: report.id,
        status,
        processedAt: status === ApprovalStatus.PENDING ? null : new Date('2026-01-01'),
      },
      trustChange: null,
      actorId: 'reviewer-1',
      notes: 'Corrected decision',
    }
  }

  it('invalidates public content and sends a rejection notification', async () => {
    const decision = input(ApprovalStatus.REJECTED)
    await completeReportApproval(decision)
    expect(
      reportType === 'handheld' ? invalidateListingSeo : invalidatePcListingSeo,
    ).toHaveBeenCalledWith(decision.report)
    expect(notificationEventEmitter.emitNotificationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: `${reportType}-rejected`,
        entityId: 'report-1',
        triggeredBy: 'reviewer-1',
        payload: expect.objectContaining({
          rejectedAt: decision.updated.processedAt,
          rejectionReason: 'Corrected decision',
        }),
      }),
    )
  })

  it('invalidates an approved report returned to Pending without notifying approval or rejection', async () => {
    await completeReportApproval(input(ApprovalStatus.PENDING))
    expect(
      reportType === 'handheld' ? invalidateListingSeo : invalidatePcListingSeo,
    ).toHaveBeenCalledOnce()
    expect(notificationEventEmitter.emitNotificationEvent).not.toHaveBeenCalled()
  })

  it('keeps the committed decision successful if notification delivery fails', async () => {
    vi.mocked(notificationEventEmitter.emitNotificationEvent).mockImplementationOnce(() => {
      throw new Error('notification unavailable')
    })
    await expect(completeReportApproval(input(ApprovalStatus.REJECTED))).resolves.toBeUndefined()
    expect(logger.error).toHaveBeenCalledWith(
      'Report decision notification failed',
      expect.any(Error),
    )
  })

  it('tracks the committed net trust change', async () => {
    await completeReportApproval({
      ...input(ApprovalStatus.APPROVED),
      trustChange: {
        userId: 'author-1',
        action: TrustAction.LISTING_APPROVED,
        delta: 14,
        oldScore: 92,
        newScore: 106,
      },
    })
    expect(analytics.trust.trustScoreChanged).toHaveBeenCalledWith({
      userId: 'author-1',
      oldScore: 92,
      newScore: 106,
      action: TrustAction.LISTING_APPROVED,
      weight: 14,
    })
  })
})
