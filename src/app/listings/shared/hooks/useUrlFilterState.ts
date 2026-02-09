import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'
import { PAGINATION, type PageSizeOption } from '@/data/constants'
import { useUrlSearch } from '@/hooks/useUrlState'
import analytics from '@/lib/analytics'
import { type SortDirection } from '@/types/api'
import { parseLimit } from '../utils/pagination'

interface Config {
  basePath: string
  storageKey: string
  maxLimit: number
}

export function useUrlFilterState<TSortField extends string>(config: Config) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchInput, setSearchInternal, search] = useUrlSearch(300)

  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const sortField = (searchParams.get('sortField') as TSortField) ?? null
  const sortDirection = (searchParams.get('sortDirection') as SortDirection) ?? null
  const myListings = searchParams.get('myListings') === 'true'

  const urlLimit = searchParams.get('limit')
  const initializedFromStorage = useRef(false)

  const limit = (() => {
    if (urlLimit) return parseLimit(urlLimit, config.maxLimit)
    if (typeof window !== 'undefined' && !initializedFromStorage.current) {
      const stored = localStorage.getItem(config.storageKey)
      if (stored) return parseLimit(stored, config.maxLimit)
    }
    return PAGINATION.PUBLIC_DEFAULT_LIMIT as PageSizeOption
  })()

  useEffect(() => {
    if (typeof window === 'undefined') return
    initializedFromStorage.current = true
    if (urlLimit) {
      localStorage.setItem(config.storageKey, String(limit))
    }
  }, [config.storageKey, limit, urlLimit])

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

      if (!('page' in updates)) params.delete('page')

      const url = params.toString() ? `?${params.toString()}` : config.basePath
      if (shouldPush) {
        router.push(url)
      } else {
        router.replace(url)
      }
    },
    [config.basePath, router, searchParams],
  )

  const setSearch = useCallback(
    (value: string) => {
      setSearchInternal(value)
    },
    [setSearchInternal],
  )

  const setPage = useCallback(
    (value: number) => {
      updateFilters({ page: value }, true)
      analytics.filter.page({ prevPage: page, nextPage: value })
    },
    [page, updateFilters],
  )

  const setLimit = useCallback(
    (value: PageSizeOption) => {
      updateFilters({ limit: value, page: 1 }, true)
      if (typeof window !== 'undefined') {
        localStorage.setItem(config.storageKey, String(value))
      }
    },
    [config.storageKey, updateFilters],
  )

  const setSortField = useCallback(
    (value: TSortField | null) => {
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

  const handleSort = useCallback(
    (field: string) => {
      let newSortField: TSortField | null = sortField
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
        newSortField = field as TSortField
        newSortDirection = 'asc'
      }

      updateFilters({
        sortField: newSortField,
        sortDirection: newSortDirection,
      })
    },
    [sortDirection, sortField, updateFilters],
  )

  const getParam = useCallback((key: string) => searchParams.get(key), [searchParams])

  return {
    searchParams,
    getParam,
    updateFilters,
    page,
    limit,
    setPage,
    setLimit,
    search,
    searchInput,
    setSearch,
    sortField,
    sortDirection,
    setSortField,
    setSortDirection,
    handleSort,
    myListings,
    setMyListings,
  }
}
