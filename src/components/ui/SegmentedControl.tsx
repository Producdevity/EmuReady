'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

const sizeClasses = {
  sm: 'h-8 text-xs',
  md: 'h-11 text-sm', // Match the height of other filter elements
  lg: 'h-12 text-base',
}

const paddingClasses = {
  sm: 'px-2',
  md: 'px-3',
  lg: 'px-4',
}

export interface SegmentedControlOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

interface Props<T extends string> {
  options: readonly [SegmentedControlOption<T>, ...SegmentedControlOption<T>[]]
  value: T
  onChange: (value: T) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function SegmentedControl<T extends string>(props: Props<T>) {
  const size = props.size ?? 'md'

  return (
    <div
      className={cn(
        'relative inline-grid gap-1 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm p-1',
        sizeClasses[size],
        props.className,
      )}
      style={{ gridTemplateColumns: `repeat(${props.options.length}, minmax(0, 1fr))` }}
    >
      {props.options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => props.onChange(option.value)}
          className={cn(
            'relative flex items-center justify-center gap-1.5 font-medium rounded-lg transition-all duration-200',
            paddingClasses[size],
            props.value === option.value
              ? 'bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200',
          )}
        >
          {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
          <span className="whitespace-nowrap">{option.label}</span>
        </button>
      ))}
    </div>
  )
}
