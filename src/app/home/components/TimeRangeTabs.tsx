'use client'

import { cn } from '@/lib/utils'

export type TimeRangeId = 'allTime' | 'thisMonth' | 'thisWeek'

export interface TimeRangeTab {
  id: TimeRangeId
  label: string
}

export const TIME_RANGE_TABS: readonly TimeRangeTab[] = [
  { id: 'allTime', label: 'All Time' },
  { id: 'thisMonth', label: 'This Month' },
  { id: 'thisWeek', label: 'This Week' },
] as const

interface TimeRangeTabsProps {
  value: TimeRangeId
  onChange: (value: TimeRangeId) => void
  className?: string
}

export function TimeRangeTabs(props: TimeRangeTabsProps) {
  return (
    <div
      className={cn(
        'flex w-full items-center justify-around gap-2 rounded-full bg-gray-100 p-1 text-sm font-medium dark:bg-gray-900/70 lg:w-auto',
        props.className,
      )}
    >
      {TIME_RANGE_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => props.onChange(tab.id)}
          title={tab.label}
          aria-label={tab.label}
          aria-pressed={props.value === tab.id}
          className={cn(
            props.value === tab.id
              ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white',
            'rounded-full px-4 py-1.5 transition-colors',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
