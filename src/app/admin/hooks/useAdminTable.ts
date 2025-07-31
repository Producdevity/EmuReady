import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback, type ChangeEvent } from 'react'
import { UI_CONSTANTS } from '@/data/constants'
import useDebouncedValue from '@/hooks/useDebouncedValue'

export type SortDirection = 'asc' | 'desc' | null

export interface UseAdminTableOptions<TSortField extends string> {
  defaultLimit?: number
  defaultSortField?: TSortField | null
  defaultSortDirection?: SortDirection
  enableUrlState?: boolean
  searchDebounceMs?: number
  additionalParams?: Record<string, string>
}

export interface UseAdminTableReturn<TSortField extends string> {
  // Search state
  search: string
  setSearch: (search: string) => void
  handleSearchChange: (ev: ChangeEvent<HTMLInputElement>) => void
  debouncedSearch: string
  isSearching: boolean

  // Pagination state
  page: number
  setPage: (page: number) => void
  limit: number

  // Sorting state
  sortField: TSortField | null
  setSortField: (field: TSortField | null) => void
  sortDirection: SortDirection
  setSortDirection: (direction: SortDirection) => void
  handleSort: (field: string) => void

  // Additional parameters
  additionalParams: Record<string, string>
  setAdditionalParam: (key: string, value: string) => void

  // URL state management
  updateUrl: () => void
  resetFilters: () => void
}

const DEFAULT_LIMIT = 20
const DEFAULT_SEARCH_DEBOUNCE = UI_CONSTANTS.DEBOUNCE_DELAY

export function useAdminTable<TSortField extends string>(
  opts: UseAdminTableOptions<TSortField> = {},
): UseAdminTableReturn<TSortField> {
  const searchParams = useSearchParams()
  const router = useRouter()
  const enableUrlState = opts.enableUrlState ?? true
  const searchDebounceMs = opts.searchDebounceMs ?? DEFAULT_SEARCH_DEBOUNCE

  // Initialize state from URL params or defaults
  const [search, setSearchState] = useState(() => {
    if (enableUrlState && searchParams.get('search')) {
      return searchParams.get('search') ?? ''
    }
    return ''
  })

  const [page, setPageState] = useState(() => {
    if (enableUrlState && searchParams.get('page')) {
      const pageFromUrl = parseInt(searchParams.get('page') ?? '1', 10)
      return isNaN(pageFromUrl) ? 1 : pageFromUrl
    }
    return 1
  })

  const [sortField, setSortFieldState] = useState<TSortField | null>(() => {
    if (enableUrlState && searchParams.get('sortField')) {
      return searchParams.get('sortField') as TSortField
    }
    return opts.defaultSortField ?? null
  })

  const [sortDirection, setSortDirectionState] = useState<SortDirection>(() => {
    if (enableUrlState && searchParams.get('sortDirection')) {
      const direction = searchParams.get('sortDirection')
      return direction === 'asc' || direction === 'desc' ? direction : null
    }
    return opts.defaultSortDirection ?? null
  })

  // Initialize additional parameters from URL
  const [additionalParams, setAdditionalParams] = useState<
    Record<string, string>
  >(() => {
    const initialParams: Record<string, string> = {}

    // First, set from defaults if provided
    if (opts.additionalParams) {
      Object.assign(initialParams, opts.additionalParams)
    }

    // Then override with URL params if present
    if (enableUrlState) {
      // Get all search params
      searchParams.forEach((value, key) => {
        // Skip standard params that are handled separately
        if (!['search', 'page', 'sortField', 'sortDirection'].includes(key)) {
          initialParams[key] = value
        }
      })
    }

    return initialParams
  })

  // Debounced search for API calls
  const debouncedSearch = useDebouncedValue(search, searchDebounceMs)
  const isSearching = search !== debouncedSearch

  // Update URL when state changes
  const updateUrl = useCallback(() => {
    if (!enableUrlState) return

    const params = new URLSearchParams()

    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim())
    if (page > 1) params.set('page', page.toString())
    if (sortField) params.set('sortField', sortField)
    if (sortDirection) params.set('sortDirection', sortDirection)

    // Add additional params to URL
    Object.entries(additionalParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      }
    })

    const url = params.toString() ? `?${params.toString()}` : ''
    router.replace(url, { scroll: false })
  }, [
    enableUrlState,
    debouncedSearch,
    page,
    sortField,
    sortDirection,
    additionalParams,
    router,
  ])

  // Update URL when relevant state changes
  useEffect(() => {
    if (enableUrlState) {
      updateUrl()
    }
  }, [
    debouncedSearch,
    page,
    sortField,
    sortDirection,
    additionalParams,
    enableUrlState,
    updateUrl,
  ])

  const setSearch = (newSearch: string) => {
    setSearchState(newSearch)
    setPageState(1) // Reset to first page when searching
  }

  const setPage = (newPage: number) => {
    setPageState(newPage)
  }

  const setSortField = (field: TSortField | null) => {
    setSortFieldState(field)
    setPageState(1) // Reset to first page when sorting
  }

  const setSortDirection = (direction: SortDirection) => {
    setSortDirectionState(direction)
    setPageState(1) // Reset to first page when sorting
  }

  const setAdditionalParam = (key: string, value: string) => {
    setAdditionalParams((prev) => {
      const newParams = { ...prev }

      if (value === '') {
        // Remove param if empty
        delete newParams[key]
      } else {
        newParams[key] = value
      }

      return newParams
    })
    setPageState(1) // Reset to first page when changing filters
  }

  const handleSearchChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setSearch(ev.target.value)
  }

  const handleSort = (field: string) => {
    let newSortField: TSortField | null = sortField
    let newSortDirection: SortDirection

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
      newSortField = field as TSortField
      newSortDirection = 'asc'
    }

    setSortField(newSortField)
    setSortDirection(newSortDirection)
  }

  const resetFilters = () => {
    setSearch('')
    setPageState(1)
    setSortField(opts.defaultSortField ?? null)
    setSortDirection(opts.defaultSortDirection ?? null)
    setAdditionalParams({})
  }

  return {
    search,
    setSearch,
    handleSearchChange,
    debouncedSearch,
    isSearching,
    page,
    setPage,
    limit: opts.defaultLimit ?? DEFAULT_LIMIT,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    handleSort,
    additionalParams,
    setAdditionalParam,
    updateUrl,
    resetFilters,
  }
}
