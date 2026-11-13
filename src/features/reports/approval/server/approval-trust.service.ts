import { TRUST_ACTIONS } from '@/lib/trust/config'
import { ApprovalStatus, TrustAction, type Prisma } from '@orm'
import { type ApprovalTrustRepository } from './approval-trust.repository'
import {
  APPROVAL_TRUST_SOURCE,
  approvalReportIdKey,
  type ApprovalTrustInput,
} from '../shared/approval-trust.types'

function approvalAction(status: ApprovalStatus) {
  if (status === ApprovalStatus.APPROVED) return TrustAction.LISTING_APPROVED
  if (status === ApprovalStatus.REJECTED) return TrustAction.LISTING_REJECTED
  return null
}

export class ApprovalTrustService {
  constructor(private readonly repository: ApprovalTrustRepository) {}

  // The repository must share the transaction that writes the report status.
  async reconcile(input: ApprovalTrustInput) {
    if (!input.authorId || input.previousStatus === input.newStatus) return null

    // Automatic approval can produce an approved report without an approval trust action.
    const previousContribution = await this.repository.statusContribution(input.authorId, input)
    const action = approvalAction(input.newStatus)
    const reportKey = approvalReportIdKey(input.reportType)
    const metadata = {
      [reportKey]: input.reportId,
      source: APPROVAL_TRUST_SOURCE,
      adminUserId: input.actorId,
      previousStatus: input.previousStatus,
      newStatus: input.newStatus,
      reason: input.reason ?? 'Report status changed',
    }
    const entries: Omit<Prisma.TrustActionLogCreateManyInput, 'userId'>[] = []
    const compensationAction =
      previousContribution < 0
        ? TrustAction.ADMIN_ADJUSTMENT_POSITIVE
        : TrustAction.ADMIN_ADJUSTMENT_NEGATIVE

    if (previousContribution !== 0) {
      entries.push({
        action: compensationAction,
        weight: -previousContribution,
        metadata: { ...metadata, reversedContribution: previousContribution },
      })
    }
    if (action) {
      entries.push({
        action,
        weight: TRUST_ACTIONS[action].weight,
        metadata,
      })
    }
    if (entries.length === 0) return null

    const delta = entries.reduce((total, entry) => total + entry.weight, 0)
    const newScore = await this.repository.appendReconciliation(input.authorId, entries)
    return {
      userId: input.authorId,
      action: action ?? compensationAction,
      entries: entries.map((entry) => ({ action: entry.action, weight: entry.weight })),
      delta,
      oldScore: newScore - delta,
      newScore,
    }
  }
}
