'use client'

import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { type ActivityTypes } from '@/server/services/activity.service'

interface Props {
  report: ActivityTypes.RecentReport
}

export function ReportActivityItem(props: Props) {
  const href =
    props.report.type === 'listing'
      ? `/admin/reports?listing=${props.report.targetId}`
      : `/admin/reports?pcListing=${props.report.targetId}`

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-red-900 dark:text-red-300">{props.report.reason}</p>
        {props.report.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
            {props.report.description}
          </p>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatDistanceToNow(props.report.createdAt, { addSuffix: true })}
          {props.report.reporterName && ` by ${props.report.reporterName}`}
        </p>
      </div>
      <Link
        href={href}
        className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
      >
        → Review
      </Link>
    </div>
  )
}
