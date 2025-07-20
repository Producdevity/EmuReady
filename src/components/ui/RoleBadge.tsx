import { getRoleColor } from '@/utils/badgeColors'
import { formatUserRole } from '@/utils/format'
import { Role } from '@orm'

interface RoleBadgeProps {
  role: Role
  className?: string
}

export function RoleBadge(props: RoleBadgeProps) {
  // Only show badges for elevated roles, not basic USER role
  if (props.role === Role.USER) {
    return null
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(props.role)} ${props.className || ''}`}
    >
      {formatUserRole(props.role)}
    </span>
  )
}
