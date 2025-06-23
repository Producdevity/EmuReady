'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  Search,
  Filter,
  X,
  Grid,
  List,
  Zap,
  Calendar,
  Heart,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import Link from 'next/link'
import { Suspense, useState, useMemo, useCallback, useEffect } from 'react'
import useListingsState from '@/app/listings/hooks/useListingsState'
import {
  type ListingsFilter,
  type SortDirection,
  type SortField,
} from '@/app/listings/types'
import {
  Button,
  Input,
  LoadingSpinner,
  VirtualScroller,
  AsyncMultiSelect,
  PullToRefresh,
} from '@/components/ui'
import analytics from '@/lib/analytics'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import ListingCard from './components/ListingCard'
import type { RouterOutput } from '@/types/trpc'

type ViewMode = 'grid' | 'list'
type ListingType = RouterOutput['listings']['get']['listings'][number]

// Define interfaces for the API responses
interface SystemData {
  id: string
  name: string
}

interface DeviceData {
  id: string
  brand: {
    name: string
  }
  modelName: string
}

interface EmulatorData {
  id: string
  name: string
}

interface SocData {
  id: string
  name: string
  manufacturer: string
}

function V2ListingsPage() {
  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showSystemIcons, _setShowSystemIcons] = useState(false)
  const listingsState = useListingsState()

  // Pagination state for infinite scrolling
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMoreItems, setHasMoreItems] = useState(true)
  const [allListings, setAllListings] = useState<ListingType[]>([])

  // Performance scales query
  const performanceScalesQuery = api.listings.performanceScales.useQuery()

  // Filter params - matching working page structure
  const filterParams: ListingsFilter = {
    systemIds:
      listingsState.systemIds.length > 0 ? listingsState.systemIds : undefined,
    deviceIds:
      listingsState.deviceIds.length > 0 ? listingsState.deviceIds : undefined,
    socIds: listingsState.socIds.length > 0 ? listingsState.socIds : undefined,
    emulatorIds:
      listingsState.emulatorIds.length > 0
        ? listingsState.emulatorIds
        : undefined,
    performanceIds:
      listingsState.performanceIds.length > 0
        ? listingsState.performanceIds
        : undefined,
    searchTerm: listingsState.search || undefined,
    page: currentPage,
    limit: 12, // Good for grid layout
    sortField: listingsState.sortField ?? undefined,
    sortDirection: listingsState.sortDirection ?? undefined,
  }

  // Async fetch functions for multiselect components
  const fetchSystems = useCallback(
    async ({
      search,
      page,
      limit,
    }: {
      search?: string
      page: number
      limit: number
    }) => {
      try {
        // Use a simpler approach with direct API calls
        const response = await fetch(
          `/api/trpc/systems.get?input=${encodeURIComponent(
            JSON.stringify({
              search: search || undefined,
              page,
              limit,
            }),
          )}`,
        )

        const data = await response.json()
        const systems = data.result.data as SystemData[]

        return {
          items: systems.map((system) => ({
            id: system.id,
            name: system.name,
          })),
          hasMore: systems.length === limit,
          total: systems.length,
        }
      } catch (error) {
        console.error('Error fetching systems:', error)
        return { items: [], hasMore: false, total: 0 }
      }
    },
    [],
  )

  // Base listings query with enabled flag to prevent unnecessary fetches
  const listingsQuery = api.listings.get.useQuery(filterParams, {
    keepPreviousData: true,
    staleTime: 30000, // 30 seconds
  })

  // Handle successful query results with optimized state updates
  useEffect(() => {
    if (!listingsQuery.data) return

    setAllListings((prev) => {
      if (currentPage === 1) {
        return listingsQuery.data.listings
      } else {
        // Avoid duplicate listings by checking IDs
        const existingIds = new Set(prev.map((item) => item.id))
        const newListings = listingsQuery.data.listings.filter(
          (item) => !existingIds.has(item.id),
        )
        return [...prev, ...newListings]
      }
    })

    setHasMoreItems(currentPage < (listingsQuery.data.pagination?.pages || 1))
  }, [listingsQuery.data, currentPage])

  // Track search analytics when results are loaded
  useEffect(() => {
    // Only track analytics when search is performed and results are loaded
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

  // Load more listings when reaching the end
  const loadMoreListings = useCallback(() => {
    if (hasMoreItems && !listingsQuery.isLoading) {
      setCurrentPage((prev) => prev + 1)
    }
  }, [hasMoreItems, listingsQuery.isLoading])

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
    setAllListings([])
  }, [
    listingsState.systemIds,
    listingsState.deviceIds,
    listingsState.socIds,
    listingsState.emulatorIds,
    listingsState.performanceIds,
    listingsState.search,
    listingsState.sortField,
    listingsState.sortDirection,
  ])

  // Refresh handler for pull-to-refresh
  const handleRefresh = async () => {
    try {
      await listingsQuery.refetch()
      setCurrentPage(1)
      setAllListings([])

      // Trigger haptic feedback on refresh complete
      if (navigator.vibrate) {
        navigator.vibrate(100)
      }
    } finally {
      // Reset refreshing state
    }
  }

  // Handlers - Properly updating state and URL
  const handleSystemChange = useCallback(
    (values: string[]) => {
      listingsState.setSystemIds(values)
    },
    [listingsState],
  )

  const handleDeviceChange = useCallback(
    (values: string[]) => {
      listingsState.setDeviceIds(values)
    },
    [listingsState],
  )

  const handleSocChange = useCallback(
    (values: string[]) => {
      listingsState.setSocIds(values)
    },
    [listingsState],
  )

  const handleEmulatorChange = useCallback(
    (values: string[]) => {
      listingsState.setEmulatorIds(values)
    },
    [listingsState],
  )

  const handlePerformanceChange = useCallback(
    (values: number[]) => {
      listingsState.setPerformanceIds(values)
    },
    [listingsState],
  )

  const handleSearchChange = useCallback(
    (value: string) => {
      listingsState.setSearch(value)
      // Analytics are now tracked in the useEffect above
    },
    [listingsState],
  )

  const handleSort = useCallback(
    (field: SortField, direction?: SortDirection) => {
      const newSortField = field
      const newSortDirection =
        direction || (listingsState.sortDirection === 'asc' ? 'desc' : 'asc')

      listingsState.setSortField(newSortField)
      listingsState.setSortDirection(newSortDirection)
    },
    [listingsState],
  )

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

  // Quick filters with proper performance scale integration
  const quickFilters = useMemo(() => {
    const performanceScales = performanceScalesQuery.data ?? []
    const topPerformanceIds = performanceScales
      .filter((scale) => scale.rank <= 3) // Get top 3 performance levels
      .map((scale) => scale.id)

    return [
      {
        label: 'Runs Well',
        action: () => handlePerformanceChange(topPerformanceIds),
        icon: Zap,
        isActive: topPerformanceIds.some((id) =>
          listingsState.performanceIds.includes(id),
        ),
      },
      {
        label: 'Recent',
        action: () => handleSort('createdAt', 'desc'),
        icon: Calendar,
        isActive:
          listingsState.sortField === 'createdAt' &&
          listingsState.sortDirection === 'desc',
      },
      {
        label: 'Top Verified',
        action: () => handleSort('successRate', 'desc'),
        icon: Heart,
        isActive:
          listingsState.sortField === 'successRate' &&
          listingsState.sortDirection === 'desc',
      },
    ]
  }, [
    performanceScalesQuery.data,
    listingsState.performanceIds,
    listingsState.sortField,
    listingsState.sortDirection,
    handlePerformanceChange,
    handleSort,
  ])

  const hasActiveFilters =
    listingsState.systemIds.length > 0 ||
    listingsState.deviceIds.length > 0 ||
    listingsState.socIds.length > 0 ||
    listingsState.emulatorIds.length > 0 ||
    listingsState.performanceIds.length > 0 ||
    listingsState.search.length > 0

  // Async fetch functions for multiselect components
  const fetchDevices = useCallback(
    async ({
      search,
      page,
      limit,
    }: {
      search?: string
      page: number
      limit: number
    }) => {
      try {
        // Use a simpler approach with direct API calls
        const response = await fetch(
          `/api/trpc/devices.get?input=${encodeURIComponent(
            JSON.stringify({
              search: search || undefined,
              page,
              limit,
            }),
          )}`,
        )

        const data = await response.json()
        const result = data.result.data as {
          devices: DeviceData[]
          pagination?: { total: number }
        }

        return {
          items: result.devices.map((device) => ({
            id: device.id,
            name: `${device.brand.name} ${device.modelName}`,
          })),
          hasMore: result.devices.length === limit,
          total: result.pagination?.total || result.devices.length,
        }
      } catch (error) {
        console.error('Error fetching devices:', error)
        return { items: [], hasMore: false, total: 0 }
      }
    },
    [],
  )

  const fetchEmulators = useCallback(
    async ({
      search,
      page,
      limit,
    }: {
      search?: string
      page: number
      limit: number
    }) => {
      try {
        // Use a simpler approach with direct API calls
        const response = await fetch(
          `/api/trpc/emulators.get?input=${encodeURIComponent(
            JSON.stringify({
              search: search || undefined,
              page,
              limit,
            }),
          )}`,
        )

        const data = await response.json()
        const result = data.result.data as {
          emulators: EmulatorData[]
          pagination?: { total: number }
        }

        return {
          items: result.emulators.map((emulator) => ({
            id: emulator.id,
            name: emulator.name,
          })),
          hasMore: result.emulators.length === limit,
          total: result.pagination?.total || result.emulators.length,
        }
      } catch (error) {
        console.error('Error fetching emulators:', error)
        return { items: [], hasMore: false, total: 0 }
      }
    },
    [],
  )

  const fetchSocs = useCallback(
    async ({
      search,
      page,
      limit,
    }: {
      search?: string
      page: number
      limit: number
    }) => {
      try {
        // Use a simpler approach with direct API calls
        const response = await fetch(
          `/api/trpc/socs.get?input=${encodeURIComponent(
            JSON.stringify({
              search: search || undefined,
              page,
              limit,
            }),
          )}`,
        )

        const data = await response.json()
        const result = data.result.data as {
          socs: SocData[]
          pagination?: { total: number }
        }

        return {
          items: result.socs.map((soc) => ({
            id: soc.id,
            name: `${soc.name} (${soc.manufacturer})`,
          })),
          hasMore: result.socs.length === limit,
          total: result.pagination?.total || result.socs.length,
        }
      } catch (error) {
        console.error('Error fetching SOCs:', error)
        return { items: [], hasMore: false, total: 0 }
      }
    },
    [],
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
            <Button onClick={() => listingsQuery.refetch()}>Try Again</Button>
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
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                  Game Listings
                  <span className="text-sm font-normal text-blue-600 dark:text-blue-400 ml-2">
                    V2
                  </span>
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {listingsQuery.isLoading && currentPage === 1
                    ? 'Loading...'
                    : `${allListings.length} listings found`}
                </p>
              </div>

              {/* View Mode & Add Listing */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="p-2"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="p-2"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
                <Button asChild variant="fancy" size="sm">
                  <Link href="/listings/new">
                    <span className="hidden sm:inline">Add Listing</span>
                    <span className="sm:hidden">Add</span>
                  </Link>
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search games, devices, emulators..."
                value={listingsState.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-12 h-12 text-base rounded-xl border-2 focus:border-blue-500 dark:focus:border-blue-400"
              />
              <Button
                variant={showFilters ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2"
              >
                {showFilters ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Filter className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Quick Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {quickFilters.map((filter, index) => (
                <Button
                  key={index}
                  variant={filter.isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={filter.action}
                  className="flex items-center gap-2 whitespace-nowrap flex-shrink-0"
                >
                  <filter.icon className="w-4 h-4" />
                  {filter.label}
                </Button>
              ))}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-red-600 hover:text-red-700 flex-shrink-0"
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {/* Advanced Filters Overlay - Bottom Sheet on Mobile */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed inset-x-0 bottom-0 z-50 lg:relative lg:mb-6"
              >
                <div className="bg-white dark:bg-gray-800 rounded-t-xl lg:rounded-xl p-4 shadow-lg border max-h-[80vh] overflow-y-auto">
                  {/* Handle for bottom sheet */}
                  <div className="lg:hidden flex justify-center mb-2">
                    <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Filters</h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setShowAdvancedFilters(!showAdvancedFilters)
                        }
                        className="flex items-center gap-1"
                      >
                        Advanced
                        {showAdvancedFilters ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Systems - Always visible with AsyncMultiSelect */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      Systems
                    </label>
                    <AsyncMultiSelect
                      label="Systems"
                      value={listingsState.systemIds}
                      onChange={handleSystemChange}
                      placeholder="Select systems..."
                      loadOptions={async (search) => {
                        const result = await fetchSystems({
                          search,
                          page: 1,
                          limit: 20,
                        })
                        return result.items
                      }}
                      emptyMessage="No systems found"
                    />
                  </div>

                  {/* Performance - Always visible */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      Performance
                    </label>
                    <AsyncMultiSelect
                      label="Performance"
                      value={listingsState.performanceIds.map(String)}
                      onChange={(values) =>
                        handlePerformanceChange(values.map(Number))
                      }
                      placeholder="Select performance levels..."
                      loadOptions={async (search) => {
                        const scales = performanceScalesQuery.data || []
                        const filtered = search
                          ? scales.filter(
                              (s) =>
                                s.label
                                  .toLowerCase()
                                  .includes(search.toLowerCase()) ||
                                (s.description &&
                                  s.description
                                    .toLowerCase()
                                    .includes(search.toLowerCase())),
                            )
                          : scales

                        return filtered.map((scale) => ({
                          id: scale.id.toString(),
                          name: `${scale.label} ${scale.description ? `- ${scale.description}` : ''}`,
                        }))
                      }}
                      emptyMessage="No performance levels found"
                    />
                  </div>

                  {/* Advanced Filters */}
                  <AnimatePresence>
                    {showAdvancedFilters && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                      >
                        {/* Devices - With AsyncMultiSelect */}
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Devices
                          </label>
                          <AsyncMultiSelect
                            label="Devices"
                            value={listingsState.deviceIds}
                            onChange={handleDeviceChange}
                            placeholder="Select devices..."
                            loadOptions={async (search) => {
                              const result = await fetchDevices({
                                search,
                                page: 1,
                                limit: 20,
                              })
                              return result.items
                            }}
                            maxSelected={3}
                            emptyMessage="No devices found"
                          />
                        </div>

                        {/* Emulators - With AsyncMultiSelect */}
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Emulators
                          </label>
                          <AsyncMultiSelect
                            label="Emulators"
                            value={listingsState.emulatorIds}
                            onChange={handleEmulatorChange}
                            placeholder="Select emulators..."
                            loadOptions={async (search) => {
                              const result = await fetchEmulators({
                                search,
                                page: 1,
                                limit: 20,
                              })
                              return result.items
                            }}
                            emptyMessage="No emulators found"
                          />
                        </div>

                        {/* SoCs - With AsyncMultiSelect */}
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            System on Chips (SoCs)
                          </label>
                          <AsyncMultiSelect
                            label="SoCs"
                            value={listingsState.socIds}
                            onChange={handleSocChange}
                            placeholder="Select SoCs..."
                            loadOptions={async (search) => {
                              const result = await fetchSocs({
                                search,
                                page: 1,
                                limit: 20,
                              })
                              return result.items
                            }}
                            maxSelected={3}
                            emptyMessage="No SoCs found"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex justify-between pt-4 border-t mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowFilters(false)}
                    >
                      Apply Filters
                    </Button>
                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        onClick={clearAllFilters}
                        className="text-red-600"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>
                </div>
                {/* Backdrop for mobile */}
                <div
                  className="fixed inset-0 bg-black/60 -z-10 lg:hidden"
                  onClick={() => setShowFilters(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading State - Skeleton Loader */}
          {listingsQuery.isLoading && currentPage === 1 && (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }
            >
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse',
                    viewMode === 'list' ? 'flex items-center p-4' : 'p-0',
                  )}
                >
                  {viewMode === 'grid' ? (
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                      </div>
                      <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                      <div className="space-y-2 mb-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="flex gap-4">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Listings Content */}
          {(!listingsQuery.isLoading || currentPage > 1) && (
            <>
              {allListings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Search className="w-16 h-16 mx-auto mb-4" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No listings found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {hasActiveFilters
                      ? 'Try adjusting your filters or search terms'
                      : 'Be the first to add a listing!'}
                  </p>
                  {hasActiveFilters ? (
                    <Button onClick={clearAllFilters} variant="outline">
                      Clear All Filters
                    </Button>
                  ) : (
                    <Button asChild>
                      <Link href="/listings/new">Add First Listing</Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="relative" style={{ minHeight: '500px' }}>
                  <div
                    className={cn(
                      'pb-12',
                      viewMode === 'grid'
                        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'
                        : '',
                    )}
                  >
                    <VirtualScroller
                      items={allListings}
                      renderItem={(listing) => (
                        <div
                          className={cn(
                            'py-3',
                            viewMode === 'grid' ? 'px-3' : 'px-0',
                          )}
                        >
                          <ListingCard
                            listing={listing}
                            viewMode={viewMode}
                            showSystemIcons={showSystemIcons}
                          />
                        </div>
                      )}
                      itemHeight={viewMode === 'grid' ? 450 : 120}
                      onEndReached={loadMoreListings}
                      endReachedThreshold={300}
                      getItemKey={(item) => item.id}
                    />
                  </div>

                  {/* Loading indicator for infinite scroll */}
                  {listingsQuery.isLoading && currentPage > 1 && (
                    <div className="flex justify-center py-4">
                      <LoadingSpinner size="md" />
                    </div>
                  )}

                  {/* End of results message */}
                  {!hasMoreItems && allListings.length > 0 && (
                    <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                      You&apos;ve reached the end of the listings
                    </div>
                  )}
                </div>
              )}
            </>
          )}
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
