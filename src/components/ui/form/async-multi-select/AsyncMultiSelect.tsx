'use client'

import { ChevronDown, X } from 'lucide-react'
import { type ReactNode, type UIEvent, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export type Option = { id: string; name: string; badgeName?: string }

interface Props {
  label: string
  leftIcon?: ReactNode
  value: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  className?: string
  maxDisplayed?: number

  // Data from wrappers
  options: Option[]
  selectedByIds: Option[]
  isFetching: boolean
  hasMore: boolean

  // Handlers implemented in wrappers
  onLoadMore?: () => void
  onQueryChange?: (query: string) => void
  debounceMs?: number
}

export default function AsyncMultiSelect(props: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounce query -> notify wrapper
  const { onQueryChange, debounceMs } = props
  useEffect(() => {
    if (!onQueryChange) return
    const id = setTimeout(() => onQueryChange?.(query), debounceMs ?? 300)
    return () => clearTimeout(id)
  }, [query, debounceMs, onQueryChange])

  // Dropdown position
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const vh = window.innerHeight
      const below = vh - rect.bottom
      const above = rect.top
      const est = 360
      setDropdownPosition(below < est && above > est ? 'top' : 'bottom')
    }
  }, [isOpen])

  // Selected options: merge page options + byIds; ordered by value
  const selectedOptions = useMemo(() => {
    const byIdMap = new Map(props.selectedByIds.map((o) => [o.id, o]))
    const optionMap = new Map(props.options.map((o) => [o.id, o]))
    const result: Option[] = []
    for (const id of props.value) {
      const fromOptions = optionMap.get(id)
      const fromByIds = byIdMap.get(id)
      if (fromOptions) result.push(fromOptions)
      else if (fromByIds) result.push(fromByIds)
    }
    return result
  }, [props.options, props.selectedByIds, props.value])

  const maxDisplayed = props.maxDisplayed ?? 2
  const getDisplayText = () => {
    if (selectedOptions.length === 0) return props.placeholder ?? `Select ${props.label}`
    if (selectedOptions.length <= maxDisplayed) return selectedOptions.map((o) => o.name).join(', ')
    const display = selectedOptions
      .slice(0, maxDisplayed)
      .map((o) => o.name)
      .join(', ')
    return `${display} (+${selectedOptions.length - maxDisplayed} more)`
  }

  const toggleId = (id: string) => {
    const newValue = props.value.includes(id)
      ? props.value.filter((v) => v !== id)
      : [...props.value, id]
    props.onChange(newValue)
  }

  const handleClearAll = () => props.onChange([])
  const handleRemoveOption = (id: string) => props.onChange(props.value.filter((v) => v !== id))

  const onScrollList = (e: UIEvent<HTMLDivElement>) => {
    if (!props.onLoadMore) return
    const el = e.currentTarget
    if (
      props.hasMore &&
      !props.isFetching &&
      el.scrollTop + el.clientHeight >= el.scrollHeight - 40
    ) {
      props.onLoadMore()
    }
  }

  return (
    <div className={cn('relative', props.className)}>
      <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
        {props.label}
      </label>

      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={`${props.label} multi-select`}
          className={cn(
            `w-full px-3 py-2 border rounded-lg bg-white 
            dark:bg-gray-800 border-gray-300 dark:border-gray-600 
            text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
            transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500`,
            isOpen ? 'ring-2 ring-blue-500 border-blue-500' : '',
          )}
          ref={buttonRef}
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
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </button>

        {isOpen && (
          <div
            className={`absolute z-[9999] w-full bg-white dark:bg-gray-800
              border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg
              animate-in fade-in-0 zoom-in-95 duration-200 ${
                dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
              }`}
          >
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={`Search ${props.label.toLowerCase()}...`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full px-2 py-1 pr-8 text-sm border-0 focus:ring-0
                    bg-transparent placeholder-gray-500 dark:placeholder-gray-400
                    text-gray-900 dark:text-gray-100"
                  autoFocus
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1
                      text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                      hover:bg-gray-100 dark:hover:bg-gray-700 rounded
                      transition-all duration-150 hover:scale-110
                      animate-in fade-in-0 zoom-in-95"
                    aria-label="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto p-1" onScroll={onScrollList}>
              {props.options.length === 0 && !props.isFetching ? (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  No options found
                </div>
              ) : (
                props.options.map((option, index) => {
                  const isSelected = props.value.includes(option.id)
                  const isTopSelected = isSelected && index < props.value.length
                  return (
                    <label
                      key={option.id}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer
                        transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700
                        ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                        ${isTopSelected ? 'animate-in slide-in-from-top-1 duration-300' : ''}
                        hover:scale-[1.02] hover:shadow-sm`}
                      style={{ animationDelay: isTopSelected ? `${index * 50}ms` : '0ms' }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleId(option.id)}
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
              {props.isFetching && (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Loading…</div>
              )}
            </div>

            {props.value.length > 0 && (
              <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="w-full px-3 py-1 text-sm text-gray-600 dark:text-gray-400
                    hover:text-gray-800 dark:hover:text-gray-200
                    hover:bg-gray-50 dark:hover:bg-gray-700 rounded
                    transition-all duration-200 hover:scale-[1.02]"
                >
                  Clear all ({props.value.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedOptions.length > 0 && (
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
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className="truncate max-w-32">{option.badgeName ?? option.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveOption(option.id)}
                  className="flex-shrink-0 p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800
                    rounded-full transition-all duration-200 hover:scale-110
                    focus:outline-none focus:ring-1 focus:ring-blue-400"
                  aria-label={`Remove ${option.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
