import { useState, useEffect, useCallback, useRef } from 'react'
import { type z } from 'zod'
import toast from '@/lib/toast'
import { safeParseJSON } from '@/utils/client-validation'

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  enabled = true,
  schema?: z.ZodSchema<T>,
) {
  const [isHydrated, setIsHydrated] = useState(false)

  const [storedValue, setStoredValue] = useState<T>(initialValue)

  // Use a ref to store the current value to avoid circular dependencies
  const storedValueRef = useRef(storedValue)
  storedValueRef.current = storedValue

  useEffect(() => {
    if (!enabled) {
      setIsHydrated(true)
      return
    }

    setIsHydrated(true)

    // Try to read from localStorage again after hydration
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        const parsed = schema
          ? safeParseJSON(item, schema, storedValueRef.current)
          : JSON.parse(item)
        setStoredValue(parsed)
      }
    } catch (error) {
      // Don't throw, just log and continue with current value
      console.error(`Error reading localStorage key "${key}":`, (error as Error).message)

      // Only show user-facing error for JSON parsing issues with existing data
      try {
        const item = window.localStorage.getItem(key)
        if (item !== null && typeof item === 'string') {
          // We have data but can't parse it
          toast.warning('Failed to load your preferences. Please refresh the page to try again.')
        }
      } catch {
        // If even getting the item fails, just ignore
      }
    }
  }, [key, enabled, schema])

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      if (!enabled) {
        // When disabled, only update local state, no localStorage
        const valueToStore = value instanceof Function ? value(storedValueRef.current) : value
        setStoredValue(valueToStore)
        return
      }

      try {
        const valueToStore = value instanceof Function ? value(storedValueRef.current) : value
        setStoredValue(valueToStore)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
        toast.warning('Failed to save your preferences. Please try again.')
        // Re-throw so calling code can handle it too
        throw error
      }
    },
    [key, enabled],
  )

  return [storedValue, setValue, isHydrated] as const
}
