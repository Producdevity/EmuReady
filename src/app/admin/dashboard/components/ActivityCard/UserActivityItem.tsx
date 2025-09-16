'use client'

import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { type ActivityTypes } from '@/server/services/activity.service'
import { hasRolePermission } from '@/utils/permissions'
import { Role } from '@orm'

interface Props {
  user: ActivityTypes.RecentUser
  userRole?: Role
}

export function UserActivityItem(props: Props) {
  const canViewAdminProfile = hasRolePermission(props.userRole, Role.ADMIN)
  const href = canViewAdminProfile
    ? `/admin/users?search=${props.user.email}`
    : `/users/${props.user.id}`

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1 min-w-0">
        <Link
          href={href}
          className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          {props.user.name || 'Unknown User'}
        </Link>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatDistanceToNow(props.user.createdAt, { addSuffix: true })}
        </p>
      </div>
      <Link
        href={href}
        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
      >
        → Profile
      </Link>
    </div>
  )
}
