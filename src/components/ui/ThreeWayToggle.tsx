'use client'

import { motion } from 'framer-motion'
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

export interface ThreeWayToggleOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

interface Props<T extends string> {
  options: [
    ThreeWayToggleOption<T>,
    ThreeWayToggleOption<T>,
    ThreeWayToggleOption<T>,
  ]
  value: T
  onChange: (value: T) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

// TODO: I feel like the english language has a better name for this
export function ThreeWayToggle<T extends string>(props: Props<T>) {
  const size = props.size ?? 'md'
  const selectedIndex = props.options.findIndex(
    (opt) => opt.value === props.value,
  )

  return (
    <div
      className={cn(
        'relative flex items-center rounded-xl bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 shadow-sm p-1',
        sizeClasses[size],
        props.className,
      )}
    >
      {/* Sliding background indicator: TODO: LOOKS LIKE SHIEETTTT */}
      <motion.div
        className="absolute inset-y-1 rounded-lg bg-blue-500 shadow-md"
        initial={false}
        animate={{
          x: `${selectedIndex * (100 / props.options.length)}%`,
          width: `${100 / props.options.length}%`,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />

      {/* Options */}
      {props.options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => props.onChange(option.value)}
          className={cn(
            'relative z-10 flex-1 flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors duration-200',
            paddingClasses[size],
            props.value === option.value
              ? 'text-white'
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
