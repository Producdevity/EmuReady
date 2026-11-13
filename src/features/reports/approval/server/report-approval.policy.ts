import { AppError, ResourceError } from '@/lib/errors'
import { type ListingType } from '@/schemas/common'
import { hasPermission, PERMISSIONS } from '@/utils/permission-system'
import { hasRolePermission } from '@/utils/permissions'
import { Role, type User } from '@orm'

export type ApprovalActor = Pick<User, 'id' | 'role'> & { permissions?: string[] }
type ApprovalIntent = 'review' | 'permission-review' | 'override' | 'reset'

export function assertCanChangeReportStatus(
  actor: ApprovalActor,
  intent: ApprovalIntent,
  reportType: ListingType,
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
    return reportType === 'handheld'
      ? ResourceError.listing.requiresDeveloperToApprove()
      : ResourceError.pcListing.requiresDeveloperToApprove()
  }
}

export function requiresEmulatorVerification(actor: ApprovalActor, intent: ApprovalIntent) {
  return intent === 'review' && !hasRolePermission(actor.role, Role.MODERATOR)
}
