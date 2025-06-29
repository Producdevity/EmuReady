'use client'

import { Search } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { isEmpty } from 'remeda'
import {
  AdminPageLayout,
  AdminTableContainer,
  AdminStatsDisplay,
} from '@/components/admin'
import { EmulatorIcon, SystemIcon } from '@/components/icons'
import {
  Button,
  Input,
  SelectInput,
  ColumnVisibilityControl,
  SortableHeader,
  ApprovalStatusBadge,
  Pagination,
  LoadingSpinner,
  useConfirmDialog,
  DisplayToggleButton,
} from '@/components/ui'
import {
  DeleteButton,
  EditButton,
  ViewButton,
} from '@/components/ui/table-buttons'
import storageKeys from '@/data/storageKeys'
import useAdminTable from '@/hooks/useAdminTable'
import useColumnVisibility, {
  type ColumnDefinition,
} from '@/hooks/useColumnVisibility'
import useEmulatorLogos from '@/hooks/useEmulatorLogos'
import useLocalStorage from '@/hooks/useLocalStorage'
import analytics from '@/lib/analytics'
import { api } from '@/lib/api'
import { type RouterInput, type RouterOutput } from '@/types/trpc'
import { formatDateTime, formatTimeAgo } from '@/utils/date'
import getGameImageUrl from '@/utils/images/getGameImageUrl'
import { ApprovalStatus } from '@orm'

type Listing = RouterOutput['listings']['getAllListings']['listings'][number]
type ListingSortField =
  | 'game.title'
  | 'game.system.name'
  | 'device'
  | 'emulator.name'
  | 'performance.rank'
  | 'author.name'
  | 'createdAt'
  | 'status'

const LISTINGS_COLUMNS: ColumnDefinition[] = [
  { key: 'game', label: 'Game', defaultVisible: true },
  { key: 'system', label: 'System', defaultVisible: true },
  { key: 'device', label: 'Device', defaultVisible: true },
  { key: 'emulator', label: 'Emulator', defaultVisible: true },
  { key: 'performance', label: 'Performance', defaultVisible: true },
  { key: 'author', label: 'Author', defaultVisible: false },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'createdAt', label: 'Created', defaultVisible: false },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

const statusOptions = [
  { id: '', name: 'All Statuses' },
  { id: ApprovalStatus.PENDING, name: 'Pending' },
  { id: ApprovalStatus.APPROVED, name: 'Approved' },
  { id: ApprovalStatus.REJECTED, name: 'Rejected' },
]

