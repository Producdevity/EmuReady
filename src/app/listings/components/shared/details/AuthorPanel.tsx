'use client'

import Image from 'next/image'
import Link from 'next/link'
import { LocalizedDate } from '@/components/ui'
import type { ReactNode } from 'react'

interface Props {
  profileImage?: string | null
  authorName?: string | null
  authorId?: string | null
  bannedBadge?: ReactNode
  postedAt: Date
}

export function AuthorPanel(props: Props) {
  return (
    <div className="flex flex-col items-center gap-2 w-full md:w-auto md:min-w-[140px]">
      <div className="relative w-16 h-16 rounded-full overflow-hidden bg-indigo-200 dark:bg-indigo-800">
        {props.profileImage ? (
          <Image
            src={props.profileImage}
            alt={`${props.authorName ?? 'Author'}'s profile`}
            fill
            sizes="64px"
            className="object-cover"
            priority
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-indigo-700 dark:text-indigo-200">
            {props.authorName?.[0] ?? '?'}
          </div>
        )}
      </div>
      <div className="text-center">
        <div className="font-semibold text-gray-900 dark:text-white">
          {props.authorName ?? 'Unknown'}
        </div>
        {props.bannedBadge}
      </div>
      {props.authorId && (
        <Link
          href={`/users/${props.authorId}`}
          className="mt-2 text-indigo-600 hover:underline text-xs"
        >
          View Profile
        </Link>
      )}

      {/* Posted Date */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Posted</div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            <LocalizedDate date={props.postedAt} format="timeAgo" />
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500">
            <LocalizedDate date={props.postedAt} format="dateTime" />
          </div>
        </div>
      </div>
    </div>
  )
}
