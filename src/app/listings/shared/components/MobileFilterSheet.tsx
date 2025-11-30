'use client'

import { X, FunnelIcon } from 'lucide-react'
import { type PropsWithChildren, useEffect, useRef } from 'react'

interface Props extends PropsWithChildren {
  title: string
  onClose: () => void
}

export function MobileFilterSheet({ onClose, ...props }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const startTrapRef = useRef<HTMLSpanElement>(null)
  const endTrapRef = useRef<HTMLSpanElement>(null)

  // Body scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  // Initial focus on mount only
  useEffect(() => {
    if (closeBtnRef.current) closeBtnRef.current.focus()
    else if (containerRef.current) containerRef.current.focus()
  }, [])

  // Escape key handling
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.preventDefault()
        onClose()
      }
    }
    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="lg:hidden fixed inset-0 z-50 flex"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-filter-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />

      {/* Sidebar Content - Full width on mobile */}
      <div className="relative w-full flex">
        <div
          ref={containerRef}
          tabIndex={-1}
          className="w-full bg-white dark:bg-gray-900 shadow-xl transform animate-slide-up"
        >
          {/* Focus trap sentinels */}
          <span
            ref={startTrapRef}
            tabIndex={0}
            aria-hidden="true"
            onFocus={() => {
              // When focus tries to leave backwards, wrap to container (then to first focusable inside)
              containerRef.current?.focus()
            }}
          />
          {/* Close button header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
            <h2
              id="mobile-filter-title"
              className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"
            >
              <FunnelIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              {props.title}
            </h2>
            <button
              type="button"
              aria-label="Close filters sidebar"
              onClick={onClose}
              ref={closeBtnRef}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="h-full overflow-y-auto">
            <div className="p-6 pb-36">{props.children}</div>
          </div>

          {/* End sentinel to wrap focus forward */}
          <span
            ref={endTrapRef}
            tabIndex={0}
            aria-hidden="true"
            onFocus={() => {
              containerRef.current?.focus()
            }}
          />
        </div>
      </div>
    </div>
  )
}
