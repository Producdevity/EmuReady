'use client'

import { Command as CommandPrimitive } from 'cmdk'
import { ChevronsUpDown, X, Search } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Button,
  Badge,
  Popover,
  PopoverContent,
  PopoverTrigger,
  LoadingSpinner,
} from '@/components/ui'
import { cn } from '@/lib/utils'

export interface AsyncOption {
  id: string
  name: string
}

export interface AsyncMultiSelectProps {
  label: string
  value: string[]
  onChange: (value: string[]) => void
  loadOptions: (inputValue: string) => Promise<AsyncOption[]>
  placeholder?: string
  emptyMessage?: string
  className?: string
  maxSelected?: number
}

export function AsyncMultiSelect({
  label,
  value = [],
  onChange,
  loadOptions,
  placeholder = 'Select options',
  emptyMessage = 'No options found.',
  className,
  maxSelected,
}: AsyncMultiSelectProps) {
  const [options, setOptions] = useState<AsyncOption[]>([])
  const [inputValue, setInputValue] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState<boolean>(false)
  const debouncedFetchRef = useRef<NodeJS.Timeout | null>(null)

  const fetchOptions = useCallback(
    async (query: string) => {
      setLoading(true)
      setError(null)

      try {
        const results = await loadOptions(query)
        setOptions(results)
      } catch (err) {
        setError('Failed to load options')
        console.error('Error loading options:', err)
      } finally {
        setLoading(false)
      }
    },
    [loadOptions],
  )

  useEffect(() => {
    if (open) {
      fetchOptions(inputValue)
    }

    const ref = debouncedFetchRef.current
    return () => {
      if (ref) {
        clearTimeout(ref)
      }
    }
  }, [open, inputValue, fetchOptions])

  const handleSelect = useCallback(
    (optionId: string) => {
      if (value.includes(optionId)) {
        onChange(value.filter((item) => item !== optionId))
      } else {
        if (maxSelected && value.length >= maxSelected) {
          return
        }
        onChange([...value, optionId])
      }
    },
    [onChange, value, maxSelected],
  )

  const handleRemove = useCallback(
    (optionId: string) => {
      onChange(value.filter((item) => item !== optionId))
    },
    [onChange, value],
  )

  const selectedOptions = options.filter((option) => value.includes(option.id))

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="truncate">
              {value.length > 0 ? `${value.length} selected` : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full min-w-[200px] p-0" align="start">
          <div className="flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground">
            <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandPrimitive.Input
                placeholder={`Search ${label.toLowerCase()}...`}
                value={inputValue}
                onValueChange={setInputValue}
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <CommandPrimitive.List className="max-h-[300px] overflow-y-auto overflow-x-hidden">
              {error ? (
                <CommandPrimitive.Empty className="py-6 text-center text-sm">
                  <div className="text-red-500">{error}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => fetchOptions(inputValue)}
                  >
                    Retry
                  </Button>
                </CommandPrimitive.Empty>
              ) : options.length === 0 && !loading ? (
                <CommandPrimitive.Empty className="py-6 text-center text-sm">
                  {emptyMessage}
                </CommandPrimitive.Empty>
              ) : (
                <CommandPrimitive.Group>
                  {value.length > 0 && (
                    <div className="flex items-center justify-between px-2 py-1.5 text-sm border-b">
                      <span className="font-medium">Selected</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onChange([])}
                        className="h-auto p-1"
                      >
                        Clear all
                      </Button>
                    </div>
                  )}

                  {loading ? (
                    <div className="flex items-center justify-center py-6">
                      <LoadingSpinner />
                    </div>
                  ) : (
                    options.map((option) => (
                      <CommandPrimitive.Item
                        key={option.id}
                        value={option.id}
                        onSelect={() => handleSelect(option.id)}
                        className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      >
                        <div
                          className={cn(
                            'mr-2 h-4 w-4',
                            value.includes(option.id) ? 'opacity-100' : 'opacity-0',
                          )}
                        >
                          {value.includes(option.id) && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        {option.name}
                      </CommandPrimitive.Item>
                    ))
                  )}

                  {maxSelected && value.length >= maxSelected && (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      Max {maxSelected} items selected
                    </div>
                  )}
                </CommandPrimitive.Group>
              )}
            </CommandPrimitive.List>
          </div>
        </PopoverContent>
      </Popover>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedOptions.map((option) => (
            <Badge key={option.id}>
              {option.name}
              <button
                type="button"
                className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onClick={() => handleRemove(option.id)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {option.name}</span>
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
