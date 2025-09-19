'use client'

import { ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface DropdownOption {
  value: string
  label: string
}

interface Props {
  options: DropdownOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  className?: string
  triggerClassName?: string
}

export function Dropdown(props: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = props.options.find((option) => option.value === props.value)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className={cn('relative', props.className)} ref={dropdownRef}>
      {props.label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {props.label}
        </label>
      )}
      <button
        className={cn(
          'relative inline-flex w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white py-2 px-3 text-left text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800',
          props.triggerClassName,
        )}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span
          className={cn(
            'flex-1 truncate text-sm',
            selectedOption ? 'text-gray-900 dark:text-gray-50' : 'text-gray-500 dark:text-gray-400',
          )}
        >
          {selectedOption ? selectedOption.label : (props.placeholder ?? 'Select an option')}
        </span>
        <ChevronDown
          className="h-4 w-4 flex-shrink-0 text-gray-500 dark:text-gray-400"
          aria-hidden
        />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-2 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg ring-1 ring-black/5 dark:border-gray-700 dark:bg-gray-800">
          {props.options.map((option) => (
            <div
              key={option.value}
              className={cn(
                'cursor-pointer select-none px-3 py-2 text-sm transition',
                option.value === props.value
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-100'
                  : 'text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700',
              )}
              onClick={() => {
                props.onChange(option.value)
                setIsOpen(false)
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
