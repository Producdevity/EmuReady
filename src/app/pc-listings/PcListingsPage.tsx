'use client'

import { Clock, CpuIcon, GamepadIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Suspense, useState } from 'react'
import NoListingsFound from '@/app/listings/components/NoListingsFound'
import { MobileFiltersFab, MobileFilterSheet } from '@/app/listings/shared/components'
import { EmulatorIcon, SystemIcon } from '@/components/icons'
import {
  PerformanceBadge,
  Pagination,
  LoadingSpinner,
  LocalizedDate,
  SortableHeader,
  Button,
  ColumnVisibilityControl,
  MobileColumnVisibilityControl,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  EditButton,
  ViewButton,
  Badge,
  DisplayToggleButton,
  SuccessRateBar,
} from '@/components/ui'
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
import { hasPermission } from '@/utils/permissions'
import { Role, ApprovalStatus } from '@orm'
import PcFiltersContent from './components/PcFiltersContent'
import PcFiltersSidebar from './components/PcFiltersSidebar'
import usePcListingsState from './hooks/usePcListingsState'

const PC_LISTINGS_COLUMNS: ColumnDefinition[] = [
  { key: 'game', label: 'Game', defaultVisible: true },
  { key: 'system', label: 'System', defaultVisible: true },
  { key: 'cpu', label: 'CPU', defaultVisible: true },
  { key: 'gpu', label: 'GPU', defaultVisible: true },
  { key: 'memory', label: 'Memory', defaultVisible: true },
  { key: 'os', label: 'OS', defaultVisible: false },
  { key: 'emulator', label: 'Emulator', defaultVisible: true },
  { key: 'performance', label: 'Performance', defaultVisible: true },
  { key: 'verified', label: 'Verified', defaultVisible: true },
  { key: 'author', label: 'Author', defaultVisible: false },
  { key: 'posted', label: 'Posted', defaultVisible: false },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

function PcListingsPage() {
  const router = useRouter()
  const listingsState = usePcListingsState()

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false)
  const [showSystemIcons, setShowSystemIcons, isSystemIconsHydrated] = useLocalStorage(
    storageKeys.showSystemIcons,
    true,
  )

  const {
    showEmulatorLogos,
    toggleEmulatorLogos,
    isHydrated: isEmulatorLogosHydrated,
  } = useEmulatorLogos()

  const columnVisibility = useColumnVisibility(PC_LISTINGS_COLUMNS, {
    storageKey: storageKeys.columnVisibility.pcListings,
  })

  const userQuery = api.users.me.useQuery()

  const userRole = userQuery?.data?.role
  const isAdmin = userRole ? hasPermission(userRole, Role.ADMIN) : false
  const isModerator = userRole ? roleIncludesRole(userRole, Role.MODERATOR) : false

  // TODO: handle MultiSelect async instead of fetching 1000 items
  const cpusQuery = api.cpus.get.useQuery({ limit: 1000 })
  // TODO: handle MultiSelect async instead of fetching 1000 items
  const gpusQuery = api.gpus.get.useQuery({ limit: 1000 })
  const emulatorsQuery = api.emulators.get.useQuery({ limit: 100 })
  const performanceScalesQuery = api.listings.performanceScales.useQuery()
  const systemsQuery = api.systems.get.useQuery()

  const filterParams: RouterInput['pcListings']['get'] = {
    page: listingsState.page,
    limit: 10,
    ...filterNullAndEmpty({
      cpuIds: listingsState.cpuIds.length > 0 ? listingsState.cpuIds : undefined,
      gpuIds: listingsState.gpuIds.length > 0 ? listingsState.gpuIds : undefined,
      systemIds: listingsState.systemIds.length > 0 ? listingsState.systemIds : undefined,
      emulatorIds: listingsState.emulatorIds.length > 0 ? listingsState.emulatorIds : undefined,
      performanceIds:
        listingsState.performanceIds.length > 0 ? listingsState.performanceIds : undefined,
      memoryMin: listingsState.minMemory ?? undefined,
      memoryMax: listingsState.maxMemory ?? undefined,
      searchTerm: listingsState.search || undefined,
      sortField: listingsState.sortField ?? undefined,
      sortDirection: listingsState.sortDirection ?? undefined,
      myListings: listingsState.myListings || undefined,
    }),
  }

  const listingsQuery = api.pcListings.get.useQuery(filterParams)

  const handleCpuChange = (values: string[]) => {
    listingsState.setCpuIds(values)
  }

  const handleGpuChange = (values: string[]) => {
    listingsState.setGpuIds(values)
  }

  const handleSystemChange = (values: string[]) => {
    listingsState.setSystemIds(values)
  }

  const handlePerformanceChange = (values: number[]) => {
    listingsState.setPerformanceIds(values)
  }

  const handleEmulatorChange = (values: string[]) => {
    listingsState.setEmulatorIds(values)
  }

  const handleMinMemoryChange = (value: number | null) => {
    listingsState.setMinMemory(value)
  }

  const handleMaxMemoryChange = (value: number | null) => {
    listingsState.setMaxMemory(value)
  }

  const handleSearchChange = (value: string) => {
    listingsState.setSearch(value)
  }

  const clearAllFilters = () => {
    listingsState.setSearch('')
    listingsState.setSystemIds([])
    listingsState.setCpuIds([])
    listingsState.setGpuIds([])
    listingsState.setEmulatorIds([])
    listingsState.setPerformanceIds([])
    listingsState.setMinMemory(null)
    listingsState.setMaxMemory(null)
  }

  if (listingsQuery?.error) {
    return <div className="p-8 text-center text-red-500">Failed to load PC listings.</div>
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="lg:flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <PcFiltersSidebar
            isCollapsed={isFiltersCollapsed}
            onToggleCollapse={() => setIsFiltersCollapsed((v) => !v)}
            onClearAll={clearAllFilters}
            cpuIds={listingsState.cpuIds}
            gpuIds={listingsState.gpuIds}
            systemIds={listingsState.systemIds}
            emulatorIds={listingsState.emulatorIds}
            performanceIds={listingsState.performanceIds}
            minMemory={listingsState.minMemory}
            maxMemory={listingsState.maxMemory}
            searchTerm={listingsState.search}
            cpus={cpusQuery.data?.cpus ?? []}
            gpus={gpusQuery.data?.gpus ?? []}
            systems={systemsQuery.data ?? []}
            emulators={emulatorsQuery.data?.emulators ?? []}
            performanceScales={performanceScalesQuery.data ?? []}
            onCpuChange={handleCpuChange}
            onGpuChange={handleGpuChange}
            onSystemChange={handleSystemChange}
            onEmulatorChange={handleEmulatorChange}
            onPerformanceChange={handlePerformanceChange}
            onMinMemoryChange={handleMinMemoryChange}
            onMaxMemoryChange={handleMaxMemoryChange}
            onSearchChange={handleSearchChange}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <MobileFilterSheet title="PC Filters" onClose={() => setIsMobileSidebarOpen(false)}>
            <PcFiltersContent
              cpuIds={listingsState.cpuIds}
              gpuIds={listingsState.gpuIds}
              systemIds={listingsState.systemIds}
              emulatorIds={listingsState.emulatorIds}
              performanceIds={listingsState.performanceIds}
              minMemory={listingsState.minMemory}
              maxMemory={listingsState.maxMemory}
              searchTerm={listingsState.search}
              cpus={cpusQuery.data?.cpus ?? []}
              gpus={gpusQuery.data?.gpus ?? []}
              systems={systemsQuery.data ?? []}
              emulators={emulatorsQuery.data?.emulators ?? []}
              performanceScales={performanceScalesQuery.data ?? []}
              onCpuChange={handleCpuChange}
              onGpuChange={handleGpuChange}
              onSystemChange={handleSystemChange}
              onEmulatorChange={handleEmulatorChange}
              onPerformanceChange={(values) => handlePerformanceChange(values.map(Number))}
              onMinMemoryChange={handleMinMemoryChange}
              onMaxMemoryChange={handleMaxMemoryChange}
              onSearchChange={handleSearchChange}
            />
          </MobileFilterSheet>
        )}

        {/* Main Content - Listings */}
        <section className="flex-1 overflow-x-auto py-4 px-2 md:px-4 lg:py-6 lg:pl-8">
          {/* Desktop Header */}
          <div className="hidden lg:flex lg:justify-between lg:items-center mb-6 lg:mb-8">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              PC Reports
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
                  {listingsState.myListings ? 'All' : 'My'} Reports
                </Button>
              )}
              <Button asChild size="sm" variant="fancy">
                <Link href="/pc-listings/new">Add PC Report</Link>
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
                columns={PC_LISTINGS_COLUMNS}
                columnVisibility={columnVisibility}
              />
            </div>
          </div>

          {/* Mobile Header - Compact */}
          <div className="flex lg:hidden items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">PC Reports</h1>

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
                <Link href="/pc-listings/new">Add</Link>
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
                  columns={PC_LISTINGS_COLUMNS}
                  columnVisibility={columnVisibility}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl shadow-xl bg-white/90 dark:bg-gray-900/90">
            {listingsQuery.isPending ? (
              <LoadingSpinner text="Loading PC listings..." />
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
                    {columnVisibility.isColumnVisible('cpu') && (
                      <SortableHeader
                        label="CPU"
                        field="cpu"
                        currentSortField={listingsState.sortField}
                        currentSortDirection={listingsState.sortDirection}
                        onSort={listingsState.handleSort}
                      />
                    )}
                    {columnVisibility.isColumnVisible('gpu') && (
                      <SortableHeader
                        label="GPU"
                        field="gpu"
                        currentSortField={listingsState.sortField}
                        currentSortDirection={listingsState.sortDirection}
                        onSort={listingsState.handleSort}
                      />
                    )}
                    {columnVisibility.isColumnVisible('memory') && (
                      <SortableHeader
                        label="Memory"
                        field="memorySize"
                        currentSortField={listingsState.sortField}
                        currentSortDirection={listingsState.sortDirection}
                        onSort={listingsState.handleSort}
                      />
                    )}
                    {columnVisibility.isColumnVisible('os') && (
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        OS
                      </th>
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
                    {columnVisibility.isColumnVisible('verified') && (
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
                  {listingsQuery.data?.pcListings.map((listing) => (
                    <tr
                      key={listing.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      onClick={() => router.push(`/pc-listings/${listing.id}`)}
                    >
                      {columnVisibility.isColumnVisible('game') && (
                        <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">
                          <div className="flex items-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link
                                  href={`/pc-listings/${listing.id}`}
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
                      {columnVisibility.isColumnVisible('cpu') && (
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                          {listing.cpu
                            ? `${listing.cpu.brand.name} ${listing.cpu.modelName}`
                            : 'N/A'}
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('gpu') && (
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                          {listing.gpu
                            ? `${listing.gpu.brand.name} ${listing.gpu.modelName}`
                            : 'Integrated'}
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('memory') && (
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                          {listing.memorySize}GB
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('os') && (
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{listing.os}</td>
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
                      {columnVisibility.isColumnVisible('verified') && (
                        <td className="px-4 py-2">
                          <SuccessRateBar
                            rate={listing.successRate * 100}
                            voteCount={listing._count.votes}
                          />
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('author') && (
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                          <Link
                            href={`/users/${listing.author?.id}`}
                            className="text-blue-600 dark:text-indigo-400 hover:underline"
                          >
                            {listing.author?.name ?? 'Anonymous'}
                          </Link>
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
                                href={`/admin/pc-listings/${listing.id}/edit`}
                                title="Edit PC Report"
                              />
                            )}
                            <ViewButton
                              href={`/pc-listings/${listing.id}`}
                              title="View PC Report Details"
                            />
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {!listingsQuery.isPending && listingsQuery.data?.pcListings.length === 0 && (
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
        ariaLabel="Open PC Filters"
        onClick={() => setIsMobileSidebarOpen(true)}
        activeCount={[
          listingsState.cpuIds.length,
          listingsState.gpuIds.length,
          listingsState.systemIds.length,
          listingsState.emulatorIds.length,
          listingsState.performanceIds.length,
          listingsState.minMemory !== null ? 1 : 0,
          listingsState.maxMemory !== null ? 1 : 0,
          listingsState.search ? 1 : 0,
        ].reduce((sum, count) => sum + count, 0)}
      />
    </main>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" />}>
      <PcListingsPage />
    </Suspense>
  )
}
