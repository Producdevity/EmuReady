import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { type SortDirection, type SortField } from '../types'

function useListingsState() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [systemId, setSystemId] = useState(searchParams.get('systemId') ?? '')
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const pageParam = Number(searchParams.get('page'))
  const [page, setPage] = useState(pageParam > 0 ? pageParam : 1)
  const [deviceId, setDeviceId] = useState(searchParams.get('deviceId') ?? '')
  const [emulatorId, setEmulatorId] = useState(
    searchParams.get('emulatorId') ?? '',
  )
  const [performanceId, setPerformanceId] = useState(
    searchParams.get('performanceId') ?? '',
  )
  const [sortField, setSortField] = useState<SortField | null>(
    (searchParams.get('sortField') as SortField) ?? null,
  )
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    (searchParams.get('sortDirection') as SortDirection) ?? null,
  )

  // Helper to update URL and state
  const updateQuery = (params: Record<string, string | number | null>) => {
    const newParams = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === '' || value === undefined) {
        return newParams.delete(key)
      }
      newParams.set(key, String(value))
    })
    router.replace(`?${newParams.toString()}`)
  }

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
    setSortField(newSortField)
    setSortDirection(newSortDirection)
    setPage(1)
    updateQuery({
      sortField: newSortField,
      sortDirection: newSortDirection,
      page: 1,
    })
  }

  return {
    // State
    systemId,
    search,
    page,
    deviceId,
    emulatorId,
    performanceId,
    sortField,
    sortDirection,

    // Setters
    setSystemId,
    setSearch,
    setPage,
    setDeviceId,
    setEmulatorId,
    setPerformanceId,
    setSortField,
    setSortDirection,

    // Helpers
    updateQuery,
    handleSort,
  }
}

export default useListingsState
