import { renderHook, render, screen, act } from '@testing-library/react'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { z } from 'zod'
import toast from '@/lib/toast'
import { useLocalStorage } from './useLocalStorage'

const StringSchema = z.string()
const NumberSchema = z.number()
const PersonSchema = z.object({ name: z.string(), age: z.number() })
const UserSchema = z.object({ id: z.number(), name: z.string() })
const NumbersSchema = z.array(z.number())
const NullishSchema = z.null().optional()

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
        useLocalStorage('test-key', 'initial-value', StringSchema),
      )

      const [value] = result.current
      expect(value).toBe('initial-value')
    })

    it('should return stored value from localStorage', () => {
      localStorageMock.setItem('test-key', JSON.stringify('stored-value'))

      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial-value', StringSchema),
      )

      const [value] = result.current
      expect(value).toBe('stored-value')
    })

    it('should update localStorage when value is set', () => {
      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial-value', StringSchema),
      )

      act(() => {
        const [, setValue] = result.current
        setValue('new-value')
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify('new-value'))
    })

    it('should return isHydrated as true after initial render', () => {
      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial-value', StringSchema),
      )

      const [, , isHydrated] = result.current
      expect(isHydrated).toBe(true)
    })
  })

  describe('function setValue', () => {
    it('does not rewrite or dispatch an event for an unchanged stored value', () => {
      localStorageMock.setItem('unchanged', '5')
      const changed = vi.fn()
      window.addEventListener('storage', changed)
      try {
        const { result } = renderHook(() => useLocalStorage('unchanged', 0, NumberSchema))
        localStorageMock.setItem.mockClear()
        act(() => result.current[1](5))
        expect(localStorageMock.setItem).not.toHaveBeenCalled()
        expect(changed).not.toHaveBeenCalled()
      } finally {
        window.removeEventListener('storage', changed)
      }
    })

    it('keeps failed background writes local without displaying a save-error toast', () => {
      const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const { result } = renderHook(() => useLocalStorage('background', 0, NumberSchema))
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage blocked')
      })
      try {
        act(() => {
          expect(() => result.current[1](5, { notifyOnError: false })).toThrow('Storage blocked')
        })
        expect(result.current[0]).toBe(5)
        expect(toast.warning).not.toHaveBeenCalled()
      } finally {
        warning.mockRestore()
      }
    })

    it('should handle function updates', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 0, NumberSchema))

      act(() => {
        const [, setValue] = result.current
        setValue((prev) => prev + 1)
      })

      const [value] = result.current
      expect(value).toBe(1)
    })

    it('should handle direct value updates', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial', StringSchema))

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
      const { result } = renderHook(() => useLocalStorage('user', initialObject, PersonSchema))

      act(() => {
        const [, setValue] = result.current
        setValue({ name: 'Jane', age: 25 })
      })

      const [value] = result.current
      expect(value).toEqual({ name: 'Jane', age: 25 })
    })

    it('should handle arrays', () => {
      const { result } = renderHook(() => useLocalStorage('items', [1, 2, 3], NumbersSchema))

      act(() => {
        const [, setValue] = result.current
        setValue([4, 5, 6])
      })

      const [value] = result.current
      expect(value).toEqual([4, 5, 6])
    })

    it('should handle null and undefined', () => {
      const { result } = renderHook(() =>
        useLocalStorage<null | undefined>('nullable', null, NullishSchema),
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
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Set invalid JSON in localStorage
      localStorageMock.setItem('test-key', 'invalid-json{')

      const { result } = renderHook(() => useLocalStorage('test-key', 'fallback', StringSchema))

      // Should fall back to initial value
      const [value] = result.current
      expect(value).toBe('fallback')

      // Restore console.error
      consoleErrorSpy.mockRestore()
    })

    it('should handle localStorage setItem errors', () => {
      // Mock console.warn to suppress expected error logs
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Create a proper spy that can be restored
      const originalSetItem = localStorageMock.setItem
      const setItemSpy = vi.spyOn(localStorageMock, 'setItem')
      setItemSpy.mockImplementation(() => {
        throw new Error('localStorage save error')
      })

      const { result } = renderHook(() => useLocalStorage('test-key', 'initial', StringSchema))

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
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Create a proper spy that can be restored
      const originalGetItem = localStorageMock.getItem
      const getItemSpy = vi.spyOn(localStorageMock, 'getItem')
      getItemSpy.mockImplementation(() => {
        throw new Error('localStorage read error')
      })

      const { result } = renderHook(() => useLocalStorage('test-key', 'fallback', StringSchema))

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
        useLocalStorage('test-key', 'initial', StringSchema, false),
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
        useLocalStorage('test-key', 'initial', StringSchema, false),
      )

      const [, , isHydrated] = result.current
      expect(isHydrated).toBe(true)
    })

    it('should handle function updates when disabled', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 0, NumberSchema, false))

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
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Test behavior when hook initializes without localStorage access
      const originalLocalStorage = global.localStorage
      Object.defineProperty(global, 'localStorage', {
        value: undefined,
        configurable: true,
      })

      const { result } = renderHook(() => useLocalStorage('test-key', 'ssr-value', StringSchema))

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
        useLocalStorage('test-key', 'initial-value', StringSchema),
      )

      // Force re-render to trigger hydration effect
      rerender()

      const [value] = result.current
      expect(value).toBe('localStorage-value')
    })

    it('should handle hydration with corrupted localStorage data', () => {
      // Mock console.error to suppress expected error logs
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Clear any existing mocks
      vi.clearAllMocks()
      localStorageMock.clear()

      localStorageMock.setItem('test-key', 'corrupted-json{')

      const { result, rerender } = renderHook(() =>
        useLocalStorage('test-key', 'fallback-value', StringSchema),
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
        useLocalStorage<{ id: number; name: string }>(
          'user',
          {
            id: 1,
            name: 'John',
          },
          UserSchema,
        ),
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
  describe('external storage subscription', () => {
    it('keeps two mounted consumers of the same key in sync', () => {
      const first = renderHook(() => useLocalStorage('shared', 0, NumberSchema))
      const second = renderHook(() => useLocalStorage('shared', 0, NumberSchema))
      act(() => first.result.current[1](7))
      expect(first.result.current[0]).toBe(7)
      expect(second.result.current[0]).toBe(7)
    })

    it('uses the latest value across consecutive functional writes from different consumers', () => {
      const first = renderHook(() => useLocalStorage('counter', 0, NumberSchema))
      const second = renderHook(() => useLocalStorage('counter', 0, NumberSchema))
      act(() => {
        first.result.current[1]((previous) => previous + 1)
        second.result.current[1]((previous) => previous + 1)
      })
      expect(first.result.current[0]).toBe(2)
      expect(second.result.current[0]).toBe(2)
    })

    it('preserves consecutive functional updates when persistence is disabled', () => {
      const { result } = renderHook(() => useLocalStorage('local-counter', 0, NumberSchema, false))
      act(() => {
        result.current[1]((previous) => previous + 1)
        result.current[1]((previous) => previous + 1)
      })
      expect(result.current[0]).toBe(2)
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
    })

    it('updates on matching storage events from another document', () => {
      const { result } = renderHook(() => useLocalStorage('watched', 'initial', StringSchema))
      localStorageMock.setItem('watched', JSON.stringify('another-tab'))
      act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'unrelated' })))
      expect(result.current[0]).toBe('initial')
      act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'watched' })))
      expect(result.current[0]).toBe('another-tab')
    })

    it('rejects stored JSON that does not match the preference schema', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      localStorageMock.setItem('number', JSON.stringify('not-a-number'))
      const { result } = renderHook(() => useLocalStorage('number', 5, NumberSchema))
      expect(result.current[0]).toBe(5)
      consoleError.mockRestore()
    })

    it('does not revive a failed local draft after external values change back', () => {
      localStorageMock.setItem('failed-draft', '0')
      const { result } = renderHook(() => useLocalStorage('failed-draft', 0, NumberSchema))
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const setItem = vi.spyOn(localStorageMock, 'setItem').mockImplementationOnce(() => {
        throw new Error('Quota exceeded')
      })
      act(() => {
        expect(() => result.current[1](7)).toThrow('Quota exceeded')
      })
      expect(result.current[0]).toBe(7)
      act(() => {
        localStorageMock.setItem('failed-draft', '1')
        window.dispatchEvent(new StorageEvent('storage', { key: 'failed-draft' }))
      })
      expect(result.current[0]).toBe(1)
      act(() => {
        localStorageMock.setItem('failed-draft', '0')
        window.dispatchEvent(new StorageEvent('storage', { key: 'failed-draft' }))
      })
      expect(result.current[0]).toBe(0)
      setItem.mockRestore()
      consoleWarn.mockRestore()
    })

    it('does not reuse a draft from a different key', () => {
      const { result, rerender } = renderHook(
        ({ key }) => useLocalStorage(key, 'initial', StringSchema),
        { initialProps: { key: 'first' } },
      )
      act(() => result.current[1]('first-draft'))
      localStorageMock.setItem('second', JSON.stringify('second-value'))
      rerender({ key: 'second' })
      expect(result.current[0]).toBe('second-value')
    })

    it('hydrates from the server value before displaying saved client preferences', () => {
      localStorageMock.setItem('hydration', JSON.stringify('client-value'))
      function Preference() {
        return useLocalStorage('hydration', 'server-value', StringSchema)[0]
      }
      const element = createElement(Preference)
      const markup = renderToString(element)
      expect(markup).toBe('server-value')
      const container = document.createElement('div')
      container.innerHTML = markup
      document.body.append(container)
      const recoverableError = vi.fn()
      render(element, { container, hydrate: true, onRecoverableError: recoverableError })
      expect(screen.getByText('client-value')).toBeInTheDocument()
      expect(recoverableError).not.toHaveBeenCalled()
    })
  })
})
