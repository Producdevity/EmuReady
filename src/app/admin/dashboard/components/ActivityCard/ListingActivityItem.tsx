'use client'

import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { type ActivityTypes } from '@/server/services/activity.service'

interface Props {
  listing: ActivityTypes.RecentListing
}

export function ListingActivityItem(props: Props) {
  const href =
    props.listing.type === 'handheld'
      ? `/listings/${props.listing.id}`
      : `/pc-listings/${props.listing.id}`

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1 min-w-0">
        <Link
          href={href}
          className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          {props.listing.gameTitle}
        </Link>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {props.listing.type === 'handheld'
            ? `on ${props.listing.deviceName}`
            : `${props.listing.cpuName || 'Unknown CPU'} / ${props.listing.gpuName || 'Unknown GPU'}`}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {formatDistanceToNow(props.listing.createdAt, { addSuffix: true })}
          {props.listing.authorName && ` by ${props.listing.authorName}`}
        </p>
      </div>
      <Link
        href={href}
        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
      >
        → View
      </Link>
    </div>
  )
}
