'use client'

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react'
import SearchGameField from './SearchGameField'

interface AutocompleteOption {
  value: string
  label: string
  icon?: ReactNode
}

interface Props {
  options: AutocompleteOption[]
  value?: string
  onChange: (value: string) => void
  onInputChange?: (input: string) => void
  onSearch: (query: string) => Promise<void>
  placeholder?: string
  label?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  loading?: boolean
  disabled?: boolean
  className?: string
  minCharsToSearch?: number
  searchDebounce?: number
}

function Autocomplete(props: Props) {
  const placeholder = props.placeholder ?? 'Type to search...'
  const loading = props.loading ?? false
  const disabled = props.disabled ?? false
  const className = props.className ?? ''
  const minCharsToSearch = props.minCharsToSearch ?? 2
  const searchDebounce = props.searchDebounce ?? 300

  const [inputValue, setInputValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Keep inputValue in sync with value prop
  useEffect(() => {
    if (!props.value) return

    const selected = props.options.find((o) => o.value === props.value)
    setInputValue(selected ? selected.label : '')
  }, [props.value, props.options])

  // Debounced search
  const debouncedSearch = useCallback(
    (query: string) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      if (props.onSearch && query.length >= minCharsToSearch) {
        searchTimeoutRef.current = setTimeout(() => {
          props.onSearch!(query)
        }, searchDebounce)
      }
    },
    [props.onSearch, minCharsToSearch, searchDebounce],
  )

  // Filter options based on inputValue
  const filteredOptions = props.options.filter((option) =>
    option.label.toLowerCase().includes(inputValue.toLowerCase()),
  )

  // Handle input changes
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setIsOpen(true)
    setHighlightedIndex(-1)
    if (!newValue) {
      props.onChange('')
    }
    if (props.onInputChange) {
      props.onInputChange(newValue)
    }
    debouncedSearch(newValue)
  }

  // Handle option selection
  const handleOptionSelect = (option: AutocompleteOption) => {
    setInputValue(option.label)
    setIsOpen(false)
    setHighlightedIndex(-1)
    props.onChange(option.value)
    // Refocus input for keyboard users
    inputRef.current?.focus()
  }

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true)
      setHighlightedIndex(0)
      return
    }
    if (e.key === 'ArrowDown') {
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0,
      )
    } else if (e.key === 'ArrowUp') {
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1,
      )
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault()
      handleOptionSelect(filteredOptions[highlightedIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  // Blur handler closes dropdown only if focus is not moving to dropdown
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (listRef.current?.contains(e.relatedTarget as Node)) {
      return
    }
    setIsOpen(false)
  }

  const handleFocus = useCallback(() => {
    setIsOpen(true)
  }, [])

  // Click outside closes dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        listRef.current &&
        !listRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // No results logic
  const showNoResults =
    isOpen &&
    !loading &&
    filteredOptions.length === 0 &&
    inputValue.length >= minCharsToSearch

  return (
    <div className={`relative ${className}`}>
      {props.label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {props.label}
        </label>
      )}
      <div className="relative flex items-center">
        {props.leftIcon && (
          <span className="absolute left-3 text-gray-400 dark:text-gray-500 flex items-center">
            {props.leftIcon}
          </span>
        )}
        <SearchGameField
          inputValue={inputValue}
          placeholder={placeholder}
          disabled={disabled}
          inputRef={inputRef}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
        {props.rightIcon && !loading && (
          <span className="absolute right-3 text-gray-400 dark:text-gray-500 flex items-center">
            {props.rightIcon}
          </span>
        )}
        {loading && (
          <span className="absolute right-3 animate-spin">
            <svg
              className="h-5 w-5 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
        )}
      </div>
      {isOpen && filteredOptions.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-900 shadow-lg rounded-xl py-1 ring-1 ring-black ring-opacity-5 max-h-60 overflow-auto border border-gray-200 dark:border-gray-700 animate-fade-in"
        >
          {filteredOptions.map((option, idx) => (
            <div
              key={option.value}
              className={`flex items-center px-4 py-2 cursor-pointer select-none transition-colors rounded-xl ${
                idx === highlightedIndex
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200'
                  : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              onMouseDown={() => handleOptionSelect(option)}
              onMouseEnter={() => setHighlightedIndex(idx)}
              aria-selected={idx === highlightedIndex}
              role="option"
            >
              {option.icon && <span className="mr-2">{option.icon}</span>}
              {option.label}
            </div>
          ))}
        </div>
      )}
      {showNoResults && (
        <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-900 shadow-lg rounded-xl py-2 ring-1 ring-black ring-opacity-5 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-center animate-fade-in">
          No results found.
        </div>
      )}
      {isOpen &&
        inputValue.length < minCharsToSearch &&
        !filteredOptions.length && (
          <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-900 shadow-lg rounded-xl py-2 ring-1 ring-black ring-opacity-5 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-center animate-fade-in">
            Type at least {minCharsToSearch} characters to search
          </div>
        )}
    </div>
  )
}

export default Autocomplete
