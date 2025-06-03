'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface Option {
  id: string
  name: string
}

interface Props {
  label: string
  leftIcon?: ReactNode
  value: string[]
  onChange: (values: string[]) => void
  options: Option[]
  placeholder?: string
  className?: string
  maxDisplayed?: number
  showSelectedBadges?: boolean
}

function MultiSelect(props: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredOptions = props.options.filter((option) =>
    option.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  )

  // Sort filtered options: selected items first, then unselected
  const sortedFilteredOptions = [...filteredOptions].sort((a, b) => {
    const aSelected = props.value.includes(a.id)
    const bSelected = props.value.includes(b.id)

    if (aSelected && !bSelected) return -1
    if (!aSelected && bSelected) return 1
    return 0
  })

  const selectedOptions = props.options.filter((option) =>
    props.value.includes(option.id),
  )

  const maxDisplayed = props.maxDisplayed ?? 2
  const showSelectedBadges = props.showSelectedBadges ?? true

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleToggle = (optionId: string) => {
    const newValue = props.value.includes(optionId)
      ? props.value.filter((id) => id !== optionId)
      : [...props.value, optionId]
    props.onChange(newValue)
  }

  const handleClearAll = () => {
    props.onChange([])
  }

  const handleRemoveOption = (optionId: string) => {
    const newValue = props.value.filter((id) => id !== optionId)
    props.onChange(newValue)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    inputRef.current?.focus()
  }

  const getDisplayText = () => {
    if (selectedOptions.length === 0) {
      return props.placeholder ?? `Select ${props.label}`
    }

    if (selectedOptions.length <= maxDisplayed) {
      return selectedOptions.map((option) => option.name).join(', ')
    }

    const displayNames = selectedOptions
      .slice(0, maxDisplayed)
      .map((option) => option.name)
      .join(', ')
    return `${displayNames} (+${selectedOptions.length - maxDisplayed} more)`
  }

  return (
    <div className={`relative ${props.className ?? ''}`}>
      <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
        {props.label}
      </label>

      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={`${props.label} multi-select`}
          className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 
            border-gray-300 dark:border-gray-600 text-left 
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
            transition-all duration-200 
            ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
            hover:border-gray-400 dark:hover:border-gray-500`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {props.leftIcon && (
                <div className="flex-shrink-0 text-gray-500 dark:text-gray-400">
                  {props.leftIcon}
                </div>
              )}
              <span
                className={`truncate ${
                  selectedOptions.length === 0
                    ? 'text-gray-500 dark:text-gray-400'
                    : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                {getDisplayText()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {selectedOptions.length > 0 && (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClearAll()
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      e.stopPropagation()
                      handleClearAll()
                    }
                  }}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700
                    text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                    transition-all duration-200 cursor-pointer hover:scale-110"
                  aria-label="Clear all selections"
                >
                  <XMarkIcon className="w-4 h-4" />
                </div>
              )}
              <ChevronDownIcon
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 
                  ${isOpen ? 'rotate-180' : ''}`}
              />
            </div>
          </div>
        </button>

        {isOpen && (
          <div
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800
              border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg
              animate-in fade-in-0 zoom-in-95 duration-200"
          >
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={`Search ${props.label.toLowerCase()}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-2 py-1 pr-8 text-sm border-0 focus:ring-0
                    bg-transparent placeholder-gray-500 dark:placeholder-gray-400
                    text-gray-900 dark:text-gray-100"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1
                      text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                      hover:bg-gray-100 dark:hover:bg-gray-700 rounded
                      transition-all duration-200 hover:scale-110
                      animate-in fade-in-0 zoom-in-95 duration-150"
                    aria-label="Clear search"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto p-1">
              {sortedFilteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  No options found
                </div>
              ) : (
                sortedFilteredOptions.map((option, index) => {
                  const isSelected = props.value.includes(option.id)
                  const isTopSelected =
                    isSelected && index < selectedOptions.length

                  return (
                    <label
                      key={option.id}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer
                        transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700
                        ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                        ${isTopSelected ? 'animate-in slide-in-from-top-1 duration-300' : ''}
                        hover:scale-[1.02] hover:shadow-sm`}
                      style={{
                        animationDelay: isTopSelected
                          ? `${index * 50}ms`
                          : '0ms',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggle(option.id)}
                        className="rounded border-gray-300 dark:border-gray-600
                          text-blue-600 focus:ring-blue-500 focus:ring-2
                          transition-all duration-200 hover:scale-110
                          dark:bg-gray-700 dark:focus:ring-blue-600"
                      />
                      <span
                        className={`text-sm select-none flex-1 transition-all duration-200
                          ${
                            isSelected
                              ? 'text-blue-700 dark:text-blue-300 font-medium'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                      >
                        {option.name}
                      </span>
                      {isSelected && (
                        <div
                          className="w-2 h-2 bg-blue-500 rounded-full
                          animate-in zoom-in-0 duration-200"
                        />
                      )}
                    </label>
                  )
                })
              )}
            </div>

            {selectedOptions.length > 0 && (
              <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="w-full px-3 py-1 text-sm text-gray-600 dark:text-gray-400
                    hover:text-gray-800 dark:hover:text-gray-200
                    hover:bg-gray-50 dark:hover:bg-gray-700 rounded
                    transition-all duration-200 hover:scale-[1.02]"
                >
                  Clear all ({selectedOptions.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Items Badges */}
      {showSelectedBadges && selectedOptions.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Selected ({selectedOptions.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedOptions.map((option, index) => (
              <div
                key={option.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1
                  bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200
                  text-xs font-medium rounded-full border border-blue-200 dark:border-blue-800
                  animate-in slide-in-from-bottom-2 fade-in-0
                  hover:bg-blue-200 dark:hover:bg-blue-900/50
                  transition-all duration-200 hover:scale-105 hover:shadow-sm"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <span className="truncate max-w-32">{option.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveOption(option.id)}
                  className="flex-shrink-0 p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800
                    rounded-full transition-all duration-200 hover:scale-110
                    focus:outline-none focus:ring-1 focus:ring-blue-400"
                  aria-label={`Remove ${option.name}`}
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MultiSelect
