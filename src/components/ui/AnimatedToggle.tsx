'use client'

import { motion } from 'framer-motion'
import { type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  description?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

function AnimatedToggle(props: Props) {
  const sizeClasses = {
    sm: {
      container: 'h-5 w-9',
      thumb: 'h-4 w-4',
      translate: 16, // 4 * 4px (translate-x-4)
    },
    md: {
      container: 'h-6 w-11',
      thumb: 'h-5 w-5',
      translate: 20, // 5 * 4px (translate-x-5)
    },
    lg: {
      container: 'h-7 w-14',
      thumb: 'h-6 w-6',
      translate: 28, // 7 * 4px (translate-x-7)
    },
  }

  const sizeConfig = sizeClasses[props.size ?? 'md']

  function handleToggle() {
    if (props.disabled) return
    props.onChange(!props.checked)
  }

  function handleKeyDown(ev: KeyboardEvent) {
    if (ev.key === ' ' || ev.key === 'Enter') {
      ev.preventDefault()
      handleToggle()
    }
  }

  return (
    <div className={cn('flex items-center gap-3', props.className)}>
      <button
        type="button"
        role="switch"
        aria-checked={props.checked}
        aria-label={props.label}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={props.disabled}
        className={cn(
          'relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900',
          sizeConfig.container,
          props.checked
            ? 'bg-blue-600 dark:bg-blue-500'
            : 'bg-gray-200 dark:bg-gray-700',
          props.disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <motion.div
          className={cn(
            'pointer-events-none inline-block rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out',
            sizeConfig.thumb,
          )}
          animate={{
            x: props.checked ? sizeConfig.translate : 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
          }}
        />
      </button>

      {(props.label ?? props.description) && (
        <div className="flex flex-col">
          {props.label && (
            <span
              className={cn(
                'text-sm font-medium text-gray-900 dark:text-gray-100',
                props.disabled && 'text-gray-500 dark:text-gray-400',
              )}
            >
              {props.label}
            </span>
          )}
          {props.description && (
            <span
              className={cn(
                'text-xs text-gray-500 dark:text-gray-400',
                props.disabled && 'text-gray-400 dark:text-gray-500',
              )}
            >
              {props.description}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default AnimatedToggle
