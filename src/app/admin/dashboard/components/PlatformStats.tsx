'use client'

import { RefreshCw, Users, FileText, AlertCircle, Clock } from 'lucide-react'
import { TrendIcon } from '@/app/admin/dashboard/components/TrendIcon'
import { cn } from '@/lib/utils'
import { type TimeRange } from '@/schemas/activity'
import { type ActivityTypes } from '@/server/services/activity.service'

export const timeRangeLabels: Record<TimeRange, string> = {
  '24h': 'Last 24 hours',
  '48h': 'Last 48 hours',
  '7d': 'Last 7 days',
}

const getTrendColor = (change: number) => {
  if (change > 0) return 'text-green-600 dark:text-green-400'
  if (change < 0) return 'text-red-600 dark:text-red-400'
  return 'text-gray-600 dark:text-gray-400'
}

interface Props {
  stats: ActivityTypes.PlatformStats
  timeRange: TimeRange
  onRefresh: () => void
  isLoading?: boolean
  className?: string
}

export function PlatformStats(props: Props) {
  const isLoading = props.isLoading ?? false

  const stats_data = [
    {
      label: 'New Users',
      value: props.stats.newUsersCount,
      change: props.stats.newUsersChange,
      icon: <Users className="h-5 w-5" />,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Handheld Reports',
      value: props.stats.newListingsCount,
      change: props.stats.newListingsChange,
      icon: <FileText className="h-5 w-5" />,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'PC Reports',
      value: props.stats.newPcListingsCount,
      change: props.stats.newPcListingsChange,
      icon: <FileText className="h-5 w-5" />,
      color: 'text-purple-600 dark:text-purple-400',
    },
  ]

  const pending_data = [
    {
      label: 'Active Reports',
      value: props.stats.activeReportsCount,
      urgent: props.stats.activeReportsCount > 0,
    },
    {
      label: 'Pending Games',
      value: props.stats.pendingGamesCount,
      urgent: props.stats.pendingGamesCount > 5,
    },
    {
      label: 'Pending Listings',
      value: props.stats.pendingListingsCount + props.stats.pendingPcListingsCount,
      urgent: props.stats.pendingListingsCount + props.stats.pendingPcListingsCount > 10,
    },
  ]

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800',
        'rounded-lg shadow-sm',
        'border border-gray-200 dark:border-gray-700',
        props.className,
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <h3 className="font-semibold text-gray-900 dark:text-white">Platform Stats</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeRangeLabels[props.timeRange]}
            </span>
            <button
              onClick={props.onRefresh}
              disabled={isLoading}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                'hover:bg-gray-100 dark:hover:bg-gray-700',
                'text-gray-500 dark:text-gray-400',
                isLoading && 'animate-spin',
              )}
              aria-label="Refresh stats"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4 space-y-4">
        {/* Growth Stats */}
        <div className="space-y-3">
          {stats_data.map((stat) => (
            <div key={stat.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={stat.color}>{stat.icon}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{stat.label}:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stat.value}
                </span>
                {stat.change !== 0 && (
                  <div className="flex items-center gap-1">
                    <TrendIcon change={stat.change} />
                    <span className={cn('text-xs font-medium', getTrendColor(stat.change))}>
                      {stat.change > 0 && '+'}
                      {stat.change}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700" />

        {/* Pending Items */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Requires Attention
          </h4>
          {pending_data.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}:</span>
              <div className="flex items-center gap-2">
                {item.urgent && <AlertCircle className="h-4 w-4 text-orange-500" />}
                <span
                  className={cn(
                    'text-sm font-medium',
                    item.urgent
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-gray-900 dark:text-white',
                  )}
                >
                  {item.value}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Total Pending */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Total Pending Approvals:
            </span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {props.stats.pendingApprovalsCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
