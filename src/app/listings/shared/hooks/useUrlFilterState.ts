import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect } from 'react'
import { type PageSizeOption } from '@/data/constants'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useUrlSearch } from '@/hooks/useUrlSearch'
import analytics from '@/lib/analytics'
import { PageSizePreferenceSchema } from '@/schemas/preferences'
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
  const [storedLimit, setStoredLimit] = useLocalStorage(
    config.storageKey,
    parseLimit(null, config.maxLimit),
    PageSizePreferenceSchema,
  )
  const limit = parseLimit(urlLimit || String(storedLimit), config.maxLimit)

  useEffect(() => {
    if (!urlLimit) return
    try {
      const value = String(parseLimit(urlLimit, config.maxLimit))
      if (window.localStorage.getItem(config.storageKey) === value) return
      window.localStorage.setItem(config.storageKey, value)
      window.dispatchEvent(new StorageEvent('storage', { key: config.storageKey }))
    } catch (error) {
      console.warn('Failed to save report page size:', error)
    }
  }, [config.storageKey, config.maxLimit, urlLimit])

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
        router.replace(url, { scroll: false })
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
      setStoredLimit(value)
    },
    [setStoredLimit, updateFilters],
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
