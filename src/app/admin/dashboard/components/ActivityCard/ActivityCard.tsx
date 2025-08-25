'use client'

import { RefreshCw, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { type PropsWithChildren, type ReactNode } from 'react'
import { type AdminRoute } from '@/app/admin/config/routes'
import { cn } from '@/lib/utils'
import { type TimeRange } from '@/schemas/activity'

interface Props extends PropsWithChildren {
  title: string
  icon?: ReactNode
  timeRange: TimeRange
  onTimeRangeChange: (range: TimeRange) => void
  onRefresh: () => void
  isLoading?: boolean
  viewAllHref?: AdminRoute | string
  className?: string
}

export function ActivityCard(props: Props) {
  const timeRanges: TimeRange[] = ['24h', '48h', '7d']

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800',
        'rounded-lg shadow-sm',
        'border border-gray-200 dark:border-gray-700',
        'flex flex-col',
        props.className,
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {props.icon}
            <h3 className="font-semibold text-gray-900 dark:text-white">{props.title}</h3>
          </div>
          <div className="flex items-center gap-2">
            {/* Time Range Selector */}
            <div className="flex rounded-md shadow-sm" role="group">
              {timeRanges.map((range) => (
                <button
                  key={range}
                  onClick={() => props.onTimeRangeChange(range)}
                  className={cn(
                    'px-3 py-1 text-xs font-medium transition-colors',
                    range === timeRanges[0] && 'rounded-l-md',
                    range === timeRanges[timeRanges.length - 1] && 'rounded-r-md',
                    props.timeRange === range
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600',
                    range !== timeRanges[0] && '-ml-px',
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
            {/* Refresh Button */}
            <button
              onClick={props.onRefresh}
              disabled={props.isLoading}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                'hover:bg-gray-100 dark:hover:bg-gray-700',
                'text-gray-500 dark:text-gray-400',
                props.isLoading && 'animate-spin',
              )}
              aria-label="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {props.isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          props.children
        )}
      </div>

      {/* Footer */}
      {props.viewAllHref && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <Link
            href={props.viewAllHref}
            className="flex items-center justify-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
