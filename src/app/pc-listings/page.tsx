'use client'

import { Clock, X, FunnelIcon, Monitor, Settings2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Suspense, useState } from 'react'
import NoListingsFound from '@/app/listings/components/NoListingsFound'
import {
  PerformanceBadge,
  Pagination,
  LoadingSpinner,
  SortableHeader,
  Button,
  ColumnVisibilityControl,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  EditButton,
  ViewButton,
  Badge,
} from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import { useColumnVisibility, type ColumnDefinition } from '@/hooks'
import { api } from '@/lib/api'
import { formatTimeAgo } from '@/utils/date'
import { filterNullAndEmpty } from '@/utils/filter'
import { roleIncludesRole } from '@/utils/permission-system'
import { hasPermission } from '@/utils/permissions'
import { Role, ApprovalStatus } from '@orm'
import PcListingsFilters from './components/PcListingsFilters'
import usePcListingsState from './hooks/usePcListingsState'
import { type PcListingsFilter } from './types'

const PC_LISTINGS_COLUMNS: ColumnDefinition[] = [
  { key: 'game', label: 'Game', defaultVisible: true },
  { key: 'system', label: 'System', defaultVisible: true },
  { key: 'cpu', label: 'CPU', defaultVisible: true },
  { key: 'gpu', label: 'GPU', defaultVisible: true },
  { key: 'memory', label: 'Memory', defaultVisible: true },
  { key: 'os', label: 'OS', defaultVisible: false },
  { key: 'emulator', label: 'Emulator', defaultVisible: true },
  { key: 'performance', label: 'Performance', defaultVisible: true },
  { key: 'author', label: 'Author', defaultVisible: false },
  { key: 'posted', label: 'Posted', defaultVisible: false },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

function PcListingsPage() {
  const router = useRouter()
  const listingsState = usePcListingsState()

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const columnVisibility = useColumnVisibility(PC_LISTINGS_COLUMNS, {
    storageKey: storageKeys.columnVisibility.pcListings,
  })

  const userQuery = api.users.me.useQuery()

  const userRole = userQuery?.data?.role as Role | undefined
  const isAdmin = userRole ? hasPermission(userRole, Role.ADMIN) : false
  const isModerator = userRole
    ? roleIncludesRole(userRole, Role.MODERATOR)
    : false

  const cpusQuery = api.cpus.get.useQuery({ limit: 100 })
  const gpusQuery = api.gpus.get.useQuery({ limit: 100 })
  const performanceScalesQuery = api.listings.performanceScales.useQuery()
  const systemsQuery = api.systems.get.useQuery()

  const filterParams: PcListingsFilter = {
    page: listingsState.page,
    limit: 10,
    ...filterNullAndEmpty({
      cpuIds:
        listingsState.cpuIds.length > 0 ? listingsState.cpuIds : undefined,
      gpuIds:
        listingsState.gpuIds.length > 0 ? listingsState.gpuIds : undefined,
      systemIds:
        listingsState.systemIds.length > 0
          ? listingsState.systemIds
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

  const handleSearchChange = (value: string) => {
    listingsState.setSearch(value)
  }

  if (listingsQuery?.error) {
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load PC listings.
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="lg:flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <PcListingsFilters
            cpuIds={listingsState.cpuIds}
            gpuIds={listingsState.gpuIds}
            systemIds={listingsState.systemIds}
            performanceIds={listingsState.performanceIds}
            searchTerm={listingsState.search}
            cpus={cpusQuery.data?.cpus ?? []}
            gpus={gpusQuery.data?.gpus ?? []}
            systems={systemsQuery.data ?? []}
            performanceScales={performanceScalesQuery.data ?? []}
            onCpuChange={handleCpuChange}
            onGpuChange={handleGpuChange}
            onSystemChange={handleSystemChange}
            onPerformanceChange={handlePerformanceChange}
            onSearchChange={handleSearchChange}
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
                    PC Filters
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
                  <PcListingsFilters
                    cpuIds={listingsState.cpuIds}
                    gpuIds={listingsState.gpuIds}
                    systemIds={listingsState.systemIds}
                    performanceIds={listingsState.performanceIds}
                    searchTerm={listingsState.search}
                    cpus={cpusQuery.data?.cpus ?? []}
                    gpus={gpusQuery.data?.gpus ?? []}
                    systems={systemsQuery.data ?? []}
                    performanceScales={performanceScalesQuery.data ?? []}
                    onCpuChange={handleCpuChange}
                    onGpuChange={handleGpuChange}
                    onSystemChange={handleSystemChange}
                    onPerformanceChange={handlePerformanceChange}
                    onSearchChange={handleSearchChange}
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
              PC Listings
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
              <Button asChild size="sm" variant="fancy">
                <Link href="/pc-listings/new">Add PC Listing</Link>
              </Button>
              <ColumnVisibilityControl
                columns={PC_LISTINGS_COLUMNS}
                columnVisibility={columnVisibility}
              />
            </div>
          </div>

          {/* Mobile Header - Compact */}
          <div className="flex lg:hidden items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              PC Listings
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
                <Link href="/pc-listings/new">Add</Link>
              </Button>
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
                                  <TooltipContent>
                                    This user has been banned
                                  </TooltipContent>
                                </Tooltip>
                              )}
                          </div>
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('system') && (
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                          {listing.game.system?.name ?? 'Unknown'}
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
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                          {listing.os}
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('emulator') && (
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                          {listing.emulator?.name ?? 'N/A'}
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
                                href={`/admin/pc-listings/${listing.id}/edit`}
                                title="Edit PC Listing"
                              />
                            )}
                            <ViewButton
                              href={`/pc-listings/${listing.id}`}
                              title="View PC Listing Details"
                            />
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {!listingsQuery.isPending &&
              listingsQuery.data?.pcListings.length === 0 && (
                <NoListingsFound />
              )}
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
          aria-label="Open PC Filters"
        >
          {/* Active filter count badge */}
          {(listingsState.cpuIds.length > 0 ||
            listingsState.gpuIds.length > 0 ||
            listingsState.systemIds.length > 0 ||
            listingsState.performanceIds.length > 0 ||
            listingsState.search) && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg">
              {[
                listingsState.cpuIds.length,
                listingsState.gpuIds.length,
                listingsState.systemIds.length,
                listingsState.performanceIds.length,
                listingsState.search ? 1 : 0,
              ].reduce((sum, count) => sum + count, 0)}
            </div>
          )}

          <div className="flex items-center gap-1">
            <Monitor className="w-5 h-5" />
            <Settings2 className="w-4 h-4" />
          </div>

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
      <PcListingsPage />
    </Suspense>
  )
}
