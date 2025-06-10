import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import useDebouncedValue from './useDebouncedValue'

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('basic debouncing', () => {
    it('should return initial value immediately', () => {
      const { result } = renderHook(() => useDebouncedValue('initial', 500))

      expect(result.current).toBe('initial')
    })

    it('should debounce value changes', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: 'initial', delay: 500 },
        },
      )

      expect(result.current).toBe('initial')

      // Change the value
      rerender({ value: 'updated', delay: 500 })

      // Should still be the old value
      expect(result.current).toBe('initial')

      // Fast forward time but not enough to trigger
      act(() => {
        vi.advanceTimersByTime(300)
      })
      expect(result.current).toBe('initial')

      // Fast forward to trigger debounce
      act(() => {
        vi.advanceTimersByTime(200)
      })
      expect(result.current).toBe('updated')
    })

    it('should reset the timer when value changes rapidly', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: 'initial', delay: 500 },
        },
      )

      rerender({ value: 'first', delay: 500 })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      // Change again before timer fires
      rerender({ value: 'second', delay: 500 })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      // Should still be initial value
      expect(result.current).toBe('initial')

      // Now wait full duration
      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(result.current).toBe('second')
    })
  })

  describe('different delay values', () => {
    it('should handle zero delay', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: 'initial', delay: 0 },
        },
      )

      rerender({ value: 'updated', delay: 0 })

      // With zero delay, it should update immediately on next tick
      act(() => {
        vi.advanceTimersByTime(0)
      })

      expect(result.current).toBe('updated')
    })

    it('should handle very short delays', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: 'initial', delay: 50 },
        },
      )

      rerender({ value: 'updated', delay: 50 })

      act(() => {
        vi.advanceTimersByTime(50)
      })

      expect(result.current).toBe('updated')
    })

    it('should handle long delays', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: 'initial', delay: 2000 },
        },
      )

      rerender({ value: 'updated', delay: 2000 })

      act(() => {
        vi.advanceTimersByTime(1999)
      })
      expect(result.current).toBe('initial')

      act(() => {
        vi.advanceTimersByTime(1)
      })
      expect(result.current).toBe('updated')
    })
  })

  describe('various value types', () => {
    it('should work with numbers', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: 0, delay: 300 },
        },
      )

      rerender({ value: 42, delay: 300 })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(result.current).toBe(42)
    })

    it('should work with objects', () => {
      const initialObj = { name: 'John', age: 30 }
      const updatedObj = { name: 'Jane', age: 25 }

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: initialObj, delay: 300 },
        },
      )

      rerender({ value: updatedObj, delay: 300 })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(result.current).toEqual(updatedObj)
    })

    it('should work with arrays', () => {
      const initialArray = [1, 2, 3]
      const updatedArray = [4, 5, 6]

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: initialArray, delay: 300 },
        },
      )

      rerender({ value: updatedArray, delay: 300 })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(result.current).toEqual(updatedArray)
    })

    it('should handle null and undefined values', () => {
      const { result, rerender } = renderHook(
        ({
          value,
          delay,
        }: {
          value: string | null | undefined
          delay: number
        }) => useDebouncedValue(value, delay),
        {
          initialProps: {
            value: 'initial' as string | null | undefined,
            delay: 300,
          },
        },
      )

      expect(result.current).toBe('initial')

      act(() => {
        rerender({ value: null, delay: 300 })
      })

      expect(result.current).toBe('initial') // Should still be initial, not debounced yet

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(result.current).toBe(null)

      act(() => {
        rerender({ value: undefined, delay: 300 })
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(result.current).toBe(undefined)
    })
  })

  describe('performance and edge cases', () => {
    it('should handle rapid value changes efficiently', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: 0, delay: 300 },
        },
      )

      // Simulate rapid typing
      for (let i = 1; i <= 10; i++) {
        rerender({ value: i, delay: 300 })
        act(() => {
          vi.advanceTimersByTime(50)
        })
      }

      // Should still be initial value
      expect(result.current).toBe(0)

      // Wait for debounce to trigger
      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(result.current).toBe(10)
    })

    it('should handle delay changes', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: 'initial', delay: 500 },
        },
      )

      rerender({ value: 'updated', delay: 100 })

      // Wait for the new shorter delay
      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current).toBe('updated')
    })
  })

  describe('real-world use cases', () => {
    it('should work for search input debouncing', () => {
      const { result, rerender } = renderHook(
        ({ searchTerm }) => useDebouncedValue(searchTerm, 300),
        {
          initialProps: { searchTerm: '' },
        },
      )

      // Simulate user typing "hello"
      const searchTerms = ['h', 'he', 'hel', 'hell', 'hello']

      searchTerms.forEach((term) => {
        rerender({ searchTerm: term })
        act(() => {
          vi.advanceTimersByTime(100)
        })
      })

      // Should still be empty (original value)
      expect(result.current).toBe('')

      // Complete the debounce
      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(result.current).toBe('hello')
    })

    it('should work for API call optimization', () => {
      const { result, rerender } = renderHook(
        ({ filters }) => useDebouncedValue(filters, 500),
        {
          initialProps: {
            filters: { category: 'all', price: { min: 0, max: 100 } },
          },
        },
      )

      // Simulate rapid filter changes
      rerender({
        filters: { category: 'electronics', price: { min: 0, max: 100 } },
      })

      act(() => {
        vi.advanceTimersByTime(200)
      })

      rerender({
        filters: { category: 'electronics', price: { min: 50, max: 200 } },
      })

      act(() => {
        vi.advanceTimersByTime(200)
      })

      rerender({
        filters: { category: 'electronics', price: { min: 50, max: 300 } },
      })

      // Should still have original filters
      expect(result.current).toEqual({
        category: 'all',
        price: { min: 0, max: 100 },
      })

      // Wait for debounce
      act(() => {
        vi.advanceTimersByTime(500)
      })

      expect(result.current).toEqual({
        category: 'electronics',
        price: { min: 50, max: 300 },
      })
    })
  })
})
