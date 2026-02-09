import { useCallback } from 'react'
import { useUrlFilterState } from '@/app/listings/shared/hooks/useUrlFilterState'
import { PAGINATION } from '@/data/constants'
import storageKeys from '@/data/storageKeys'
import { type RouterInput } from '@/types/trpc'
import { parseArrayParam, parseNumberArrayParam } from '@/utils/parse-params'

type SortField = NonNullable<RouterInput['pcListings']['get']['sortField']>

/**
 * Hook for managing PC listings filter state through URL parameters
 * Uses proper URL state management with router.push for pagination (back button support)
 */
export default function usePcListingsState() {
  const baseState = useUrlFilterState<SortField>({
    basePath: '/pc-listings',
    storageKey: storageKeys.pagination.pcListingsPageSize,
    maxLimit: PAGINATION.PUBLIC_MAX_LIMIT_PC_LISTINGS,
  })

  // Parse domain-specific filter values from URL
  const cpuIds = parseArrayParam(baseState.getParam('cpuIds'))
  const gpuIds = parseArrayParam(baseState.getParam('gpuIds'))
  const systemIds = parseArrayParam(baseState.getParam('systemIds'))
  const performanceIds = parseNumberArrayParam(baseState.getParam('performanceIds'))
  const emulatorIds = parseArrayParam(baseState.getParam('emulatorIds'))
  const minMemory = baseState.getParam('minMemory') ? Number(baseState.getParam('minMemory')) : null
  const maxMemory = baseState.getParam('maxMemory') ? Number(baseState.getParam('maxMemory')) : null

  // Domain-specific setters
  const setCpuIds = useCallback(
    (values: string[]) => {
      baseState.updateFilters({ cpuIds: values })
    },
    [baseState],
  )

  const setGpuIds = useCallback(
    (values: string[]) => {
      baseState.updateFilters({ gpuIds: values })
    },
    [baseState],
  )

  const setSystemIds = useCallback(
    (values: string[]) => {
      baseState.updateFilters({ systemIds: values })
    },
    [baseState],
  )

  const setPerformanceIds = useCallback(
    (values: number[]) => {
      baseState.updateFilters({ performanceIds: values })
    },
    [baseState],
  )

  const setEmulatorIds = useCallback(
    (values: string[]) => {
      baseState.updateFilters({ emulatorIds: values })
    },
    [baseState],
  )

  const setMinMemory = useCallback(
    (value: number | null) => {
      baseState.updateFilters({ minMemory: value })
    },
    [baseState],
  )

  const setMaxMemory = useCallback(
    (value: number | null) => {
      baseState.updateFilters({ maxMemory: value })
    },
    [baseState],
  )

  const clearAllFilters = useCallback(() => {
    baseState.updateFilters({
      cpuIds: [],
      gpuIds: [],
      systemIds: [],
      performanceIds: [],
      emulatorIds: [],
      minMemory: null,
      maxMemory: null,
      search: null,
    })
  }, [baseState])

  return {
    // Current filter values from URL for actual filtering
    page: baseState.page,
    limit: baseState.limit,
    search: baseState.search,
    cpuIds,
    gpuIds,
    systemIds,
    performanceIds,
    emulatorIds,
    minMemory,
    maxMemory,
    sortField: baseState.sortField,
    sortDirection: baseState.sortDirection,
    myListings: baseState.myListings,

    // Local input value
    searchInput: baseState.searchInput,

    // Individual setter functions
    setPage: baseState.setPage,
    setLimit: baseState.setLimit,
    setSearch: baseState.setSearch,
    setCpuIds,
    setGpuIds,
    setSystemIds,
    setPerformanceIds,
    setEmulatorIds,
    setMinMemory,
    setMaxMemory,
    setSortField: baseState.setSortField,
    setSortDirection: baseState.setSortDirection,
    setMyListings: baseState.setMyListings,

    // Helpers
    handleSort: baseState.handleSort,
    clearAllFilters,
  }
}
