import { ApprovalTrustRepository } from '@/features/reports/approval/server/approval-trust.repository'
import { ApprovalTrustService } from '@/features/reports/approval/server/approval-trust.service'
import { ResourceError } from '@/lib/errors'
import { TRUST_ACTIONS } from '@/lib/trust/config'
import {
  ReportModerationRepository,
  type ListingReportModerationRecord,
  type PcListingReportModerationRecord,
} from '@/server/repositories/report-moderation.repository'
import { TrustScoreRepository } from '@/server/repositories/trust-score.repository'
import { isPrismaError, PRISMA_ERROR_CODES } from '@/server/utils/prisma-errors'
import { withRetryTransaction } from '@/server/utils/transactions'
import { trackTrustScoreChange } from '@/server/utils/trust-score-analytics'
import { ApprovalStatus, ReportStatus, TrustAction, Prisma, type PrismaClient } from '@orm/client'

const FINAL_REPORT_STATUSES: ReadonlySet<ReportStatus> = new Set([
  ReportStatus.RESOLVED,
  ReportStatus.DISMISSED,
])

interface UpdateListingReportStatusInput {
  id: string
  status: ReportStatus
  reviewNotes?: string
  reviewerId: string
}

interface UpdatePcListingReportStatusInput {
  reportId: string
  status: ReportStatus
  reviewNotes?: string
  reviewerId: string
}

function isFinalReportStatus(status: ReportStatus): boolean {
  return FINAL_REPORT_STATUSES.has(status)
}

function assertCanTransitionReportStatus(params: {
  currentStatus: ReportStatus
  nextStatus: ReportStatus
  onFinalStatusChange: () => never
}): void {
  if (params.currentStatus === params.nextStatus) return

  if (isFinalReportStatus(params.currentStatus)) {
    params.onFinalStatusChange()
  }
}

function shouldRejectReportedContent(params: {
  statusChanged: boolean
  nextStatus: ReportStatus
  currentListingStatus: ApprovalStatus | null | undefined
}): boolean {
  return (
    params.statusChanged &&
    params.nextStatus === ReportStatus.RESOLVED &&
    params.currentListingStatus === ApprovalStatus.APPROVED
  )
}

async function recordReporterTrustEffect(params: {
  tx: Prisma.TransactionClient
  report: ListingReportModerationRecord | PcListingReportModerationRecord
  nextStatus: ReportStatus
  reviewerId: string
  reviewNotes?: string
}) {
  const action =
    params.nextStatus === ReportStatus.RESOLVED
      ? TrustAction.REPORT_CONFIRMED
      : params.nextStatus === ReportStatus.DISMISSED
        ? TrustAction.FALSE_REPORT
        : null
  if (!action) return null
  const reportKey = 'listingId' in params.report ? 'listingId' : 'pcListingId'
  const reportId =
    'listingId' in params.report ? params.report.listingId : params.report.pcListingId
  const result = await new TrustScoreRepository(params.tx).appendActions(
    params.report.reportedById,
    [
      {
        action,
        weight: TRUST_ACTIONS[action].weight,
        metadata: {
          reportId: params.report.id,
          [reportKey]: reportId,
          reviewedBy: params.reviewerId,
          reason: params.report.reason,
          ...(params.reviewNotes === undefined ? {} : { reviewNotes: params.reviewNotes }),
        },
      },
    ],
  )
  return { ...result, userId: params.report.reportedById, action }
}

function translateListingReportModerationError(error: unknown): never {
  if (isPrismaError(error, PRISMA_ERROR_CODES.RECORD_NOT_FOUND)) {
    return ResourceError.listingReport.notFound()
  }

  throw error
}

function translatePcListingReportModerationError(error: unknown): never {
  if (isPrismaError(error, PRISMA_ERROR_CODES.RECORD_NOT_FOUND)) {
    return ResourceError.pcListingReport.notFound()
  }

  throw error
}

export class ReportModerationService {
  constructor(private readonly prisma: PrismaClient) {}

