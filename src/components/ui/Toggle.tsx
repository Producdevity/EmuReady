'use client'

import { cn } from '@/lib/utils'

// Size-based styling
const sizeClasses = {
  sm: {
    toggle: 'w-8 h-4',
    circle: 'w-2.5 h-2.5',
    translate: 'translate-x-4',
  },
  md: {
    toggle: 'w-11 h-6',
    circle: 'w-4 h-4',
    translate: 'translate-x-5',
  },
  lg: {
    toggle: 'w-14 h-7',
    circle: 'w-5 h-5',
    translate: 'translate-x-7',
  },
}

interface Props {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Toggle(props: Props) {
  const size = props.size ?? 'md'

  return (
    <label
      className={cn(
        'inline-flex items-center cursor-pointer',
        props.disabled ? 'opacity-50 cursor-not-allowed' : '',
        props.className,
      )}
    >
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={props.checked}
          disabled={props.disabled ?? false}
          onChange={(ev) => props.onChange(ev.target.checked)}
        />
        <div
          className={`${sizeClasses[size].toggle} rounded-full peer 
          transition-colors duration-300 ease-in-out
          ${
            props.checked
              ? 'bg-blue-600 dark:bg-blue-500'
              : 'bg-gray-200 dark:bg-gray-700'
          }`}
        />
        <div
          className={cn(
            'absolute left-1 top-1/2 -translate-y-1/2',
            sizeClasses[size].circle,
            'bg-white rounded-full shadow-md transition-all duration-300 ease-in-out',
            props.checked ? sizeClasses[size].translate : 'translate-x-0',
            props.checked ? 'scale-110' : 'scale-100',
          )}
        />
      </div>
      {props.label && (
        <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
          {props.label}
        </span>
      )}
    </label>
  )
}
