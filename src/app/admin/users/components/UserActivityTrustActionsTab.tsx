'use client'

import { Badge, LocalizedDate, Pagination } from '@/components/ui'
import { cn } from '@/lib/utils'
import { type RouterOutput } from '@/types/trpc'
import { getTrustActionBadgeColor } from '@/utils/badge-colors'

type UserData = NonNullable<RouterOutput['users']['getUserById']>

interface Props {
  trustActionLogs: UserData['trustActionLogs']
  page: number
  onPageChange: (page: number) => void
  isFetching: boolean
}

function UserActivityTrustActionsTab(props: Props) {
  return (
    <div className={cn('space-y-3', props.isFetching && 'opacity-60 transition-opacity')}>
      {/* Count */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {props.trustActionLogs.pagination.total} trust actions
      </div>

      {/* Trust Action Rows */}
      {props.trustActionLogs.items.length > 0 ? (
        <div className="space-y-1">
          {props.trustActionLogs.items.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-2 text-xs rounded-md bg-gray-50/50 dark:bg-gray-800/50"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Badge
                  variant={getTrustActionBadgeColor(log.action)}
                  size="sm"
                  className="text-xs flex-shrink-0"
                >
                  {log.action}
                </Badge>
                <span className="text-gray-500 dark:text-gray-400">
                  <LocalizedDate date={log.createdAt} format="dateTime" />
                </span>
              </div>
              <span
                className={cn(
                  'ml-2 font-medium flex-shrink-0',
                  log.weight > 0
                    ? 'text-green-600'
                    : log.weight < 0
                      ? 'text-red-600'
                      : 'text-gray-500',
                )}
              >
                {log.weight > 0 ? '+' : ''}
                {log.weight}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400 py-4 text-center">
          No trust actions yet
        </p>
      )}

      {/* Pagination */}
      {props.trustActionLogs.pagination.pages > 1 && (
        <Pagination
          page={props.page}
          totalPages={props.trustActionLogs.pagination.pages}
          totalItems={props.trustActionLogs.pagination.total}
          itemsPerPage={props.trustActionLogs.pagination.limit}
          onPageChange={props.onPageChange}
        />
      )}
    </div>
  )
}

export default UserActivityTrustActionsTab
