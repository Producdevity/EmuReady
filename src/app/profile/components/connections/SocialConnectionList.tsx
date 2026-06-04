'use client'

import { Users } from 'lucide-react'
import { type ReactNode } from 'react'
import { Pagination, Skeleton } from '@/components/ui'
import { ConnectionUserRow } from './ConnectionUserRow'
import type { RouterOutput } from '@/types/trpc'

type VisibleFollowers = Extract<RouterOutput['social']['getFollowers'], { visibility: 'visible' }>
export type SocialUser = VisibleFollowers['items'][number]['follower']
export type PaginationMeta = VisibleFollowers['pagination']

export function EmptyState(props: { message: string }) {
  return (
    <div className="text-center py-8">
      <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
      <p className="text-gray-500 dark:text-gray-400">{props.message}</p>
    </div>
  )
}

interface Props {
  items: { id: string; user: SocialUser }[] | undefined
  isPending: boolean
  pagination?: PaginationMeta
  onPageChange: (page: number) => void
  emptyMessage: string
  renderAction: (user: SocialUser) => ReactNode
  header?: ReactNode
  showActionSkeleton?: boolean
  actionSkeletonClassName?: string
  skeletonRows?: number
}

function SocialConnectionListSkeleton(props: {
  actionClassName: string
  showAction: boolean
  rows: number
}) {
  return (
    <div className="space-y-1" aria-label="Loading social connections">
      {Array.from({ length: props.rows }, (_, index) => (
        <div key={index} className="flex items-center gap-4 py-3 px-2 rounded-lg">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Skeleton className="h-10 w-10 flex-shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-6 w-32" />
              <div className="flex items-center gap-2 mt-0.5">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            </div>
          </div>
          {props.showAction && (
            <Skeleton className={`${props.actionClassName} h-8 flex-shrink-0 rounded-md`} />
          )}
        </div>
      ))}
    </div>
  )
}

export function SocialConnectionList(props: Props) {
  if (props.isPending) {
    return (
      <div className="space-y-4">
        {props.header}
        <SocialConnectionListSkeleton
          actionClassName={props.actionSkeletonClassName ?? 'w-24'}
          rows={props.skeletonRows ?? 3}
          showAction={props.showActionSkeleton ?? true}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {props.header}

      {!props.items || props.items.length === 0 ? (
        <EmptyState message={props.emptyMessage} />
      ) : (
        <div className="space-y-1">
          {props.items.map((item) => (
            <ConnectionUserRow
              key={item.id}
              user={item.user}
              action={props.renderAction(item.user)}
            />
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
