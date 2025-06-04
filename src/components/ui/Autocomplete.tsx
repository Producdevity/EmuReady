'use client'

import {
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { cn } from '@/lib/utils'

// Generic Option type to allow flexibility for the consumer
export interface AutocompleteOptionBase {
  // Allow any other properties, but prefer unknown over any for better type safety
  [key: string]: unknown
}

interface AutocompleteProps<T extends AutocompleteOptionBase> {
  value?: string | null // The actual selected value (e.g., an ID)
  onChange: (value: string | null) => void // Callback with the new selected value

  onFocus?: () => void
  onBlur?: () => void

  // Data handling: Provide either static items or a function to load them
  items?: T[] // Static list of items
  loadItems?: (query: string) => Promise<T[]> // Async function to fetch items

  optionToValue: (option: T) => string // Function to get the value from an option (e.g., option.id)
  optionToLabel: (option: T) => string // Function to get the display label from an option (e.g., option.label)
  optionToIcon?: (option: T) => ReactNode // Optional: Function to get an icon for an option
  customOptionRenderer?: (option: T, isHighlighted: boolean) => ReactNode // Optional: Custom renderer for options

  filterKeys?: (keyof T)[] // Keys to use for client-side fuzzy filtering (if items is provided)

  placeholder?: string
  label?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  disabled?: boolean
  className?: string
  minCharsToTrigger?: number // Renamed from minCharsToSearch for clarity
  debounceTime?: number // Renamed from searchDebounce
}

function Autocomplete<T extends AutocompleteOptionBase>({
  value,
  onChange,
  onFocus,
  onBlur,
  items: staticItems,
  loadItems,
  optionToValue,
  optionToLabel,
  optionToIcon,
  customOptionRenderer,
  filterKeys = [], // Default to empty array, implying label search or specific logic
  placeholder = 'Type to search...',
  label,
  leftIcon,
  rightIcon,
  disabled = false,
  className = '',
  minCharsToTrigger = 0,
  debounceTime = 300,
}: AutocompleteProps<T>) {
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<T[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [hasInitialLoad, setHasInitialLoad] = useState(false)
  const [isUserTyping, setIsUserTyping] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null) // Changed to ul
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load initial items from server if loadItems is provided (only once)
  useEffect(() => {
    if (!loadItems || hasInitialLoad) return
    setHasInitialLoad(true)

    if (debounceTime < 200) return
    loadItems('')
      .then(setSuggestions)
      .catch((error) =>
        console.error('Error fetching/filtering suggestions:', error),
      )
  }, [loadItems, hasInitialLoad, debounceTime])

  // Effect to update inputValue when the external `value` prop changes (controlled mode only)
  useEffect(() => {
    // Don't override input value when user is actively typing
    if (isUserTyping) return

    // If value is null or undefined, clear the input
    if (value == null) {
      setInputValue('')
      return
    }

    if (staticItems && staticItems.length > 0) {
      const staticSelectedItem = staticItems.find(
        (item) => optionToValue(item) === value,
      )
      if (staticSelectedItem) {
        setInputValue(optionToLabel(staticSelectedItem))
        return
      }
    }

    if (!loadItems) return

    const selectedItem = suggestions.find(
      (item) => optionToValue(item) === value,
    )
    if (selectedItem) return setInputValue(optionToLabel(selectedItem))

    // If we reach here and no item was found, but value is not null,
    // it might mean the item hasn't been loaded yet, so keep current input
  }, [
    value,
    staticItems,
    optionToValue,
    optionToLabel,
    suggestions,
    loadItems,
    isUserTyping,
  ])

  const performSearch = useCallback(
    async (query: string) => {
      // For static items, allow showing all items when query is empty
      // For async loading, allow showing initial results even with empty query
      if (
        query.length < minCharsToTrigger &&
        !(loadItems && query.length === 0) &&
        !(staticItems && query.length === 0)
      ) {
        setSuggestions([])
        setIsOpen(query.length > 0) // Keep open if user is typing but below threshold
        return
      }

      setIsLoading(true)
      setIsOpen(true) // Open dropdown immediately when loading starts

      try {
        let newSuggestions: T[] = []

        if (loadItems) {
          newSuggestions = await loadItems(query)
        } else if (staticItems) {
          if (query.length === 0) {
            // Show all items when query is empty for static items
            newSuggestions = staticItems
          } else {
            const lowerQuery = query.toLowerCase()
            newSuggestions = staticItems.filter((item) => {
              if (filterKeys.length > 0) {
                return filterKeys.some((key) => {
                  const val = item[key]
                  return (
                    typeof val === 'string' &&
                    val.toLowerCase().includes(lowerQuery)
                  )
                })
              } else {
                // Default to filtering by label if no filterKeys provided
                return optionToLabel(item).toLowerCase().includes(lowerQuery)
              }
            })
          }
        }

        // Update suggestions and loading state together to prevent race condition
        setSuggestions(newSuggestions)
        setIsLoading(false)
        setHasSearched(true)
      } catch (error) {
        console.error('Error fetching/filtering suggestions:', error)
        setSuggestions([])
        setIsLoading(false)
        setHasSearched(true)
      }

      setIsOpen(true)
      setHighlightedIndex(-1)
    },
    [loadItems, staticItems, optionToLabel, filterKeys, minCharsToTrigger],
  )

  const debouncedSearch = useCallback(
    (query: string) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      debounceTimeoutRef.current = setTimeout(() => {
        performSearch(query).catch(console.error)
      }, debounceTime)
    },
    [performSearch, debounceTime],
  )

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setInputValue(newQuery)
    setIsUserTyping(true)

    // Clear the user typing flag after a delay to allow controlled updates
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    debounceTimeoutRef.current = setTimeout(() => {
      setIsUserTyping(false)
    }, debounceTime + 100)

    if (newQuery.length === 0) {
      // Clear selection when input is completely empty
      if (value != null) {
        onChange(null)
      }
      // For static items, show all items when input is cleared
      if (staticItems && staticItems.length > 0) {
        setSuggestions(staticItems)
        setIsOpen(true)
      } else {
        setSuggestions([])
        setIsOpen(false)
      }
    } else {
      // Check if we need to clear selection when typing something different
      if (value != null) {
        const currentSelectedItem =
          staticItems?.find((item) => optionToValue(item) === value) ??
          suggestions.find((item) => optionToValue(item) === value)

        // Clear selection if the typed text doesn't match the selected item's label
        if (
          currentSelectedItem &&
          optionToLabel(currentSelectedItem) !== newQuery
        ) {
          // Delay the onChange call slightly to avoid race condition with useEffect
          setTimeout(() => onChange(null), 0)
        }
      }

      debouncedSearch(newQuery)
    }
  }

  const handleOptionClick = (item: T) => {
    const itemValue = optionToValue(item)
    const itemLabel = optionToLabel(item)
    setInputValue(itemLabel)
    setIsUserTyping(false)
    onChange(itemValue)
    setIsOpen(false)
    // Don't clear suggestions immediately to allow useEffect to work
    setTimeout(() => setSuggestions([]), 0)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      // Open dropdown and trigger search
      if (!loadItems && staticItems && staticItems.length > 0) {
        performSearch(inputValue).catch(console.error)
      } else if (loadItems && inputValue.length >= minCharsToTrigger) {
        performSearch(inputValue).catch(console.error)
      }
      return
    }

    if (!isOpen && e.key !== 'Tab') {
      // If closed and user types more, trigger search
      if (inputValue.length >= minCharsToTrigger && !loadItems) {
        // for static items, re-filter
        debouncedSearch(inputValue)
      } else if (inputValue.length >= minCharsToTrigger && loadItems) {
        // for dynamic, user typing should re-trigger if desired
        // or rely on input change handler
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0,
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1,
        )
        break
      case 'Enter':
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          e.preventDefault()
          handleOptionClick(suggestions[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSuggestions([])
        break
      case 'Tab':
        // Allow tab to function normally, potentially closing dropdown if desired
        setIsOpen(false)
        // if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        //   handleOptionClick(suggestions[highlightedIndex]);
        // }
        break
    }
  }

  const handleInputFocus = () => {
    if (disabled) return

    onFocus?.()

    // For static items, always show results on focus
    if (!loadItems && staticItems && staticItems.length > 0) {
      performSearch(inputValue).catch(console.error)
    } else if (loadItems) {
      // For async loading, show initial results if available or trigger search if enough chars
      if (suggestions.length > 0) {
        setIsOpen(true)
      } else if (inputValue.length >= minCharsToTrigger) {
        performSearch(inputValue).catch(console.error)
      } else if (inputValue.length === 0 && hasInitialLoad) {
        // Show initial results on focus if we have them
        setIsOpen(true)
      }
    }
  }

  const handleInputBlur = (_e: FocusEvent<HTMLInputElement>) => {
    onBlur?.()
    setTimeout(() => {
      if (
        listRef.current &&
        !listRef.current.contains(document.activeElement)
      ) {
        setIsOpen(false)
      }
    }, 100)
  }

  useEffect(() => {
    const currentList = listRef.current
    if (isOpen && highlightedIndex >= 0 && currentList) {
      const optionElement = currentList.children[highlightedIndex] as
        | HTMLLIElement
        | undefined
      if (optionElement && typeof optionElement.scrollIntoView === 'function') {
        optionElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        })
      }
    }
  }, [highlightedIndex, isOpen])

  // Click outside closes dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        listRef.current &&
        !listRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      setIsUserTyping(false)
    }
  }, [])

  // Improved logic for showing messages - prevent race condition by checking hasSearched
  const showNoResults =
    isOpen &&
    !isLoading &&
    hasSearched &&
    suggestions.length === 0 &&
    inputValue.length >= minCharsToTrigger &&
    (staticItems == null || staticItems.length === 0 || inputValue.length > 0)

  const showMinCharsMessage =
    isOpen &&
    !isLoading &&
    inputValue.length < minCharsToTrigger &&
    inputValue.length > 0 &&
    suggestions.length === 0 &&
    loadItems != null

  return (
    <div className={cn('relative', className)}>
      {label && (
        <label
          htmlFor={label}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
            {leftIcon}
          </span>
        )}
        <input
          ref={inputRef}
          id={label}
          type="text"
          className={cn(
            'w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200',
            leftIcon ? 'pl-10' : '',
            rightIcon || isLoading ? 'pr-10' : '',
          )}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={isOpen ? 'autocomplete-list' : undefined}
          aria-activedescendant={
            highlightedIndex >= 0 && suggestions[highlightedIndex]
              ? `option-${optionToValue(suggestions[highlightedIndex])}`
              : undefined
          }
        />
        {rightIcon && !isLoading && (
          <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
            {rightIcon}
          </span>
        )}
        {isLoading && (
          <span className="absolute inset-y-0 right-0 pr-3 flex items-center animate-spin">
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

      {isOpen &&
        (suggestions.length > 0 ||
          showNoResults ||
          showMinCharsMessage ||
          isLoading) && (
          <ul
            ref={listRef}
            id="autocomplete-list"
            role="listbox"
            className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-900 shadow-lg rounded-xl py-1 ring-1 ring-black ring-opacity-5 max-h-60 overflow-auto border border-gray-200 dark:border-gray-700 animate-fade-in"
          >
            {isLoading && (
              <li className="px-4 py-2 text-gray-500 dark:text-gray-400 text-center">
                Loading...
              </li>
            )}
            {!isLoading && showNoResults && (
              <li className="px-4 py-2 text-gray-500 dark:text-gray-400 text-center">
                No results found.
              </li>
            )}
            {!isLoading && showMinCharsMessage && (
              <li className="px-4 py-2 text-gray-500 dark:text-gray-400 text-center">
                Type at least {minCharsToTrigger} characters to search
              </li>
            )}
            {!isLoading &&
              suggestions.map((item, idx) => {
                const itemValue = optionToValue(item)
                const isHighlighted = idx === highlightedIndex
                return (
                  <li
                    key={itemValue}
                    id={`option-${itemValue}`}
                    role="option"
                    aria-selected={isHighlighted}
                    className={cn(
                      'flex items-center px-4 py-2 cursor-pointer select-none transition-colors rounded-xl',
                      isHighlighted
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200'
                        : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700',
                    )}
                    onMouseDown={(ev) => {
                      ev.preventDefault()
                      handleOptionClick(item)
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                  >
                    {customOptionRenderer ? (
                      customOptionRenderer(item, isHighlighted)
                    ) : (
                      <>
                        {optionToIcon && (
                          <span className="mr-2 flex-shrink-0">
                            {optionToIcon(item)}
                          </span>
                        )}
                        <span className="flex-grow">{optionToLabel(item)}</span>
                      </>
                    )}
                  </li>
                )
              })}
          </ul>
        )}
    </div>
  )
}

export default Autocomplete
