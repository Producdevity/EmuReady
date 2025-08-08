'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeClosed, X, Settings2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui'
import { type ColumnDefinition, type UseColumnVisibilityReturn } from '@/hooks/useColumnVisibility'
import { cn } from '@/lib/utils'

interface Props {
  columns: ColumnDefinition[]
  columnVisibility: UseColumnVisibilityReturn
  className?: string
  triggerClassName?: string
}

export function MobileColumnVisibilityControl(props: Props) {
  const [isOpen, setIsOpen] = useState(false)

  const visibleCount = props.columns.filter((col) =>
    props.columnVisibility.isColumnVisible(col.key),
  ).length

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          'p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors',
          props.triggerClassName,
        )}
        aria-label="Column visibility settings"
        title="Column visibility settings"
      >
        <Settings2 className="w-4 h-4" />
      </button>

      {/* Mobile Sheet */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Sheet Content */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={cn(
                'fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl shadow-xl z-50',
                'max-h-[80vh] flex flex-col',
                props.className,
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Visible Columns ({visibleCount}/{props.columns.length})
                </h2>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => props.columnVisibility.showAll()}
                  className="flex-1"
                >
                  Show All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => props.columnVisibility.hideAll()}
                  className="flex-1"
                >
                  Hide All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => props.columnVisibility.resetToDefaults()}
                  className="flex-1"
                >
                  Reset
                </Button>
              </div>

              {/* Column List */}
              <div className="flex-1 overflow-y-auto">
                {props.columns.map((column) => {
                  const isVisible = props.columnVisibility.isColumnVisible(column.key)
                  const isToggleable = !column.alwaysVisible

                  return (
                    <div
                      key={column.key}
                      className={cn(
                        'flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800',
                        isToggleable
                          ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          : 'opacity-50',
                      )}
                      onClick={() => {
                        if (!isToggleable) return
                        props.columnVisibility.toggleColumn(column.key)
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <motion.div
                          className="relative"
                          whileHover={isToggleable ? { scale: 1.1 } : {}}
                          whileTap={isToggleable ? { scale: 0.95 } : {}}
                        >
                          <AnimatePresence mode="wait">
                            {isVisible ? (
                              <motion.div
                                key="eye-open"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                              >
                                <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
                              </motion.div>
                            ) : (
                              <motion.div
                                key="eye-closed"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                              >
                                <EyeClosed className="h-5 w-5 text-gray-400" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                        <span className="text-base font-medium text-gray-700 dark:text-gray-300">
                          {column.label}
                        </span>
                      </div>

                      {column.alwaysVisible ? (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Always visible
                        </span>
                      ) : (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={() => props.columnVisibility.toggleColumn(column.key)}
                            onClick={(e) => e.stopPropagation()}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <Button onClick={() => setIsOpen(false)} className="w-full" variant="primary">
                  Done
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
