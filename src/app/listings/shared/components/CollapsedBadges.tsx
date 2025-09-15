'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { type ReactNode } from 'react'
import { motionPresets } from '@/lib/motionPresets'

export interface CollapsedBadgeItem {
  key: string
  count: number
  icon: ReactNode
  cardBgClass: string
  iconColorClass: string
  badgeBgClass: string
  delay?: number
}

interface Props {
  items: CollapsedBadgeItem[]
}

export function CollapsedBadges(props: Props) {
  return (
    <div className="flex flex-col items-center gap-4 w-full" style={{ overflow: 'visible' }}>
      <AnimatePresence>
        {props.items
          .filter((i) => i.count > 0)
          .map((item) => (
            <motion.div
              key={item.key}
              {...motionPresets.badgeIn(item.delay ?? 0.05, 300)}
              className="relative group"
              style={{ overflow: 'visible' }}
            >
              <motion.div
                className={`p-2.5 ${item.cardBgClass} rounded-xl shadow-sm`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.2 }}
              >
                <div className={item.iconColorClass}>{item.icon}</div>
              </motion.div>
              <motion.div
                className={`absolute -top-2 -right-2 ${item.badgeBgClass} text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg z-30`}
                {...motionPresets.countPop((item.delay ?? 0.05) + 0.05)}
              >
                {item.count}
              </motion.div>
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  )
}
