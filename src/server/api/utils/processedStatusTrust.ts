import { ApprovalStatus, TrustAction } from '@orm'

interface ProcessedStatusTrustInput {
  previousStatus: ApprovalStatus
  newStatus: ApprovalStatus
  authorId?: string | null
}

interface ProcessedStatusTrustAction {
  userId: string
  action: TrustAction
}

export function getProcessedStatusTrustAction(
  input: ProcessedStatusTrustInput,
): ProcessedStatusTrustAction | null {
  if (!input.authorId || input.previousStatus === input.newStatus) return null

  switch (input.newStatus) {
    case ApprovalStatus.APPROVED:
      return { userId: input.authorId, action: TrustAction.LISTING_APPROVED }
    case ApprovalStatus.REJECTED:
      return { userId: input.authorId, action: TrustAction.LISTING_REJECTED }
    case ApprovalStatus.PENDING:
      return null
  }
}
