import { AppError } from '@/lib/errors'
import { requireUserActor, type Actor } from '@/server/auth/actor'
import { hasRolePermission } from '@/utils/permissions'
import { Role } from '@orm'

export function assertCanReadTemplates(actor: Actor) {
  if (!hasRolePermission(requireUserActor(actor).role, Role.ADMIN))
    return AppError.insufficientRole(Role.ADMIN)
}

export function assertCanWriteTemplates(actor: Actor) {
  if (!hasRolePermission(requireUserActor(actor).role, Role.SUPER_ADMIN))
    return AppError.insufficientRole(Role.SUPER_ADMIN)
}
