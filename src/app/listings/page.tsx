'use client'

import { Clock, GamepadIcon, CpuIcon, X, FunnelIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Suspense, useState } from 'react'
import NoListingsFound from '@/app/listings/components/NoListingsFound'
import { EmulatorIcon, SystemIcon } from '@/components/icons'
import {
  PerformanceBadge,
  Pagination,
  SuccessRateBar,
  LoadingSpinner,
  SortableHeader,
  Button,
  ColumnVisibilityControl,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  DisplayToggleButton,
  VerifiedDeveloperBadge,
} from '@/components/ui'
import { EditButton, ViewButton } from '@/components/ui/table-buttons'
import storageKeys from '@/data/storageKeys'
import useColumnVisibility, {
  type ColumnDefinition,
} from '@/hooks/useColumnVisibility'
import useEmulatorLogos from '@/hooks/useEmulatorLogos'
import useLocalStorage from '@/hooks/useLocalStorage'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { formatTimeAgo } from '@/utils/date'
import { filterNullAndEmpty } from '@/utils/filter'
import { hasPermission } from '@/utils/permissions'
import { Role, ApprovalStatus } from '@orm'
import ListingFilters from './components/ListingFilters'
import useListingsState from './hooks/useListingsState'
import { type ListingsFilter } from './types'

