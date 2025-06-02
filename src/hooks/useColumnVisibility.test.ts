import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  type MockInstance,
} from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useColumnVisibility, {
  type ColumnDefinition,
} from './useColumnVisibility'

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('useColumnVisibility', () => {
  const mockColumns: ColumnDefinition[] = [
    { key: 'name', label: 'Name', defaultVisible: true },
    { key: 'email', label: 'Email', defaultVisible: true },
    { key: 'role', label: 'Role', defaultVisible: false },
    { key: 'actions', label: 'Actions', alwaysVisible: true },
    { key: 'optional', label: 'Optional' }, // defaultVisible undefined (should default to true)
  ]

  let consoleErrorMock: MockInstance

  beforeEach(() => {
    vi.clearAllMocks()
    // Create a silent mock that doesn't output anything
    consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorMock.mockRestore()
  })

  describe('initialization', () => {
    it('should initialize with default visible columns based on column definitions', () => {
      const { result } = renderHook(() => useColumnVisibility(mockColumns))

      expect(result.current.isColumnVisible('name')).toBe(true)
      expect(result.current.isColumnVisible('email')).toBe(true)
      expect(result.current.isColumnVisible('role')).toBe(false)
      expect(result.current.isColumnVisible('actions')).toBe(true)
      expect(result.current.isColumnVisible('optional')).toBe(true)
    })

    it('should initialize with custom default visible columns', () => {
      const { result } = renderHook(() =>
        useColumnVisibility(mockColumns, {
          defaultVisibleColumns: ['name', 'role'],
        }),
      )

      expect(result.current.isColumnVisible('name')).toBe(true)
      expect(result.current.isColumnVisible('email')).toBe(false)
      expect(result.current.isColumnVisible('role')).toBe(true)
      expect(result.current.isColumnVisible('actions')).toBe(true) // alwaysVisible
      expect(result.current.isColumnVisible('optional')).toBe(false)
    })

    it('should load from localStorage when storageKey is provided', () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify(['name', 'role', 'actions']),
      )

      const { result } = renderHook(() =>
        useColumnVisibility(mockColumns, {
          storageKey: 'test-columns',
        }),
      )

      expect(localStorageMock.getItem).toHaveBeenCalledWith('test-columns')
      expect(result.current.isColumnVisible('name')).toBe(true)
      expect(result.current.isColumnVisible('email')).toBe(false)
      expect(result.current.isColumnVisible('role')).toBe(true)
      expect(result.current.isColumnVisible('actions')).toBe(true)
    })

    it('should handle localStorage errors gracefully', () => {
      consoleErrorMock.mockImplementation(() => {})
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      const { result } = renderHook(() =>
        useColumnVisibility(mockColumns, {
          storageKey: 'test-columns',
        }),
      )

      expect(consoleErrorMock).toHaveBeenCalledWith(
        'Failed to load column visibility from localStorage:',
        'localStorage error',
      )

      // Should fall back to default behavior
      expect(result.current.isColumnVisible('name')).toBe(true)
      expect(result.current.isColumnVisible('role')).toBe(false)
    })
  })

  describe('column visibility', () => {
    it('should correctly identify visible columns', () => {
      const { result } = renderHook(() => useColumnVisibility(mockColumns))

      expect(result.current.isColumnVisible('name')).toBe(true)
      expect(result.current.isColumnVisible('role')).toBe(false)
      expect(result.current.isColumnVisible('actions')).toBe(true) // alwaysVisible
    })

    it('should always show alwaysVisible columns regardless of state', () => {
      const { result } = renderHook(() =>
        useColumnVisibility(mockColumns, {
          defaultVisibleColumns: [], // Hide all by default
        }),
      )

      expect(result.current.isColumnVisible('name')).toBe(false)
      expect(result.current.isColumnVisible('actions')).toBe(true) // alwaysVisible
    })
  })

  describe('column toggling', () => {
    it('should toggle column visibility', () => {
      const { result } = renderHook(() => useColumnVisibility(mockColumns))

      expect(result.current.isColumnVisible('name')).toBe(true)

      act(() => {
        result.current.toggleColumn('name')
      })

      expect(result.current.isColumnVisible('name')).toBe(false)

      act(() => {
        result.current.toggleColumn('name')
      })

      expect(result.current.isColumnVisible('name')).toBe(true)
    })

    it('should not toggle alwaysVisible columns', () => {
      const { result } = renderHook(() => useColumnVisibility(mockColumns))

      expect(result.current.isColumnVisible('actions')).toBe(true)

      act(() => {
        result.current.toggleColumn('actions')
      })

      expect(result.current.isColumnVisible('actions')).toBe(true) // Should remain visible
    })

    it('should show hidden columns', () => {
      const { result } = renderHook(() => useColumnVisibility(mockColumns))

      expect(result.current.isColumnVisible('role')).toBe(false)

      act(() => {
        result.current.showColumn('role')
      })

      expect(result.current.isColumnVisible('role')).toBe(true)
    })

    it('should hide visible columns', () => {
      const { result } = renderHook(() => useColumnVisibility(mockColumns))

      expect(result.current.isColumnVisible('name')).toBe(true)

      act(() => {
        result.current.hideColumn('name')
      })

      expect(result.current.isColumnVisible('name')).toBe(false)
    })

    it('should not hide alwaysVisible columns', () => {
      const { result } = renderHook(() => useColumnVisibility(mockColumns))

      expect(result.current.isColumnVisible('actions')).toBe(true)

      act(() => {
        result.current.hideColumn('actions')
      })

      expect(result.current.isColumnVisible('actions')).toBe(true) // Should remain visible
    })
  })

  describe('bulk operations', () => {
    it('should show all columns', () => {
      const { result } = renderHook(() => useColumnVisibility(mockColumns))

      act(() => {
        result.current.showAll()
      })

      expect(result.current.isColumnVisible('name')).toBe(true)
      expect(result.current.isColumnVisible('email')).toBe(true)
      expect(result.current.isColumnVisible('role')).toBe(true)
      expect(result.current.isColumnVisible('actions')).toBe(true)
      expect(result.current.isColumnVisible('optional')).toBe(true)
    })

    it('should hide all toggleable columns', () => {
      const { result } = renderHook(() => useColumnVisibility(mockColumns))

      act(() => {
        result.current.hideAll()
      })

      expect(result.current.isColumnVisible('name')).toBe(false)
      expect(result.current.isColumnVisible('email')).toBe(false)
      expect(result.current.isColumnVisible('role')).toBe(false)
      expect(result.current.isColumnVisible('actions')).toBe(true) // alwaysVisible
      expect(result.current.isColumnVisible('optional')).toBe(false)
    })

    it('should reset to default values', () => {
      const { result } = renderHook(() => useColumnVisibility(mockColumns))

      act(() => {
        result.current.hideColumn('name')
        result.current.showColumn('role')
      })

      expect(result.current.isColumnVisible('name')).toBe(false)
      expect(result.current.isColumnVisible('role')).toBe(true)

      act(() => {
        result.current.resetToDefaults()
      })

      expect(result.current.isColumnVisible('name')).toBe(true)
      expect(result.current.isColumnVisible('role')).toBe(false)
    })
  })

  describe('localStorage persistence', () => {
    it('should save to localStorage when columns change', () => {
      const { result } = renderHook(() =>
        useColumnVisibility(mockColumns, {
          storageKey: 'test-columns',
        }),
      )

      act(() => {
        result.current.toggleColumn('name')
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'test-columns',
        expect.stringContaining('email'), // name should be removed
      )
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'test-columns',
        expect.not.stringContaining('name'),
      )
    })

    it('should handle localStorage save errors gracefully', () => {
      consoleErrorMock.mockImplementation(() => {})
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage save error')
      })

      const { result } = renderHook(() =>
        useColumnVisibility(mockColumns, { storageKey: 'test-columns' }),
      )

      act(() => {
        result.current.toggleColumn('name')
      })

      expect(consoleErrorMock).toHaveBeenCalledWith(
        'Failed to save column visibility to localStorage:',
        expect.any(Error),
      )
    })

    it('should not use localStorage when no storageKey is provided', () => {
      const { result } = renderHook(() => useColumnVisibility(mockColumns))

      act(() => {
        result.current.toggleColumn('name')
      })

      expect(localStorageMock.setItem).not.toHaveBeenCalled()
      expect(localStorageMock.getItem).not.toHaveBeenCalled()
    })
  })

  describe('visibleColumns set', () => {
    it('should return correct visible columns set', () => {
      const { result } = renderHook(() => useColumnVisibility(mockColumns))

      const visibleColumns = result.current.visibleColumns

      expect(visibleColumns.has('name')).toBe(true)
      expect(visibleColumns.has('email')).toBe(true)
      expect(visibleColumns.has('role')).toBe(false)
      expect(visibleColumns.has('actions')).toBe(true)
      expect(visibleColumns.has('optional')).toBe(true)
    })

    it('should update visible columns set when toggling', () => {
      const { result } = renderHook(() => useColumnVisibility(mockColumns))

      act(() => {
        result.current.toggleColumn('name')
      })

      expect(result.current.visibleColumns.has('name')).toBe(false)
    })
  })
})
