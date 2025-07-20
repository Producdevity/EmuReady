'use client'

import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { getRoleColor } from '@/utils/badgeColors'
import { formatUserRole } from '@/utils/format'
import { Role } from '@orm'

interface RoleBadgeProps {
  role: Role
  size?: 'sm' | 'md'
  className?: string
}

export function RoleBadge(props: RoleBadgeProps) {
  const { role, size = 'sm', className } = props

  // Don't show badge for regular users
  if (role === Role.USER) return null

  return (
    <Badge size={size} pill className={cn(getRoleColor(role), className)}>
      {formatUserRole(role)}
    </Badge>
  )
}
