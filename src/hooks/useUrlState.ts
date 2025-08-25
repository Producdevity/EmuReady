import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useState, useRef, useEffect } from 'react'

interface UseUrlStateOptions {
  debounceMs?: number
  mode?: 'replace' | 'push'
  resetPageOnChange?: boolean
}

/**
 * A robust hook for managing state that syncs with URL parameters.
 *
 * Key principles:
 * 1. URL is the source of truth for actual values
 * 2. Local state is only for immediate UI feedback
 * 3. No bidirectional syncing to avoid feedback loops
 * 4. Handles debouncing internally without setTimeout hacks
 *
 * @param key - The URL parameter key
 * @param initialValue - Initial value if not in URL
 * @param options - Configuration options
 */
export function useUrlState<T extends string | number | boolean | string[] | number[] | null>(
  key: string,
  initialValue: T,
  options: UseUrlStateOptions = {},
): [T, (value: T) => void, T] {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { debounceMs = 0, mode = 'replace', resetPageOnChange = true } = options

  // Parse value from URL
  const urlValue = parseUrlValue<T>(searchParams.get(key), initialValue)

  // Local state for immediate UI updates
  const [localValue, setLocalValue] = useState<T>(urlValue)
  const pendingUpdateRef = useRef<NodeJS.Timeout | null>(null)

  // Update local value when URL changes due to browser navigation
  // (not our own updates)
  const lastUrlValueRef = useRef(urlValue)
  useEffect(() => {
    if (urlValue !== lastUrlValueRef.current) {
      setLocalValue(urlValue)
      lastUrlValueRef.current = urlValue
    }
  }, [urlValue])

  // Update function that handles both local state and URL
  const setValue = useCallback(
    (value: T) => {
      // Immediate local update for responsive UI
      setLocalValue(value)

      // Clear any pending URL update
      if (pendingUpdateRef.current) {
        clearTimeout(pendingUpdateRef.current)
        pendingUpdateRef.current = null
      }

      // Function to actually update the URL
      const updateUrl = () => {
        const params = new URLSearchParams(searchParams.toString())

        // Handle the value in URL
        if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
          params.delete(key)
        } else if (Array.isArray(value)) {
          params.set(key, JSON.stringify(value))
        } else {
          params.set(key, String(value))
        }

        // Reset page if requested
        if (resetPageOnChange && key !== 'page') {
          params.delete('page')
        }

        // Update URL
        const url = params.toString() ? `${pathname}?${params.toString()}` : pathname
        if (mode === 'push') {
          router.push(url)
        } else {
          router.replace(url)
        }
      }

      // Apply debounce if configured
      if (debounceMs > 0) {
        pendingUpdateRef.current = setTimeout(updateUrl, debounceMs)
      } else {
        updateUrl()
      }
    },
    [key, searchParams, pathname, router, mode, debounceMs, resetPageOnChange],
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pendingUpdateRef.current) {
        clearTimeout(pendingUpdateRef.current)
      }
    }
  }, [])

  // Return [localValue for UI, setValue function, urlValue for actual filtering]
  return [localValue, setValue, urlValue]
}

/**
 * Hook specifically for search inputs with built-in debouncing
 */
export function useUrlSearch(debounceMs = 300): [string, (value: string) => void, string] {
  return useUrlState<string>('search', '', { debounceMs, resetPageOnChange: true })
}

/**
 * Hook for managing multiple URL parameters at once
 */
export function useUrlFilters<T extends Record<string, unknown>>(
  defaultValues: T,
  options: UseUrlStateOptions = {},
): {
  values: T
  localValues: T
  setFilter: <K extends keyof T>(key: K, value: T[K]) => void
  setFilters: (updates: Partial<T>) => void
  resetFilters: () => void
} {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { mode = 'replace' } = options

  // Parse all values from URL
  const values = Object.keys(defaultValues).reduce((acc, key) => {
    const urlValue = searchParams.get(key)
    acc[key as keyof T] = parseUrlValue(urlValue, defaultValues[key as keyof T])
    return acc
  }, {} as T)

  // Local state for immediate UI updates
  const [localValues, setLocalValues] = useState<T>(values)

  // Update local values when URL changes due to browser navigation
  useEffect(() => {
    setLocalValues(values)
  }, [values])

  // Update a single filter
  const setFilter = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setLocalValues((prev) => ({ ...prev, [key]: value }))

      const params = new URLSearchParams(searchParams.toString())

      if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
        params.delete(String(key))
      } else if (Array.isArray(value)) {
        params.set(String(key), JSON.stringify(value))
      } else {
        params.set(String(key), String(value))
      }

      // Reset page when changing filters
      if (String(key) !== 'page') {
        params.delete('page')
      }

      const url = params.toString() ? `${pathname}?${params.toString()}` : pathname
      if (mode === 'push') {
        router.push(url)
      } else {
        router.replace(url)
      }
    },
    [searchParams, pathname, router, mode],
  )

  // Update multiple filters at once
  const setFilters = useCallback(
    (updates: Partial<T>) => {
      setLocalValues((prev) => ({ ...prev, ...updates }))

      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
          params.delete(key)
        } else if (Array.isArray(value)) {
          params.set(key, JSON.stringify(value))
        } else {
          params.set(key, String(value))
        }
      })

      // Reset page when changing filters
      if (!('page' in updates)) {
        params.delete('page')
      }

      const url = params.toString() ? `${pathname}?${params.toString()}` : pathname
      if (mode === 'push') {
        router.push(url)
      } else {
        router.replace(url)
      }
    },
    [searchParams, pathname, router, mode],
  )

  // Reset all filters
  const resetFilters = useCallback(() => {
    setLocalValues(defaultValues)
    router.replace(pathname)
  }, [defaultValues, pathname, router])

  return {
    values, // URL values for actual filtering
    localValues, // Local values for UI
    setFilter,
    setFilters,
    resetFilters,
  }
}

// Helper function to parse URL values
function parseUrlValue<T>(value: string | null, defaultValue: T): T {
  if (value === null) return defaultValue

  // Handle arrays
  if (Array.isArray(defaultValue)) {
    try {
      const parsed = JSON.parse(value)
      return (Array.isArray(parsed) ? parsed : defaultValue) as T
    } catch {
      return defaultValue
    }
  }

  // Handle booleans
  if (typeof defaultValue === 'boolean') {
    return (value === 'true') as T
  }

  // Handle numbers
  if (typeof defaultValue === 'number') {
    const num = Number(value)
    return (isNaN(num) ? defaultValue : num) as T
  }

  // Handle strings
  return value as T
}