const LISTINGS_COLUMNS: ColumnDefinition[] = [
  { key: 'game', label: 'Game', defaultVisible: true },
  { key: 'system', label: 'System', defaultVisible: true },
  { key: 'device', label: 'Device', defaultVisible: true },
  { key: 'emulator', label: 'Emulator', defaultVisible: true },
  { key: 'performance', label: 'Performance', defaultVisible: true },
  { key: 'successRate', label: 'Success Rate', defaultVisible: true },
  { key: 'author', label: 'Author', defaultVisible: false },
  { key: 'posted', label: 'Posted', defaultVisible: false },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

function ListingsPage() {
  const router = useRouter()
  const listingsState = useListingsState()

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [showSystemIcons, setShowSystemIcons, isSystemIconsHydrated] =
    useLocalStorage(storageKeys.showSystemIcons, true)

  const [userDeviceFilterDisabled, setUserDeviceFilterDisabled] =
    useState(false)
  const [userSocFilterDisabled, setUserSocFilterDisabled] = useState(false)

  const {
    showEmulatorLogos,
    toggleEmulatorLogos,
    isHydrated: isEmulatorLogosHydrated,
  } = useEmulatorLogos()

  const columnVisibility = useColumnVisibility(LISTINGS_COLUMNS, {
    storageKey: storageKeys.columnVisibility.listings,
  })

  const userQuery = api.users.me.useQuery()
  const userPreferencesQuery = api.userPreferences.get.useQuery(undefined, {
    staleTime: 30 * 1000, // Cache for 30 seconds to reduce excessive refetching
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  })

  const userRole = userQuery?.data?.role as Role | undefined
  const isAdmin = userRole ? hasPermission(userRole, Role.ADMIN) : false

  // Get user's preferred device IDs if defaultToUserDevices is enabled
  const userDeviceIds = userPreferencesQuery.data?.defaultToUserDevices
    ? userPreferencesQuery.data.devicePreferences.map((pref) => pref.deviceId)
    : []

  // Get user's preferred SoC IDs if defaultToUserSocs is enabled
  const userSocIds = userPreferencesQuery.data?.defaultToUserSocs
    ? userPreferencesQuery.data.socPreferences.map((pref) => pref.socId)
    : []

  // Apply user device filter if enabled and no manual device filter is set and not explicitly disabled
  const shouldUseUserDeviceFilter =
    userPreferencesQuery.data?.defaultToUserDevices &&
    listingsState.deviceIds.length === 0 &&
    userDeviceIds.length > 0 &&
    !userDeviceFilterDisabled

  // Apply user SoC filter if enabled and no manual SoC filter is set and not explicitly disabled
  const shouldUseUserSocFilter =
    userPreferencesQuery.data?.defaultToUserSocs &&
    listingsState.socIds.length === 0 &&
    userSocIds.length > 0 &&
    !userSocFilterDisabled

  // Debug logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log('User preferences loaded:', {
      defaultToUserDevices: userPreferencesQuery.data?.defaultToUserDevices,
      defaultToUserSocs: userPreferencesQuery.data?.defaultToUserSocs,
      userDeviceIds,
      userSocIds,
      shouldUseUserDeviceFilter,
      shouldUseUserSocFilter,
      userDeviceFilterDisabled,
      userSocFilterDisabled,
      currentDeviceFilter: listingsState.deviceIds,
      currentSocFilter: listingsState.socIds,
    })
  }

  const systemsQuery = api.systems.get.useQuery()
  const devicesQuery = api.devices.get.useQuery({ limit: 10000 })
  const socsQuery = api.socs.get.useQuery({ limit: 10000 })
  const emulatorsQuery = api.emulators.get.useQuery({ limit: 10000 })
  const performanceScalesQuery = api.listings.performanceScales.useQuery()

  const filterParams: ListingsFilter = {
    page: listingsState.page,
    limit: 10,
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
      sortField: listingsState.sortField ?? undefined,
      sortDirection: listingsState.sortDirection ?? undefined,
      myListings: listingsState.myListings || undefined,
    }),
  }

  const listingsQuery = api.listings.get.useQuery(filterParams)

  const handleSystemChange = (values: string[]) => {
    listingsState.setSystemIds(values)
  }

  const handleDeviceChange = (values: string[]) => {
    listingsState.setDeviceIds(values)
    // When user manually selects devices, disable user preference filtering
    if (values.length > 0) {
      setUserDeviceFilterDisabled(true)
      // Also disable SoC preferences when manually selecting devices
      setUserSocFilterDisabled(true)
    }
    // When clearing device selections (Show all devices), ensure user preferences are disabled
    // so we show ALL devices, not filtered by user preferences
    if (values.length === 0) {
      setUserDeviceFilterDisabled(true)
    }
  }

  const handleSocChange = (values: string[]) => {
    listingsState.setSocIds(values)
    // When user manually selects SoCs, disable user preference filtering
    if (values.length > 0) {
      setUserSocFilterDisabled(true)
      // Also disable device preferences when manually selecting SoCs
      setUserDeviceFilterDisabled(true)
    }
    // When clearing SOC selections (Show all SOCs), ensure user preferences are disabled
    // so we show ALL listings, not filtered by user preferences
    if (values.length === 0) {
      setUserSocFilterDisabled(true)
    }
  }

  const handleEmulatorChange = (values: string[]) => {
    listingsState.setEmulatorIds(values)
  }

  const handlePerformanceChange = (values: number[]) => {
    listingsState.setPerformanceIds(values)
  }

  const handleSearchChange = (value: string) => {
    listingsState.setSearch(value)
  }

  const handleEnableUserDeviceFilter = () => {
    setUserDeviceFilterDisabled(false)
    // Clear any manual device selections to allow user preferences to take effect
    listingsState.setDeviceIds([])
  }

  const handleEnableUserSocFilter = () => {
    setUserSocFilterDisabled(false)
    // Clear any manual SoC selections to allow user preferences to take effect
    listingsState.setSocIds([])
  }

  if (listingsQuery?.error) {
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load listings.
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="lg:flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <ListingFilters
            systemIds={listingsState.systemIds}
            deviceIds={listingsState.deviceIds}
            socIds={listingsState.socIds}
            emulatorIds={listingsState.emulatorIds}
            performanceIds={listingsState.performanceIds}
            searchTerm={listingsState.search}
            systems={systemsQuery.data ?? []}
            devices={devicesQuery.data?.devices ?? []}
            socs={socsQuery.data?.socs ?? []}
            emulators={emulatorsQuery.data?.emulators ?? []}
            performanceScales={performanceScalesQuery.data ?? []}
            onSystemChange={handleSystemChange}
            onDeviceChange={handleDeviceChange}
            onSocChange={handleSocChange}
            onEmulatorChange={handleEmulatorChange}
            onPerformanceChange={handlePerformanceChange}
            onSearchChange={handleSearchChange}
            isCollapsed={isMobileSidebarOpen}
            onToggleCollapse={() =>
              setIsMobileSidebarOpen((prevState) => !prevState)
            }
            userPreferences={userPreferencesQuery.data}
            shouldUseUserDeviceFilter={shouldUseUserDeviceFilter}
            userDeviceIds={userDeviceIds}
            shouldUseUserSocFilter={shouldUseUserSocFilter}
            userSocIds={userSocIds}
            onEnableUserDeviceFilter={handleEnableUserDeviceFilter}
            onEnableUserSocFilter={handleEnableUserSocFilter}
            userDeviceFilterDisabled={userDeviceFilterDisabled}
            userSocFilterDisabled={userSocFilterDisabled}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
              onClick={() => setIsMobileSidebarOpen(false)}
            />

            {/* Sidebar Content - Full width on mobile */}
            <div className="relative w-full flex">
              <div className="w-full bg-white dark:bg-gray-900 shadow-xl transform animate-slide-up">
                {/* Close button header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <FunnelIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Filters
                  </h2>
                  <button
                    type="button"
                    aria-label="Close filters sidebar"
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="h-full overflow-y-auto">
                  <ListingFilters
                    systemIds={listingsState.systemIds}
                    deviceIds={listingsState.deviceIds}
                    socIds={listingsState.socIds}
                    emulatorIds={listingsState.emulatorIds}
                    performanceIds={listingsState.performanceIds}
                    searchTerm={listingsState.search}
                    systems={systemsQuery.data ?? []}
                    devices={devicesQuery.data?.devices ?? []}
                    socs={socsQuery.data?.socs ?? []}
                    emulators={emulatorsQuery.data?.emulators ?? []}
                    performanceScales={performanceScalesQuery.data ?? []}
                    onSystemChange={handleSystemChange}
                    onDeviceChange={handleDeviceChange}
                    onSocChange={handleSocChange}
                    onEmulatorChange={handleEmulatorChange}
                    onPerformanceChange={handlePerformanceChange}
                    onSearchChange={handleSearchChange}
                    isCollapsed={false}
                    onToggleCollapse={() =>
                      setIsMobileSidebarOpen(!isMobileSidebarOpen)
                    }
                    userPreferences={userPreferencesQuery.data}
                    shouldUseUserDeviceFilter={shouldUseUserDeviceFilter}
                    userDeviceIds={userDeviceIds}
                    shouldUseUserSocFilter={shouldUseUserSocFilter}
                    userSocIds={userSocIds}
                    onEnableUserDeviceFilter={handleEnableUserDeviceFilter}
                    onEnableUserSocFilter={handleEnableUserSocFilter}
                    userDeviceFilterDisabled={userDeviceFilterDisabled}
                    userSocFilterDisabled={userSocFilterDisabled}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content - Listings */}
        <section className="flex-1 overflow-x-auto py-4 px-2 md:px-4 lg:py-6 lg:pl-8">
          {/* Desktop Header */}
          <div className="hidden lg:flex lg:justify-between lg:items-center mb-6 lg:mb-8">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Game Listings
            </h1>

            <div className="flex items-center gap-3">
              {userQuery.data && (
                <Button
                  variant={listingsState.myListings ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => {
                    listingsState.setMyListings(!listingsState.myListings)
                  }}
                >
                  {listingsState.myListings ? 'All Listings' : 'My Listings'}
                </Button>
              )}
              <Button asChild variant="fancy">
                <Link href="/listings/new">Add Listing</Link>
              </Button>
              <div className="flex items-center gap-2">
                <DisplayToggleButton
                  showLogos={showSystemIcons}
                  onToggle={() => setShowSystemIcons(!showSystemIcons)}
                  isHydrated={isSystemIconsHydrated}
                  logoLabel="System Icons"
                  nameLabel="System Names"
                />
                <DisplayToggleButton
                  showLogos={showEmulatorLogos}
                  onToggle={toggleEmulatorLogos}
                  isHydrated={isEmulatorLogosHydrated}
                  logoLabel="Emulator Logos"
                  nameLabel="Emulator Names"
                />
              </div>
              <ColumnVisibilityControl
                columns={LISTINGS_COLUMNS}
                columnVisibility={columnVisibility}
              />
            </div>
          </div>

          {/* Mobile Header - Compact */}
          <div className="flex lg:hidden items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Game Listings
            </h1>

            {/* Mobile Action Menu */}
            <div className="flex items-center gap-2">
              {userQuery.data && (
                <Button
                  variant={listingsState.myListings ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    listingsState.setMyListings(!listingsState.myListings)
                  }}
                  className="px-3 py-1.5 text-xs"
                >
                  {listingsState.myListings ? 'All' : 'My'} Listings
                </Button>
              )}
              <Button
                asChild
                variant="fancy"
                size="sm"
                className="px-3 py-1.5 text-xs"
              >
                <Link href="/listings/new">Add</Link>
              </Button>

              {/* Compact View Options */}
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setShowSystemIcons(!showSystemIcons)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                  aria-pressed={showSystemIcons}
                  aria-label={
                    showSystemIcons ? 'Show System Names' : 'Show System Icons'
                  }
                  title={
                    showSystemIcons ? 'Show System Names' : 'Show System Icons'
                  }
                >
                  <CpuIcon
                    className={cn(
                      'w-4 h-4',
                      showSystemIcons ? 'text-blue-600 dark:text-blue-400' : '',
                    )}
                  />
                </button>
                <button
                  type="button"
                  onClick={toggleEmulatorLogos}
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                  title={
                    showEmulatorLogos
                      ? 'Show Emulator Names'
                      : 'Show Emulator Logos'
                  }
                >
                  <GamepadIcon
                    className={cn(
                      'w-4 h-4',
                      showEmulatorLogos
                        ? 'text-blue-600 dark:text-blue-400'
                        : '',
                    )}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl shadow-xl bg-white/90 dark:bg-gray-900/90">
            {listingsQuery.isLoading ? (
              <LoadingSpinner text="Loading listings..." />
            ) : (
              <table className="table-auto lg:table-fixed min-w-full divide-y divide-gray-200 dark:divide-gray-800 rounded-2xl">
                <thead className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
                  <tr>
                    {columnVisibility.isColumnVisible('game') && (
                      <SortableHeader
                        label="Game"
                        field="game.title"
                        currentSortField={listingsState.sortField}
                        currentSortDirection={listingsState.sortDirection}
                        onSort={listingsState.handleSort}
                      />
                    )}
                    {columnVisibility.isColumnVisible('system') && (
                      <SortableHeader
                        label="System"
                        field="game.system.name"
                        currentSortField={listingsState.sortField}
                        currentSortDirection={listingsState.sortDirection}
                        onSort={listingsState.handleSort}
                      />
                    )}
                    {columnVisibility.isColumnVisible('device') && (
                      <SortableHeader
                        label="Device"
                        field="device"
                        currentSortField={listingsState.sortField}
                        currentSortDirection={listingsState.sortDirection}
                        onSort={listingsState.handleSort}
                      />
                    )}
                    {columnVisibility.isColumnVisible('emulator') && (
                      <SortableHeader
                        label="Emulator"
                        field="emulator.name"
                        currentSortField={listingsState.sortField}
                        currentSortDirection={listingsState.sortDirection}
                        onSort={listingsState.handleSort}
                      />
                    )}
                    {columnVisibility.isColumnVisible('performance') && (
                      <SortableHeader
                        label="Performance"
                        field="performance.rank"
                        currentSortField={listingsState.sortField}
                        currentSortDirection={listingsState.sortDirection}
                        onSort={listingsState.handleSort}
                      />
                    )}
                    {columnVisibility.isColumnVisible('successRate') && (
                      <SortableHeader
                        label="Verified"
                        field="successRate"
                        currentSortField={listingsState.sortField}
                        currentSortDirection={listingsState.sortDirection}
                        onSort={listingsState.handleSort}
                      />
                    )}
                    {columnVisibility.isColumnVisible('author') && (
                      <SortableHeader
                        label="Author"
                        field="author.name"
                        currentSortField={listingsState.sortField}
                        currentSortDirection={listingsState.sortDirection}
                        onSort={listingsState.handleSort}
                      />
                    )}
                    {columnVisibility.isColumnVisible('posted') && (
                      <SortableHeader
                        label="Posted"
                        field="createdAt"
                        currentSortField={listingsState.sortField}
                        currentSortDirection={listingsState.sortDirection}
                        onSort={listingsState.handleSort}
                      />
                    )}
                    {columnVisibility.isColumnVisible('actions') && (
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {listingsQuery.data?.listings.map((listing) => (
                    <tr
                      key={listing.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      onClick={() => router.push(`/listings/${listing.id}`)}
                    >
                      {columnVisibility.isColumnVisible('game') && (
                        <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">
                          <div className="flex items-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link
                                  // TODO: A/B test what users expect when they click a game name
                                  // href={`/games/${listing.game.id}`}
                                  href={`/listings/${listing.id}`}
                                  className="hover:text-blue-600 dark:hover:text-blue-400"
                                >
                                  {listing.game.title.substring(0, 30)}
                                  {listing.game.title.length > 30 && '...'}
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                {listing.game.title}
                              </TooltipContent>
                            </Tooltip>

                            {listing.status === ApprovalStatus.PENDING && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                </TooltipTrigger>
                                <TooltipContent>Under Review</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('system') && (
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                          {isSystemIconsHydrated &&
                          showSystemIcons &&
                          listing.game.system?.key ? (
                            <div className="flex items-center gap-2">
                              <SystemIcon
                                name={listing.game.system.name}
                                systemKey={listing.game.system.key}
                                size="md"
                              />
                              <span className="sr-only">
                                {listing.game.system?.name}
                              </span>
                            </div>
                          ) : (
                            (listing.game.system?.name ?? 'Unknown')
                          )}
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('device') && (
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                          {listing.device
                            ? `${listing.device.brand.name} ${listing.device.modelName}`
                            : 'N/A'}
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('emulator') && (
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                          <div className="flex items-center gap-2">
                            {listing.emulator ? (
                              <EmulatorIcon
                                name={listing.emulator.name}
                                logo={listing.emulator.logo}
                                showLogo={
                                  isEmulatorLogosHydrated && showEmulatorLogos
                                }
                                size="sm"
                              />
                            ) : (
                              'N/A'
                            )}
                            {listing.isVerifiedDeveloper && (
                              <VerifiedDeveloperBadge size="sm" />
                            )}
                          </div>
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('performance') && (
                        <td className="px-4 py-2">
                          <PerformanceBadge
                            rank={listing.performance?.rank ?? 8}
                            label={listing.performance?.label ?? 'N/A'}
                            description={listing.performance?.description}
                          />
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('successRate') && (
                        <td className="px-4 py-2">
                          <SuccessRateBar
                            rate={listing.successRate * 100}
                            voteCount={listing._count.votes}
                          />
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('author') && (
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                          {listing.author?.name ?? 'Anonymous'}
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('posted') && (
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                          {formatTimeAgo(listing.createdAt)}
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('actions') && (
                        <td
                          className="px-6 py-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-2">
                            {isAdmin && (
                              <EditButton
                                href={`/admin/listings/${listing.id}/edit`}
                                title="Edit Listing"
                              />
                            )}
                            <ViewButton
                              href={`/listings/${listing.id}`}
                              title="View Listing Details"
                            />
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {!listingsQuery.isLoading &&
              listingsQuery.data?.listings.length === 0 && <NoListingsFound />}
          </div>

          {listingsQuery.data?.pagination &&
            listingsQuery.data?.pagination?.pages > 1 && (
              <Pagination
                currentPage={listingsState.page}
                totalPages={listingsQuery.data.pagination.pages}
                totalItems={listingsQuery.data.pagination.total}
                itemsPerPage={listingsQuery.data.pagination.limit}
                onPageChange={(newPage) => {
                  listingsState.setPage(newPage)
                }}
              />
            )}
        </section>
      </div>

      {/* Floating Action Button for Filters - Mobile Only */}
      <div className="lg:hidden fixed bottom-14 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="group relative bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-4 rounded-full shadow-2xl hover:shadow-blue-500/25 transform hover:scale-110 transition-all duration-300 ease-out"
          aria-label="Open Filters"
        >
          {/* Active filter count badge */}
          {(listingsState.systemIds.length > 0 ||
            listingsState.deviceIds.length > 0 ||
            listingsState.socIds.length > 0 ||
            listingsState.emulatorIds.length > 0 ||
            listingsState.performanceIds.length > 0 ||
            listingsState.search) && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg">
              {[
                listingsState.systemIds.length,
                listingsState.deviceIds.length,
                listingsState.socIds.length,
                listingsState.emulatorIds.length,
                listingsState.performanceIds.length,
                listingsState.search ? 1 : 0,
              ].reduce((sum, count) => sum + count, 0)}
            </div>
          )}

          <FunnelIcon className="w-6 h-6" />

          {/* Ripple effect */}
          <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 group-hover:animate-ping" />
        </button>
      </div>
    </main>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" />}>
      <ListingsPage />
    </Suspense>
  )
}
