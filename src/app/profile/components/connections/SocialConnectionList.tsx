'use client'

import { Users } from 'lucide-react'
import { type ReactNode } from 'react'
import { LoadingSpinner, Pagination } from '@/components/ui'
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
}

export function SocialConnectionList(props: Props) {
  if (props.isPending) return <LoadingSpinner /> // TODO: use a custom Skeleton

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
