'use client'

import { motion } from 'framer-motion'
import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Tab {
  id: string
  label: string
  icon?: ReactNode
  badge?: number
}

interface Props {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

function ProfileTabs(props: Props) {
  return (
    <div className={cn('w-full', props.className)}>
      <div className="flex overflow-x-auto overflow-y-hidden scroll-smooth scrollbar-hide">
        <div className="flex gap-2 p-2 min-w-max">
          {props.tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => props.onTabChange(tab.id)}
              className={cn(
                'relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 text-sm flex-shrink-0 touch-manipulation select-none',
                props.activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700',
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              layout
            >
              {/* Background gradient for active tab */}
              {props.activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabBackground"
                  className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}

              {/* Tab content */}
              <div className="relative flex items-center gap-2">
                {tab.icon && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className={cn(
                      'flex-shrink-0',
                      props.activeTab === tab.id
                        ? 'text-white'
                        : 'text-gray-500 dark:text-gray-400',
                    )}
                  >
                    {tab.icon}
                  </motion.div>
                )}

                <span className="font-medium whitespace-nowrap">{tab.label}</span>

                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className={cn(
                      'inline-flex items-center justify-center min-w-[18px] h-4 px-1 text-xs font-bold rounded-full',
                      props.activeTab === tab.id
                        ? 'bg-white/20 text-white'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                    )}
                  >
                    {tab.badge}
                  </motion.span>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ProfileTabs