  async updateListingReportStatus(input: UpdateListingReportStatusInput) {
    try {
      const result = await withRetryTransaction(
        this.prisma,
        async (tx) => {
          const repository = new ReportModerationRepository(tx)
          const report = await repository.findListingReportForModeration(input.id)

          if (!report) return ResourceError.listingReport.notFound()

          assertCanTransitionReportStatus({
            currentStatus: report.status,
            nextStatus: input.status,
            onFinalStatusChange: ResourceError.listingReport.cannotChangeFinalStatus,
          })

          const statusChanged = report.status !== input.status
          const reviewedAt = new Date()
          let approvalTrustChange: Awaited<ReturnType<ApprovalTrustService['reconcile']>> = null
          let reporterTrustChange: Awaited<ReturnType<typeof recordReporterTrustEffect>> = null

          if (
            shouldRejectReportedContent({
              statusChanged,
              nextStatus: input.status,
              currentListingStatus: report.listing?.status,
            })
          ) {
            await repository.rejectListingFromReport({
              listingId: report.listingId,
              reviewerId: input.reviewerId,
              reviewNotes: input.reviewNotes,
              processedAt: reviewedAt,
            })
            approvalTrustChange = await new ApprovalTrustService(
              new ApprovalTrustRepository(tx),
            ).reconcile({
              reportId: report.listingId,
              reportType: 'handheld',
              authorId: report.listing?.authorId ?? null,
              actorId: input.reviewerId,
              previousStatus: ApprovalStatus.APPROVED,
              newStatus: ApprovalStatus.REJECTED,
              reason: input.reviewNotes ?? 'Rejected due to confirmed content report',
            })
          }

          if (statusChanged && isFinalReportStatus(input.status)) {
            reporterTrustChange = await recordReporterTrustEffect({
              tx,
              report,
              nextStatus: input.status,
              reviewerId: input.reviewerId,
              reviewNotes: input.reviewNotes,
            })
          }

          const updatedReport = await repository.updateListingReportStatus({
            id: input.id,
            status: input.status,
            reviewNotes: input.reviewNotes,
            reviewerId: input.reviewerId,
            reviewedAt,
          })
          return { updatedReport, approvalTrustChange, reporterTrustChange }
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      )
      trackTrustScoreChange(result.approvalTrustChange)
      trackTrustScoreChange(result.reporterTrustChange)
      return result.updatedReport
    } catch (error) {
      translateListingReportModerationError(error)
    }
  }

  async updatePcListingReportStatus(input: UpdatePcListingReportStatusInput) {
    try {
      const result = await withRetryTransaction(
        this.prisma,
        async (tx) => {
          const repository = new ReportModerationRepository(tx)
          const report = await repository.findPcListingReportForModeration(input.reportId)

          if (!report) return ResourceError.pcListingReport.notFound()

          assertCanTransitionReportStatus({
            currentStatus: report.status,
            nextStatus: input.status,
            onFinalStatusChange: ResourceError.pcListingReport.cannotChangeFinalStatus,
          })

          const statusChanged = report.status !== input.status
          const reviewedAt = new Date()
          let approvalTrustChange: Awaited<ReturnType<ApprovalTrustService['reconcile']>> = null
          let reporterTrustChange: Awaited<ReturnType<typeof recordReporterTrustEffect>> = null

          if (
            shouldRejectReportedContent({
              statusChanged,
              nextStatus: input.status,
              currentListingStatus: report.pcListing?.status,
            })
          ) {
            await repository.rejectPcListingFromReport({
              pcListingId: report.pcListingId,
              reviewerId: input.reviewerId,
              reviewNotes: input.reviewNotes,
              processedAt: reviewedAt,
            })
            approvalTrustChange = await new ApprovalTrustService(
              new ApprovalTrustRepository(tx),
            ).reconcile({
              reportId: report.pcListingId,
              reportType: 'pc',
              authorId: report.pcListing?.authorId ?? null,
              actorId: input.reviewerId,
              previousStatus: ApprovalStatus.APPROVED,
              newStatus: ApprovalStatus.REJECTED,
              reason: input.reviewNotes ?? 'Rejected due to confirmed content report',
            })
          }

          if (statusChanged && isFinalReportStatus(input.status)) {
            reporterTrustChange = await recordReporterTrustEffect({
              tx,
              report,
              nextStatus: input.status,
              reviewerId: input.reviewerId,
              reviewNotes: input.reviewNotes,
            })
          }

          const updatedReport = await repository.updatePcListingReportStatus({
            id: input.reportId,
            status: input.status,
            reviewNotes: input.reviewNotes,
            reviewerId: input.reviewerId,
            reviewedAt,
          })
          return { updatedReport, approvalTrustChange, reporterTrustChange }
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      )
      trackTrustScoreChange(result.approvalTrustChange)
      trackTrustScoreChange(result.reporterTrustChange)
      return result.updatedReport
    } catch (error) {
      translatePcListingReportModerationError(error)
    }
  }

  async deleteListingReport(id: string) {
    try {
      return await new ReportModerationRepository(this.prisma).deleteListingReport(id)
    } catch (error) {
      translateListingReportModerationError(error)
    }
  }

  async deletePcListingReport(id: string) {
    try {
      return await new ReportModerationRepository(this.prisma).deletePcListingReport(id)
    } catch (error) {
      translatePcListingReportModerationError(error)
    }
  }
}
