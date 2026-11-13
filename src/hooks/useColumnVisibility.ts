'use client'

import { useCallback, useMemo } from 'react'
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
  const configuredDefaults = opts?.defaultVisibleColumns
  const defaultColumns = useMemo(
    () =>
      configuredDefaults ??
      columns.filter((column) => column.defaultVisible !== false).map((column) => column.key),
    [columns, configuredDefaults],
  )
  const [storedColumns, setStoredColumns, isHydrated] = useLocalStorage(
    opts?.storageKey ?? 'unused-key',
    defaultColumns,
    ColumnVisibilitySchema,
    Boolean(opts?.storageKey),
  )
  const visibleColumns = useMemo(() => new Set(storedColumns), [storedColumns])
  const updateColumns = useCallback(
    (update: string[] | ((previous: string[]) => string[])) => {
      try {
        setStoredColumns(update)
      } catch (error) {
        console.error('Failed to save column visibility to localStorage:', error)
      }
    },
    [setStoredColumns],
  )

  const isColumnVisible = useCallback(
    (columnKey: string) => {
      return (
        columns.find((column) => column.key === columnKey)?.alwaysVisible ||
        visibleColumns.has(columnKey)
      )
    },
    [columns, visibleColumns],
  )

  const toggleColumn = useCallback(
    (columnKey: string) => {
      if (columns.find((column) => column.key === columnKey)?.alwaysVisible) return
      updateColumns((previous) => Array.from(toggleInSet(new Set(previous), columnKey)))
    },
    [columns, updateColumns],
  )

  const showColumn = useCallback(
    (columnKey: string) => {
      updateColumns((previous) => Array.from(new Set([...previous, columnKey])))
    },
    [updateColumns],
  )

  const hideColumn = useCallback(
    (columnKey: string) => {
      if (columns.find((column) => column.key === columnKey)?.alwaysVisible) return
      updateColumns((previous) => previous.filter((key) => key !== columnKey))
    },
    [columns, updateColumns],
  )

  const showAll = useCallback(
    () => updateColumns(columns.map((column) => column.key)),
    [columns, updateColumns],
  )
  const hideAll = useCallback(
    () =>
      updateColumns(columns.filter((column) => column.alwaysVisible).map((column) => column.key)),
    [columns, updateColumns],
  )
  const resetToDefaults = useCallback(
    () => updateColumns(defaultColumns),
    [defaultColumns, updateColumns],
  )

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
