'use client'

import { CheckCircle, XCircle, Clock, Search } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { isEmpty } from 'remeda'
import ViewButton from '@/app/admin/components/table-buttons/ViewButton'
import EmulatorIcon from '@/components/icons/EmulatorIcon'
import SystemIcon from '@/components/icons/SystemIcon'
import {
  Button,
  Input,
  ColumnVisibilityControl,
  AdminTableContainer,
  AdminNotificationBanner,
  SortableHeader,
  Pagination,
  LoadingSpinner,
  BulkActions,
} from '@/components/ui'
import DisplayToggleButton from '@/components/ui/DisplayToggleButton'
import storageKeys from '@/data/storageKeys'
import useAdminTable from '@/hooks/useAdminTable'
import useColumnVisibility, {
  type ColumnDefinition,
} from '@/hooks/useColumnVisibility'
import useEmulatorLogos from '@/hooks/useEmulatorLogos'
import useLocalStorage from '@/hooks/useLocalStorage'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterOutput, type RouterInput } from '@/types/trpc'
import { formatDateTime, formatTimeAgo } from '@/utils/date'
import getErrorMessage from '@/utils/getErrorMessage'
import { ApprovalStatus } from '@orm'
import ApprovalModal from './components/ApprovalModal'

type PendingListing = RouterOutput['listings']['getPending']['listings'][number]
type ApprovalSortField =
  | 'game.title'
  | 'game.system.name'
  | 'device'
  | 'emulator.name'
  | 'createdAt'
  | 'author.name'

