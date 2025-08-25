'use client'

import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { type ActivityTypes } from '@/server/services/activity.service'

interface Props {
  comment: ActivityTypes.RecentComment
}

export function CommentActivityItem(props: Props) {
  const href =
    props.comment.listingType === 'handheld'
      ? `/listings/${props.comment.listingId}`
      : `/pc-listings/${props.comment.listingId}`

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
          &ldquo;{props.comment.content}&rdquo;
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          on {props.comment.gameTitle}
          {props.comment.authorName && ` by ${props.comment.authorName}`}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {formatDistanceToNow(props.comment.createdAt, { addSuffix: true })}
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
