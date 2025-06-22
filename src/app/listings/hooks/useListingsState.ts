import { useRouter, useSearchParams } from 'next/navigation'
import { parseArrayParam, parseNumberArrayParam } from '@/utils/parse-params'
import { type SortDirection, type SortField } from '../types'

function useListingsState() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Read directly from URL - this ensures we always have the current URL state
  const systemIds = parseArrayParam(searchParams.get('systemIds'))
  const search = searchParams.get('search') ?? ''
  const pageParam = Number(searchParams.get('page'))
  const page = pageParam > 0 ? pageParam : 1
  const deviceIds = parseArrayParam(searchParams.get('deviceIds'))
  const socIds = parseArrayParam(searchParams.get('socIds'))
  const emulatorIds = parseArrayParam(searchParams.get('emulatorIds'))
  const performanceIds = parseNumberArrayParam(
    searchParams.get('performanceIds'),
  )
  const sortField = (searchParams.get('sortField') as SortField) ?? null
  const sortDirection =
    (searchParams.get('sortDirection') as SortDirection) ?? null
  const myListings = searchParams.get('myListings') === 'true'

  // Helper to update URL and state
  const updateQuery = (
    params: Record<
      string,
      string | number | string[] | number[] | boolean | null
    >,
  ) => {
    const newParams = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === '' || value === undefined) {
        return newParams.delete(key)
      }
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return newParams.delete(key)
        }
        newParams.set(key, JSON.stringify(value))
      } else {
        newParams.set(key, String(value))
      }
    })
    router.replace(`?${newParams.toString()}`)
  }

  // Setters that update URL directly
  const setSystemIds = (values: string[]) => updateQuery({ systemIds: values })
  const setSearch = (value: string) => updateQuery({ search: value })
  const setPage = (value: number) => updateQuery({ page: value })
  const setDeviceIds = (values: string[]) => updateQuery({ deviceIds: values })
  const setSocIds = (values: string[]) => updateQuery({ socIds: values })
  const setEmulatorIds = (values: string[]) =>
    updateQuery({ emulatorIds: values })
  const setPerformanceIds = (values: number[]) =>
    updateQuery({ performanceIds: values })
  const setSortField = (value: SortField | null) =>
    updateQuery({ sortField: value })
  const setSortDirection = (value: SortDirection) =>
    updateQuery({ sortDirection: value })
  const setMyListings = (value: boolean) => updateQuery({ myListings: value })

  const handleSort = (field: string) => {
    let newSortField: SortField | null = sortField
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
      newSortField = field as SortField
      newSortDirection = 'asc'
    }
    updateQuery({
      sortField: newSortField,
      sortDirection: newSortDirection,
      page: 1,
    })
  }

  return {
    // State (read directly from URL)
    systemIds,
    search,
    page,
    deviceIds,
    socIds,
    emulatorIds,
    performanceIds,
    sortField,
    sortDirection,
    myListings,

    // Setters (update URL directly)
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
    updateQuery,
    handleSort,
  }
}

export default useListingsState
