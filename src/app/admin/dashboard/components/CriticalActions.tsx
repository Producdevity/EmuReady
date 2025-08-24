'use client'

import { formatDistanceToNow } from 'date-fns'
import { AlertCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { getApprovalRoute } from '@/app/admin/config/routes'
import { cn } from '@/lib/utils'
import { type ActivityTypes } from '@/server/services/activity.service'

interface CriticalActionsProps {
  actions: ActivityTypes.PendingApproval[]
  className?: string
}

export function CriticalActions({ actions, className }: CriticalActionsProps) {
  if (actions.length === 0) return null

  // Group actions by type
  const groupedActions = actions.reduce(
    (acc, action) => {
      if (!acc[action.type]) acc[action.type] = []
      acc[action.type].push(action)
      return acc
    },
    {} as Record<string, typeof actions>,
  )

  const getActionUrl = (action: ActivityTypes.PendingApproval) => {
    return getApprovalRoute(action.type as 'game' | 'listing' | 'pcListing')
  }

  const getActionLabel = (type: string, count: number) => {
    switch (type) {
      case 'game':
        return `${count} Game${count > 1 ? 's' : ''} pending approval`
      case 'listing':
        return `${count} Mobile listing${count > 1 ? 's' : ''} pending approval`
      case 'pcListing':
        return `${count} PC listing${count > 1 ? 's' : ''} pending approval`
      default:
        return `${count} item${count > 1 ? 's' : ''} pending`
    }
  }

  return (
    <div
      className={cn(
        'bg-orange-50 dark:bg-orange-900/20',
        'border border-orange-200 dark:border-orange-700',
        'rounded-lg shadow-sm',
        className,
      )}
    >
      <div className="px-4 py-3 border-b border-orange-200 dark:border-orange-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <h2 className="font-semibold text-orange-900 dark:text-orange-300">
              Critical Actions Required
            </h2>
          </div>
          <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
            {actions.length} items pending
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {Object.entries(groupedActions).map(([type, items]) => (
          <div key={type} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
                {getActionLabel(type, items.length)}
              </p>
              <Link
                href={getActionUrl(items[0])}
                className="flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 transition-colors"
              >
                Review All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Show first item as preview */}
            <div className="pl-4 text-xs text-orange-700 dark:text-orange-400">
              Latest: {items[0].title}
              {items[0].submittedBy && ` by ${items[0].submittedBy}`}
              {' • '}
              {formatDistanceToNow(items[0].createdAt, { addSuffix: true })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
