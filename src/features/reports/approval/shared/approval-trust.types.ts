import { type ListingType } from '@/schemas/common'
import { type ApprovalStatus } from '@orm'

export const APPROVAL_TRUST_SOURCE = 'report_status_reconciliation'

export interface ApprovalTrustInput {
  reportId: string
  reportType: ListingType
  authorId: string | null
  actorId: string
  previousStatus: ApprovalStatus
  newStatus: ApprovalStatus
  reason?: string
}

export function approvalReportIdKey(reportType: ListingType) {
  return reportType === 'handheld' ? 'listingId' : 'pcListingId'
}
