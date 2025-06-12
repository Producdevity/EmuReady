import { ApprovalStatus, Role } from '@orm'
import type { BadgeVariant } from '@/components/ui/Badge'

const approvalStatusVariantsMap: Record<ApprovalStatus, BadgeVariant> = {
  [ApprovalStatus.APPROVED]: 'success',
  [ApprovalStatus.PENDING]: 'warning',
  [ApprovalStatus.REJECTED]: 'danger',
}

export function getApprovalStatusVariant(status: ApprovalStatus | null) {
  return status ? (approvalStatusVariantsMap[status] ?? 'default') : 'default'
}

const approvalStatusColorMap: Record<ApprovalStatus, string> = {
  [ApprovalStatus.APPROVED]:
    'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100',
  [ApprovalStatus.REJECTED]:
    'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100',
  [ApprovalStatus.PENDING]:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100',
}

export function getApprovalStatusColor(status: ApprovalStatus | null) {
  const defaultStyling =
    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'

  return status
    ? (approvalStatusColorMap[status] ?? defaultStyling)
    : defaultStyling
}

const roleVariantsMap: Record<Role, BadgeVariant> = {
  [Role.SUPER_ADMIN]: 'primary',
  [Role.ADMIN]: 'primary',
  [Role.AUTHOR]: 'success',
  [Role.USER]: 'default',
}

export function getRoleVariant(role: Role): BadgeVariant {
  return roleVariantsMap[role] || 'default'
}
