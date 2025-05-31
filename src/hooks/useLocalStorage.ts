import { useState, useEffect, useCallback, useRef } from 'react'
import toast from '@/lib/toast'

function useLocalStorage<T>(key: string, initialValue: T) {
  const [isHydrated, setIsHydrated] = useState(false)

  // Pure initializer - no side effects
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      // Silent fail during initialization, handle errors in useEffect
      return initialValue
    }
  })

  // Use a ref to store the current value to avoid circular dependencies
  const storedValueRef = useRef(storedValue)
  storedValueRef.current = storedValue

  useEffect(() => {
    setIsHydrated(true)

    // Try to read from localStorage again after hydration
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        const parsed = JSON.parse(item)
        setStoredValue(parsed)
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)

      // Only show user-facing error for JSON parsing issues with existing data
      const item = window.localStorage.getItem(key)
      if (item !== null && typeof item === 'string') {
        // We have data but can't parse it
        toast.warning(
          'Failed to load your preferences. Please refresh the page to try again.',
        )
      }
    }
  }, [key])

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValueRef.current) : value
        setStoredValue(valueToStore)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
        toast.warning('Failed to save your preferences. Please try again.')
      }
    },
    [key],
  )

  return [storedValue, setValue, isHydrated] as const
}

export default useLocalStorage
