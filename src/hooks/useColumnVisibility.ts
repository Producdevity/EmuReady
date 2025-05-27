/**
 * @documentation /docs/COLUMN_VISIBILITY.md
 */
'use client'

import { useState, useEffect, useCallback } from 'react'

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
  resetToDefaults: () => void
  showAll: () => void
  hideAll: () => void
}

function useColumnVisibility(
  columns: ColumnDefinition[],
  options: UseColumnVisibilityOptions = {},
): UseColumnVisibilityReturn {
  const { storageKey, defaultVisibleColumns } = options

  // Get initial visible columns
  const getInitialVisibleColumns = useCallback((): Set<string> => {
    // If we have a storage key, try to load from localStorage
    if (storageKey && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          const parsedColumns = JSON.parse(stored) as string[]
          return new Set(parsedColumns)
        }
      } catch (error) {
        console.warn(
          'Failed to load column visibility from localStorage:',
          error,
        )
      }
    }

    // If defaultVisibleColumns is provided, use that
    if (defaultVisibleColumns) {
      return new Set(defaultVisibleColumns)
    }

    // Otherwise, use column definitions
    return new Set(
      columns
        .filter((col) => col.defaultVisible !== false)
        .map((col) => col.key),
    )
  }, [columns, storageKey, defaultVisibleColumns])

  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    getInitialVisibleColumns,
  )

  // Save to localStorage when visibleColumns changes
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify([...visibleColumns]))
      } catch (error) {
        console.warn('Failed to save column visibility to localStorage:', error)
      }
    }
  }, [visibleColumns, storageKey])

  const isColumnVisible = useCallback(
    (columnKey: string): boolean => {
      const column = columns.find((col) => col.key === columnKey)
      if (column?.alwaysVisible) return true
      return visibleColumns.has(columnKey)
    },
    [visibleColumns, columns],
  )

  const toggleColumn = useCallback(
    (columnKey: string) => {
      const column = columns.find((col) => col.key === columnKey)
      // Don't allow toggling of alwaysVisible columns
      if (column?.alwaysVisible) return

      setVisibleColumns((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(columnKey)) {
          newSet.delete(columnKey)
        } else {
          newSet.add(columnKey)
        }
        return newSet
      })
    },
    [columns],
  )

  const showColumn = useCallback((columnKey: string) => {
    setVisibleColumns((prev) => new Set([...prev, columnKey]))
  }, [])

  const hideColumn = useCallback(
    (columnKey: string) => {
      const column = columns.find((col) => col.key === columnKey)
      // Don't allow hiding of alwaysVisible columns
      if (column?.alwaysVisible) return

      setVisibleColumns((prev) => {
        const newSet = new Set(prev)
        newSet.delete(columnKey)
        return newSet
      })
    },
    [columns],
  )

  const resetToDefaults = useCallback(() => {
    setVisibleColumns(getInitialVisibleColumns())
  }, [getInitialVisibleColumns])

  const showAll = useCallback(() => {
    setVisibleColumns(new Set(columns.map((col) => col.key)))
  }, [columns])

  const hideAll = useCallback(() => {
    // Only hide columns that are not marked as alwaysVisible
    const alwaysVisibleColumns = columns
      .filter((col) => col.alwaysVisible)
      .map((col) => col.key)
    setVisibleColumns(new Set(alwaysVisibleColumns))
  }, [columns])

  return {
    visibleColumns,
    isColumnVisible,
    toggleColumn,
    showColumn,
    hideColumn,
    resetToDefaults,
    showAll,
    hideAll,
  }
}

export default useColumnVisibility
