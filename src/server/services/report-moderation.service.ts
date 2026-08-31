import { ResourceError } from '@/lib/errors'
import { TrustService } from '@/lib/trust/service'
import {
  ReportModerationRepository,
  type ListingReportModerationRecord,
  type PcListingReportModerationRecord,
} from '@/server/repositories/report-moderation.repository'
import { isPrismaError, PRISMA_ERROR_CODES } from '@/server/utils/prisma-errors'
import {
  ApprovalStatus,
  ReportStatus,
  TrustAction,
  type Prisma,
  type PrismaClient,
} from '@orm/client'

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

async function applyListingReportTrustEffect(params: {
  tx: Prisma.TransactionClient
  report: ListingReportModerationRecord
  nextStatus: ReportStatus
  reviewerId: string
  reviewNotes?: string
}): Promise<void> {
  const trustService = new TrustService(params.tx)

  if (params.nextStatus === ReportStatus.RESOLVED) {
    await trustService.logAction({
      userId: params.report.reportedById,
      action: TrustAction.REPORT_CONFIRMED,
      metadata: {
        reportId: params.report.id,
        listingId: params.report.listingId,
        reviewedBy: params.reviewerId,
        reason: params.report.reason,
      },
    })
    return
  }

  if (params.nextStatus === ReportStatus.DISMISSED) {
    await trustService.logAction({
      userId: params.report.reportedById,
      action: TrustAction.FALSE_REPORT,
      metadata: {
        reportId: params.report.id,
        listingId: params.report.listingId,
        reviewedBy: params.reviewerId,
        reason: params.report.reason,
        reviewNotes: params.reviewNotes,
      },
    })
  }
}

async function applyPcListingReportTrustEffect(params: {
  tx: Prisma.TransactionClient
  report: PcListingReportModerationRecord
  nextStatus: ReportStatus
  reviewerId: string
  reviewNotes?: string
}): Promise<void> {
  const trustService = new TrustService(params.tx)

  if (params.nextStatus === ReportStatus.RESOLVED) {
    await trustService.logAction({
      userId: params.report.reportedById,
      action: TrustAction.REPORT_CONFIRMED,
      metadata: {
        reportId: params.report.id,
        pcListingId: params.report.pcListingId,
        reviewedBy: params.reviewerId,
        reason: params.report.reason,
      },
    })
    return
  }

  if (params.nextStatus === ReportStatus.DISMISSED) {
    await trustService.logAction({
      userId: params.report.reportedById,
      action: TrustAction.FALSE_REPORT,
      metadata: {
        reportId: params.report.id,
        pcListingId: params.report.pcListingId,
        reviewedBy: params.reviewerId,
        reason: params.report.reason,
        reviewNotes: params.reviewNotes,
      },
    })
  }
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
      return await this.prisma.$transaction(async (tx) => {
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
        }

        if (statusChanged && isFinalReportStatus(input.status)) {
          await applyListingReportTrustEffect({
            tx,
            report,
            nextStatus: input.status,
            reviewerId: input.reviewerId,
            reviewNotes: input.reviewNotes,
          })
        }

        return repository.updateListingReportStatus({
          id: input.id,
          status: input.status,
          reviewNotes: input.reviewNotes,
          reviewerId: input.reviewerId,
          reviewedAt,
        })
      })
    } catch (error) {
      translateListingReportModerationError(error)
    }
  }

  async updatePcListingReportStatus(input: UpdatePcListingReportStatusInput) {
    try {
      return await this.prisma.$transaction(async (tx) => {
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
        }

        if (statusChanged && isFinalReportStatus(input.status)) {
          await applyPcListingReportTrustEffect({
            tx,
            report,
            nextStatus: input.status,
            reviewerId: input.reviewerId,
            reviewNotes: input.reviewNotes,
          })
        }

        return repository.updatePcListingReportStatus({
          id: input.reportId,
          status: input.status,
          reviewNotes: input.reviewNotes,
          reviewerId: input.reviewerId,
          reviewedAt,
        })
      })
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
