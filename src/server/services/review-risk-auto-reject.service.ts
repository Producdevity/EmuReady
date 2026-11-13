import { type ApprovalActor } from '@/features/reports/approval/server/report-approval.policy'
import { ReportApprovalRepository } from '@/features/reports/approval/server/report-approval.repository'
import { ReportApprovalService } from '@/features/reports/approval/server/report-approval.service'
import { type ListingType } from '@/schemas/common'
import { ListingsRepository } from '@/server/repositories/listings.repository'
import { PcListingsRepository } from '@/server/repositories/pc-listings.repository'
import { getAutoRejectableReviewRiskItemsForCandidates } from '@/server/services/review-risk.service'
import { ApprovalStatus, type PrismaClient } from '@orm/client'

interface AutoRejectInput {
  prisma: PrismaClient
  actor: ApprovalActor
}

export interface ReviewRiskAutoRejectResult {
  success: true
  rejectedCount: number
  skippedCount: number
  message: string
}

async function autoRejectRiskyReports(
  params: AutoRejectInput,
  reportType: ListingType,
): Promise<ReviewRiskAutoRejectResult> {
  const repository =
    reportType === 'handheld'
      ? new ListingsRepository(params.prisma)
      : new PcListingsRepository(params.prisma)
  const items = await getAutoRejectableReviewRiskItemsForCandidates({
    prisma: params.prisma,
    loadCandidates: () => repository.getPendingListingRiskCandidates({}),
  })
  const reportLabel = reportType === 'handheld' ? 'handheld' : 'PC'
  if (items.length === 0) {
    return {
      success: true,
      rejectedCount: 0,
      skippedCount: 0,
      message: `No auto-rejectable review-risk ${reportLabel} reports found.`,
    }
  }
  const result = await new ReportApprovalService(
    new ReportApprovalRepository(params.prisma),
  ).reviewPending({
    reportIds: items.map((item) => item.id),
    reportType,
    newStatus: ApprovalStatus.REJECTED,
    actor: params.actor,
    notesById: new Map(items.map((item) => [item.id, item.processedNotes])),
  })
  const message = `Automatically rejected ${result.rejectedCount} review-risk ${reportLabel} report(s).`
  return {
    success: true,
    rejectedCount: result.rejectedCount,
    skippedCount: result.skippedCount,
    message:
      result.skippedCount === 0
        ? message
        : `${message} ${result.skippedCount} ${reportLabel} report(s) were skipped because they were already processed.`,
  }
}

export function autoRejectRiskyHandheldReports(params: AutoRejectInput) {
  return autoRejectRiskyReports(params, 'handheld')
}

export function autoRejectRiskyPcReports(params: AutoRejectInput) {
  return autoRejectRiskyReports(params, 'pc')
}
