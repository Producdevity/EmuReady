'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { User, ArrowUp } from 'lucide-react'
import { Suspense, useState, useEffect, useMemo, useCallback } from 'react'
import useListingsState from '@/app/listings/hooks/useListingsState'
import { LoadingSpinner, PullToRefresh, Button } from '@/components/ui'
import analytics from '@/lib/analytics'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { filterNullAndEmpty } from '@/utils/filter'
import { ListingFilters } from './components/ListingFilters'
import { ListingsContent } from './components/ListingsContent'
import { ListingsHeader } from './components/ListingsHeader'
import { QuickFilters } from './components/QuickFilters'
import { SearchBar } from './components/SearchBar'
import type { SortDirection } from '@/types/api'
import type { RouterOutput, RouterInput } from '@/types/trpc'

type SortField = NonNullable<RouterInput['listings']['get']['sortField']>

type ListingType = RouterOutput['listings']['get']['listings'][number]

function V2ListingsPage() {
  const listingsState = useListingsState()

  // UI State - specific to v2
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [showSystemIcons, _setShowSystemIcons] = useState(false)
  const [showScrollToTop, setShowScrollToTop] = useState(false)

  // Infinite scrolling state
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMoreItems, setHasMoreItems] = useState(true)
  const [allListings, setAllListings] = useState<ListingType[]>([])
  const [myListingsOnly, setMyListingsOnly] = useState(false)

  const performanceScalesQuery = api.listings.performanceScales.useQuery()

  // User preferences and device filtering
  const userQuery = api.users.me.useQuery()
  const userPreferencesQuery = api.userPreferences.get.useQuery(undefined, {
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  const [userDeviceFilterDisabled, setUserDeviceFilterDisabled] =
    useState(false)
  const [userSocFilterDisabled, setUserSocFilterDisabled] = useState(false)

  // Get user's preferred device IDs if defaultToUserDevices is enabled
  const userDeviceIds = useMemo(
    () =>
      userPreferencesQuery.data?.defaultToUserDevices &&
      userPreferencesQuery.data.devicePreferences
        ? userPreferencesQuery.data.devicePreferences.map(
            (pref) => pref.deviceId,
          )
        : [],
    [userPreferencesQuery.data],
  )

  // Get user's preferred SoC IDs if defaultToUserSocs is enabled
  const userSocIds = useMemo(
    () =>
      userPreferencesQuery.data?.defaultToUserSocs &&
      userPreferencesQuery.data.socPreferences
        ? userPreferencesQuery.data.socPreferences.map((pref) => pref.socId)
        : [],
    [userPreferencesQuery.data],
  )

  // Apply user device filter if enabled and no manual device filter is set
  const shouldUseUserDeviceFilter =
    userPreferencesQuery.data?.defaultToUserDevices &&
    listingsState.deviceIds.length === 0 &&
    userDeviceIds.length > 0 &&
    !userDeviceFilterDisabled

  // Apply user SoC filter if enabled and no manual SoC filter is set
  const shouldUseUserSocFilter =
    userPreferencesQuery.data?.defaultToUserSocs &&
    listingsState.socIds.length === 0 &&
    userSocIds.length > 0 &&
    !userSocFilterDisabled

  // Filter params for API call
  const filterParams: RouterInput['listings']['get'] = useMemo(
    () => ({
      page: currentPage,
      limit: 15, // Increased for better mobile experience
      ...filterNullAndEmpty({
        systemIds:
          listingsState.systemIds.length > 0
            ? listingsState.systemIds
            : undefined,
        deviceIds:
          listingsState.deviceIds.length > 0
            ? listingsState.deviceIds
            : shouldUseUserDeviceFilter
              ? userDeviceIds
              : undefined,
        socIds:
          listingsState.socIds.length > 0
            ? listingsState.socIds
            : shouldUseUserSocFilter
              ? userSocIds
              : undefined,
        emulatorIds:
          listingsState.emulatorIds.length > 0
            ? listingsState.emulatorIds
            : undefined,
        performanceIds:
          listingsState.performanceIds.length > 0
            ? listingsState.performanceIds
            : undefined,
        searchTerm: listingsState.search || undefined,
        myListingsOnly: myListingsOnly && userQuery.data?.id ? true : undefined,
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
      myListingsOnly,
      shouldUseUserDeviceFilter,
      shouldUseUserSocFilter,
      userDeviceIds,
      userSocIds,
      currentPage,
      userQuery.data?.id,
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
      !listingsQuery.isPending &&
      listingsQuery.data
    ) {
      analytics.contentDiscovery.searchPerformed({
        query: listingsState.search,
        resultCount: listingsQuery.data.listings.length,
        category: 'v2_listings',
        page: 'v2/listings',
      })
    }
  }, [listingsQuery.data, listingsQuery.isPending, listingsState.search])

  // Scroll to top functionality
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 400)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (navigator.vibrate) {
      navigator.vibrate(25)
    }
  }

  const toggleMyListings = () => {
    setMyListingsOnly(!myListingsOnly)
    setCurrentPage(1)
    setAllListings([])

    if (navigator.vibrate) {
      navigator.vibrate(50)
    }

    analytics.filter.myListings(!myListingsOnly)
  }

  const loadMoreListings = useCallback(() => {
    if (hasMoreItems && !listingsQuery.isPending && !listingsQuery.isFetching) {
      setCurrentPage((prev) => prev + 1)
    }
  }, [hasMoreItems, listingsQuery.isPending, listingsQuery.isFetching])

  const handleRefresh = useCallback(async () => {
    if (listingsQuery.isPending || listingsQuery.isFetching) return

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

  // Enhanced filter handlers
  const handleDeviceChange = useCallback(
    (values: string[]) => {
      listingsState.setDeviceIds(values)
      setCurrentPage(1)
      setAllListings([])

      // When user manually selects devices, disable user preference filtering
      if (values.length > 0) {
        setUserDeviceFilterDisabled(true)
        setUserSocFilterDisabled(true)
      }
      // When clearing device selections, ensure user preferences are disabled
      if (values.length === 0) {
        setUserDeviceFilterDisabled(true)
      }

      analytics.filter.device(values)
    },
    [listingsState],
  )

  const handleSocChange = useCallback(
    (values: string[]) => {
      listingsState.setSocIds(values)
      setCurrentPage(1)
      setAllListings([])

      // When user manually selects SoCs, disable user preference filtering
      if (values.length > 0) {
        setUserSocFilterDisabled(true)
        setUserDeviceFilterDisabled(true)
      }
      // When clearing SOC selections, ensure user preferences are disabled
      if (values.length === 0) {
        setUserSocFilterDisabled(true)
      }

      analytics.filter.soc(values)
    },
    [listingsState],
  )

  const handleSystemChange = useCallback(
    (values: string[]) => {
      listingsState.setSystemIds(values)
      setCurrentPage(1)
      setAllListings([])
      analytics.filter.system(values)
    },
    [listingsState],
  )

  const handleEmulatorChange = useCallback(
    (values: string[]) => {
      listingsState.setEmulatorIds(values)
      setCurrentPage(1)
      setAllListings([])
      analytics.filter.emulator(values)
    },
    [listingsState],
  )

  const handlePerformanceChange = useCallback(
    (values: number[]) => {
      listingsState.setPerformanceIds(values)
      setCurrentPage(1)
      setAllListings([])
      analytics.filter.performance(values)
    },
    [listingsState],
  )

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
    setMyListingsOnly(false)
    setCurrentPage(1)
    setAllListings([])
    setUserDeviceFilterDisabled(false)
    setUserSocFilterDisabled(false)
    analytics.filter.clearAll()
  }, [listingsState])

  // Check if any filters are active
  const hasActiveFilters =
    listingsState.systemIds.length > 0 ||
    listingsState.deviceIds.length > 0 ||
    listingsState.socIds.length > 0 ||
    listingsState.emulatorIds.length > 0 ||
    listingsState.performanceIds.length > 0 ||
    listingsState.search.length > 0 ||
    myListingsOnly

  // Properly typed handleSort function
  const handleSort = (field: SortField, direction?: SortDirection) => {
    listingsState.setSortField(field)
    listingsState.setSortDirection(direction || null)
  }

  // Preload filter data with 500 item limits
  const systemsQuery = api.systems.get.useQuery()
  const devicesQuery = api.devices.get.useQuery({ limit: 500, offset: 0 })
  const emulatorsQuery = api.emulators.get.useQuery({ limit: 500, offset: 0 })
  const socsQuery = api.socs.get.useQuery({ limit: 500, offset: 0 })

  // Transform preloaded data into options format
  const systemOptions = useMemo(
    () =>
      systemsQuery.data?.map((system) => ({
        id: system.id,
        name: system.name,
      })),
    [systemsQuery.data],
  )

  const deviceOptions = useMemo(
    () =>
      devicesQuery.data?.devices.map((device) => ({
        id: device.id,
        name: `${device.brand.name} ${device.modelName}`,
      })),
    [devicesQuery.data],
  )

  const emulatorOptions = useMemo(
    () =>
      emulatorsQuery.data?.emulators.map((emulator) => ({
        id: emulator.id,
        name: emulator.name,
      })),
    [emulatorsQuery.data],
  )

  const socOptions = useMemo(
    () =>
      socsQuery.data?.socs.map((soc) => ({
        id: soc.id,
        name: `${soc.name} (${soc.manufacturer})`,
      })),
    [socsQuery.data],
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
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          {/* Header */}
          <div className="mb-6">
            <ListingsHeader
              viewMode={viewMode}
              setViewMode={setViewMode}
              listingsCount={allListings.length}
              isLoading={listingsQuery.isPending && currentPage === 1}
            />

            {/* Search Bar */}
            <SearchBar
              search={listingsState.search}
              onSearchChange={(value) => listingsState.setSearch(value)}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters(!showFilters)}
              activeFilterCount={
                hasActiveFilters
                  ? Object.values({
                      systems: listingsState.systemIds.length,
                      devices: listingsState.deviceIds.length,
                      socs: listingsState.socIds.length,
                      emulators: listingsState.emulatorIds.length,
                      performance: listingsState.performanceIds.length,
                      search: listingsState.search ? 1 : 0,
                      myListings: myListingsOnly ? 1 : 0,
                    }).reduce((sum, count) => sum + count, 0)
                  : 0
              }
            />

            {/* Quick Filter Chips */}
            <QuickFilters
              performanceScales={performanceScalesQuery.data}
              performanceIds={listingsState.performanceIds}
              handlePerformanceChange={handlePerformanceChange}
              sortField={listingsState.sortField}
              sortDirection={listingsState.sortDirection}
              handleSort={handleSort}
              hasActiveFilters={hasActiveFilters}
              clearAllFilters={clearAllFilters}
              myListingsOnly={myListingsOnly}
              toggleMyListings={toggleMyListings}
              userQuery={userQuery}
            />
          </div>

          {/* Advanced Filters Overlay - Bottom Sheet on Mobile */}
          <ListingFilters
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            hasActiveFilters={hasActiveFilters}
            clearAllFilters={clearAllFilters}
            systemIds={listingsState.systemIds}
            handleSystemChange={handleSystemChange}
            systemOptions={systemOptions}
            performanceIds={listingsState.performanceIds.map(String)}
            handlePerformanceChange={(values) =>
              handlePerformanceChange(values.map(Number))
            }
            performanceScales={performanceScalesQuery.data}
            deviceIds={listingsState.deviceIds}
            handleDeviceChange={handleDeviceChange}
            deviceOptions={deviceOptions}
            emulatorIds={listingsState.emulatorIds}
            handleEmulatorChange={handleEmulatorChange}
            emulatorOptions={emulatorOptions}
            socIds={listingsState.socIds}
            handleSocChange={handleSocChange}
            socOptions={socOptions}
          />

          {/* Listings Content */}
          <ListingsContent
            allListings={allListings}
            viewMode={viewMode}
            showSystemIcons={showSystemIcons}
            isLoading={listingsQuery.isPending}
            isFetching={listingsQuery.isFetching}
            hasMoreItems={hasMoreItems}
            currentPage={currentPage}
            loadMoreListings={loadMoreListings}
            hasActiveFilters={hasActiveFilters}
            clearAllFilters={clearAllFilters}
          />
        </div>

        {/* Floating Action Buttons */}
        <div className="fixed bottom-6 right-4 flex flex-col gap-3 z-30">
          {/* My Listings Toggle */}
          {userQuery.data && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                onClick={toggleMyListings}
                size="sm"
                className={cn(
                  'h-12 w-12 rounded-full shadow-lg transition-all duration-200',
                  'border-2 backdrop-blur-sm',
                  myListingsOnly
                    ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500 shadow-blue-500/25'
                    : 'bg-white/90 hover:bg-white text-gray-700 border-gray-200 hover:border-gray-300 dark:bg-gray-800/90 dark:hover:bg-gray-800 dark:text-gray-300 dark:border-gray-600',
                )}
                title={
                  myListingsOnly ? 'Show all listings' : 'Show my listings only'
                }
              >
                <User className="w-5 h-5" />
              </Button>
            </motion.div>
          )}

          {/* Scroll to Top */}
          <AnimatePresence>
            {showScrollToTop && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  onClick={scrollToTop}
                  size="sm"
                  className="h-12 w-12 rounded-full bg-gray-900/90 hover:bg-gray-900 text-white shadow-lg backdrop-blur-sm border-2 border-gray-700 hover:border-gray-600"
                  title="Scroll to top"
                >
                  <ArrowUp className="w-5 h-5" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
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