function AdminListingsPage() {
  const confirm = useConfirmDialog()
  const table = useAdminTable<ListingSortField>({
    defaultLimit: 20,
    defaultSortField: 'createdAt',
    defaultSortDirection: 'desc',
  })

  const columnVisibility = useColumnVisibility(LISTINGS_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminListings,
  })

  const [showSystemIcons, setShowSystemIcons, isSystemIconsHydrated] =
    useLocalStorage(storageKeys.showSystemIcons, false)

  const emulatorLogos = useEmulatorLogos()

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | ''>('')
  const [systemFilter, setSystemFilter] = useState('')
  const [emulatorFilter, setEmulatorFilter] = useState('')

  const deleteListing = api.listings.delete.useMutation({
    onSuccess: () => {
      listingsQuery.refetch().catch(console.error)
      setDeleteConfirmId(null)
    },
  })

  // Queries
  const listingsQuery = api.listings.getAllListings.useQuery({
    page: table.page,
    limit: table.limit,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
    search: isEmpty(table.search) ? undefined : table.search,
    statusFilter: statusFilter || undefined,
    systemFilter: systemFilter || undefined,
    emulatorFilter: emulatorFilter || undefined,
  })

  const listingStatsQuery = api.listings.getStats.useQuery()
  const systemsQuery = api.systems.get.useQuery()
  const emulatorsQuery = api.emulators.get.useQuery()

  const clearFilters = () => {
    table.setSearch('')
    setStatusFilter('')
    setSystemFilter('')
    setEmulatorFilter('')
    table.setPage(1)
  }

  const handleDelete = async (id: string) => {
    if (deleteConfirmId !== id) return setDeleteConfirmId(id)

    const confirmed = await confirm({
      title: 'Delete Listing',
      description:
        'Are you sure you want to delete this listing? This action cannot be undone.',
    })

    if (confirmed) {
      deleteListing.mutate({ id } satisfies RouterInput['listings']['delete'])
    }
    setDeleteConfirmId(null)
  }

  if (listingsQuery.error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 text-lg">
            Error loading listings: {listingsQuery.error.message}
          </p>
          <Button onClick={() => listingsQuery.refetch()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const listings = listingsQuery.data?.listings ?? []
  const pagination = listingsQuery.data?.pagination

  return (
    <AdminPageLayout
      title="Manage Listings"
      description="Edit and manage all performance listings in the system"
      headerActions={
        <>
          <DisplayToggleButton
            showLogos={showSystemIcons}
            onToggle={() => setShowSystemIcons(!showSystemIcons)}
            isHydrated={isSystemIconsHydrated}
            logoLabel="Show System Icons"
            nameLabel="Show System Names"
          />
          <DisplayToggleButton
            showLogos={emulatorLogos.showEmulatorLogos}
            onToggle={emulatorLogos.toggleEmulatorLogos}
            isHydrated={emulatorLogos.isHydrated}
            logoLabel="Show Emulator Logos"
            nameLabel="Show Emulator Names"
          />
          <ColumnVisibilityControl
            columns={LISTINGS_COLUMNS}
            columnVisibility={columnVisibility}
          />
        </>
      }
    >
      {listingStatsQuery.data && (
        <AdminStatsDisplay
          stats={[
            {
              label: 'Total',
              value: listingStatsQuery.data.total,
              color: 'blue',
            },
            {
              label: 'Approved',
              value: listingStatsQuery.data.approved,
              color: 'green',
            },
            {
              label: 'Pending',
              value: listingStatsQuery.data.pending,
              color: 'yellow',
            },
            {
              label: 'Rejected',
              value: listingStatsQuery.data.rejected,
              color: 'red',
            },
          ]}
          isLoading={listingStatsQuery.isLoading}
          className="mb-6"
        />
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search listings, games, or authors..."
                value={table.search}
                onChange={table.handleSearchChange}
                className="w-full pl-10"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <SelectInput
              hideLabel
              label="Status Filter"
              options={statusOptions}
              value={statusFilter}
              onChange={(ev) => {
                setStatusFilter(ev.target.value as ApprovalStatus | '')
                table.setPage(1)
              }}
              className="min-w-[140px]"
            />
            <SelectInput
              hideLabel
              label="System Filter"
              options={[
                { id: '', name: 'All Systems' },
                ...(systemsQuery.data?.map((system) => ({
                  id: system.id,
                  name: system.name,
                })) ?? []),
              ]}
              value={systemFilter}
              onChange={(ev) => {
                setSystemFilter(ev.target.value)
                table.setPage(1)
              }}
              className="min-w-[140px]"
            />
            <SelectInput
              hideLabel
              label="Emulator Filter"
              options={[
                { id: '', name: 'All Emulators' },
                ...(emulatorsQuery.data?.emulators?.map((emulator) => ({
                  id: emulator.id,
                  name: emulator.name,
                })) ?? []),
              ]}
              value={emulatorFilter}
              onChange={(ev) => {
                setEmulatorFilter(ev.target.value)
                table.setPage(1)
              }}
              className="min-w-[140px]"
            />
            <Button variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Listings Table */}
      <AdminTableContainer>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {columnVisibility.isColumnVisible('game') && (
                  <SortableHeader
                    label="Game"
                    field="game.title"
                    currentSortField={table.sortField}
                    currentSortDirection={table.sortDirection}
                    onSort={table.handleSort}
                    className="px-6 py-3 text-left"
                  />
                )}
                {columnVisibility.isColumnVisible('system') && (
                  <SortableHeader
                    label="System"
                    field="game.system.name"
                    currentSortField={table.sortField}
                    currentSortDirection={table.sortDirection}
                    onSort={table.handleSort}
                    className="px-6 py-3 text-left"
                  />
                )}
                {columnVisibility.isColumnVisible('device') && (
                  <SortableHeader
                    label="Device"
                    field="device"
                    currentSortField={table.sortField}
                    currentSortDirection={table.sortDirection}
                    onSort={table.handleSort}
                    className="px-6 py-3 text-left"
                  />
                )}
                {columnVisibility.isColumnVisible('emulator') && (
                  <SortableHeader
                    label="Emulator"
                    field="emulator.name"
                    currentSortField={table.sortField}
                    currentSortDirection={table.sortDirection}
                    onSort={table.handleSort}
                    className="px-6 py-3 text-left"
                  />
                )}
                {columnVisibility.isColumnVisible('performance') && (
                  <SortableHeader
                    label="Performance"
                    field="performance.rank"
                    currentSortField={table.sortField}
                    currentSortDirection={table.sortDirection}
                    onSort={table.handleSort}
                    className="px-6 py-3 text-left"
                  />
                )}
                {columnVisibility.isColumnVisible('author') && (
                  <SortableHeader
                    label="Author"
                    field="author.name"
                    currentSortField={table.sortField}
                    currentSortDirection={table.sortDirection}
                    onSort={table.handleSort}
                    className="px-6 py-3 text-left"
                  />
                )}
                {columnVisibility.isColumnVisible('status') && (
                  <SortableHeader
                    label="Status"
                    field="status"
                    currentSortField={table.sortField}
                    currentSortDirection={table.sortDirection}
                    onSort={table.handleSort}
                    className="px-6 py-3 text-left"
                  />
                )}
                {columnVisibility.isColumnVisible('createdAt') && (
                  <SortableHeader
                    label="Created"
                    field="createdAt"
                    currentSortField={table.sortField}
                    currentSortDirection={table.sortDirection}
                    onSort={table.handleSort}
                    className="px-6 py-3 text-left"
                  />
                )}
                {columnVisibility.isColumnVisible('actions') && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {listingsQuery.isLoading ? (
                <LoadingSpinner text="Loading Listings..." />
              ) : listings.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    {table.search ||
                    statusFilter ||
                    systemFilter ||
                    emulatorFilter
                      ? 'No listings found matching your filters.'
                      : 'No listings found.'}
                  </p>
                </div>
              ) : (
                listings.map((listing: Listing) => (
                  <tr
                    key={listing.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    {columnVisibility.isColumnVisible('game') && (
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-16 w-20 flex justify-center items-center">
                            <Image
                              src={getGameImageUrl(listing.game)}
                              alt={listing.game.title}
                              width={80}
                              height={64}
                              className="rounded-md object-contain max-h-16 max-w-20"
                              unoptimized
                            />
                          </div>
                          <div className="ml-4 flex-1 min-w-0">
                            <Link
                              href={`/games/${listing.game.id}`}
                              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                              onClick={(ev) => ev.stopPropagation()}
                            >
                              {listing.game.title}
                            </Link>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              ID: {listing.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('system') && (
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
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
                              {listing.game.system.name}
                            </span>
                          </div>
                        ) : (
                          listing.game.system.name
                        )}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('device') && (
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        <div>
                          <div className="font-medium">
                            {listing.device.brand.name}{' '}
                            {listing.device.modelName}
                          </div>
                          {listing.device.soc && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {listing.device.soc.name}
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('emulator') && (
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        <EmulatorIcon
                          name={listing.emulator.name}
                          logo={listing.emulator.logo}
                          showLogo={
                            emulatorLogos.isHydrated &&
                            emulatorLogos.showEmulatorLogos
                          }
                          size="sm"
                        />
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('performance') && (
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        <div className="font-medium">
                          {listing.performance.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Rank: {listing.performance.rank}
                        </div>
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('author') && (
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {listing.author?.name ?? 'Unknown'}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('status') && (
                      <td className="px-6 py-4">
                        <ApprovalStatusBadge status={listing.status} />
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('createdAt') && (
                      <td
                        className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100"
                        title={formatDateTime(listing.createdAt)}
                      >
                        {formatTimeAgo(listing.createdAt)}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('actions') && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <EditButton
                            href={`/admin/listings/${listing.id}/edit`}
                            title="Edit Listing"
                          />
                          <ViewButton
                            onClick={() => {
                              analytics.contentDiscovery.externalLinkClicked({
                                url: `/listings/${listing.id}`,
                                context: 'admin_listings_table_click',
                                entityId: listing.id,
                              })
                              window.open(
                                `/listings/${listing.id}`,
                                '_blank',
                                'noopener,noreferrer',
                              )
                            }}
                            title="View Details"
                          />
                          <DeleteButton
                            title="Delete Listing"
                            onClick={() => handleDelete(listing.id)}
                          />
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <Pagination
              currentPage={table.page}
              totalPages={pagination.totalPages}
              onPageChange={table.setPage}
            />
          </div>
        )}
      </AdminTableContainer>
    </AdminPageLayout>
  )
}

export default AdminListingsPage