const APPROVALS_COLUMNS: ColumnDefinition[] = [
  { key: 'game', label: 'Game', defaultVisible: true },
  { key: 'system', label: 'System', defaultVisible: true },
  { key: 'author', label: 'Author', defaultVisible: false },
  { key: 'device', label: 'Device', defaultVisible: true },
  { key: 'emulator', label: 'Emulator', defaultVisible: true },
  { key: 'submittedAt', label: 'Submitted', defaultVisible: false },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

function AdminApprovalsPage() {
  const table = useAdminTable<ApprovalSortField>({
    defaultLimit: 20,
    defaultSortField: 'createdAt',
    defaultSortDirection: 'desc',
  })

  const columnVisibility = useColumnVisibility(APPROVALS_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminApprovals,
  })

  const [showSystemIcons, setShowSystemIcons, isSystemIconsHydrated] =
    useLocalStorage(storageKeys.showSystemIcons, false)

  const {
    showEmulatorLogos,
    toggleEmulatorLogos,
    isHydrated: isEmulatorLogosHydrated,
  } = useEmulatorLogos()

  const pendingListingsQuery = api.listings.getPending.useQuery({
    page: table.page,
    limit: table.limit,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
    search: isEmpty(table.search) ? undefined : table.search,
  })

  const gameStatsQuery = api.games.getStats.useQuery()

  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [selectedListingForApproval, setSelectedListingForApproval] =
    useState<PendingListing | null>(null)
  const [approvalNotes, setApprovalNotes] = useState('')
  const [approvalDecision, setApprovalDecision] =
    useState<ApprovalStatus | null>(null)

  // Bulk selection state
  const [selectedListingIds, setSelectedListingIds] = useState<string[]>([])

  const utils = api.useUtils()
  const approveMutation = api.listings.approveListing.useMutation({
    onSuccess: async () => {
      toast.success('Listing approved successfully!')
      await pendingListingsQuery.refetch()
      await utils.listings.getProcessed.invalidate()
      await utils.listings.get.invalidate()
      closeApprovalModal()
    },
    onError: (err) => {
      console.error('Failed to approve listing:', err)
      toast.error(`Failed to approve listing: ${getErrorMessage(err)}`)
    },
  })

  const rejectMutation = api.listings.rejectListing.useMutation({
    onSuccess: async () => {
      toast.success('Listing rejected successfully!')
      await pendingListingsQuery.refetch()
      await utils.listings.getProcessed.invalidate()
      await utils.listings.get.invalidate()
      closeApprovalModal()
    },
    onError: (err) => {
      console.error('Failed to reject listing:', err)
      toast.error(`Failed to reject listing: ${getErrorMessage(err)}`)
    },
  })

  const bulkApproveMutation = api.listings.bulkApproveListing.useMutation({
    onSuccess: async (result) => {
      toast.success(result.message)
      await pendingListingsQuery.refetch()
      await utils.listings.getProcessed.invalidate()
      await utils.listings.get.invalidate()
      setSelectedListingIds([])
    },
    onError: (err) => {
      console.error('Failed to bulk approve listings:', err)
      toast.error(`Failed to bulk approve listings: ${getErrorMessage(err)}`)
    },
  })

  const bulkRejectMutation = api.listings.bulkRejectListing.useMutation({
    onSuccess: async (result) => {
      toast.success(result.message)
      await pendingListingsQuery.refetch()
      await utils.listings.getProcessed.invalidate()
      await utils.listings.get.invalidate()
      setSelectedListingIds([])
    },
    onError: (err) => {
      console.error('Failed to bulk reject listings:', err)
      toast.error(`Failed to bulk reject listings: ${getErrorMessage(err)}`)
    },
  })

  // Bulk selection handlers
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedListingIds(listings.map((l) => l.id))
    } else {
      setSelectedListingIds([])
    }
  }

  const handleSelectListing = (listingId: string, selected: boolean) => {
    if (selected) {
      setSelectedListingIds((prev) => [...prev, listingId])
    } else {
      setSelectedListingIds((prev) => prev.filter((id) => id !== listingId))
    }
  }

  const handleBulkApprove = async (ids: string[]) => {
    await bulkApproveMutation.mutateAsync({ listingIds: ids })
  }

  const handleBulkReject = async (ids: string[], notes?: string) => {
    await bulkRejectMutation.mutateAsync({ listingIds: ids, notes })
  }

  const openApprovalModal = (
    listing: PendingListing,
    decision: ApprovalStatus,
  ) => {
    setSelectedListingForApproval(listing)
    setApprovalDecision(decision)
    setApprovalNotes('')
    setShowApprovalModal(true)
  }

  const closeApprovalModal = () => {
    setShowApprovalModal(false)
    setSelectedListingForApproval(null)
    setApprovalNotes('')
    setApprovalDecision(null)
  }

  const handleApprovalSubmit = () => {
    if (selectedListingForApproval && approvalDecision) {
      if (approvalDecision === ApprovalStatus.APPROVED) {
        approveMutation.mutate({
          listingId: selectedListingForApproval.id,
        } satisfies RouterInput['listings']['approveListing'])
      } else if (approvalDecision === ApprovalStatus.REJECTED) {
        rejectMutation.mutate({
          listingId: selectedListingForApproval.id,
          notes: approvalNotes || undefined,
        } satisfies RouterInput['listings']['rejectListing'])
      }
    }
  }

  if (pendingListingsQuery.error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 text-lg">
            Error loading pending listings: {pendingListingsQuery.error.message}
          </p>
          <Button
            onClick={() => pendingListingsQuery.refetch()}
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const listings = pendingListingsQuery.data?.listings ?? []
  const pagination = pendingListingsQuery.data?.pagination

  if (pendingListingsQuery.isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner text="Loading pending listings..." />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Listing Approvals
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Review and approve or reject pending listing submissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DisplayToggleButton
            showLogos={showSystemIcons}
            onToggle={() => setShowSystemIcons(!showSystemIcons)}
            isHydrated={isSystemIconsHydrated}
            logoLabel="Show System Icons"
            nameLabel="Show System Names"
          />
          <DisplayToggleButton
            showLogos={showEmulatorLogos}
            onToggle={toggleEmulatorLogos}
            isHydrated={isEmulatorLogosHydrated}
            logoLabel="Show Emulator Logos"
            nameLabel="Show Emulator Names"
          />
          <ColumnVisibilityControl
            columns={APPROVALS_COLUMNS}
            columnVisibility={columnVisibility}
          />
        </div>
      </div>

      {gameStatsQuery.data && gameStatsQuery.data.pending > 0 && (
        <AdminNotificationBanner
          type="warning"
          title="Pending Games Awaiting Approval"
          message={`There ${gameStatsQuery.data.pending === 1 ? 'is' : 'are'} ${gameStatsQuery.data.pending} game${gameStatsQuery.data.pending === 1 ? '' : 's'} waiting for admin approval.`}
          actionLabel="Review Games"
          actionUrl="/admin/games/approvals"
        />
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mt-2 mb-6 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search listings, games, or authors..."
                value={table.search}
                onChange={(ev) => table.setSearch(ev.target.value)}
                className="w-full pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-full"
              onClick={() => {
                table.setSearch('')
                table.setPage(1)
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {listings.length > 0 && (
        <BulkActions
          selectedIds={selectedListingIds}
          totalCount={listings.length}
          onSelectAll={handleSelectAll}
          onClearSelection={() => setSelectedListingIds([])}
          actions={{
            approve: {
              label: 'Approve Selected',
              onAction: handleBulkApprove,
            },
            reject: {
              label: 'Reject Selected',
              onAction: handleBulkReject,
            },
          }}
        />
      )}

      {/* Listings Table */}
      <AdminTableContainer>
        {listings.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {table.search
                ? 'No listings found matching your search.'
                : 'No pending listings to review.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedListingIds.length === listings.length &&
                          listings.length > 0
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </th>
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
                    {columnVisibility.isColumnVisible('submittedAt') && (
                      <SortableHeader
                        label="Submitted"
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
                  {listings.map((listing: PendingListing) => (
                    <tr
                      key={listing.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedListingIds.includes(listing.id)}
                          onChange={(e) =>
                            handleSelectListing(listing.id, e.target.checked)
                          }
                          className="rounded border-gray-300"
                        />
                      </td>
                      {columnVisibility.isColumnVisible('game') && (
                        <td className="px-6 py-4">
                          <Link
                            href={`/listings/${listing.id}`}
                            target="_blank"
                            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {listing.game.title}
                          </Link>
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
                      {columnVisibility.isColumnVisible('author') && (
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          {listing.author?.name ?? 'N/A'}
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('device') && (
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          {listing.device.brand.name} {listing.device.modelName}
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('emulator') && (
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          <EmulatorIcon
                            name={listing.emulator.name}
                            logo={listing.emulator.logo}
                            showLogo={
                              isEmulatorLogosHydrated && showEmulatorLogos
                            }
                            size="sm"
                          />
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('submittedAt') && (
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
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-600 border-green-400 hover:bg-green-50 dark:text-green-400 dark:border-green-500 dark:hover:bg-green-700/20"
                              onClick={() =>
                                openApprovalModal(
                                  listing,
                                  ApprovalStatus.APPROVED,
                                )
                              }
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 border-red-400 hover:bg-red-50 dark:text-red-400 dark:border-red-500 dark:hover:bg-red-700/20"
                              onClick={() =>
                                openApprovalModal(
                                  listing,
                                  ApprovalStatus.REJECTED,
                                )
                              }
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                            <ViewButton
                              href={`/listings/${listing.id}`}
                              title="View Details"
                            />
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <Pagination
                  currentPage={table.page}
                  totalPages={pagination.pages}
                  onPageChange={table.setPage}
                />
              </div>
            )}
          </>
        )}
      </AdminTableContainer>

      {/* Approval Modal */}
      {showApprovalModal && selectedListingForApproval && approvalDecision && (
        <ApprovalModal
          showApprovalModal={showApprovalModal}
          closeApprovalModal={closeApprovalModal}
          selectedListingForApproval={selectedListingForApproval}
          approvalDecision={approvalDecision}
          approvalNotes={approvalNotes}
          setApprovalNotes={setApprovalNotes}
          handleApprovalSubmit={handleApprovalSubmit}
          approveMutation={approveMutation}
          rejectMutation={rejectMutation}
        />
      )}
    </div>
  )
}

export default AdminApprovalsPage
