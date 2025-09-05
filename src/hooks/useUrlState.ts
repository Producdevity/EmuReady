import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useState, useRef, useEffect } from 'react'

interface UseUrlStateOptions {
  debounceMs?: number
  mode?: 'replace' | 'push'
  resetPageOnChange?: boolean
}

/**
 * Manage state that syncs with URL parameters.
 *
 * Key principles:
 * 1. URL is the source of truth for actual values
 * 2. Local state is only for immediate UI feedback
 * 3. No bidirectional syncing to avoid feedback loops
 * 4. Handles debouncing internally
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
  // Track when the user is actively typing (within debounce window)
  const isTypingRef = useRef(false)

  // Update local value when URL changes due to browser navigation
  // (not our own updates)
  const lastUrlValueRef = useRef(urlValue)
  useEffect(() => {
    // Avoid clobbering user input while they are typing (debounce window)
    if (isTypingRef.current) return

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
      // Mark as typing to prevent URL-driven clobbering during debounce
      isTypingRef.current = true

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
        // Debounce window ends after we flush our update to the URL
        isTypingRef.current = false
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
