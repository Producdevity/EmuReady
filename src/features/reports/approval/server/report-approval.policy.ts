import { AppError, ResourceError } from '@/lib/errors'
import { type ListingType } from '@/schemas/common'
import { hasPermission, PERMISSIONS } from '@/utils/permission-system'
import { hasRolePermission } from '@/utils/permissions'
import { ApprovalStatus, Role, type User } from '@orm'

export type ApprovalActor = Pick<User, 'id' | 'role'> & { permissions?: string[] }
type ApprovalIntent = 'review' | 'permission-review' | 'override' | 'reset'

export function assertCanChangeReportStatus(
  actor: ApprovalActor,
  intent: ApprovalIntent,
  reportType: ListingType,
  newStatus: ApprovalStatus,
): void {
  if (intent === 'override') {
    if (!hasRolePermission(actor.role, Role.SUPER_ADMIN))
      AppError.insufficientRole(Role.SUPER_ADMIN)
    return
  }
  if (intent === 'reset') {
    if (!hasRolePermission(actor.role, Role.MODERATOR)) AppError.insufficientRole(Role.MODERATOR)
    return
  }
  if (intent === 'permission-review') {
    if (!hasPermission(actor.permissions, PERMISSIONS.APPROVE_LISTINGS))
      AppError.insufficientPermissions(PERMISSIONS.APPROVE_LISTINGS)
    return
  }
  if (!hasRolePermission(actor.role, Role.DEVELOPER)) {
    const errors = reportType === 'handheld' ? ResourceError.listing : ResourceError.pcListing
    return newStatus === ApprovalStatus.REJECTED
      ? errors.requiresDeveloperToReject()
      : errors.requiresDeveloperToApprove()
  }
}

export function requiresEmulatorVerification(actor: ApprovalActor, intent: ApprovalIntent) {
  return intent === 'review' && !hasRolePermission(actor.role, Role.MODERATOR)
}
