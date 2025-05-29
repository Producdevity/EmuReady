/**
 * @documentation /docs/COLUMN_VISIBILITY.md
 */
'use client'

import getErrorMessage from '@/utils/getErrorMessage'
import toggleInSet from '@/utils/toggleInSet'
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
  isHydrated: boolean
}

function useColumnVisibility(
  columns: ColumnDefinition[],
  opts?: UseColumnVisibilityOptions,
): UseColumnVisibilityReturn {
  const [isHydrated, setIsHydrated] = useState(false)

  const getDefaultVisibleColumns = useCallback((): Set<string> => {
    // default to defaultVisibleColumns when provided
    if (opts?.defaultVisibleColumns) return new Set(opts.defaultVisibleColumns)

    // Otherwise, use column definitions
    return new Set(
      columns
        .filter((col) => col.defaultVisible !== false)
        .map((col) => col.key),
    )
  }, [columns, opts?.defaultVisibleColumns])

  const getStoredVisibleColumns = useCallback((): Set<string> | null => {
    if (!opts?.storageKey || typeof window === 'undefined') return null

    try {
      const stored = localStorage.getItem(opts.storageKey)
      if (stored) {
        const parsedColumns = JSON.parse(stored) as string[]
        return new Set(parsedColumns)
      }
    } catch (error) {
      console.error(
        'Failed to load column visibility from localStorage:',
        getErrorMessage(error),
      )
    }
    return null
  }, [opts?.storageKey])

  // Initialize with default columns (for SSR consistency)
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    getDefaultVisibleColumns,
  )

  // Hydrate from localStorage after mount
  useEffect(() => {
    const storedColumns = getStoredVisibleColumns()
    if (storedColumns) {
      setVisibleColumns(storedColumns)
    }
    setIsHydrated(true)
  }, [getStoredVisibleColumns])

  // Save to localStorage when visibleColumns changes (only after hydration)
  useEffect(() => {
    if (!isHydrated || !opts?.storageKey || typeof window === 'undefined')
      return

    try {
      localStorage.setItem(opts.storageKey, JSON.stringify([...visibleColumns]))
    } catch (error) {
      console.error('Failed to save column visibility to localStorage:', error)
    }
  }, [visibleColumns, opts?.storageKey, isHydrated])

  const isColumnVisible = useCallback(
    (columnKey: string): boolean => {
      const column = columns.find((col) => col.key === columnKey)
      return column?.alwaysVisible ? true : visibleColumns.has(columnKey)
    },
    [visibleColumns, columns],
  )

  const toggleColumn = useCallback(
    (columnKey: string) => {
      const column = columns.find((col) => col.key === columnKey)

      if (column?.alwaysVisible) return

      setVisibleColumns((prev) => toggleInSet(prev, columnKey))
    },
    [columns],
  )

  const showColumn = useCallback((columnKey: string) => {
    setVisibleColumns((prev) => new Set([...prev, columnKey]))
  }, [])

  const hideColumn = useCallback(
    (columnKey: string) => {
      const column = columns.find((col) => col.key === columnKey)

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
    setVisibleColumns(getDefaultVisibleColumns())
  }, [getDefaultVisibleColumns])

  const showAll = useCallback(() => {
    setVisibleColumns(new Set(columns.map((col) => col.key)))
  }, [columns])

  const hideAll = useCallback(() => {
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
    isHydrated,
  }
}

export default useColumnVisibility
