import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useLocalStorage } from './useLocalStorage'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

vi.mock('@/lib/toast', () => ({ default: { warning: vi.fn() } }))

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  configurable: true,
  writable: true,
})

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorageMock.clear()
  })

  describe('basic functionality', () => {
    it('should return initial value when localStorage is empty', () => {
      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial-value'),
      )

      const [value] = result.current
      expect(value).toBe('initial-value')
    })

    it('should return stored value from localStorage', () => {
      localStorageMock.setItem('test-key', JSON.stringify('stored-value'))

      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial-value'),
      )

      const [value] = result.current
      expect(value).toBe('stored-value')
    })

    it('should update localStorage when value is set', () => {
      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial-value'),
      )

      act(() => {
        const [, setValue] = result.current
        setValue('new-value')
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify('new-value'),
      )
    })

    it('should return isHydrated as true after initial render', () => {
      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial-value'),
      )

      const [, , isHydrated] = result.current
      expect(isHydrated).toBe(true)
    })
  })

  describe('function setValue', () => {
    it('should handle function updates', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 0))

      act(() => {
        const [, setValue] = result.current
        setValue((prev) => prev + 1)
      })

      const [value] = result.current
      expect(value).toBe(1)
    })

    it('should handle direct value updates', () => {
      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial'),
      )

      act(() => {
        const [, setValue] = result.current
        setValue('updated')
      })

      const [value] = result.current
      expect(value).toBe('updated')
    })
  })

  describe('complex data types', () => {
    it('should handle objects', () => {
      const initialObject = { name: 'John', age: 30 }
      const { result } = renderHook(() =>
        useLocalStorage('user', initialObject),
      )

      act(() => {
        const [, setValue] = result.current
        setValue({ name: 'Jane', age: 25 })
      })

      const [value] = result.current
      expect(value).toEqual({ name: 'Jane', age: 25 })
    })

    it('should handle arrays', () => {
      const { result } = renderHook(() => useLocalStorage('items', [1, 2, 3]))

      act(() => {
        const [, setValue] = result.current
        setValue([4, 5, 6])
      })

      const [value] = result.current
      expect(value).toEqual([4, 5, 6])
    })

    it('should handle null and undefined', () => {
      const { result } = renderHook(() =>
        useLocalStorage<null | undefined>('nullable', null),
      )

      act(() => {
        const [, setValue] = result.current
        setValue(undefined)
      })

      const [value] = result.current
      expect(value).toBeUndefined()
    })
  })

  describe('error handling', () => {
    it('should handle JSON parse errors gracefully', () => {
      // Mock console.error to suppress expected error logs
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      // Set invalid JSON in localStorage
      localStorageMock.setItem('test-key', 'invalid-json{')

      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'fallback'),
      )

      // Should fall back to initial value
      const [value] = result.current
      expect(value).toBe('fallback')

      // Restore console.error
      consoleErrorSpy.mockRestore()
    })

    it('should handle localStorage setItem errors', () => {
      // Mock console.warn to suppress expected error logs
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {})

      // Create a proper spy that can be restored
      const originalSetItem = localStorageMock.setItem
      const setItemSpy = vi.spyOn(localStorageMock, 'setItem')
      setItemSpy.mockImplementation(() => {
        throw new Error('localStorage save error')
      })

      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial'),
      )

      expect(() => {
        act(() => {
          const [, setValue] = result.current
          setValue('new-value')
        })
      }).toThrow('localStorage save error')

      // Restore the original implementation
      setItemSpy.mockRestore()
      localStorageMock.setItem = originalSetItem
      consoleWarnSpy.mockRestore()
    })

    it('should handle localStorage getItem errors during hydration', () => {
      // Mock console.error to suppress expected error logs
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      // Create a proper spy that can be restored
      const originalGetItem = localStorageMock.getItem
      const getItemSpy = vi.spyOn(localStorageMock, 'getItem')
      getItemSpy.mockImplementation(() => {
        throw new Error('localStorage read error')
      })

      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'fallback'),
      )

      // Should fall back to initial value
      const [value] = result.current
      expect(value).toBe('fallback')

      // Restore the original implementation
      getItemSpy.mockRestore()
      localStorageMock.getItem = originalGetItem
      consoleErrorSpy.mockRestore()
    })
  })

  describe('disabled mode', () => {
    it('should not use localStorage when disabled', () => {
      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial', false),
      )

      act(() => {
        const [, setValue] = result.current
        setValue('new-value')
      })

      const [value] = result.current
      expect(value).toBe('new-value')
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
    })

    it('should still return isHydrated when disabled', () => {
      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial', false),
      )

      const [, , isHydrated] = result.current
      expect(isHydrated).toBe(true)
    })

    it('should handle function updates when disabled', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 0, false))

      act(() => {
        const [, setValue] = result.current
        setValue((prev) => prev + 5)
      })

      const [value] = result.current
      expect(value).toBe(5)
    })
  })

  describe('SSR compatibility', () => {
    it('should handle server-side rendering', () => {
      // Mock console.error to suppress expected error logs
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      // Test behavior when hook initializes without localStorage access
      const originalLocalStorage = global.localStorage
      Object.defineProperty(global, 'localStorage', {
        value: undefined,
        configurable: true,
      })

      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'ssr-value'),
      )

      const [value] = result.current
      expect(value).toBe('ssr-value')

      // Restore localStorage
      Object.defineProperty(global, 'localStorage', {
        value: originalLocalStorage,
        configurable: true,
      })
      consoleErrorSpy.mockRestore()
    })
  })

  describe('hydration behavior', () => {
    it('should update value after hydration if localStorage has different value', () => {
      // Clear any existing mocks
      vi.clearAllMocks()
      localStorageMock.clear()

      localStorageMock.setItem('test-key', JSON.stringify('localStorage-value'))

      const { result, rerender } = renderHook(() =>
        useLocalStorage('test-key', 'initial-value'),
      )

      // Force re-render to trigger hydration effect
      rerender()

      const [value] = result.current
      expect(value).toBe('localStorage-value')
    })

    it('should handle hydration with corrupted localStorage data', () => {
      // Mock console.error to suppress expected error logs
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      // Clear any existing mocks
      vi.clearAllMocks()
      localStorageMock.clear()

      localStorageMock.setItem('test-key', 'corrupted-json{')

      const { result, rerender } = renderHook(() =>
        useLocalStorage('test-key', 'fallback-value'),
      )

      rerender()

      const [value] = result.current
      expect(value).toBe('fallback-value')

      consoleErrorSpy.mockRestore()
    })
  })

  describe('type safety', () => {
    it('should maintain type safety with TypeScript', () => {
      const { result } = renderHook(() =>
        useLocalStorage<{ id: number; name: string }>('user', {
          id: 1,
          name: 'John',
        }),
      )

      const [value] = result.current

      // TypeScript should enforce the correct type
      expect(value.id).toBe(1)
      expect(value.name).toBe('John')

      act(() => {
        const [, setValue] = result.current
        setValue({ id: 2, name: 'Jane' })
      })

      const [updatedValue] = result.current
      expect(updatedValue.id).toBe(2)
      expect(updatedValue.name).toBe('Jane')
    })
  })
})
