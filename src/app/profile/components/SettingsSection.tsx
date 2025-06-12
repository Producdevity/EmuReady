'use client'

import { motion } from 'framer-motion'
import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  title: string
  description?: string
  icon?: ReactNode
  children: ReactNode
  className?: string
  delay?: number
}

function SettingsSection(props: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: props.delay ?? 0 }}
      className={cn(
        'relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden',
        props.className,
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 dark:from-blue-900/10 dark:via-transparent dark:to-purple-900/10 pointer-events-none" />

      <div className="relative p-8">
        <div className="flex items-start gap-5 mb-8">
          {props.icon && (
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 rounded-xl flex items-center justify-center shadow-md">
              <div className="text-blue-600 dark:text-blue-400">
                {props.icon}
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {props.title}
            </h3>
            {props.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {props.description}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">{props.children}</div>
      </div>
    </motion.div>
  )
}

export default SettingsSection
