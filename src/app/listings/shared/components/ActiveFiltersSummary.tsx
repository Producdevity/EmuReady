'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { motionPresets } from '@/lib/motionPresets'

interface SummaryItem {
  key: string
  content: string
  colorClass: string // e.g., 'bg-yellow-500'
  delay?: number
}

interface Props {
  title?: string
  items: SummaryItem[]
  showClearAll?: boolean
  onClearAll?: () => void
}

export function ActiveFiltersSummary(props: Props) {
  const title = props.title ?? 'Active Filters'
  if (!props.items.length) return null

  return (
    <motion.div
      key="active-filters-summary"
      {...motionPresets.fadeInUp(0.4)}
      className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</h3>
        {props.showClearAll && props.onClearAll && (
          <motion.button
            onClick={props.onClearAll}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-150 font-medium px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Clear All
          </motion.button>
        )}
      </div>
      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
        <AnimatePresence>
          {props.items.map((item, index) => (
            <motion.div
              key={item.key}
              {...motionPresets.fadeInLeft(item.delay ?? 0.1 + index * 0.05)}
              className="flex items-center gap-2"
            >
              <span className={`w-2 h-2 ${item.colorClass} rounded-full`} />
              {item.content}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
