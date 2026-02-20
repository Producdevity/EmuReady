'use client'

import { motion } from 'framer-motion'
import { type KeyboardEvent, type ReactNode, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'

export interface SegmentedTab {
  id: string
  label: string
  icon?: ReactNode
  count?: number
}

interface Props {
  tabs: SegmentedTab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  /** Unique layoutId for framer-motion animated indicator. Required when multiple SegmentedTabs exist on the same page. */
  layoutId?: string
  size?: 'sm' | 'md'
  className?: string
}

export function SegmentedTabs(props: Props) {
  const layoutId = props.layoutId ?? 'segmented-tabs-indicator'
  const size = props.size ?? 'md'
  const containerRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    const container = containerRef.current
    if (!container) return

    const tabs = Array.from(container.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
    const currentIndex = tabs.findIndex((tab) => tab === document.activeElement)
    if (currentIndex === -1) return

    let targetIndex: number | null = null

    switch (e.key) {
      case 'ArrowRight':
        targetIndex = (currentIndex + 1) % tabs.length
        break
      case 'ArrowLeft':
        targetIndex = (currentIndex - 1 + tabs.length) % tabs.length
        break
      case 'Home':
        targetIndex = 0
        break
      case 'End':
        targetIndex = tabs.length - 1
        break
      default:
        return
    }

    e.preventDefault()
    tabs[targetIndex]?.focus()
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn(
        'inline-flex w-full items-center rounded-xl border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-900/60',
        size === 'sm' ? 'gap-0.5' : 'gap-1',
        props.className,
      )}
      role="tablist"
      onKeyDown={handleKeyDown}
    >
      {props.tabs.map((tab) => {
        const isActive = props.activeTab === tab.id

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => props.onTabChange(tab.id)}
            className={cn(
              'relative flex flex-1 items-center justify-center gap-2 rounded-lg font-semibold transition-colors select-none',
              size === 'sm' ? 'min-h-[36px] px-3 py-1.5 text-xs' : 'min-h-[40px] px-4 py-2 text-sm',
              isActive
                ? 'text-gray-900 dark:text-gray-100'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
            )}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-gray-800"
                transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              {tab.icon}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={cn(
                    'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full',
                    isActive
                      ? 'bg-gray-900/10 text-gray-700 dark:bg-white/10 dark:text-gray-300'
                      : 'bg-gray-200/80 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
                  )}
                >
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
