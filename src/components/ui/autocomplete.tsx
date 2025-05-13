'use client'

import {
  useState,
  useRef,
  useEffect,
  type ReactNode,
  type ChangeEvent,
  type KeyboardEvent,
  useCallback,
} from 'react'

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
  onSearch?: (query: string) => Promise<void>
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

export function Autocomplete(props: Props) {
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
  const [userIsTyping, setUserIsTyping] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize inputValue only when component mounts or when props.value changes and user isn't typing
  useEffect(() => {
    if (props.value && !userIsTyping) {
      const selected = props.options.find((o) => o.value === props.value)
      setInputValue(selected ? selected.label : '')
    } else if (!props.value && !userIsTyping) {
      setInputValue('')
    }
  }, [props.value, props.options, userIsTyping])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        listRef.current &&
        !listRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setUserIsTyping(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

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
    [props.onSearch, minCharsToSearch, searchDebounce]
  )

  const filteredOptions = props.options.filter((option) =>
    option.label.toLowerCase().includes(inputValue.toLowerCase()),
  )

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setUserIsTyping(true)
    setInputValue(newValue)
    setIsOpen(true)
    setHighlightedIndex(-1)
    
    // If user clears the input, reset the value
    if (!newValue) {
      props.onChange('')
    }
    
    // Let parent component know about input changes if handler provided
    if (props.onInputChange) {
      props.onInputChange(newValue)
    }

    // Trigger search if we have a search function
    debouncedSearch(newValue)
  }

  const handleOptionSelect = (option: AutocompleteOption) => {
    setUserIsTyping(false)
    setInputValue(option.label)
    setIsOpen(false)
    props.onChange(option.value)
  }

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
      handleOptionSelect(filteredOptions[highlightedIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setUserIsTyping(false)
    }
  }

  // When input loses focus
  const handleBlur = () => {
    // Small delay to allow click events on options to fire first
    setTimeout(() => {
      if (isOpen) {
        setIsOpen(false)
        setUserIsTyping(false)
        
        // If there's a valid option that matches input exactly, select it
        const exactMatch = props.options.find(
          option => option.label.toLowerCase() === inputValue.toLowerCase()
        )
        if (exactMatch) {
          props.onChange(exactMatch.value)
        }
      }
    }, 200)
  }

  const showNoResults = isOpen && !loading && filteredOptions.length === 0 && inputValue.length >= minCharsToSearch

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
        <input
          ref={inputRef}
          type="text"
          className={`w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 ${props.leftIcon ? 'pl-10' : ''} ${props.rightIcon ? 'pr-10' : ''}`}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleChange}
          onFocus={() => setIsOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoComplete="off"
        />
        {props.rightIcon && (
          <span className="absolute right-3 text-gray-400 dark:text-gray-500 flex items-center">
            {props.rightIcon}
          </span>
        )}
        {loading && (
          <span className="absolute right-10 animate-spin">
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
      {isOpen && inputValue.length < minCharsToSearch && !filteredOptions.length && (
        <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-900 shadow-lg rounded-xl py-2 ring-1 ring-black ring-opacity-5 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-center animate-fade-in">
          Type at least {minCharsToSearch} characters to search
        </div>
      )}
    </div>
  )
}
