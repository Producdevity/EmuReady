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
  ExternalLink,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Suspense, useState, useMemo, useCallback } from 'react'
import useListingsState from '@/app/listings/hooks/useListingsState'
import {
  type ListingsFilter,
  type SortDirection,
  type SortField,
} from '@/app/listings/types'
import EmulatorIcon from '@/components/icons/EmulatorIcon'
import SystemIcon from '@/components/icons/SystemIcon'
import {
  Button,
  Input,
  LoadingSpinner,
  PerformanceBadge,
  SuccessRateBar,
  Pagination,
  MultiSelect,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui'
import analytics from '@/lib/analytics'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { formatTimeAgo } from '@/utils/date'
import { ApprovalStatus } from '@orm'

type ViewMode = 'grid' | 'list'

function V2ListingsPage() {
  const router = useRouter()
  const listingsState = useListingsState()

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showSystemIcons, _setShowSystemIcons] = useState(false)

  // API Queries - Using correct endpoints from working page
  const systemsQuery = api.systems.get.useQuery()
  const devicesQuery = api.devices.get.useQuery({ limit: 10000 })
  const socsQuery = api.socs.get.useQuery({ limit: 10000 })
  const emulatorsQuery = api.emulators.get.useQuery({ limit: 10000 })
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
    page: listingsState.page,
    limit: 12, // Good for grid layout
    sortField: listingsState.sortField ?? undefined,
    sortDirection: listingsState.sortDirection ?? undefined,
  }

  const listingsQuery = api.listings.get.useQuery(filterParams)
  const listings = listingsQuery.data?.listings ?? []
  const pagination = listingsQuery.data?.pagination

  // Handlers - Properly updating state and URL
  const handleSystemChange = useCallback(
    (values: string[]) => {
      listingsState.setSystemIds(values)
      listingsState.setPage(1)
      listingsState.updateQuery({ systemIds: values, page: 1 })

      analytics.filter.system(values)
    },
    [listingsState],
  )

  const handleDeviceChange = useCallback(
    (values: string[]) => {
      listingsState.setDeviceIds(values)
      listingsState.setPage(1)
      listingsState.updateQuery({ deviceIds: values, page: 1 })

      analytics.filter.device(values)
    },
    [listingsState],
  )

  const handleSocChange = useCallback(
    (values: string[]) => {
      listingsState.setSocIds(values)
      listingsState.setPage(1)
      listingsState.updateQuery({ socIds: values, page: 1 })

      analytics.filter.soc(values)
    },
    [listingsState],
  )

  const handleEmulatorChange = useCallback(
    (values: string[]) => {
      listingsState.setEmulatorIds(values)
      listingsState.setPage(1)
      listingsState.updateQuery({ emulatorIds: values, page: 1 })

      analytics.filter.emulator(values)
    },
    [listingsState],
  )

  const handlePerformanceChange = useCallback(
    (values: number[]) => {
      listingsState.setPerformanceIds(values)
      listingsState.setPage(1)
      listingsState.updateQuery({ performanceIds: values, page: 1 })

      analytics.filter.performance(values)
    },
    [listingsState],
  )

  const handleSearchChange = useCallback(
    (value: string) => {
      listingsState.setSearch(value)
      listingsState.setPage(1)
      listingsState.updateQuery({ search: value, page: 1 })

      if (value.length > 2) {
        analytics.contentDiscovery.searchPerformed({
          query: value,
          resultCount: listings.length,
          category: 'v2_listings',
          page: 'v2/listings',
        })
      }
    },
    [listingsState, listings.length],
  )

  const handleSort = useCallback(
    (field: SortField, direction?: SortDirection) => {
      const newSortField = field
      const newSortDirection =
        direction || (listingsState.sortDirection === 'asc' ? 'desc' : 'asc')

      listingsState.setSortField(newSortField)
      listingsState.setSortDirection(newSortDirection)
      listingsState.setPage(1)
      listingsState.updateQuery({
        sortField: newSortField,
        sortDirection: newSortDirection,
        page: 1,
      })
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
    listingsState.setPage(1)
    listingsState.updateQuery({
      systemIds: [],
      deviceIds: [],
      socIds: [],
      emulatorIds: [],
      performanceIds: [],
      search: '',
      sortField: null,
      sortDirection: null,
      page: 1,
    })

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
        label: 'High Performance',
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
        label: 'Most Voted',
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
                {listingsQuery.isLoading
                  ? 'Loading...'
                  : `${listings.length} listings found`}
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

        {/* Advanced Filters Overlay */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Filters</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
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

                {/* Systems - Always visible */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Systems
                  </label>
                  <MultiSelect
                    label="Systems"
                    options={
                      systemsQuery.data?.map((system) => ({
                        id: system.id,
                        name: system.name,
                      })) ?? []
                    }
                    value={listingsState.systemIds}
                    onChange={handleSystemChange}
                    placeholder="Select systems..."
                  />
                </div>

                {/* Performance - Always visible */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Performance
                  </label>
                  <MultiSelect
                    label="Performance"
                    options={
                      performanceScalesQuery.data?.map((scale) => ({
                        id: scale.id.toString(),
                        name: `${scale.label} ${scale.description ? `- ${scale.description}` : ''}`,
                      })) ?? []
                    }
                    value={listingsState.performanceIds.map(String)}
                    onChange={(values) =>
                      handlePerformanceChange(values.map(Number))
                    }
                    placeholder="Select performance levels..."
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
                      {/* Devices */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Devices
                        </label>
                        <MultiSelect
                          label="Devices"
                          options={
                            devicesQuery.data?.devices.map((device) => ({
                              id: device.id,
                              name: `${device.brand.name} ${device.modelName}`,
                            })) ?? []
                          }
                          value={listingsState.deviceIds}
                          onChange={handleDeviceChange}
                          placeholder="Select devices..."
                          maxDisplayed={3}
                        />
                      </div>

                      {/* Emulators */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Emulators
                        </label>
                        <MultiSelect
                          label="Emulators"
                          options={
                            emulatorsQuery.data?.emulators.map((emulator) => ({
                              id: emulator.id,
                              name: emulator.name,
                            })) ?? []
                          }
                          value={listingsState.emulatorIds}
                          onChange={handleEmulatorChange}
                          placeholder="Select emulators..."
                        />
                      </div>

                      {/* SoCs */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          System on Chips (SoCs)
                        </label>
                        <MultiSelect
                          label="SoCs"
                          options={
                            socsQuery.data?.socs.map((soc) => ({
                              id: soc.id,
                              name: `${soc.name} (${soc.manufacturer})`,
                            })) ?? []
                          }
                          value={listingsState.socIds}
                          onChange={handleSocChange}
                          placeholder="Select SoCs..."
                          maxDisplayed={3}
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
                    Close
                  </Button>
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      onClick={clearAllFilters}
                      className="text-red-600"
                    >
                      Clear All Filters
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {listingsQuery.isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner text="Loading listings..." />
          </div>
        )}

        {/* Listings Content */}
        {!listingsQuery.isLoading && (
          <>
            {listings.length === 0 ? (
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
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
                }
              >
                {listings.map((listing) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group',
                      viewMode === 'list' ? 'flex items-center p-4' : 'p-0',
                    )}
                    onKeyUp={(ev) => {
                      if (ev.key === 'Enter' || ev.key === ' ') {
                        router.push(`/listings/${listing.id}`)
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`View listing for ${listing.game.title}`}
                    onClick={() => router.push(`/listings/${listing.id}`)}
                  >
                    {viewMode === 'grid' ? (
                      <div className="p-6">
                        {/* Card Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 min-w-0">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  {listing.game.title}
                                </h3>
                              </TooltipTrigger>
                              <TooltipContent>
                                {listing.game.title}
                              </TooltipContent>
                            </Tooltip>
                            <div className="flex items-center gap-2 mt-1">
                              {listing.game.system?.key ? (
                                <SystemIcon
                                  name={listing.game.system.name}
                                  systemKey={listing.game.system.key}
                                  size="sm"
                                />
                              ) : (
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {listing.game.system?.name}
                                </span>
                              )}
                              {listing.status === ApprovalStatus.PENDING && (
                                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(ev) => {
                              ev.stopPropagation()
                              router.push(`/games/${listing.game.id}`)
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Device & Emulator */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {listing.device
                                ? `${listing.device.brand.name} ${listing.device.modelName}`
                                : 'Unknown Device'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {listing.emulator && (
                              <EmulatorIcon
                                name={listing.emulator.name}
                                logo={listing.emulator.logo}
                                showLogo={true}
                                size="sm"
                              />
                            )}
                          </div>
                        </div>

                        {/* Performance & Success Rate */}
                        <div className="flex items-center justify-between mb-4">
                          <PerformanceBadge
                            rank={listing.performance?.rank ?? 8}
                            label={listing.performance?.label ?? 'N/A'}
                            description={listing.performance?.description}
                          />
                          <SuccessRateBar
                            rate={listing.successRate * 100}
                            voteCount={listing._count.votes}
                          />
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>{listing.author?.name ?? 'Anonymous'}</span>
                          <span>{formatTimeAgo(listing.createdAt)}</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* List View */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {listing.game.title}
                            </h3>
                            {listing.status === ApprovalStatus.PENDING && (
                              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span>
                              {showSystemIcons && listing.game.system?.key ? (
                                <SystemIcon
                                  name={listing.game.system.name}
                                  systemKey={listing.game.system.key}
                                  size="sm"
                                />
                              ) : (
                                listing.game.system?.name
                              )}
                            </span>
                            <span>
                              {listing.device
                                ? `${listing.device.brand.name} ${listing.device.modelName}`
                                : 'Unknown'}
                            </span>
                            {listing.emulator && (
                              <EmulatorIcon
                                name={listing.emulator.name}
                                logo={listing.emulator.logo}
                                showLogo={true}
                                size="sm"
                              />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <PerformanceBadge
                            rank={listing.performance?.rank ?? 8}
                            label={listing.performance?.label ?? 'N/A'}
                            description={listing.performance?.description}
                          />
                          <SuccessRateBar
                            rate={listing.successRate * 100}
                            voteCount={listing._count.votes}
                          />
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  currentPage={listingsState.page}
                  totalPages={pagination.pages}
                  onPageChange={(newPage) => {
                    listingsState.setPage(newPage)
                    listingsState.updateQuery({ page: newPage })
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function V2ListingsPageWithSuspense() {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" />}>
      <V2ListingsPage />
    </Suspense>
  )
}
