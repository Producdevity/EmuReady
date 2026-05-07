import { ApprovalStatus } from '@orm'

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  [ApprovalStatus.PENDING]: 'Pending',
  [ApprovalStatus.APPROVED]: 'Approved',
  [ApprovalStatus.REJECTED]: 'Rejected',
} as const

export const APPROVAL_STATUS_OPTIONS = Object.values(ApprovalStatus).map((status) => ({
  id: status,
  name: APPROVAL_STATUS_LABELS[status],
}))

const APPROVAL_STATUS_VALUES: ReadonlySet<string> = new Set(Object.values(ApprovalStatus))

export function isApprovalStatus(value: unknown): value is ApprovalStatus {
  return typeof value === 'string' && APPROVAL_STATUS_VALUES.has(value)
}
