import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useAdminTable from './useAdminTable'

// Mock Next.js navigation hooks
const mockPush = vi.fn()
const mockReplace = vi.fn()
const mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
}))

describe('useAdminTable', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
    // Reset search params
    mockSearchParams.forEach((_, key) => {
      mockSearchParams.delete(key)
    })
  })

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useAdminTable())

      expect(result.current.search).toBe('')
      expect(result.current.page).toBe(1)
      expect(result.current.limit).toBe(20)
      expect(result.current.sortField).toBe(null)
      expect(result.current.sortDirection).toBe(null)
    })

    it('should initialize with custom options', () => {
      const options = {
        defaultLimit: 50,
        defaultSortField: 'name' as const,
        defaultSortDirection: 'asc' as const,
      }

      const { result } = renderHook(() => useAdminTable(options))

      expect(result.current.limit).toBe(50)
      expect(result.current.sortField).toBe('name')
      expect(result.current.sortDirection).toBe('asc')
    })
  })

  describe('search functionality', () => {
    it('should update search value', () => {
      const { result } = renderHook(() => useAdminTable())

      act(() => {
        result.current.setSearch('test search')
      })

      expect(result.current.search).toBe('test search')
    })

    it('should handle search change event and reset page', () => {
      const { result } = renderHook(() => useAdminTable())

      // Set page to something other than 1
      act(() => {
        result.current.setPage(3)
      })

      expect(result.current.page).toBe(3)

      // Simulate search input change
      const mockEvent = {
        target: { value: 'new search' },
      } as React.ChangeEvent<HTMLInputElement>

      act(() => {
        result.current.handleSearchChange(mockEvent)
      })

      expect(result.current.search).toBe('new search')
      expect(result.current.page).toBe(1) // Should reset to page 1
    })
  })

  describe('pagination functionality', () => {
    it('should update page value', () => {
      const { result } = renderHook(() => useAdminTable())

      act(() => {
        result.current.setPage(5)
      })

      expect(result.current.page).toBe(5)
    })
  })

  describe('sorting functionality', () => {
    it('should update sort field and direction', () => {
      const { result } = renderHook(() => useAdminTable<'name' | 'email'>())

      act(() => {
        result.current.setSortField('name')
        result.current.setSortDirection('desc')
      })

      expect(result.current.sortField).toBe('name')
      expect(result.current.sortDirection).toBe('desc')
    })

    it('should handle sort cycling: null -> asc -> desc -> null', () => {
      const { result } = renderHook(() => useAdminTable<'name' | 'email'>())

      // Initial state: no sorting
      expect(result.current.sortField).toBe(null)
      expect(result.current.sortDirection).toBe(null)

      // First click: should set to asc
      act(() => {
        result.current.handleSort('name')
      })

      expect(result.current.sortField).toBe('name')
      expect(result.current.sortDirection).toBe('asc')
      expect(result.current.page).toBe(1)

      // Second click on same field: should set to desc
      act(() => {
        result.current.handleSort('name')
      })

      expect(result.current.sortField).toBe('name')
      expect(result.current.sortDirection).toBe('desc')

      // Third click on same field: should clear sorting
      act(() => {
        result.current.handleSort('name')
      })

      expect(result.current.sortField).toBe(null)
      expect(result.current.sortDirection).toBe(null)
    })

    it('should switch to new field when clicking different field', () => {
      const { result } = renderHook(() => useAdminTable<'name' | 'email'>())

      // Set initial sort
      act(() => {
        result.current.handleSort('name')
      })

      expect(result.current.sortField).toBe('name')
      expect(result.current.sortDirection).toBe('asc')

      // Click different field
      act(() => {
        result.current.handleSort('email')
      })

      expect(result.current.sortField).toBe('email')
      expect(result.current.sortDirection).toBe('asc')
    })

    it('should reset page when sorting changes', () => {
      const { result } = renderHook(() => useAdminTable<'name'>())

      // Set page to something other than 1
      act(() => {
        result.current.setPage(3)
      })

      expect(result.current.page).toBe(3)

      // Change sort
      act(() => {
        result.current.handleSort('name')
      })

      expect(result.current.page).toBe(1)
    })
  })

  describe('reset functionality', () => {
    it('should reset all filters to default values', () => {
      const { result } = renderHook(() => useAdminTable<'name'>())

      // Set up initial state (set page last since setSortField resets page to 1)
      act(() => {
        result.current.setSearch('test search')
        result.current.setSortField('name')
        result.current.setSortDirection('desc')
        result.current.setPage(5) // Set page after sort to avoid reset
      })

      expect(result.current.search).toBe('test search')
      expect(result.current.page).toBe(5)
      expect(result.current.sortField).toBe('name')
      expect(result.current.sortDirection).toBe('desc')

      act(() => {
        result.current.resetFilters()
      })

      expect(result.current.search).toBe('')
      expect(result.current.page).toBe(1)
      expect(result.current.sortField).toBe(null)
      expect(result.current.sortDirection).toBe(null)
    })

    it('should reset to custom default values when provided', () => {
      const options = {
        defaultSortField: 'name' as const,
        defaultSortDirection: 'asc' as const,
      }

      const { result } = renderHook(() => useAdminTable(options))

      act(() => {
        result.current.setSearch('test')
        result.current.setPage(3)
        result.current.setSortField(null)
        result.current.setSortDirection('desc')
      })

      act(() => {
        result.current.resetFilters()
      })

      expect(result.current.search).toBe('')
      expect(result.current.page).toBe(1)
      expect(result.current.sortField).toBe('name')
      expect(result.current.sortDirection).toBe('asc')
    })
  })

  describe('type safety', () => {
    it('should enforce sort field types', () => {
      type TestSortField = 'name' | 'email' | 'createdAt'
      const { result } = renderHook(() => useAdminTable<TestSortField>())

      // This should work with valid field
      act(() => {
        result.current.setSortField('name')
      })

      expect(result.current.sortField).toBe('name')

      // TypeScript should prevent invalid fields at compile time
      // result.current.setSortField('invalidField') // This would be a TS error
    })
  })

  describe('return value structure', () => {
    it('should return all expected properties and methods', () => {
      const { result } = renderHook(() => useAdminTable())

      const returnValue = result.current

      // State properties
      expect(returnValue).toHaveProperty('search')
      expect(returnValue).toHaveProperty('page')
      expect(returnValue).toHaveProperty('limit')
      expect(returnValue).toHaveProperty('sortField')
      expect(returnValue).toHaveProperty('sortDirection')

      // Setter methods
      expect(returnValue).toHaveProperty('setSearch')
      expect(returnValue).toHaveProperty('setPage')
      expect(returnValue).toHaveProperty('setSortField')
      expect(returnValue).toHaveProperty('setSortDirection')

      // Handler methods
      expect(returnValue).toHaveProperty('handleSearchChange')
      expect(returnValue).toHaveProperty('handleSort')
      expect(returnValue).toHaveProperty('resetFilters')

      // Check that methods are functions
      expect(typeof returnValue.setSearch).toBe('function')
      expect(typeof returnValue.setPage).toBe('function')
      expect(typeof returnValue.setSortField).toBe('function')
      expect(typeof returnValue.setSortDirection).toBe('function')
      expect(typeof returnValue.handleSearchChange).toBe('function')
      expect(typeof returnValue.handleSort).toBe('function')
      expect(typeof returnValue.resetFilters).toBe('function')
    })
  })
})
