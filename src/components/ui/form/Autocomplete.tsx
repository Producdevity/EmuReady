'use client'

import {
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  type AriaAttributes,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { cn } from '@/lib/utils'

// Generic Option type to allow flexibility for the consumer
export interface AutocompleteOptionBase {
  [key: string]: unknown // Allow any other properties
}

interface Props<T extends AutocompleteOptionBase> {
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
  id?: string
  label?: string
  name?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  disabled?: boolean
  className?: string
  inputClassName?: string
  inputRef?: (input: HTMLInputElement | null) => void
  'aria-required'?: AriaAttributes['aria-required']
  'aria-invalid'?: AriaAttributes['aria-invalid']
  'aria-describedby'?: AriaAttributes['aria-describedby']
  minCharsToTrigger?: number
  debounceTime?: number
}

const DROPDOWN_MAX_HEIGHT_PX = 240
const DROPDOWN_MIN_HEIGHT_PX = 160
const DROPDOWN_MARGIN_PX = 8

export function Autocomplete<T extends AutocompleteOptionBase>(props: Props<T>) {
  const {
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
    filterKeys = [],
    placeholder,
    id,
    label,
    name,
    leftIcon,
    rightIcon,
    disabled,
    className,
    inputClassName,
    inputRef: externalInputRef,
    'aria-required': ariaRequired,
    'aria-invalid': ariaInvalid,
    'aria-describedby': ariaDescribedBy,
    minCharsToTrigger = 0,
    debounceTime = 300,
  } = props
  const [inputDraft, setInputDraft] = useState<string | null>(null)
  const [previousValue, setPreviousValue] = useState(value)
  const [clearingSelection, setClearingSelection] = useState(false)
  const [selectedOption, setSelectedOption] = useState<T | null>(null)
  const [initialItems, setInitialItems] = useState<T[]>([])
  const [searchItems, setSearchItems] = useState<T[] | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [hasSearched, setHasSearched] = useState(false)
  const [dropdownStyles, setDropdownStyles] = useState<{
    top: number
    left: number
    width: number
    maxHeight: number
  } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialRequest = useRef<Promise<T[]> | null>(null)
  const requestSequence = useRef(0)

  const setInputRef = useCallback(
    (element: HTMLInputElement | null) => {
      inputRef.current = element
      externalInputRef?.(element)
    },
    [externalInputRef],
  )

  if (previousValue !== value) {
    setPreviousValue(value)
    if ((value != null && value !== '') || !clearingSelection) setInputDraft(null)
    setClearingSelection(false)
  }

  const matchingOption =
    staticItems?.find((item) => optionToValue(item) === value) ??
    searchItems?.find((item) => optionToValue(item) === value) ??
    initialItems.find((item) => optionToValue(item) === value) ??
    (selectedOption && optionToValue(selectedOption) === value ? selectedOption : null)
  const inputValue = inputDraft ?? (matchingOption ? optionToLabel(matchingOption) : '')
  const lowerQuery = inputValue.toLowerCase()
  const suggestions = loadItems
    ? (searchItems ?? initialItems)
    : (inputValue.length > 0 && inputValue.length < minCharsToTrigger
        ? []
        : (staticItems ?? [])
      ).filter((item) => {
        if (!inputValue) return true
        if (filterKeys.length) {
          return filterKeys.some((key) => {
            const field = item[key]
            return typeof field === 'string' && field.toLowerCase().includes(lowerQuery)
          })
        }
        return optionToLabel(item)?.toLowerCase().includes(lowerQuery)
      })

  useEffect(() => {
    if (!loadItems || debounceTime < 200) return
    let cancelled = false
    initialRequest.current ??= loadItems('')
    initialRequest.current.then(
      (items) => {
        if (!cancelled) setInitialItems(items)
      },
      (error: unknown) => {
        if (!cancelled) console.error('Error fetching/filtering suggestions:', error)
      },
    )
    return () => {
      cancelled = true
    }
  }, [loadItems, debounceTime])

  const performSearch = useCallback(
    async (query: string) => {
      const request = ++requestSequence.current
      setHighlightedIndex(-1)
      setHasSearched(true)
      setIsOpen(true)
      if (!loadItems) return
      if (query.length > 0 && query.length < minCharsToTrigger) {
        setSearchItems([])
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      try {
        const items = await loadItems(query)
        if (request === requestSequence.current) setSearchItems(items)
      } catch (error) {
        if (request === requestSequence.current) {
          console.error('Error fetching/filtering suggestions:', error)
          setSearchItems([])
        }
      } finally {
        if (request === requestSequence.current) setIsLoading(false)
      }
    },
    [loadItems, minCharsToTrigger],
  )

  const debouncedSearch = useCallback(
    (query: string) => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current)
      debounceTimeoutRef.current = setTimeout(() => {
        void performSearch(query)
      }, debounceTime)
    },
    [performSearch, debounceTime],
  )

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const query = event.target.value
    setInputDraft(query)
    ++requestSequence.current
    setHighlightedIndex(-1)
    if (value != null && (!matchingOption || optionToLabel(matchingOption) !== query)) {
      setClearingSelection(true)
      onChange(null)
    }
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current)
    if (!query) {
      setSearchItems([])
      setIsLoading(false)
      setIsOpen(Boolean(staticItems?.length))
    } else {
      debouncedSearch(query)
    }
  }

  function handleOptionClick(item: T) {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current)
    ++requestSequence.current
    setSelectedOption(item)
    if (loadItems) setSearchItems([])
    setInputDraft(optionToLabel(item))
    setClearingSelection(false)
    setIsOpen(false)
    setIsLoading(false)
    inputRef.current?.focus()
    onChange(optionToValue(item))
  }

  const handleKeyDown = (ev: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    if (!isOpen && (ev.key === 'ArrowDown' || ev.key === 'ArrowUp')) {
      // Open dropdown and trigger search
      if (!loadItems && staticItems && staticItems.length > 0) {
        performSearch(inputValue).catch(console.error)
      } else if (loadItems && inputValue.length >= minCharsToTrigger) {
        performSearch(inputValue).catch(console.error)
      }
      return
    }

    if (!isOpen && ev.key !== 'Tab') {
      // If closed and user types more, trigger search
      if (inputValue.length >= minCharsToTrigger && !loadItems) {
        // for static items, re-filter
        debouncedSearch(inputValue)
      } else if (inputValue.length >= minCharsToTrigger && loadItems) {
        // for dynamic, user typing should re-trigger if desired
        // or rely on input change handler
      }
    }

    switch (ev.key) {
      case 'ArrowDown':
        ev.preventDefault()
        setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        ev.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
        break
      case 'Enter':
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          ev.preventDefault()
          handleOptionClick(suggestions[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
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
      } else if (inputValue.length === 0) {
        // Show initial results on focus if we have them
        setIsOpen(true)
      }
    }
  }

  const handleInputBlur = (_e: FocusEvent<HTMLInputElement>) => {
    onBlur?.()
    setTimeout(() => {
      if (listRef.current && !listRef.current.contains(document.activeElement)) {
        setIsOpen(false)
      }
    }, 100)
  }

  const updateDropdownPosition = useCallback(() => {
    if (typeof window === 'undefined') return
    const inputElement = inputRef.current
    if (!inputElement) return

    const rect = inputElement.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    const availableBelow = viewportHeight - rect.bottom
    const availableAbove = rect.top
    const shouldOpenAbove =
      availableBelow < DROPDOWN_MIN_HEIGHT_PX && availableAbove > availableBelow

    const maxHeight = Math.min(
      DROPDOWN_MAX_HEIGHT_PX,
      Math.max(DROPDOWN_MIN_HEIGHT_PX, viewportHeight - DROPDOWN_MARGIN_PX * 2),
    )

    // For fixed positioning, coordinates are viewport-relative.
    let top = rect.bottom + DROPDOWN_MARGIN_PX
    if (shouldOpenAbove) {
      const proposedTop = rect.top - maxHeight - DROPDOWN_MARGIN_PX
      if (proposedTop >= DROPDOWN_MARGIN_PX) {
        top = proposedTop
      }
    }

    const minLeft = DROPDOWN_MARGIN_PX
    const maxLeft = viewportWidth - rect.width - DROPDOWN_MARGIN_PX
    const left = Math.min(Math.max(rect.left, minLeft), Math.max(minLeft, maxLeft))

    setDropdownStyles({
      top,
      left,
      width: rect.width,
      maxHeight,
    })
  }, [])

  useLayoutEffect(() => {
    if (!isOpen) return
    updateDropdownPosition()
  }, [isOpen, updateDropdownPosition, suggestions.length])

  useEffect(() => {
    if (!isOpen) return

    const handleReposition = () => {
      updateDropdownPosition()
    }

    window.addEventListener('resize', handleReposition, { passive: true })
    window.addEventListener('scroll', handleReposition, { capture: true, passive: true })

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleReposition)
      window.visualViewport.addEventListener('scroll', handleReposition)
    }

    return () => {
      window.removeEventListener('resize', handleReposition)
      window.removeEventListener('scroll', handleReposition, true)

      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleReposition)
        window.visualViewport.removeEventListener('scroll', handleReposition)
      }
    }
  }, [isOpen, updateDropdownPosition])

  useEffect(() => {
    const currentList = listRef.current
    if (isOpen && highlightedIndex >= 0 && currentList) {
      const optionElement = currentList.children[highlightedIndex]
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
        event.target instanceof Node &&
        inputRef.current &&
        !inputRef.current.contains(event.target) &&
        listRef.current &&
        !listRef.current.contains(event.target)
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
      requestSequence.current = requestSequence.current + 1
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

  const dropdownVisible =
    isOpen && (suggestions.length > 0 || showNoResults || showMinCharsMessage || isLoading)

  const createSafeId = (itemValue: string, idx: number) =>
    `option-${idx}-${String(itemValue).replace(/[^A-Za-z0-9_-]/g, '_')}`

  return (
    <div className={cn('relative', className)}>
      {label && (
        <label
          htmlFor={id ?? label}
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
          ref={setInputRef}
          id={id ?? label}
          name={name}
          type="text"
          className={cn(
            'w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200',
            leftIcon ? 'pl-10' : '',
            rightIcon || isLoading ? 'pr-10' : '',
            inputClassName,
          )}
          placeholder={placeholder ?? 'Type to search...'}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-required={ariaRequired}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          aria-expanded={isOpen}
          aria-controls={isOpen ? 'autocomplete-list' : undefined}
          aria-activedescendant={
            highlightedIndex >= 0 && suggestions[highlightedIndex]
              ? createSafeId(optionToValue(suggestions[highlightedIndex]), highlightedIndex)
              : undefined
          }
        />
        {rightIcon && !isLoading && (
          <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
            {rightIcon}
          </span>
        )}
        {isLoading && (
          <span className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <LoadingSpinner size="sm" />
          </span>
        )}
      </div>

      {dropdownVisible && (
        <ul
          ref={listRef}
          id="autocomplete-list"
          role="listbox"
          className={cn(
            'z-[70] w-full bg-white dark:bg-gray-900 shadow-lg rounded-xl py-1 overflow-auto animate-fade-in',
            'ring-1 ring-black/5 dark:ring-white/10 border border-transparent',
            !dropdownStyles && 'absolute left-0 mt-2',
          )}
          style={
            dropdownStyles
              ? {
                  position: 'fixed',
                  top: dropdownStyles.top,
                  left: dropdownStyles.left,
                  width: dropdownStyles.width,
                  maxHeight: dropdownStyles.maxHeight,
                }
              : undefined
          }
        >
          <li className="px-4 py-2 text-gray-500 dark:text-gray-400 text-center">
            {isLoading
              ? 'Loading...'
              : showNoResults
                ? 'No results found.'
                : showMinCharsMessage
                  ? `Type at least ${minCharsToTrigger} characters to search`
                  : null}
          </li>

          {!isLoading &&
            !showNoResults &&
            !showMinCharsMessage &&
            suggestions.map((item, idx) => {
              const itemValue = optionToValue(item)
              const safeId = createSafeId(itemValue, idx)
              const isHighlighted = idx === highlightedIndex
              return (
                <li
                  key={safeId}
                  id={safeId}
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
                        <span className="mr-2 flex-shrink-0">{optionToIcon(item)}</span>
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
