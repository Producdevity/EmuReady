import { useCallback } from 'react'
import { PAGINATION } from '@/data/constants'
import storageKeys from '@/data/storageKeys'
import analytics from '@/lib/analytics'
import { type RouterInput } from '@/types/trpc'
import { parseArrayParam, parseNumberArrayParam } from '@/utils/parse-params'
import { useUrlFilterState } from '../shared/hooks/useUrlFilterState'

type SortField = NonNullable<RouterInput['listings']['get']['sortField']>

/**
 * Hook for managing listings filter state through URL parameters
 * Uses proper URL state management without hacks
 */
function useListingsState() {
  const baseState = useUrlFilterState<SortField>({
    basePath: '/listings',
    storageKey: storageKeys.pagination.listingsPageSize,
    maxLimit: PAGINATION.PUBLIC_MAX_LIMIT_LISTINGS,
  })

  // Parse domain-specific filter values from URL
  const systemIds = parseArrayParam(baseState.getParam('systemIds'))
  const deviceIds = parseArrayParam(baseState.getParam('deviceIds'))
  const socIds = parseArrayParam(baseState.getParam('socIds'))
  const emulatorIds = parseArrayParam(baseState.getParam('emulatorIds'))
  const performanceIds = parseNumberArrayParam(baseState.getParam('performanceIds'))

  // Wrap updateFilters to add analytics tracking for this page
  const updateFiltersWithAnalytics = useCallback(
    (updates: Record<string, unknown>, shouldPush = false) => {
      baseState.updateFilters(updates, shouldPush)
      analytics.filter.listingsCombined(updates)
    },
    [baseState],
  )

  // Domain-specific setters
  const setSystemIds = useCallback(
    (values: string[]) => {
      updateFiltersWithAnalytics({ systemIds: values })
    },
    [updateFiltersWithAnalytics],
  )

  const setDeviceIds = useCallback(
    (values: string[]) => {
      updateFiltersWithAnalytics({ deviceIds: values })
    },
    [updateFiltersWithAnalytics],
  )

  const setSocIds = useCallback(
    (values: string[]) => {
      updateFiltersWithAnalytics({ socIds: values })
    },
    [updateFiltersWithAnalytics],
  )

  const setEmulatorIds = useCallback(
    (values: string[]) => {
      updateFiltersWithAnalytics({ emulatorIds: values })
    },
    [updateFiltersWithAnalytics],
  )

  const setPerformanceIds = useCallback(
    (values: number[]) => {
      updateFiltersWithAnalytics({ performanceIds: values })
    },
    [updateFiltersWithAnalytics],
  )

  const clearAllFilters = useCallback(() => {
    updateFiltersWithAnalytics({
      systemIds: [],
      deviceIds: [],
      socIds: [],
      emulatorIds: [],
      performanceIds: [],
      search: null,
    })
  }, [updateFiltersWithAnalytics])

  return {
    // Current filter values from URL for actual filtering
    systemIds,
    search: baseState.search,
    page: baseState.page,
    limit: baseState.limit,
    deviceIds,
    socIds,
    emulatorIds,
    performanceIds,
    sortField: baseState.sortField,
    sortDirection: baseState.sortDirection,
    myListings: baseState.myListings,

    // Local input value for responsive UI
    searchInput: baseState.searchInput,

    // Individual setter functions
    setSystemIds,
    setSearch: baseState.setSearch,
    setPage: baseState.setPage,
    setLimit: baseState.setLimit,
    setDeviceIds,
    setSocIds,
    setEmulatorIds,
    setPerformanceIds,
    setSortField: baseState.setSortField,
    setSortDirection: baseState.setSortDirection,
    setMyListings: baseState.setMyListings,

    // Helpers
    handleSort: baseState.handleSort,
    clearAllFilters,
  }
}

export default useListingsState
