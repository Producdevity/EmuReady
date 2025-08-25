'use client'

import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { type ActivityTypes } from '@/server/services/activity.service'

interface Props {
  ban: ActivityTypes.RecentBan
}

export function BanActivityItem(props: Props) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {props.ban.userName || 'Unknown User'}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {props.ban.reason || 'No reason provided'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatDistanceToNow(props.ban.createdAt, { addSuffix: true })}
          {props.ban.bannedBy && ` by ${props.ban.bannedBy}`}
        </p>
      </div>
      <Link
        href="/admin/user-bans"
        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
      >
        → View
      </Link>
    </div>
  )
}
