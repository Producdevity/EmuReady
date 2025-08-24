import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { useUrlSearch } from '@/hooks/useUrlState'
import analytics from '@/lib/analytics'
import { type SortDirection } from '@/types/api'
import { type RouterInput } from '@/types/trpc'
import { parseArrayParam, parseNumberArrayParam } from '@/utils/parse-params'

type SortField = NonNullable<RouterInput['listings']['get']['sortField']>

/**
 * Hook for managing listings filter state through URL parameters
 * Uses proper URL state management without hacks
 */
function useListingsState() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Use proper URL state management for search with debouncing
  const [searchInput, setSearchInternal, search] = useUrlSearch(300)

  // Parse filter values from URL
  const systemIds = parseArrayParam(searchParams.get('systemIds'))
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const deviceIds = parseArrayParam(searchParams.get('deviceIds'))
  const socIds = parseArrayParam(searchParams.get('socIds'))
  const emulatorIds = parseArrayParam(searchParams.get('emulatorIds'))
  const performanceIds = parseNumberArrayParam(searchParams.get('performanceIds'))
  const sortField = (searchParams.get('sortField') as SortField) ?? null
  const sortDirection = (searchParams.get('sortDirection') as SortDirection) ?? null
  const myListings = searchParams.get('myListings') === 'true'

  // Helper to update URL with new filters
  const updateFilters = useCallback(
    (updates: Record<string, unknown>, shouldPush = false) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '' || value === undefined) {
          params.delete(key)
        } else if (Array.isArray(value)) {
          if (value.length === 0) {
            params.delete(key)
          } else {
            params.set(key, JSON.stringify(value))
          }
        } else {
          params.set(key, String(value))
        }
      })

      // Reset page when changing filters (unless explicitly setting page)
      if (!('page' in updates)) {
        params.delete('page')
      }

      const url = params.toString() ? `?${params.toString()}` : '/listings'
      if (shouldPush) {
        router.push(url)
      } else {
        router.replace(url)
      }

      analytics.filter.listingsCombined(updates)
    },
    [router, searchParams],
  )

  const setSearch = useCallback(
    (value: string) => {
      setSearchInternal(value)
      analytics.filter.search(value)
    },
    [setSearchInternal],
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
      analytics.filter.page({ prevPage: page, nextPage: value })
    },
    [page, updateFilters],
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
      let newSortField: SortField | null = sortField
      let newSortDirection: SortDirection | null

      if (sortField === field) {
        if (sortDirection === 'asc') {
          newSortDirection = 'desc'
        } else if (sortDirection === 'desc') {
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
    [sortDirection, sortField, updateFilters],
  )

  return {
    // Current filter values from URL for actual filtering
    systemIds,
    search, // URL value for actual filtering
    page,
    deviceIds,
    socIds,
    emulatorIds,
    performanceIds,
    sortField,
    sortDirection,
    myListings,

    // Local input value for responsive UI
    searchInput, // Local value for input field

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
