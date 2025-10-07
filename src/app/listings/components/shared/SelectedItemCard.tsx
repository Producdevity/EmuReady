'use client'

import { X } from 'lucide-react'
import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  leftContent: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  badge?: ReactNode
  onClear: () => void
  className?: string
}

export function SelectedItemCard(props: Props) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl bg-white dark:bg-gray-800/50 shadow-sm dark:shadow-none dark:ring-1 dark:ring-white/10 transition-all duration-200 hover:shadow-md dark:hover:ring-white/20',
        props.className,
      )}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Left content (thumbnail or icon) */}
        <div className="flex-shrink-0">{props.leftContent}</div>

        {/* Center content (title and subtitle) */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{props.title}</h3>
            {props.badge}
          </div>
          {props.subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{props.subtitle}</p>
          )}
        </div>

        {/* Right content (change button) */}
        <button
          type="button"
          onClick={props.onClear}
          className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          aria-label="Change selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
