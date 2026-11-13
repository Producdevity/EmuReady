import { type z } from 'zod'
import { logger } from '@/lib/logger'
import { invalidateListingSeo, invalidatePcListingSeo } from '@/server/cache/invalidation'
import { NOTIFICATION_EVENTS, notificationEventEmitter } from '@/server/notifications/eventEmitter'
import {
  invalidateCatalogCompatibilityCacheForDevice,
  listingStatsCache,
} from '@/server/utils/cache/instances'
import { trackTrustScoreChange } from '@/server/utils/trust-score-analytics'
import { ApprovalStatus } from '@orm'
import { type ApprovalTrustService } from './approval-trust.service'
import { type ReportApprovalRepository } from './report-approval.repository'
import { type ReportApprovalResultSchema } from '../shared/report-approval.schemas'

interface ApprovalEffectsInput {
  report: NonNullable<Awaited<ReturnType<ReportApprovalRepository['find']>>>
  updated: z.output<typeof ReportApprovalResultSchema>
  trustChange: Awaited<ReturnType<ApprovalTrustService['reconcile']>>
  actorId: string
  notes: string | null
}

export async function completeReportApproval(input: ApprovalEffectsInput): Promise<void> {
  trackTrustScoreChange(input.trustChange)
  const report = input.report
  const status = input.updated.status
  listingStatsCache.delete(report.reportType === 'handheld' ? 'listing-stats' : 'pc-listing-stats')
  if (report.reportType === 'handheld') {
    invalidateCatalogCompatibilityCacheForDevice(report.deviceId)
  }
  if (report.status === ApprovalStatus.APPROVED || status === ApprovalStatus.APPROVED) {
    if (report.reportType === 'handheld') await invalidateListingSeo(report)
    else await invalidatePcListingSeo(report)
  }
  if (status === ApprovalStatus.PENDING) return
  const approved = status === ApprovalStatus.APPROVED
  try {
    if (report.reportType === 'handheld') {
      notificationEventEmitter.emitNotificationEvent({
        eventType: approved
          ? NOTIFICATION_EVENTS.LISTING_APPROVED
          : NOTIFICATION_EVENTS.LISTING_REJECTED,
        entityType: 'listing',
        entityId: report.id,
        triggeredBy: input.actorId,
        payload: approved
          ? {
              listingId: report.id,
              approvedBy: input.actorId,
              approvedAt: input.updated.processedAt,
            }
          : {
              listingId: report.id,
              rejectedBy: input.actorId,
              rejectedAt: input.updated.processedAt,
              rejectionReason: input.notes,
            },
      })
    } else {
      notificationEventEmitter.emitNotificationEvent({
        eventType: approved
          ? NOTIFICATION_EVENTS.PC_LISTING_APPROVED
          : NOTIFICATION_EVENTS.PC_LISTING_REJECTED,
        entityType: 'pcListing',
        entityId: report.id,
        triggeredBy: input.actorId,
        payload: approved
          ? {
              pcListingId: report.id,
              gameId: report.gameId,
              approvedBy: input.actorId,
              approvedAt: input.updated.processedAt,
            }
          : {
              pcListingId: report.id,
              rejectedBy: input.actorId,
              rejectedAt: input.updated.processedAt,
              rejectionReason: input.notes,
            },
      })
    }
  } catch (error) {
    logger.error('Report decision notification failed', error)
  }
}
