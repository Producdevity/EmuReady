import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { type SortDirection, type SortField } from '../types'

function parseArrayParam(param: string | null): string[] {
  if (!param) return []
  try {
    return JSON.parse(param)
  } catch {
    return param ? [param] : []
  }
}

function parseNumberArrayParam(param: string | null): number[] {
  if (!param) return []
  try {
    const parsed = JSON.parse(param)
    return Array.isArray(parsed) ? parsed.map(Number).filter(Boolean) : []
  } catch {
    return param ? [Number(param)].filter(Boolean) : []
  }
}

function useListingsState() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [systemIds, setSystemIds] = useState<string[]>(
    parseArrayParam(searchParams.get('systemIds')),
  )
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const pageParam = Number(searchParams.get('page'))
  const [page, setPage] = useState(pageParam > 0 ? pageParam : 1)
  const [deviceIds, setDeviceIds] = useState<string[]>(
    parseArrayParam(searchParams.get('deviceIds')),
  )
  const [socIds, setSocIds] = useState<string[]>(
    parseArrayParam(searchParams.get('socIds')),
  )
  const [emulatorIds, setEmulatorIds] = useState<string[]>(
    parseArrayParam(searchParams.get('emulatorIds')),
  )
  const [performanceIds, setPerformanceIds] = useState<number[]>(
    parseNumberArrayParam(searchParams.get('performanceIds')),
  )
  const [sortField, setSortField] = useState<SortField | null>(
    (searchParams.get('sortField') as SortField) ?? null,
  )
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    (searchParams.get('sortDirection') as SortDirection) ?? null,
  )

  // Helper to update URL and state
  const updateQuery = (
    params: Record<string, string | number | string[] | number[] | null>,
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
    systemIds,
    search,
    page,
    deviceIds,
    socIds,
    emulatorIds,
    performanceIds,
    sortField,
    sortDirection,

    // Setters
    setSystemIds,
    setSearch,
    setPage,
    setDeviceIds,
    setSocIds,
    setEmulatorIds,
    setPerformanceIds,
    setSortField,
    setSortDirection,

    // Helpers
    updateQuery,
    handleSort,
  }
}

export default useListingsState
