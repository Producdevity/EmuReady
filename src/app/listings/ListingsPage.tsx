'use client'

import { Clock, GamepadIcon, CpuIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Suspense, useState, useCallback } from 'react'
import NoListingsFound from '@/app/listings/components/NoListingsFound'
import { MobileFilterSheet, MobileFiltersFab } from '@/app/listings/shared/components'
import { EmulatorIcon, SystemIcon } from '@/components/icons'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ColumnVisibilityControl } from '@/components/ui/ColumnVisibilityControl'
import { DisplayToggleButton } from '@/components/ui/DisplayToggleButton'
import { ListingVerificationBadge } from '@/components/ui/ListingVerificationBadge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { LocalizedDate } from '@/components/ui/LocalizedDate'
import { MobileColumnVisibilityControl } from '@/components/ui/MobileColumnVisibilityControl'
import { Pagination } from '@/components/ui/Pagination'
import { PerformanceBadge } from '@/components/ui/PerformanceBadge'
import { SortableHeader } from '@/components/ui/SortableHeader'
import { SuccessRateBar } from '@/components/ui/SuccessRateBar'
import { EditButton, ViewButton } from '@/components/ui/table-buttons'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/Tooltip'
import { VerifiedDeveloperBadge } from '@/components/ui/VerifiedDeveloperBadge'
import storageKeys from '@/data/storageKeys'
import {
  useEmulatorLogos,
  useLocalStorage,
  useColumnVisibility,
  type ColumnDefinition,
} from '@/hooks'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { type RouterInput } from '@/types/trpc'
import { filterNullAndEmpty } from '@/utils/filter'
import { roleIncludesRole } from '@/utils/permission-system'
import { hasRolePermission } from '@/utils/permissions'
import { ms } from '@/utils/time'
import { Role, ApprovalStatus } from '@orm'
import ListingsFiltersContent from './components/ListingsFiltersContent'
import ListingsFiltersSidebar from './components/ListingsFiltersSidebar'
import useListingsState from './hooks/useListingsState'
import { usePreferredHardwareFilters } from './shared/hooks/usePreferredHardwareFilters'

