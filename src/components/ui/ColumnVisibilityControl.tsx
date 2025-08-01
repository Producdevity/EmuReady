/**
 * @documentation /docs/COLUMN_VISIBILITY.md
 */
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeClosed, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui'
import {
  type ColumnDefinition,
  type UseColumnVisibilityReturn,
} from '@/hooks/useColumnVisibility'

interface Props {
  columns: ColumnDefinition[]
  columnVisibility: UseColumnVisibilityReturn
  className?: string
}

export function ColumnVisibilityControl(props: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const visibleCount = props.columns.filter((col) =>
    props.columnVisibility.isColumnVisible(col.key),
  ).length

  const toggleableColumns = props.columns.filter((col) => !col.alwaysVisible)

  const displayCount = props.columnVisibility.isHydrated
    ? `${visibleCount}/${props.columns.length}`
    : '...'

  return (
    <div className={`relative ${props.className ?? ''}`} ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Eye className="h-4 w-4" />
        Columns ({displayCount})
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  props.columnVisibility.showAll()
                }}
                className="flex-1 text-xs"
              >
                Show All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  props.columnVisibility.hideAll()
                }}
                className="flex-1 text-xs"
              >
                Hide All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  props.columnVisibility.resetToDefaults()
                }}
                className="flex-1 text-xs"
              >
                Reset
              </Button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {props.columns.map((column) => {
              const isVisible = props.columnVisibility.isColumnVisible(
                column.key,
              )
              const isToggleable = !column.alwaysVisible

              return (
                <div
                  key={column.key}
                  className={`flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    !isToggleable ? 'opacity-50' : 'cursor-pointer'
                  }`}
                  onClick={() => {
                    if (isToggleable) {
                      props.columnVisibility.toggleColumn(column.key)
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <motion.div
                      className="relative"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <AnimatePresence mode="wait">
                        {isVisible ? (
                          <motion.div
                            key="eye-open"
                            initial={{ scale: 0.8, opacity: 0, rotateX: -90 }}
                            animate={{
                              scale: 1,
                              opacity: 1,
                              rotateX: 0,
                              transition: { duration: 0.3, ease: 'easeOut' },
                            }}
                            exit={{
                              scale: 0.8,
                              opacity: 0,
                              rotateX: 90,
                              transition: { duration: 0.2, ease: 'easeIn' },
                            }}
                          >
                            <Eye className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="eye-closed"
                            initial={{ scale: 0.8, opacity: 0, rotateX: 90 }}
                            animate={{
                              scale: 1,
                              opacity: 1,
                              rotateX: 0,
                              transition: { duration: 0.3, ease: 'easeOut' },
                            }}
                            exit={{
                              scale: 0.8,
                              opacity: 0,
                              rotateX: -90,
                              transition: { duration: 0.2, ease: 'easeIn' },
                            }}
                          >
                            <EyeClosed className="h-4 w-4 text-gray-400" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {column.label}
                    </span>
                  </div>

                  {column.alwaysVisible && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Always visible
                    </span>
                  )}

                  {isToggleable && (
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={() =>
                        props.columnVisibility.toggleColumn(column.key)
                      }
                      onClick={(ev) => ev.stopPropagation()}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  )}
                </div>
              )
            })}
          </div>

          {toggleableColumns.length === 0 && (
            <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400">
              All columns are always visible
            </div>
          )}
        </div>
      )}
    </div>
  )
}
