import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import analytics from '@/lib/analytics'
import { type SortDirection } from '@/types/api'
import { parseArrayParam, parseNumberArrayParam } from '@/utils/parse-params'
import { type SortField } from '../types'

export default function usePcListingsState() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Parse initial state from URL
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [cpuIds, setCpuIds] = useState<string[]>(
    parseArrayParam(searchParams.get('cpuIds')),
  )
  const [gpuIds, setGpuIds] = useState<string[]>(
    parseArrayParam(searchParams.get('gpuIds')),
  )
  const [systemIds, setSystemIds] = useState<string[]>(
    parseArrayParam(searchParams.get('systemIds')),
  )
  const [performanceIds, setPerformanceIds] = useState<number[]>(
    parseNumberArrayParam(searchParams.get('performanceIds')),
  )
  const [emulatorIds, setEmulatorIds] = useState<string[]>(
    parseArrayParam(searchParams.get('emulatorIds')),
  )
  const [minMemory, setMinMemory] = useState<number | null>(
    searchParams.get('minMemory')
      ? Number(searchParams.get('minMemory'))
      : null,
  )
  const [maxMemory, setMaxMemory] = useState<number | null>(
    searchParams.get('maxMemory')
      ? Number(searchParams.get('maxMemory'))
      : null,
  )
  const [sortField, setSortField] = useState<SortField | null>(
    (searchParams.get('sortField') as SortField) || null,
  )
  const [sortDirection, setSortDirection] = useState<SortDirection | null>(
    (searchParams.get('sortDirection') as SortDirection) || null,
  )
  const [myListings, setMyListings] = useState(
    searchParams.get('myListings') === 'true',
  )

  // Update URL when state changes
  useEffect(() => {
    const params = new URLSearchParams()

    if (page > 1) params.set('page', page.toString())
    if (search) params.set('search', search)
    if (cpuIds.length) params.set('cpuIds', JSON.stringify(cpuIds))
    if (gpuIds.length) params.set('gpuIds', JSON.stringify(gpuIds))
    if (systemIds.length) params.set('systemIds', JSON.stringify(systemIds))
    if (performanceIds.length)
      params.set('performanceIds', JSON.stringify(performanceIds))
    if (emulatorIds.length)
      params.set('emulatorIds', JSON.stringify(emulatorIds))
    if (minMemory !== null) params.set('minMemory', minMemory.toString())
    if (maxMemory !== null) params.set('maxMemory', maxMemory.toString())
    if (sortField) params.set('sortField', sortField)
    if (sortDirection) params.set('sortDirection', sortDirection)
    if (myListings) params.set('myListings', 'true')

    analytics.filter.pcListingsCombined({
      page,
      search,
      cpuIds,
      gpuIds,
      systemIds,
      performanceIds,
      emulatorIds,
      minMemory,
      maxMemory,
      sortField,
      sortDirection,
      myListings,
    })

    const url = params.toString() ? `?${params.toString()}` : '/pc-listings'
    router.replace(url, { scroll: false })
  }, [
    page,
    search,
    cpuIds,
    gpuIds,
    systemIds,
    performanceIds,
    emulatorIds,
    minMemory,
    maxMemory,
    sortField,
    sortDirection,
    myListings,
    router,
  ])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [
    search,
    cpuIds,
    gpuIds,
    systemIds,
    performanceIds,
    emulatorIds,
    minMemory,
    maxMemory,
    myListings,
  ])

  const handleSort = useCallback(
    (field: string) => {
      const typedField = field as SortField
      if (sortField === typedField) {
        if (sortDirection === 'asc') {
          setSortDirection('desc')
        } else if (sortDirection === 'desc') {
          setSortField(null)
          setSortDirection(null)
        }
      } else {
        setSortField(typedField)
        setSortDirection('asc')
      }
    },
    [sortField, sortDirection],
  )

  return {
    page,
    setPage,
    search,
    setSearch,
    cpuIds,
    setCpuIds,
    gpuIds,
    setGpuIds,
    systemIds,
    setSystemIds,
    performanceIds,
    setPerformanceIds,
    emulatorIds,
    setEmulatorIds,
    minMemory,
    setMinMemory,
    maxMemory,
    setMaxMemory,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    myListings,
    setMyListings,
    handleSort,
  }
}