const LISTINGS_COLUMNS: ColumnDefinition[] = [
  { key: 'game', label: 'Game', defaultVisible: true },
  { key: 'system', label: 'System', defaultVisible: true },
  { key: 'device', label: 'Device', defaultVisible: true },
  { key: 'emulator', label: 'Emulator', defaultVisible: true },
  { key: 'performance', label: 'Performance', defaultVisible: true },
  { key: 'successRate', label: 'Verified', defaultVisible: true },
  { key: 'author', label: 'Author', defaultVisible: false },
  { key: 'posted', label: 'Posted', defaultVisible: false },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

function ListingsPage() {
  const router = useRouter()
  const listingsState = useListingsState()

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [showSystemIcons, setShowSystemIcons, isSystemIconsHydrated] = useLocalStorage(
    storageKeys.showSystemIcons,
    true,
  )

  // Preferred hardware filters (devices/SoCs)

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
    staleTime: ms.seconds(30),
    gcTime: ms.minutes(5),
  })

  const userRole = userQuery?.data?.role
  const isAdmin = userRole ? hasRolePermission(userRole, Role.ADMIN) : false
  const isModerator = userRole ? roleIncludesRole(userRole, Role.MODERATOR) : false

  const preferred = usePreferredHardwareFilters({
    userPreferences: userPreferencesQuery.data,
    deviceIds: listingsState.deviceIds,
    socIds: listingsState.socIds,
  })

  const systemsQuery = api.systems.get.useQuery()
  // TODO: find a better alternative to hardcoding 10000 for devices (AsyncMultiselect)
  const devicesQuery = api.devices.get.useQuery({ limit: 10000 })
  // TODO: find a better alternative to hardcoding 10000 for SoCs (AsyncMultiselect)
  const socsQuery = api.socs.get.useQuery({ limit: 10000 })
  const emulatorsQuery = api.emulators.get.useQuery({ limit: 100 })
  const performanceScalesQuery = api.listings.performanceScales.useQuery()

  const filterParams: RouterInput['listings']['get'] = {
    page: listingsState.page,
    limit: 10,
    ...filterNullAndEmpty({
      systemIds: listingsState.systemIds.length > 0 ? listingsState.systemIds : undefined,
      deviceIds: preferred.appliedDeviceIds,
      socIds: preferred.appliedSocIds,
      emulatorIds: listingsState.emulatorIds.length > 0 ? listingsState.emulatorIds : undefined,
      performanceIds:
        listingsState.performanceIds.length > 0 ? listingsState.performanceIds : undefined,
      searchTerm: listingsState.search || undefined,
      sortField: listingsState.sortField ?? undefined,
      sortDirection: listingsState.sortDirection ?? undefined,
      myListings: listingsState.myListings || undefined,
    }),
  }

  const listingsQuery = api.listings.get.useQuery(filterParams)

  const handleSystemChange = useCallback(
    (values: string[]) => {
      listingsState.setSystemIds(values)
    },
    [listingsState],
  )

  const handleDeviceChange = useCallback(
    (values: string[]) => {
      listingsState.setDeviceIds(values)
      // When user manually selects devices, disable user preference filtering
      if (values.length > 0) {
        preferred.setUserDeviceFilterDisabled(true)
        // Also disable SoC preferences when manually selecting devices
        preferred.setUserSocFilterDisabled(true)
      }
      // When clearing device selections (Show all devices), ensure user preferences are disabled
      // so we show ALL devices, not filtered by user preferences
      if (values.length === 0) {
        preferred.setUserDeviceFilterDisabled(true)
      }
    },
    [listingsState, preferred],
  )

  const handleSocChange = useCallback(
    (values: string[]) => {
      listingsState.setSocIds(values)
      // When user manually selects SoCs, disable user preference filtering
      if (values.length > 0) {
        preferred.setUserSocFilterDisabled(true)
        // Also disable device preferences when manually selecting SoCs
        preferred.setUserDeviceFilterDisabled(true)
      }
      // When clearing SOC selections (Show all SOCs), ensure user preferences are disabled
      // so we show ALL listings, not filtered by user preferences
      if (values.length === 0) {
        preferred.setUserSocFilterDisabled(true)
      }
    },
    [listingsState, preferred],
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
    },
    [listingsState],
  )

  const handleClearAllFilters = useCallback(() => {
    listingsState.clearAllFilters()
    // When clearing all filters, disable user preferences to show truly ALL listings
    preferred.setUserDeviceFilterDisabled(true)
    preferred.setUserSocFilterDisabled(true)
  }, [listingsState, preferred])

  const handleEnableUserDeviceFilter = useCallback(() => {
    preferred.enableUserDeviceFilter()
    // Clear any manual device selections to allow user preferences to take effect
    listingsState.setDeviceIds([])
  }, [preferred, listingsState])

  const handleEnableUserSocFilter = useCallback(() => {
    preferred.enableUserSocFilter()
    // Clear any manual SoC selections to allow user preferences to take effect
    listingsState.setSocIds([])
  }, [preferred, listingsState])

  if (listingsQuery?.error) {
    return <div className="p-8 text-center text-red-500">Failed to load listings.</div>
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="lg:flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <ListingsFiltersSidebar
            systemIds={listingsState.systemIds}
            deviceIds={listingsState.deviceIds}
            socIds={listingsState.socIds}
            emulatorIds={listingsState.emulatorIds}
            performanceIds={listingsState.performanceIds}
            searchTerm={listingsState.searchInput}
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
            onClearAll={handleClearAllFilters}
            isCollapsed={isMobileSidebarOpen}
            onToggleCollapse={() => setIsMobileSidebarOpen((prevState) => !prevState)}
            userPreferences={userPreferencesQuery.data}
            shouldUseUserDeviceFilter={preferred.shouldUseUserDeviceFilter}
            userDeviceIds={preferred.userDeviceIds}
            shouldUseUserSocFilter={preferred.shouldUseUserSocFilter}
            userSocIds={preferred.userSocIds}
            onEnableUserDeviceFilter={handleEnableUserDeviceFilter}
            onEnableUserSocFilter={handleEnableUserSocFilter}
            userDeviceFilterDisabled={preferred.userDeviceFilterDisabled}
            userSocFilterDisabled={preferred.userSocFilterDisabled}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <MobileFilterSheet title="Filters" onClose={() => setIsMobileSidebarOpen(false)}>
            <ListingsFiltersContent
              systemIds={listingsState.systemIds}
              deviceIds={listingsState.deviceIds}
              socIds={listingsState.socIds}
              emulatorIds={listingsState.emulatorIds}
              performanceIds={listingsState.performanceIds}
              searchTerm={listingsState.searchInput}
              systems={systemsQuery.data ?? []}
              devices={devicesQuery.data?.devices ?? []}
              socs={socsQuery.data?.socs ?? []}
              emulators={emulatorsQuery.data?.emulators ?? []}
              performanceScales={performanceScalesQuery.data ?? []}
              onSystemChange={handleSystemChange}
              onDeviceChange={handleDeviceChange}
              onSocChange={handleSocChange}
              onEmulatorChange={handleEmulatorChange}
              onPerformanceChange={(values) => handlePerformanceChange(values.map(Number))}
              onSearchChange={handleSearchChange}
              onClearAll={handleClearAllFilters}
              showActiveFilters
            />
          </MobileFilterSheet>
        )}

        {/* Main Content - Listings */}
        <section className="flex-1 overflow-x-auto py-4 px-2 md:px-4 lg:py-6 lg:pl-8">
          {/* Desktop Header */}
          <div className="hidden lg:flex lg:justify-between lg:items-center mb-6 lg:mb-8">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Handheld Reports
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
                  {listingsState.myListings ? 'All Reports' : 'My Reports'}
                </Button>
              )}
              <Button asChild size="sm" variant="fancy">
                <Link href="/listings/new">Add Report</Link>
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
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Handheld Reports</h1>

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
                  {listingsState.myListings ? 'All' : 'My'} Reports
                </Button>
              )}
              <Button asChild variant="fancy" size="sm" className="px-3 py-1.5 text-xs">
                <Link href="/listings/new">Add</Link>
              </Button>

              {/* Compact View Options */}
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setShowSystemIcons(!showSystemIcons)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                  aria-pressed={showSystemIcons}
                  aria-label={showSystemIcons ? 'Show System Names' : 'Show System Icons'}
                  title={showSystemIcons ? 'Show System Names' : 'Show System Icons'}
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
                  title={showEmulatorLogos ? 'Show Emulator Names' : 'Show Emulator Logos'}
                >
                  <GamepadIcon
                    className={cn(
                      'w-4 h-4',
                      showEmulatorLogos ? 'text-blue-600 dark:text-blue-400' : '',
                    )}
                  />
                </button>
                <MobileColumnVisibilityControl
                  columns={LISTINGS_COLUMNS}
                  columnVisibility={columnVisibility}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl shadow-xl bg-white/90 dark:bg-gray-900/90">
            {listingsQuery.isPending ? (
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
                                  href={`/listings/${listing.id}`}
                                  className="hover:text-blue-600 dark:hover:text-blue-400"
                                >
                                  {listing.game.title.substring(0, 30)}
                                  {listing.game.title.length > 30 && '...'}
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent side="top">{listing.game.title}</TooltipContent>
                            </Tooltip>

                            {listing.status === ApprovalStatus.PENDING && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                </TooltipTrigger>
                                <TooltipContent>Under Review</TooltipContent>
                              </Tooltip>
                            )}

                            {isModerator &&
                              listing.author &&
                              'userBans' in listing.author &&
                              Array.isArray(listing.author.userBans) &&
                              listing.author.userBans.length > 0 && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800">
                                      BANNED
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>This user has been banned</TooltipContent>
                                </Tooltip>
                              )}

                            {listing.developerVerifications &&
                              listing.developerVerifications.length > 0 && (
                                <ListingVerificationBadge
                                  verifications={listing.developerVerifications}
                                  size="sm"
                                  showTooltip={true}
                                />
                              )}
                          </div>
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('system') && (
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                          {isSystemIconsHydrated && showSystemIcons && listing.game.system?.key ? (
                            <div className="flex items-center gap-2">
                              <SystemIcon
                                name={listing.game.system.name}
                                systemKey={listing.game.system.key}
                                size="sm"
                              />
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
                                showLogo={isEmulatorLogosHydrated && showEmulatorLogos}
                                size="sm"
                              />
                            ) : (
                              'N/A'
                            )}
                            {listing.isVerifiedDeveloper && <VerifiedDeveloperBadge size="sm" />}
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
                          {listing.author?.id ? (
                            <Link
                              href={`/users/${listing.author.id}`}
                              className="text-blue-600 dark:text-indigo-400 hover:underline"
                              onClick={(event) => event.stopPropagation()}
                            >
                              {listing.author.name ?? 'Anonymous'}
                            </Link>
                          ) : (
                            <span>{listing.author?.name ?? 'Anonymous'}</span>
                          )}
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('posted') && (
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                          <LocalizedDate date={listing.createdAt} format="timeAgo" />
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('actions') && (
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {isAdmin && (
                              <EditButton
                                href={`/admin/listings/${listing.id}/edit`}
                                title="Edit Report"
                              />
                            )}
                            <ViewButton
                              href={`/listings/${listing.id}`}
                              title="View Report Details"
                            />
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {!listingsQuery.isPending && listingsQuery.data?.listings.length === 0 && (
              <NoListingsFound />
            )}
          </div>

          {listingsQuery.data?.pagination && listingsQuery.data?.pagination?.pages > 1 && (
            <Pagination
              page={listingsState.page}
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
      <MobileFiltersFab
        ariaLabel="Open Filters"
        onClick={() => setIsMobileSidebarOpen(true)}
        activeCount={[
          listingsState.systemIds.length,
          listingsState.deviceIds.length,
          listingsState.socIds.length,
          listingsState.emulatorIds.length,
          listingsState.performanceIds.length,
          listingsState.search ? 1 : 0,
        ].reduce((sum, count) => sum + count, 0)}
      />
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
