'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { type AdminNavItem } from '../../data'
import ApprovalCountBadge from '../ApprovalCountBadge'

interface QuickNavigationProps {
  items: AdminNavItem[]
  title?: string
  defaultExpanded?: boolean
  className?: string
}

export function QuickNavigation({
  items,
  title = 'Quick Navigation',
  defaultExpanded = true,
  className,
}: QuickNavigationProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  if (items.length === 0) return null

  return (
    <nav
      data-testid="admin-nav"
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700',
        className,
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
          {!isExpanded && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({items.length} sections)
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto -mx-2">
            <div className="flex gap-2 px-2 min-w-min">
              {items.slice(0, 5).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative flex-shrink-0',
                    'px-3 py-2',
                    'bg-gray-50 dark:bg-gray-700/50',
                    'rounded-lg',
                    'border border-gray-200 dark:border-gray-600',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                    'hover:border-gray-300 dark:hover:border-gray-500',
                    'transition-all',
                    'min-w-[120px]',
                    'text-center',
                  )}
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.label}
                  </span>
                  <ApprovalCountBadge href={item.href} />
                </Link>
              ))}
              {items.length > 5 && (
                <button
                  className={cn(
                    'relative flex-shrink-0',
                    'px-3 py-2',
                    'bg-gray-50 dark:bg-gray-700/50',
                    'rounded-lg',
                    'border border-gray-200 dark:border-gray-600',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                    'hover:border-gray-300 dark:hover:border-gray-500',
                    'transition-all',
                    'min-w-[120px]',
                    'text-center',
                  )}
                  onClick={() => {
                    // Could open a modal or navigate to a full list
                    setIsExpanded(false)
                  }}
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    +{items.length - 5} more
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Show all items in a grid on larger screens */}
          <div className="hidden lg:block mt-4">
            <div className="grid grid-cols-4 xl:grid-cols-5 gap-3">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative',
                    'p-3',
                    'bg-gray-50 dark:bg-gray-700/50',
                    'rounded-lg',
                    'border border-gray-200 dark:border-gray-600',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                    'hover:border-gray-300 dark:hover:border-gray-500',
                    'transition-all',
                  )}
                >
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {item.label}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {item.description}
                  </p>
                  <ApprovalCountBadge href={item.href} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
