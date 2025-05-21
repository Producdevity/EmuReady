'use client'

import { useState, useRef, useEffect } from 'react'
import { twMerge } from 'tailwind-merge'

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
}

function Dropdown(props: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = props.options.find(
    (option) => option.value === props.value,
  )

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className={twMerge('relative', props.className)} ref={dropdownRef}>
      {props.label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {props.label}
        </label>
      )}
      <button
        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600
          rounded-md py-2 px-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span
          className={`block truncate ${!selectedOption ? 'text-gray-500' : 'text-gray-900 dark:text-white'}`}
        >
          {selectedOption
            ? selectedOption.label
            : (props.placeholder ?? 'Select an option')}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto max-h-60">
          {props.options.map((option) => (
            <div
              key={option.value}
              className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 dark:hover:bg-gray-700
                ${option.value === props.value ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200' : 'text-gray-900 dark:text-white'}`}
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

export default Dropdown
