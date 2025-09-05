import { TRUST_ACTIONS } from '@/lib/trust/config'
import { ApprovalStatus, PermissionCategory, Role, type TrustAction } from '@orm'
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
  [ApprovalStatus.APPROVED]: 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100',
  [ApprovalStatus.REJECTED]: 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100',
  [ApprovalStatus.PENDING]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100',
}

export function getApprovalStatusColor(status: ApprovalStatus | null) {
  const defaultStyling = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'

  return status ? (approvalStatusColorMap[status] ?? defaultStyling) : defaultStyling
}

const roleVariantsMap: Record<Role, BadgeVariant> = {
  [Role.SUPER_ADMIN]: 'primary',
  [Role.ADMIN]: 'primary',
  [Role.DEVELOPER]: 'info',
  [Role.MODERATOR]: 'warning',
  [Role.AUTHOR]: 'success',
  [Role.USER]: 'default',
}

export function getRoleVariant(role: Role): BadgeVariant {
  return roleVariantsMap[role] || 'default'
}

const roleColorMap: Record<Role | 'UNKNOWN', string> = {
  [Role.USER]: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
  [Role.AUTHOR]: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
  [Role.MODERATOR]: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300',
  [Role.DEVELOPER]: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-300',
  [Role.ADMIN]: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300',
  [Role.SUPER_ADMIN]: 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300',
  UNKNOWN: 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
}

export function getRoleColor(role: Role): string {
  return roleColorMap[role] || roleColorMap.UNKNOWN
}

export function getTrustActionBadgeColor(action: TrustAction): BadgeVariant {
  const weight = TRUST_ACTIONS[action]?.weight ?? 0
  if (weight > 5) return 'success'
  if (weight > 0) return 'info'
  if (weight < -5) return 'danger'
  return 'warning'
}

const permissionCategoryVariantMap: Record<PermissionCategory, BadgeVariant> = {
  [PermissionCategory.CONTENT]: 'info',
  [PermissionCategory.MODERATION]: 'warning',
  [PermissionCategory.USER_MANAGEMENT]: 'primary',
  [PermissionCategory.SYSTEM]: 'danger',
}

export function getPermissionCategoryBadgeVariant(
  permissionCategory: PermissionCategory,
): BadgeVariant {
  return permissionCategoryVariantMap[permissionCategory] || 'default'
}
