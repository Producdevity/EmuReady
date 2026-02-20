'use client'

import { Users } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { type ReactNode } from 'react'
import { Badge, LoadingSpinner, Pagination, TrustLevelBadge } from '@/components/ui'
import { getRoleVariant } from '@/utils/badge-colors'
import { formatUserRole } from '@/utils/format'
import type { RouterOutput } from '@/types/trpc'

export type SocialUser = RouterOutput['social']['getFollowers']['items'][number]['follower']
export type PaginationMeta = RouterOutput['social']['getFollowers']['pagination']

export function UserRow(props: { user: SocialUser; action?: ReactNode }) {
  return (
    <div className="flex items-center gap-4 py-3 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <Link href={`/users/${props.user.id}`} className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
          <Image
            src={props.user.profileImage ?? '/placeholder/profile.svg'}
            alt={props.user.name ?? 'User'}
            width={40}
            height={40}
            className="object-cover w-full h-full"
            unoptimized
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {props.user.name ?? 'Anonymous'}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant={getRoleVariant(props.user.role)} size="sm">
              {formatUserRole(props.user.role)}
            </Badge>
            <TrustLevelBadge trustScore={props.user.trustScore} size="sm" />
          </div>
        </div>
      </Link>
      {props.action && <div className="flex-shrink-0">{props.action}</div>}
    </div>
  )
}

export function EmptyState(props: { message: string }) {
  return (
    <div className="text-center py-8">
      <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
      <p className="text-gray-500 dark:text-gray-400">{props.message}</p>
    </div>
  )
}

export function SocialConnectionList(props: {
  items: { id: string; user: SocialUser }[] | undefined
  isPending: boolean
  pagination?: PaginationMeta
  onPageChange: (page: number) => void
  emptyMessage: string
  renderAction: (user: SocialUser) => ReactNode
  header?: ReactNode
}) {
  if (props.isPending) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      {props.header}

      {!props.items || props.items.length === 0 ? (
        <EmptyState message={props.emptyMessage} />
      ) : (
        <div className="space-y-1">
          {props.items.map((item) => (
            <UserRow key={item.id} user={item.user} action={props.renderAction(item.user)} />
          ))}
          {props.pagination && props.pagination.pages > 1 && (
            <div className="pt-4">
              <Pagination
                page={props.pagination.page}
                totalPages={props.pagination.pages}
                totalItems={props.pagination.total}
                itemsPerPage={props.pagination.limit}
                onPageChange={props.onPageChange}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
