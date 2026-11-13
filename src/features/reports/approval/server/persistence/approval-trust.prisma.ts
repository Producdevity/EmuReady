import { TrustAction, type Prisma } from '@orm'
import { APPROVAL_TRUST_SOURCE, type ApprovalTrustInput } from '../../shared/approval-trust.types'

export function statusContributionWhere(
  authorId: string,
  target: Pick<ApprovalTrustInput, 'reportId' | 'reportType'>,
): Prisma.TrustActionLogWhereInput {
  const reportKey = target.reportType === 'handheld' ? 'listingId' : 'pcListingId'
  return {
    userId: authorId,
    AND: [
      { metadata: { path: [reportKey], equals: target.reportId } },
      {
        OR: [
          { action: { in: [TrustAction.LISTING_APPROVED, TrustAction.LISTING_REJECTED] } },
          {
            action: {
              in: [TrustAction.ADMIN_ADJUSTMENT_POSITIVE, TrustAction.ADMIN_ADJUSTMENT_NEGATIVE],
            },
            metadata: { path: ['source'], equals: APPROVAL_TRUST_SOURCE },
          },
        ],
      },
    ],
  }
}
