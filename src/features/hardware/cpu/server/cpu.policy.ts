import { requireActorPermission, type Actor } from '@/server/auth/actor'
import { PERMISSIONS } from '@/utils/permission-system'

export function assertCanManageCpu(actor: Actor): void {
  requireActorPermission(actor, PERMISSIONS.MANAGE_DEVICES)
}

export function assertCanViewCpuStats(actor: Actor): void {
  requireActorPermission(actor, PERMISSIONS.VIEW_STATISTICS)
}
