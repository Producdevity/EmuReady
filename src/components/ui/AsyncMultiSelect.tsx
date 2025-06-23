import { Check, ChevronsUpDown, X } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from './LoadingSpinner'

// Temporary type definitions until we can properly import the components
type CommandProps = React.HTMLAttributes<HTMLDivElement>
type CommandEmptyProps = React.HTMLAttributes<HTMLDivElement>
type CommandGroupProps = React.HTMLAttributes<HTMLDivElement>
type CommandInputProps = React.HTMLAttributes<HTMLInputElement> & {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
}
type CommandItemProps = React.HTMLAttributes<HTMLDivElement> & {
  value: string
}

type CommandListProps = React.HTMLAttributes<HTMLDivElement>

type PopoverProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

type PopoverTriggerProps = {
  asChild?: boolean
  children: React.ReactNode
}

type PopoverContentProps = React.HTMLAttributes<HTMLDivElement> & {
  align?: 'start' | 'center' | 'end'
  children: React.ReactNode
}

// Simple component implementations
const Command = (props: CommandProps) => <div {...props} />
const CommandEmpty = (props: CommandEmptyProps) => <div {...props} />
const CommandGroup = (props: CommandGroupProps) => <div {...props} />
const CommandInput = (props: CommandInputProps) => {
  const { onValueChange, ...inputProps } = props
  return (
    <input onChange={(e) => onValueChange?.(e.target.value)} {...inputProps} />
  )
}

// Fixed implementation that doesn't use the conflicting onSelect prop
const CommandItem = (props: CommandItemProps) => {
  const { value, ...itemProps } = props
  return <div data-value={value} {...itemProps} />
}

// TODO: add shadCN
const CommandList = (props: CommandListProps) => <div {...props} />

const Popover = (props: PopoverProps) => <div {...props} />
const PopoverTrigger = (props: PopoverTriggerProps) => <div {...props} />
const PopoverContent = (props: PopoverContentProps) => <div {...props} />

export interface AsyncOption {
  id: string
  name: string
}

interface AsyncMultiSelectProps {
  label: string
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  emptyMessage?: string
  loadingMessage?: string
  maxDisplayed?: number
  className?: string
  disabled?: boolean

  // Async props
  fetchOptions: (params: {
    search?: string
    page: number
    limit: number
  }) => Promise<{
    items: AsyncOption[]
    hasMore: boolean
    total?: number
  }>
  debounceMs?: number
  pageSize?: number
}

