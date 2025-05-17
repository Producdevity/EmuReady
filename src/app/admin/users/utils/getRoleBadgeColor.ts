import type { BadgeVariant } from '@/components/ui/Badge'
import { Role } from '@orm'

const roleBadgeColorsMap: Record<Role, BadgeVariant> = {
  [Role.SUPER_ADMIN]: 'primary',
  [Role.ADMIN]: 'primary',
  [Role.AUTHOR]: 'success',
  [Role.USER]: 'default',
}

function getRoleBadgeColor(role: Role): BadgeVariant {
  return roleBadgeColorsMap[role] || 'default'
}

export default getRoleBadgeColor
