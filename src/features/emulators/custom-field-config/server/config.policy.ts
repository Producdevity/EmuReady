import { ResourceError } from '@/lib/errors'
import { requireActorPermission, type Actor } from '@/server/auth/actor'
import { PERMISSIONS } from '@/utils/permission-system'
import { hasRolePermission } from '@/utils/permissions'
import { Role } from '@orm'
import { type ConfigEmulatorRecord } from './persistence/config.prisma'

export function assertCanManageConfig(actor: Actor, emulator: ConfigEmulatorRecord) {
  const user = requireActorPermission(actor, PERMISSIONS.MANAGE_CUSTOM_FIELDS)
  if (
    !hasRolePermission(user.role, Role.MODERATOR) &&
    !emulator.verifiedDevelopers.some((developer) => developer.userId === user.userId)
  ) {
    ResourceError.customField.canOnlyManageVerified()
  }
}
