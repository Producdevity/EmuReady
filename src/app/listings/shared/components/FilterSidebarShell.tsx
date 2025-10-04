'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, Filter, Settings2 } from 'lucide-react'
import { type ReactNode } from 'react'
import useMounted from '@/hooks/useMounted'
import { motionPresets } from '@/lib/motionPresets'

interface Props {
  isCollapsed: boolean
  onToggleCollapse: () => void
  title?: string
  totalActiveCount?: number
  collapsedSummary: ReactNode
  children: ReactNode
  showToggle?: boolean
}

export function FilterSidebarShell(props: Props) {
  const mounted = useMounted()

  const totalActive = props.totalActiveCount ?? 0

  return (
    <motion.div className="relative" initial={false} style={{ zIndex: 10 }}>
      {/* Collapse toggle */}
      {props.showToggle !== false && (
        <motion.button
          onClick={props.onToggleCollapse}
          className="absolute -right-4 top-2 z-30 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-0 rounded-full p-2 shadow-xl md:flex hidden group"
          aria-label={props.isCollapsed ? 'Expand filters' : 'Collapse filters'}
          whileHover={{ scale: 1.1, boxShadow: '0 20px 25px -5px rgba(59, 130, 246, 0.4)' }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ overflow: 'visible' }}
        >
          <AnimatePresence mode="wait">
            {props.isCollapsed ? (
              <motion.div
                key="filter-icon"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 90 }}
                transition={{ duration: 0.3 }}
              >
                <Filter className="w-4 h-4 text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="arrow-icon"
                initial={{ scale: 0, rotate: 90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: -90 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Filter Count Badge */}
          <AnimatePresence>
            {totalActive > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4.5 h-4.5 flex items-center justify-center font-bold shadow-lg z-50"
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                {totalActive}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      )}

      {/* Sidebar container */}
      <motion.aside
        className="bg-white dark:bg-gray-800 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 flex-shrink-0 shadow-xl relative mr-8 md:mr-0"
        initial={false}
        animate={{
          width: props.isCollapsed
            ? mounted
              ? window.innerWidth >= 768
                ? 80
                : 0
              : 80
            : mounted
              ? window.innerWidth >= 768
                ? 320
                : '100%'
              : 320,
          borderRadius: props.isCollapsed ? 20 : 24,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{ zIndex: 10, overflow: 'visible' }}
      >
        <div
          className={`${props.isCollapsed ? 'p-4' : 'p-6'} transition-all duration-300 overflow-visible`}
        >
          <AnimatePresence mode="wait">
            {props.isCollapsed ? (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="hidden md:flex flex-col items-center gap-4 py-4 mt-4"
                style={{ overflow: 'visible' }}
              >
                {props.collapsedSummary}
              </motion.div>
            ) : (
              <motion.div
                key="expanded"
                {...motionPresets.fadeInLeft(0.1, 0.3)}
                style={{ overflow: 'visible' }}
              >
                <motion.div
                  className="flex items-center gap-3 mb-6"
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                    <Settings2 className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {props.title ?? 'Filters'}
                  </h2>
                  {totalActive > 0 && (
                    <motion.div
                      {...motionPresets.scaleIn()}
                      className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 font-bold"
                    >
                      {totalActive}
                    </motion.div>
                  )}
                </motion.div>

                {props.children}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
    </motion.div>
  )
}
