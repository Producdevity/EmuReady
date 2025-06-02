'use client'

import { Suspense, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { EyeIcon, TrashIcon } from '@heroicons/react/24/outline'
import { api } from '@/lib/api'
import { hasPermission } from '@/utils/permissions'
import { Role, ListingApprovalStatus } from '@orm'
import storageKeys from '@/data/storageKeys'
import SystemIcon from '@/components/icons/SystemIcon'
import useLocalStorage from '@/hooks/useLocalStorage'
import useListingsState from './hooks/useListingsState'
import {
  PerformanceBadge,
  Pagination,
  SuccessRateBar,
  LoadingSpinner,
  SortableHeader,
  Button,
  useConfirmDialog,
  ColumnVisibilityControl,
} from '@/components/ui'
import useColumnVisibility, {
  type ColumnDefinition,
} from '@/hooks/useColumnVisibility'
import ListingFilters, {
  type SelectInputEvent,
} from './components/ListingFilters'
import {
  type ListingsFilter,
  type SortDirection,
  type SortField,
} from './types'
import { type RouterInput } from '@/types/trpc'

const LISTINGS_COLUMNS: ColumnDefinition[] = [
  { key: 'game', label: 'Game', defaultVisible: true },
  { key: 'system', label: 'System', defaultVisible: true },
  { key: 'device', label: 'Device', defaultVisible: true },
  { key: 'emulator', label: 'Emulator', defaultVisible: true },
  { key: 'performance', label: 'Performance', defaultVisible: true },
  { key: 'successRate', label: 'Success Rate', defaultVisible: true },
  { key: 'author', label: 'Author', defaultVisible: false },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

function ListingsPage() {
  const confirm = useConfirmDialog()

  // Use the custom hook for state management
  const listingsState = useListingsState()

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [showSystemIcons, setShowSystemIcons, isSystemIconsHydrated] =
    useLocalStorage(storageKeys.showSystemIcons, false)

  const columnVisibility = useColumnVisibility(LISTINGS_COLUMNS, {
    storageKey: storageKeys.columnVisibility.listings,
  })

  const { user } = useUser()
  
  // Get user role from Clerk's publicMetadata
  const userRole = user?.publicMetadata?.role as Role | undefined
  const isAdmin = userRole ? hasPermission(userRole, Role.ADMIN) : false

  const systemsQuery = api.systems.get.useQuery()
  const devicesQuery = api.devices.get.useQuery()
  const emulatorsQuery = api.emulators.get.useQuery()
  const performanceScalesQuery = api.listings.performanceScales.useQuery()

  const filterParams: ListingsFilter = {
    systemId: listingsState.systemId || undefined,
    deviceId: listingsState.deviceId || undefined,
    emulatorId: listingsState.emulatorId || undefined,
    performanceId: listingsState.performanceId
      ? parseInt(listingsState.performanceId)
      : undefined,
    searchTerm: listingsState.search || undefined,
    page: listingsState.page,
    limit: 10,
    sortField: listingsState.sortField ?? undefined,
    sortDirection: listingsState.sortDirection ?? undefined,
    approvalStatus: ListingApprovalStatus.APPROVED,
  }

  const listingsQuery = api.listings.get.useQuery(filterParams)

  const deleteListing = api.listings.delete.useMutation({
    onSuccess: () => {
      listingsQuery.refetch().catch(console.error)
      setDeleteConfirmId(null)
    },
  })

  const handleFilterChange = (ev: SelectInputEvent) => {
    listingsState.setSystemId(ev.target.value)
    listingsState.setPage(1)
    listingsState.updateQuery({ systemId: ev.target.value, page: 1 })
  }

  const handleDeviceChange = (ev: SelectInputEvent) => {
    listingsState.setDeviceId(ev.target.value)
    listingsState.setPage(1)
    listingsState.updateQuery({ deviceId: ev.target.value, page: 1 })
  }

  const handleEmulatorChange = (ev: SelectInputEvent) => {
    listingsState.setEmulatorId(ev.target.value)
    listingsState.setPage(1)
    listingsState.updateQuery({ emulatorId: ev.target.value, page: 1 })
  }

  const handlePerformanceChange = (ev: SelectInputEvent) => {
    listingsState.setPerformanceId(ev.target.value)
    listingsState.setPage(1)
    listingsState.updateQuery({ performanceId: ev.target.value, page: 1 })
  }

  const handleSearchChange = (ev: SelectInputEvent) => {
    listingsState.setSearch(ev.target.value)
    listingsState.setPage(1)
    listingsState.updateQuery({ search: ev.target.value, page: 1 })
  }

  const handleSort = (field: string) => {
    let newSortField: SortField | null = listingsState.sortField
    let newSortDirection: SortDirection
    if (listingsState.sortField === field) {
      if (listingsState.sortDirection === 'asc') {
        newSortDirection = 'desc'
      } else if (listingsState.sortDirection === 'desc') {
        newSortField = null
        newSortDirection = null
      } else {
        newSortDirection = 'asc'
      }
    } else {
      newSortField = field as SortField
      newSortDirection = 'asc'
    }
    listingsState.setSortField(newSortField)
    listingsState.setSortDirection(newSortDirection)
    listingsState.setPage(1)
    listingsState.updateQuery({
      sortField: newSortField,
      sortDirection: newSortDirection,
      page: 1,
    })
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Listing',
      description: 'Are you sure you want to delete this listing?',
    })

    if (!confirmed) return

    deleteListing.mutate({ id } satisfies RouterInput['listings']['delete'])
  }

  if (listingsQuery?.error)
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load listings.
      </div>
    )

  return (
    <main className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-gray-900">
      <ListingFilters
        systemId={listingsState.systemId}
        deviceId={listingsState.deviceId}
        emulatorId={listingsState.emulatorId}
        performanceId={listingsState.performanceId}
        searchTerm={listingsState.search}
        systems={systemsQuery.data ?? []}
        devices={devicesQuery.data ?? []}
        emulators={emulatorsQuery.data ?? []}
        performanceScales={performanceScalesQuery.data ?? []}
        onSystemChange={handleFilterChange}
        onDeviceChange={handleDeviceChange}
        onEmulatorChange={handleEmulatorChange}
        onPerformanceChange={handlePerformanceChange}
        onSearchChange={handleSearchChange}
      />

      {/* Main Content - Listings */}
      <section className="flex-1 overflow-x-auto py-6 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Game Listings
          </h1>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => setShowSystemIcons(!showSystemIcons)}
            >
              {isSystemIconsHydrated
                ? showSystemIcons
                  ? 'Show System Names'
                  : 'Show System Icons'
                : 'Show System Icons'}
            </Button>
            <ColumnVisibilityControl
              columns={LISTINGS_COLUMNS}
              columnVisibility={columnVisibility}
            />
            <Button asChild variant="fancy">
              <Link href="/listings/new">Add Listing</Link>
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl shadow-xl bg-white/90 dark:bg-gray-900/90">
          {listingsQuery.isLoading ? (
            <LoadingSpinner text="Loading listings..." />
          ) : (
            <table className="table-auto md:table-fixed min-w-full divide-y divide-gray-200 dark:divide-gray-800 rounded-2xl">
              <thead className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
                <tr>
                  {columnVisibility.isColumnVisible('game') && (
                    <SortableHeader
                      label="Game"
                      field="game.title"
                      currentSortField={listingsState.sortField}
                      currentSortDirection={listingsState.sortDirection}
                      onSort={handleSort}
                    />
                  )}
                  {columnVisibility.isColumnVisible('system') && (
                    <SortableHeader
                      label="System"
                      field="game.system.name"
                      currentSortField={listingsState.sortField}
                      currentSortDirection={listingsState.sortDirection}
                      onSort={handleSort}
                    />
                  )}
                  {columnVisibility.isColumnVisible('device') && (
                    <SortableHeader
                      label="Device"
                      field="device"
                      currentSortField={listingsState.sortField}
                      currentSortDirection={listingsState.sortDirection}
                      onSort={handleSort}
                    />
                  )}
                  {columnVisibility.isColumnVisible('emulator') && (
                    <SortableHeader
                      label="Emulator"
                      field="emulator.name"
                      currentSortField={listingsState.sortField}
                      currentSortDirection={listingsState.sortDirection}
                      onSort={handleSort}
                    />
                  )}
                  {columnVisibility.isColumnVisible('performance') && (
                    <SortableHeader
                      label="Performance"
                      field="performance.label"
                      currentSortField={listingsState.sortField}
                      currentSortDirection={listingsState.sortDirection}
                      onSort={handleSort}
                    />
                  )}
                  {columnVisibility.isColumnVisible('successRate') && (
                    <SortableHeader
                      label="Success Rate"
                      field="successRate"
                      currentSortField={listingsState.sortField}
                      currentSortDirection={listingsState.sortDirection}
                      onSort={handleSort}
                    />
                  )}
                  {columnVisibility.isColumnVisible('author') && (
                    <SortableHeader
                      label="Author"
                      field="author.name"
                      currentSortField={listingsState.sortField}
                      currentSortDirection={listingsState.sortDirection}
                      onSort={handleSort}
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
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {columnVisibility.isColumnVisible('game') && (
                      <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">
                        <Link
                          href={`/games/${listing.game.id}`}
                          className="hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {listing.game.title}
                        </Link>
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
                              size="lg"
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
                        {listing.emulator?.name ?? 'N/A'}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('performance') && (
                      <td className="px-4 py-2">
                        <PerformanceBadge
                          rank={listing.performance?.rank ?? 8}
                          label={listing.performance?.label ?? 'N/A'}
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
                    {columnVisibility.isColumnVisible('actions') && (
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-2 flex-col">
                          <Link
                            href={`/listings/${listing.id}`}
                            className="flex items-center justify-center min-w-19 gap-1 p-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-150 shadow-sm hover:scale-105 focus:ring-2 focus:ring-blue-400 text-xs"
                          >
                            <EyeIcon className="w-4 h-4" /> View
                          </Link>

                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(listing.id)}
                              className={`flex items-center justify-center min-w-19 gap-1 p-1 rounded-lg transition-all duration-150 shadow-sm hover:scale-105 focus:ring-2 focus:ring-red-400 text-xs ${
                                deleteConfirmId === listing.id
                                  ? 'bg-orange-700 text-white hover:bg-orange-800'
                                  : 'bg-red-600 text-white hover:bg-red-700'
                              }`}
                            >
                              <TrashIcon className="w-4 h-4" />
                              {deleteConfirmId === listing.id
                                ? 'Confirm'
                                : 'Delete'}
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!listingsQuery.isLoading &&
            listingsQuery.data?.listings.length === 0 && (
              <div className="text-center py-12">
                <p className="text-xl text-gray-500 dark:text-gray-400">
                  No listings found matching the criteria.
                </p>
              </div>
            )}
        </div>

        {listingsQuery.data?.pagination &&
          listingsQuery.data?.pagination?.pages > 1 && (
            <Pagination
              currentPage={listingsState.page}
              totalPages={listingsQuery.data.pagination.pages}
              onPageChange={(newPage) => {
                listingsState.setPage(newPage)
                listingsState.updateQuery({ page: newPage })
              }}
            />
          )}
      </section>
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
