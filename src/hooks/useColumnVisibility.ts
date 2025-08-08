/**
 * @documentation /docs/COLUMN_VISIBILITY.md
 */
'use client'

import { useState, useCallback, useEffect } from 'react'
import { ColumnVisibilitySchema } from '@/schemas/common'
import toggleInSet from '@/utils/toggleInSet'
import { useLocalStorage } from './useLocalStorage'

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

export function useColumnVisibility(
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

  // Only use localStorage when storageKey is explicitly provided
  const shouldUseLocalStorage = Boolean(opts?.storageKey)
  const storageKey = opts?.storageKey ?? 'unused-key'

  const [storedColumns, setStoredColumns, isHydrated] = useLocalStorage<
    string[]
  >(
    storageKey,
    getDefaultVisibleColumns(),
    shouldUseLocalStorage,
    ColumnVisibilitySchema,
  )

  const [visibleColumns, setVisibleColumns] = useState(
    () => new Set(storedColumns),
  )

  // Only sync from localStorage to state on mount or when localStorage value changes
  useEffect(() => {
    setVisibleColumns(new Set(storedColumns))
  }, [storedColumns])

  // Wrap setStoredColumns to handle errors for test compliance
  const updateVisibleColumns = useCallback(
    (newColumns: Set<string>) => {
      setVisibleColumns(newColumns)
      if (isHydrated && shouldUseLocalStorage) {
        try {
          setStoredColumns(Array.from(newColumns))
        } catch (error) {
          console.error(
            'Failed to save column visibility to localStorage:',
            error,
          )
        }
      }
    },
    [setStoredColumns, isHydrated, shouldUseLocalStorage],
  )

  const isColumnVisible = useCallback(
    (columnKey: string) => {
      const column = columns.find((col) => col.key === columnKey)
      // Always show columns marked as alwaysVisible
      if (column?.alwaysVisible) return true
      return visibleColumns.has(columnKey)
    },
    [columns, visibleColumns],
  )

  const toggleColumn = useCallback(
    (columnKey: string) => {
      const column = columns.find((col) => col.key === columnKey)
      // Don't allow toggling columns marked as alwaysVisible
      if (column?.alwaysVisible) return

      updateVisibleColumns(toggleInSet(visibleColumns, columnKey))
    },
    [columns, visibleColumns, updateVisibleColumns],
  )

  const showColumn = useCallback(
    (columnKey: string) => {
      setVisibleColumns((prev) => new Set([...prev, columnKey]))
      if (isHydrated && shouldUseLocalStorage) {
        try {
          setStoredColumns((prev) => Array.from(new Set([...prev, columnKey])))
        } catch (error) {
          console.error(
            'Failed to save column visibility to localStorage:',
            error,
          )
        }
      }
    },
    [setStoredColumns, isHydrated, shouldUseLocalStorage],
  )

  const hideColumn = useCallback(
    (columnKey: string) => {
      const column = columns.find((col) => col.key === columnKey)
      // Don't allow hiding columns marked as alwaysVisible
      if (column?.alwaysVisible) return

      setVisibleColumns((prev) => {
        const next = new Set(prev)
        next.delete(columnKey)
        return next
      })
      if (isHydrated && shouldUseLocalStorage) {
        try {
          setStoredColumns((prev) => {
            const next = new Set(prev)
            next.delete(columnKey)
            return Array.from(next)
          })
        } catch (error) {
          console.error(
            'Failed to save column visibility to localStorage:',
            error,
          )
        }
      }
    },
    [columns, setStoredColumns, isHydrated, shouldUseLocalStorage],
  )

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
    // Get the actual defaults based on column definitions
    const defaultColumns = getDefaultVisibleColumns()
    // Update both local state and localStorage
    setVisibleColumns(new Set(defaultColumns))
    if (isHydrated && shouldUseLocalStorage) {
      try {
        setStoredColumns(defaultColumns)
      } catch (error) {
        console.error(
          'Failed to save column visibility to localStorage:',
          error,
        )
      }
    }
  }, [
    getDefaultVisibleColumns,
    setStoredColumns,
    isHydrated,
    shouldUseLocalStorage,
  ])

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
