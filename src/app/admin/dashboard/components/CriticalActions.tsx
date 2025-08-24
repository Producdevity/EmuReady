'use client'

import { formatDistanceToNow } from 'date-fns'
import { AlertTriangle, Clock, User, ArrowRight, Sparkles } from 'lucide-react'
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
        return `${count} Game${count > 1 ? 's' : ''}`
      case 'listing':
        return `${count} Handheld listing${count > 1 ? 's' : ''}`
      case 'pcListing':
        return `${count} PC listing${count > 1 ? 's' : ''}`
      default:
        return `${count} item${count > 1 ? 's' : ''}`
    }
  }

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'game':
        return '🎮'
      case 'listing':
        return '📱'
      case 'pcListing':
        return '💻'
      default:
        return '📋'
    }
  }

  const totalCount = actions.length
  const urgentCount = actions.filter(
    (a) => new Date().getTime() - a.createdAt.getTime() > 24 * 60 * 60 * 1000,
  ).length

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        'bg-gradient-to-br from-amber-50 via-orange-50 to-red-50',
        'dark:from-amber-950/30 dark:via-orange-950/30 dark:to-red-950/30',
        'border border-amber-200/50 dark:border-amber-800/50',
        'rounded-xl shadow-lg',
        'backdrop-blur-sm',
        className,
      )}
    >
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-100/10 to-orange-100/10 dark:via-amber-900/10 dark:to-orange-900/10 pointer-events-none" />

      {/* Header with pulse animation for urgency */}
      <div className="relative px-6 py-4 border-b border-gradient-to-r from-amber-200/50 via-orange-200/50 to-red-200/50 dark:from-amber-800/50 dark:via-orange-800/50 dark:to-red-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              {urgentCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </div>
            <div>
              <h2 className="font-bold text-lg bg-gradient-to-r from-amber-700 to-orange-600 dark:from-amber-400 dark:to-orange-300 bg-clip-text text-transparent">
                Action Required
              </h2>
              <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5">
                Review pending submissions
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-sm font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              {totalCount} pending
            </span>
            {urgentCount > 0 && (
              <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                {urgentCount} urgent
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content with modern card design */}
      <div className="relative p-6 space-y-4">
        {Object.entries(groupedActions).map(([type, items]) => {
          const oldestItem = items.reduce((oldest, current) =>
            current.createdAt < oldest.createdAt ? current : oldest,
          )
          const isUrgent =
            new Date().getTime() - oldestItem.createdAt.getTime() > 24 * 60 * 60 * 1000

          return (
            <div
              key={type}
              className={cn(
                'group relative',
                'bg-white/80 dark:bg-gray-900/50',
                'border rounded-lg',
                'transition-all duration-200',
                'hover:shadow-md hover:scale-[1.01]',
                isUrgent
                  ? 'border-red-200 dark:border-red-800/50'
                  : 'border-amber-200/50 dark:border-amber-800/30',
              )}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-2xl mt-0.5">{getActionIcon(type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {getActionLabel(type, items.length)} awaiting review
                      </p>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <User className="h-3.5 w-3.5" />
                          <span className="truncate">
                            {oldestItem.submittedBy || 'Unknown user'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {formatDistanceToNow(oldestItem.createdAt, { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      {items.length > 1 && (
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                          +{items.length - 1} more waiting
                        </p>
                      )}
                    </div>
                  </div>
                  <Link
                    href={getActionUrl(items[0])}
                    className={cn(
                      'inline-flex items-center gap-1.5',
                      'px-4 py-2 rounded-lg',
                      'text-sm font-medium',
                      'transition-all duration-200',
                      'group-hover:translate-x-0.5',
                      isUrgent
                        ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600',
                    )}
                  >
                    Review
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
