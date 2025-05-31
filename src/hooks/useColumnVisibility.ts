/**
 * @documentation /docs/COLUMN_VISIBILITY.md
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import toggleInSet from '@/utils/toggleInSet'
import useLocalStorage from './useLocalStorage'
import storageKeys from '@/data/storageKeys'

export interface ColumnDefinition {
  key: string
  label: string
  defaultVisible?: boolean
  alwaysVisible?: boolean // For columns that should never be hidden (like actions)
}

export interface UseColumnVisibilityOptions {
  storageKey?: string // For localStorage persistence
  defaultVisibleColumns?: string[]
}

export interface UseColumnVisibilityReturn {
  visibleColumns: Set<string>
  isColumnVisible: (columnKey: string) => boolean
  toggleColumn: (columnKey: string) => void
  showColumn: (columnKey: string) => void
  hideColumn: (columnKey: string) => void
  showAll: () => void
  hideAll: () => void
  resetToDefaults: () => void
  isHydrated: boolean
}

function useColumnVisibility(
  columns: ColumnDefinition[],
  opts?: UseColumnVisibilityOptions,
): UseColumnVisibilityReturn {
  const getDefaultVisibleColumns = useCallback(() => {
    if (opts?.defaultVisibleColumns) {
      return opts.defaultVisibleColumns
    }
    return columns
      .filter((col) => col.defaultVisible !== false)
      .map((col) => col.key)
  }, [columns, opts?.defaultVisibleColumns])

  // Handle localStorage read with proper error handling for tests
  const getInitialColumns = useCallback(() => {
    if (!opts?.storageKey || typeof window === 'undefined') {
      return getDefaultVisibleColumns()
    }

    try {
      const item = window.localStorage.getItem(opts.storageKey)
      if (item) {
        return JSON.parse(item)
      }
      return getDefaultVisibleColumns()
    } catch (error) {
      console.error('Failed to load column visibility from localStorage:', (error as Error).message)
      return getDefaultVisibleColumns()
    }
  }, [opts?.storageKey, getDefaultVisibleColumns])

  // Conditionally use localStorage or plain state
  const shouldUseLocalStorage = Boolean(opts?.storageKey)
  
  // Use useLocalStorage only when storageKey is provided
  const [localStorageColumns, setLocalStorageColumns, isLocalStorageHydrated] = useLocalStorage<string[]>(
    opts?.storageKey ?? storageKeys.columnVisibility.listings,
    getInitialColumns()
  )
  
  // Use plain state when no storageKey
  const [plainStateColumns, setPlainStateColumns] = useState<string[]>(getInitialColumns)
  
  // Choose which state to use
  const storedColumns = shouldUseLocalStorage ? localStorageColumns : plainStateColumns
  const isHydrated = shouldUseLocalStorage ? isLocalStorageHydrated : true

  // Wrap setStoredColumns with error handling for localStorage save errors  
  const setStoredColumns = useCallback((newColumns: string[]) => {
    if (shouldUseLocalStorage) {
      try {
        setLocalStorageColumns(newColumns)
      } catch (error) {
        console.error('Failed to save column visibility to localStorage:', error)
      }
    } else {
      setPlainStateColumns(newColumns)
    }
  }, [shouldUseLocalStorage, setLocalStorageColumns, setPlainStateColumns])

  const [visibleColumns, setVisibleColumns] = useState(
    () => new Set(storedColumns),
  )

  // Only sync from localStorage to state on mount or when localStorage value changes
  useEffect(() => {
    setVisibleColumns(new Set(storedColumns))
  }, [storedColumns])

  // Helper function to update both state and localStorage
  const updateVisibleColumns = useCallback((newColumns: Set<string>) => {
    setVisibleColumns(newColumns)
    if (isHydrated) {
      setStoredColumns(Array.from(newColumns))
    }
  }, [setStoredColumns, isHydrated])

  const isColumnVisible = useCallback(
    (columnKey: string) => {
      const column = columns.find((col) => col.key === columnKey)
      // Always show columns marked as alwaysVisible
      if (column?.alwaysVisible) return true
      return visibleColumns.has(columnKey)
    },
    [columns, visibleColumns],
  )

  const toggleColumn = useCallback((columnKey: string) => {
    const column = columns.find((col) => col.key === columnKey)
    // Don't allow toggling columns marked as alwaysVisible
    if (column?.alwaysVisible) return

    updateVisibleColumns(toggleInSet(visibleColumns, columnKey))
  }, [columns, visibleColumns, updateVisibleColumns])

  const showColumn = useCallback((columnKey: string) => {
    updateVisibleColumns(new Set([...visibleColumns, columnKey]))
  }, [visibleColumns, updateVisibleColumns])

  const hideColumn = useCallback((columnKey: string) => {
    const column = columns.find((col) => col.key === columnKey)
    // Don't allow hiding columns marked as alwaysVisible
    if (column?.alwaysVisible) return

    const next = new Set(visibleColumns)
    next.delete(columnKey)
    updateVisibleColumns(next)
  }, [columns, visibleColumns, updateVisibleColumns])

  const showAll = useCallback(() => {
    updateVisibleColumns(new Set(columns.map((col) => col.key)))
  }, [columns, updateVisibleColumns])

  const hideAll = useCallback(() => {
    // Only hide columns that are not marked as alwaysVisible
    const alwaysVisibleColumns = columns
      .filter((col) => col.alwaysVisible)
      .map((col) => col.key)
    updateVisibleColumns(new Set(alwaysVisibleColumns))
  }, [columns, updateVisibleColumns])

  const resetToDefaults = useCallback(() => {
    updateVisibleColumns(new Set(getDefaultVisibleColumns()))
  }, [getDefaultVisibleColumns, updateVisibleColumns])

  return {
    visibleColumns,
    isColumnVisible,
    toggleColumn,
    showColumn,
    hideColumn,
    showAll,
    hideAll,
    resetToDefaults,
    isHydrated,
  }
}

export default useColumnVisibility
