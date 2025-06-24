'use client'

import { Suspense, useState, useEffect, useMemo, useCallback } from 'react'
import useListingsState from '@/app/listings/hooks/useListingsState'
import { LoadingSpinner, PullToRefresh } from '@/components/ui'
import analytics from '@/lib/analytics'
import { api } from '@/lib/api'
import { filterNullAndEmpty } from '@/utils/filter'
import { ListingFilters } from './components/ListingFilters'
import { ListingsContent } from './components/ListingsContent'
import { ListingsHeader } from './components/ListingsHeader'
import { QuickFilters } from './components/QuickFilters'
import { SearchBar } from './components/SearchBar'
import type {
  ListingsFilter,
  SortDirection,
  SortField,
} from '@/app/listings/types'
import type { RouterOutput } from '@/types/trpc'

type ListingType = RouterOutput['listings']['get']['listings'][number]

function V2ListingsPage() {
  // Use the standard listings state hook
  const listingsState = useListingsState()

  // UI State - specific to v2
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [showSystemIcons, _setShowSystemIcons] = useState(false)

  // Infinite scrolling state
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMoreItems, setHasMoreItems] = useState(true)
  const [allListings, setAllListings] = useState<ListingType[]>([])

  // Performance scales query
  const performanceScalesQuery = api.listings.performanceScales.useQuery()

  // Filter params for API call
  const filterParams: ListingsFilter = useMemo(
    () => ({
      page: currentPage,
      limit: 12,
      ...filterNullAndEmpty({
        systemIds:
          listingsState.systemIds.length > 0
            ? listingsState.systemIds
            : undefined,
        deviceIds:
          listingsState.deviceIds.length > 0
            ? listingsState.deviceIds
            : undefined,
        socIds:
          listingsState.socIds.length > 0 ? listingsState.socIds : undefined,
        emulatorIds:
          listingsState.emulatorIds.length > 0
            ? listingsState.emulatorIds
            : undefined,
        performanceIds:
          listingsState.performanceIds.length > 0
            ? listingsState.performanceIds
            : undefined,
        searchTerm: listingsState.search || undefined,
        sortField: listingsState.sortField ?? undefined,
        sortDirection: listingsState.sortDirection ?? undefined,
      }),
    }),
    [
      listingsState.systemIds,
      listingsState.deviceIds,
      listingsState.socIds,
      listingsState.emulatorIds,
      listingsState.performanceIds,
      listingsState.search,
      listingsState.sortField,
      listingsState.sortDirection,
      currentPage,
    ],
  )

  // Main listings query
  const listingsQuery = api.listings.get.useQuery(filterParams, {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  })

  // Handle query results for infinite scrolling
  useEffect(() => {
    if (!listingsQuery.data) return

    setAllListings((prev) => {
      if (currentPage === 1) {
        return listingsQuery.data.listings
      } else {
        const existingIds = new Set(prev.map((item) => item.id))
        const newListings = listingsQuery.data.listings.filter(
          (item) => !existingIds.has(item.id),
        )
        return [...prev, ...newListings]
      }
    })

    setHasMoreItems(currentPage < (listingsQuery.data.pagination?.pages || 1))
  }, [listingsQuery.data, currentPage])

  // Track search analytics
  useEffect(() => {
    if (
      listingsState.search &&
      listingsState.search.length > 2 &&
      !listingsQuery.isLoading &&
      listingsQuery.data
    ) {
      analytics.contentDiscovery.searchPerformed({
        query: listingsState.search,
        resultCount: listingsQuery.data.listings.length,
        category: 'v2_listings',
        page: 'v2/listings',
      })
    }
  }, [listingsQuery.data, listingsQuery.isLoading, listingsState.search])

  // Load more listings
  const loadMoreListings = useCallback(() => {
    if (hasMoreItems && !listingsQuery.isLoading && !listingsQuery.isFetching) {
      setCurrentPage((prev) => prev + 1)
    }
  }, [hasMoreItems, listingsQuery.isLoading, listingsQuery.isFetching])

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    if (listingsQuery.isLoading || listingsQuery.isFetching) return

    try {
      await listingsQuery.refetch()
      setCurrentPage(1)
      setAllListings([])

      if (navigator.vibrate) {
        navigator.vibrate(100)
      }
    } catch (error) {
      console.error('Error refreshing listings:', error)
    }
  }, [listingsQuery])

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    listingsState.setSystemIds([])
    listingsState.setDeviceIds([])
    listingsState.setSocIds([])
    listingsState.setEmulatorIds([])
    listingsState.setPerformanceIds([])
    listingsState.setSearch('')
    listingsState.setSortField(null)
    listingsState.setSortDirection(null)
    analytics.filter.clearAll()
  }, [listingsState])

  // Check if any filters are active
  const hasActiveFilters =
    listingsState.systemIds.length > 0 ||
    listingsState.deviceIds.length > 0 ||
    listingsState.socIds.length > 0 ||
    listingsState.emulatorIds.length > 0 ||
    listingsState.performanceIds.length > 0 ||
    listingsState.search.length > 0

  // Properly typed handleSort function
  const handleSort = (field: SortField, direction?: SortDirection) => {
    listingsState.setSortField(field)
    listingsState.setSortDirection(direction || null)
  }

  // State for async fetch functions (for multiselect components)
  const [systemSearchTerm, setSystemSearchTerm] = useState('')
  const [deviceSearchTerm, setDeviceSearchTerm] = useState('')
  const [emulatorSearchTerm, setEmulatorSearchTerm] = useState('')
  const [socSearchTerm, setSocSearchTerm] = useState('')

  // Queries for async data fetching
  const systemsQuery = api.systems.get.useQuery(
    { search: systemSearchTerm || undefined },
    { enabled: systemSearchTerm.length > 0, refetchOnWindowFocus: false },
  )

  const devicesQuery = api.devices.get.useQuery(
    { search: deviceSearchTerm || undefined, limit: 50, offset: 0 },
    { enabled: deviceSearchTerm.length > 0, refetchOnWindowFocus: false },
  )

  const emulatorsQuery = api.emulators.get.useQuery(
    { search: emulatorSearchTerm || undefined, limit: 50, offset: 0 },
    { enabled: emulatorSearchTerm.length > 0, refetchOnWindowFocus: false },
  )

  const socsQuery = api.socs.get.useQuery(
    { search: socSearchTerm || undefined, limit: 50, offset: 0 },
    { enabled: socSearchTerm.length > 0, refetchOnWindowFocus: false },
  )

  // Debounced fetch functions
  const fetchSystems = useCallback(
    async (search: string): Promise<{ id: string; name: string }[]> => {
      if (!search.trim()) return []

      return new Promise((resolve) => {
        const timeoutId = setTimeout(async () => {
          setSystemSearchTerm(search)
          setTimeout(async () => {
            try {
              const result = await systemsQuery.refetch()
              resolve(
                result.data?.map((system) => ({
                  id: system.id,
                  name: system.name,
                })) || [],
              )
            } catch (error) {
              console.error('Error fetching systems:', error)
              resolve([])
            }
          }, 50)
        }, 150)

        return () => clearTimeout(timeoutId)
      })
    },
    [systemsQuery],
  )

  const fetchDevices = useCallback(
    async (search: string): Promise<{ id: string; name: string }[]> => {
      if (!search.trim()) return []

      return new Promise((resolve) => {
        const timeoutId = setTimeout(async () => {
          setDeviceSearchTerm(search)
          setTimeout(async () => {
            try {
              const result = await devicesQuery.refetch()
              resolve(
                result.data?.devices.map((device) => ({
                  id: device.id,
                  name: `${device.brand.name} ${device.modelName}`,
                })) || [],
              )
            } catch (error) {
              console.error('Error fetching devices:', error)
              resolve([])
            }
          }, 50)
        }, 150)

        return () => clearTimeout(timeoutId)
      })
    },
    [devicesQuery],
  )

  const fetchEmulators = useCallback(
    async (search: string): Promise<{ id: string; name: string }[]> => {
      if (!search.trim()) return []

      return new Promise((resolve) => {
        const timeoutId = setTimeout(async () => {
          setEmulatorSearchTerm(search)
          setTimeout(async () => {
            try {
              const result = await emulatorsQuery.refetch()
              resolve(
                result.data?.emulators.map((emulator) => ({
                  id: emulator.id,
                  name: emulator.name,
                })) || [],
              )
            } catch (error) {
              console.error('Error fetching emulators:', error)
              resolve([])
            }
          }, 50)
        }, 150)

        return () => clearTimeout(timeoutId)
      })
    },
    [emulatorsQuery],
  )

  const fetchSocs = useCallback(
    async (search: string): Promise<{ id: string; name: string }[]> => {
      if (!search.trim()) return []

      return new Promise((resolve) => {
        const timeoutId = setTimeout(async () => {
          setSocSearchTerm(search)
          setTimeout(async () => {
            try {
              const result = await socsQuery.refetch()
              resolve(
                result.data?.socs.map((soc) => ({
                  id: soc.id,
                  name: `${soc.name} (${soc.manufacturer})`,
                })) || [],
              )
            } catch (error) {
              console.error('Error fetching SoCs:', error)
              resolve([])
            }
          }, 50)
        }, 150)

        return () => clearTimeout(timeoutId)
      })
    },
    [socsQuery],
  )

  // Handle errors
  if (listingsQuery.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
              Error Loading Listings
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {listingsQuery.error.message}
            </p>
            <button
              onClick={() => listingsQuery.refetch()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <PullToRefresh
      onRefresh={handleRefresh}
      enableHaptics={true}
      refreshingText="Refreshing listings..."
      pullingText="Pull to refresh"
      releaseText="Release to refresh"
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-6">
          {/* Mobile-First Header */}
          <div className="mb-6">
            <ListingsHeader
              viewMode={viewMode}
              setViewMode={setViewMode}
              listingsCount={allListings.length}
              isLoading={listingsQuery.isLoading && currentPage === 1}
            />

            {/* Search Bar */}
            <SearchBar
              search={listingsState.search}
              onSearchChange={(value) => listingsState.setSearch(value)}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters(!showFilters)}
            />

            {/* Quick Filter Chips */}
            <QuickFilters
              performanceScales={performanceScalesQuery.data}
              performanceIds={listingsState.performanceIds}
              handlePerformanceChange={(values) =>
                listingsState.setPerformanceIds(values)
              }
              sortField={listingsState.sortField}
              sortDirection={listingsState.sortDirection}
              handleSort={handleSort}
              hasActiveFilters={hasActiveFilters}
              clearAllFilters={clearAllFilters}
            />
          </div>

          {/* Advanced Filters Overlay - Bottom Sheet on Mobile */}
          <ListingFilters
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            hasActiveFilters={hasActiveFilters}
            clearAllFilters={clearAllFilters}
            systemIds={listingsState.systemIds}
            handleSystemChange={(values) => listingsState.setSystemIds(values)}
            fetchSystems={fetchSystems}
            performanceIds={listingsState.performanceIds.map(String)}
            handlePerformanceChange={(values) =>
              listingsState.setPerformanceIds(values.map(Number))
            }
            performanceScales={performanceScalesQuery.data}
            deviceIds={listingsState.deviceIds}
            handleDeviceChange={(values) => listingsState.setDeviceIds(values)}
            fetchDevices={fetchDevices}
            emulatorIds={listingsState.emulatorIds}
            handleEmulatorChange={(values) =>
              listingsState.setEmulatorIds(values)
            }
            fetchEmulators={fetchEmulators}
            socIds={listingsState.socIds}
            handleSocChange={(values) => listingsState.setSocIds(values)}
            fetchSocs={fetchSocs}
          />

          {/* Listings Content */}
          <ListingsContent
            allListings={allListings}
            viewMode={viewMode}
            showSystemIcons={showSystemIcons}
            isLoading={listingsQuery.isLoading}
            isFetching={listingsQuery.isFetching}
            hasMoreItems={hasMoreItems}
            currentPage={currentPage}
            loadMoreListings={loadMoreListings}
            hasActiveFilters={hasActiveFilters}
            clearAllFilters={clearAllFilters}
          />
        </div>
      </div>
    </PullToRefresh>
  )
}

export default function V2ListingsPageWithSuspense() {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" />}>
      <V2ListingsPage />
    </Suspense>
  )
}
