import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useCallback, useRef } from 'react'
import analytics from '@/lib/analytics'
import { type SortDirection } from '@/types/api'
import { type RouterInput } from '@/types/trpc'
import { parseArrayParam, parseNumberArrayParam } from '@/utils/parse-params'

type SortField = NonNullable<RouterInput['listings']['get']['sortField']>

interface FilterParams {
  systemIds?: string[] | null
  search?: string | null
  page?: number | null
  deviceIds?: string[] | null
  socIds?: string[] | null
  emulatorIds?: string[] | null
  performanceIds?: number[] | null
  sortField?: SortField | null
  sortDirection?: SortDirection | null
  myListings?: boolean | null
}

/**
 * Hook for managing listings filter state through URL parameters
 * Uses URL as source of truth with local state only for search input to improve UX
 */
function useListingsState() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Read all filter values from URL
  const filters = {
    systemIds: parseArrayParam(searchParams.get('systemIds')),
    search: searchParams.get('search') ?? '',
    page: Math.max(1, Number(searchParams.get('page')) || 1),
    deviceIds: parseArrayParam(searchParams.get('deviceIds')),
    socIds: parseArrayParam(searchParams.get('socIds')),
    emulatorIds: parseArrayParam(searchParams.get('emulatorIds')),
    performanceIds: parseNumberArrayParam(searchParams.get('performanceIds')),
    sortField: (searchParams.get('sortField') as SortField) ?? null,
    sortDirection: (searchParams.get('sortDirection') as SortDirection) ?? null,
    myListings: searchParams.get('myListings') === 'true',
  }

  // Local state only for search input, the rest is derived from URL
  const [searchInput, setSearchInput] = useState(filters.search)

  // Sync local search state when URL changes (e.g., back/forward navigation)
  useEffect(() => {
    setSearchInput(filters.search)
  }, [filters.search])

  // Helper to update URL with new filters
  const updateFilters = useCallback(
    (newFilters: FilterParams, shouldPush = false) => {
      // Create a new URLSearchParams object
      const newParams = new URLSearchParams(searchParams.toString())

      // Reset to page 1 when changing filters (unless explicitly setting page)
      analytics.filter.listingsCombined(newFilters)

      // Update params
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value === null || value === '' || value === undefined) {
          newParams.delete(key)
        } else if (Array.isArray(value)) {
          if (value.length === 0) {
            newParams.delete(key)
          } else {
            newParams.set(key, JSON.stringify(value))
          }
        } else {
          newParams.set(key, String(value))
        }
      })

      // Navigate
      const url = `?${newParams.toString()}`
      if (shouldPush) {
        router.push(url)
      } else {
        router.replace(url)
      }
    },
    [router, searchParams],
  )

  const setSearch = useCallback(
    (value: string) => {
      // Update local state immediately
      setSearchInput(value)
      analytics.filter.search(value)

      // Debounce URL update
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }

      searchTimeoutRef.current = setTimeout(() => {
        updateFilters({ search: value })
      }, 300)
    },
    [updateFilters],
  )

  const setSystemIds = useCallback(
    (values: string[]) => {
      updateFilters({ systemIds: values })
      analytics.filter.system(values)
    },
    [updateFilters],
  )

  const setPage = useCallback(
    (value: number) => {
      updateFilters({ page: value }, true) // Use push for pagination
      analytics.filter.page({ prevPage: filters.page, nextPage: value })
    },
    [filters.page, updateFilters],
  )

  const setDeviceIds = useCallback(
    (values: string[]) => {
      updateFilters({ deviceIds: values })
      analytics.filter.device(values)
    },
    [updateFilters],
  )

  const setSocIds = useCallback(
    (values: string[]) => {
      updateFilters({ socIds: values })
      analytics.filter.soc(values)
    },
    [updateFilters],
  )

  const setEmulatorIds = useCallback(
    (values: string[]) => {
      updateFilters({ emulatorIds: values })
      analytics.filter.emulator(values)
    },
    [updateFilters],
  )

  const setPerformanceIds = useCallback(
    (values: number[]) => {
      updateFilters({ performanceIds: values })
      analytics.filter.performance(values)
    },
    [updateFilters],
  )

  const setSortField = useCallback(
    (value: SortField | null) => {
      updateFilters({ sortField: value })
      analytics.filter.sort(value ?? undefined)
    },
    [updateFilters],
  )

  const setSortDirection = useCallback(
    (value: SortDirection | null) => {
      updateFilters({ sortDirection: value })
    },
    [updateFilters],
  )

  const setMyListings = useCallback(
    (value: boolean) => {
      updateFilters({ myListings: value ? true : null })
      analytics.filter.myListings(value)
    },
    [updateFilters],
  )

  // Helper for toggling sort direction
  const handleSort = useCallback(
    (field: string) => {
      let newSortField: SortField | null = filters.sortField
      let newSortDirection: SortDirection | null

      if (filters.sortField === field) {
        if (filters.sortDirection === 'asc') {
          newSortDirection = 'desc'
        } else if (filters.sortDirection === 'desc') {
          newSortField = null
          newSortDirection = null
        } else {
          newSortDirection = 'asc'
        }
      } else {
        newSortField = field as SortField
        newSortDirection = 'asc'
      }

      updateFilters({
        sortField: newSortField,
        sortDirection: newSortDirection,
      })
    },
    [filters.sortDirection, filters.sortField, updateFilters],
  )

  return {
    // Current filter values (with search from local state)
    ...filters,
    search: searchInput,

    // Individual setter functions
    setSystemIds,
    setSearch,
    setPage,
    setDeviceIds,
    setSocIds,
    setEmulatorIds,
    setPerformanceIds,
    setSortField,
    setSortDirection,
    setMyListings,

    // Helpers
    handleSort,
  }
}

export default useListingsState