function AsyncMultiSelect(props: AsyncMultiSelectProps) {
  const {
    label,
    value,
    onChange,
    placeholder = 'Select items...',
    emptyMessage = 'No items found.',
    loadingMessage = 'Loading items...',
    maxDisplayed = 2,
    className,
    disabled = false,
    fetchOptions,
    debounceMs = 300,
    pageSize = 20,
  } = props

  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [options, setOptions] = useState<AsyncOption[]>([])
  const [selectedOptions, setSelectedOptions] = useState<AsyncOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [_total, setTotal] = useState(0) // Prefix with _ since it's not used directly

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Load options function
  const loadOptions = useCallback(
    async (pageToLoad: number, replace = false) => {
      try {
        setLoading(true)
        setError(null)

        const result = await fetchOptions({
          search: inputValue,
          page: pageToLoad,
          limit: pageSize,
        })

        setOptions((prev) =>
          replace ? result.items : [...prev, ...result.items],
        )
        setHasMore(result.hasMore)
        setTotal(result.total || 0)
        setPage(pageToLoad)
      } catch (err) {
        console.error('Error loading options:', err)
        setError('Failed to load options')
      } finally {
        setLoading(false)
      }
    },
    [fetchOptions, inputValue, pageSize],
  )

  // Reset pagination when search changes
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      setPage(1)
      setOptions([])
      loadOptions(1, true)
    }, debounceMs)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [inputValue, debounceMs, loadOptions])

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    if (!open) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore && !loading) {
          loadOptions(page + 1)
        }
      },
      { threshold: 0.5 },
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    observerRef.current = observer

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [open, hasMore, loading, page, loadOptions])

  // Fetch selected options when value changes
  useEffect(() => {
    const fetchSelectedOptions = async () => {
      if (!value.length) {
        setSelectedOptions([])
        return
      }

      try {
        // We need to fetch all selected options, even if they're not in the current search results
        const selectedIds = new Set(value)
        const missingIds = value.filter(
          (id) => !options.some((option) => option.id === id),
        )

        if (missingIds.length === 0) {
          // All selected options are already in the options list
          setSelectedOptions(
            options.filter((option) => selectedIds.has(option.id)),
          )
          return
        }

        // Fetch the missing options - this assumes your API supports fetching by IDs
        // You might need to adapt this to your actual API
        const result = await fetchOptions({
          page: 1,
          limit: 100,
          search: missingIds.join(','),
        })

        const newSelectedOptions = [
          ...options.filter((option) => selectedIds.has(option.id)),
          ...result.items.filter((option) => selectedIds.has(option.id)),
        ]

        setSelectedOptions(newSelectedOptions)
      } catch (err) {
        console.error('Error fetching selected options:', err)
        setError('Failed to load selected options')
      }
    }

    fetchSelectedOptions()
  }, [value, options, fetchOptions])

  // Handle selection
  const handleSelect = useCallback(
    (optionId: string) => {
      onChange(
        value.includes(optionId)
          ? value.filter((id) => id !== optionId)
          : [...value, optionId],
      )
    },
    [value, onChange],
  )

  // Handle removing a selected item
  const handleRemove = useCallback(
    (optionId: string) => {
      onChange(value.filter((id) => id !== optionId))
    },
    [value, onChange],
  )

  // Handle clearing all selected items
  const handleClear = useCallback(() => {
    onChange([])
  }, [onChange])

  // Open the popover and load initial options
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      setOpen(newOpen)

      if (newOpen && options.length === 0) {
        loadOptions(1, true)
      }
    },
    [loadOptions, options.length],
  )

  return (
    <div className={cn('space-y-2', className)}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
            disabled={disabled}
          >
            {value.length > 0 ? (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-sm text-muted-foreground mr-1">
                  {label}:
                </span>
                {value.length > maxDisplayed ? (
                  <Badge variant="default" className="rounded-md">
                    {value.length} selected
                  </Badge>
                ) : (
                  selectedOptions.map((option) => (
                    <Badge
                      key={option.id}
                      variant="default"
                      className="rounded-md"
                    >
                      {option.name}
                    </Badge>
                  ))
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full min-w-[200px] p-0" align="start">
          <Command className="w-full">
            <CommandInput
              placeholder={`Search ${label.toLowerCase()}...`}
              value={inputValue}
              onValueChange={setInputValue}
              className="h-9"
            />
            <CommandList className="max-h-[300px]">
              {error ? (
                <CommandEmpty className="py-6 text-center text-sm">
                  <div className="text-red-500">{error}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => loadOptions(1, true)}
                  >
                    Retry
                  </Button>
                </CommandEmpty>
              ) : options.length === 0 && !loading ? (
                <CommandEmpty className="py-6 text-center text-sm">
                  {emptyMessage}
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {value.length > 0 && (
                    <div className="flex items-center justify-between px-2 py-1.5 text-sm border-b">
                      <span className="text-muted-foreground">
                        {value.length} selected
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1"
                        onClick={handleClear}
                      >
                        Clear all
                      </Button>
                    </div>
                  )}

                  {options.map((option) => (
                    <CommandItem
                      key={option.id}
                      value={option.id}
                      onClick={() => handleSelect(option.id)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value.includes(option.id)
                            ? 'opacity-100'
                            : 'opacity-0',
                        )}
                      />
                      {option.name}
                    </CommandItem>
                  ))}

                  {/* Load more indicator */}
                  {hasMore && (
                    <div
                      ref={loadMoreRef}
                      className="py-2 text-center text-sm text-muted-foreground"
                    >
                      {loading && <LoadingSpinner size="sm" />}
                    </div>
                  )}

                  {/* Show loading state */}
                  {loading && options.length === 0 && (
                    <div className="py-6 text-center">
                      <LoadingSpinner size="md" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        {loadingMessage}
                      </p>
                    </div>
                  )}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected items display (outside popover) */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {selectedOptions.map((option) => (
            <Badge
              key={option.id}
              variant="default"
              className="flex items-center gap-1 rounded-md"
            >
              {option.name}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleRemove(option.id)}
              />
            </Badge>
          ))}
          {value.length > selectedOptions.length && (
            <Badge variant="default" className="rounded-md">
              +{value.length - selectedOptions.length} more
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

export default AsyncMultiSelect
