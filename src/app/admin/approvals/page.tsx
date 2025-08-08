'use client'

import { Clock, Flag, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { isEmpty } from 'remeda'
import { useAdminTable } from '@/app/admin/hooks'
import {
  AdminPageLayout,
  AdminTableContainer,
  AdminNotificationBanner,
  AdminStatsDisplay,
  AdminSearchFilters,
  AdminTableNoResults,
} from '@/components/admin'
import { EmulatorIcon, SystemIcon } from '@/components/icons'
import {
  ApproveButton,
  BulkActions,
  Button,
  ColumnVisibilityControl,
  DisplayToggleButton,
  LoadingSpinner,
  LocalizedDate,
  Pagination,
  RejectButton,
  SortableHeader,
  ViewButton,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  useConfirmDialog,
} from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import {
  useEmulatorLogos,
  useLocalStorage,
  useColumnVisibility,
  type ColumnDefinition,
} from '@/hooks'
import analytics from '@/lib/analytics'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterOutput, type RouterInput } from '@/types/trpc'
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

  const [showSystemIcons, setShowSystemIcons, isSystemIconsHydrated] = useLocalStorage(
    storageKeys.showSystemIcons,
    false,
  )

  const emulatorLogos = useEmulatorLogos()

  const currentUserQuery = api.users.me.useQuery()
  const pendingListingsQuery = api.listings.getPending.useQuery({
    page: table.page,
    limit: table.limit,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
    search: isEmpty(table.search) ? undefined : table.search,
  })

  const gameStatsQuery = api.games.getStats.useQuery()
  const listingStatsQuery = api.listings.getStats.useQuery()

  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [selectedListingForApproval, setSelectedListingForApproval] =
    useState<PendingListing | null>(null)
  const [approvalNotes, setApprovalNotes] = useState('')
  const [approvalDecision, setApprovalDecision] = useState<ApprovalStatus | null>(null)
  const [selectedListingIds, setSelectedListingIds] = useState<string[]>([])
  const confirm = useConfirmDialog()

  const utils = api.useUtils()

  const invalidateQueries = async () => {
    // Invalidate all related queries
    await Promise.all([
      pendingListingsQuery.refetch(),
      utils.listings.getProcessed.invalidate(),
      utils.listings.get.invalidate(),
      utils.listings.getStats.invalidate(),
      utils.games.getStats.invalidate(),
      // Force refetch the stats
      utils.listings.getStats.refetch(),
      utils.games.getStats.refetch(),
    ])
  }

  const approveMutation = api.listings.approveListing.useMutation({
    onSuccess: async (_result, variables) => {
      toast.success('Listing approved successfully!')

      analytics.admin.listingApproved({
        listingId: variables.listingId,
        adminId: currentUserQuery.data?.id ?? 'unknown',
        gameId: selectedListingForApproval?.game.id,
        systemId: selectedListingForApproval?.game.system.id,
      })

      await invalidateQueries()
      closeApprovalModal()
    },
    onError: (err) => {
      console.error('Failed to approve listing:', err)
      toast.error(`Failed to approve listing: ${getErrorMessage(err)}`)
    },
  })

  const rejectMutation = api.listings.rejectListing.useMutation({
    onSuccess: async (_result, variables) => {
      toast.success('Listing rejected successfully!')

      analytics.admin.listingRejected({
        listingId: variables.listingId,
        adminId: currentUserQuery.data?.id ?? 'unknown',
        reason: variables.notes,
        gameId: selectedListingForApproval?.game.id,
        systemId: selectedListingForApproval?.game.system.id,
      })

      await invalidateQueries()
      closeApprovalModal()
    },
    onError: (err) => {
      console.error('Failed to reject listing:', err)
      toast.error(`Failed to reject listing: ${getErrorMessage(err)}`)
    },
  })

  const bulkApproveMutation = api.listings.bulkApproveListing.useMutation({
    onSuccess: async (result, variables) => {
      toast.success(result.message)

      analytics.admin.bulkOperation({
        operation: 'approve',
        entityType: 'listing',
        count: variables.listingIds.length,
        adminId: 'current-admin', // Replace with actual admin ID
      })

      await invalidateQueries()
      setSelectedListingIds([])
    },
    onError: (err) => {
      console.error('Failed to bulk approve listings:', err)
      toast.error(`Failed to bulk approve listings: ${getErrorMessage(err)}`)
    },
  })

  const bulkRejectMutation = api.listings.bulkRejectListing.useMutation({
    onSuccess: async (result, variables) => {
      toast.success(result.message)

      analytics.admin.bulkOperation({
        operation: 'reject',
        entityType: 'listing',
        count: variables.listingIds.length,
        adminId: 'current-admin', // Replace with actual admin ID
      })

      await invalidateQueries()
      setSelectedListingIds([])
    },
    onError: (err) => {
      console.error('Failed to bulk reject listings:', err)
      toast.error(`Failed to bulk reject listings: ${getErrorMessage(err)}`)
    },
  })

  // Handle bulk approval with confirmation for reported users
  const handleBulkApprovalWithConfirmation = async (listingIds: string[]) => {
    const selectedListings = listings.filter((listing) => listingIds.includes(listing.id))
    const reportedUserListings = selectedListings.filter(
      (listing) => listing.authorReportStats?.hasReports,
    )

    if (reportedUserListings.length > 0) {
      const reportedUsers = [
        ...new Set(reportedUserListings.map((l) => l.author?.name || 'Unknown')),
      ]
      const totalReports = reportedUserListings.reduce(
        (sum, l) => sum + (l.authorReportStats?.totalReports || 0),
        0,
      )

      const confirmed = await confirm({
        title: 'Bulk Approval Warning',
        description: `You are about to approve ${listingIds.length} listings, including ${reportedUserListings.length} from reported users.\n\nReported users in this selection:\n• ${reportedUsers.join('\n• ')}\n\nThese users have a total of ${totalReports} active reports against their listings.\n\nAre you sure you want to proceed with the bulk approval?`,
        confirmText: 'Yes, Approve All',
        cancelText: 'Cancel',
      })

      if (!confirmed) return
    } else {
      const confirmed = await confirm({
        title: 'Bulk Approval Confirmation',
        description: `You are about to approve ${listingIds.length} listings. Are you sure you want to proceed?`,
        confirmText: 'Yes, Approve All',
        cancelText: 'Cancel',
      })

      if (!confirmed) return
    }

    // Proceed with bulk approval
    await bulkApproveMutation.mutateAsync({ listingIds })
    await invalidateQueries()
    closeApprovalModal()
  }

  const handleSelectAll = (selected: boolean) => {
    setSelectedListingIds(selected ? listings.map((l) => l.id) : [])
  }

  const handleSelectListing = (listingId: string, selected: boolean) => {
    setSelectedListingIds((prev) =>
      selected ? [...prev, listingId] : prev.filter((id) => id !== listingId),
    )
  }

  const openApprovalModal = (listing: PendingListing, decision: ApprovalStatus) => {
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
    if (!selectedListingForApproval || !approvalDecision) return
    if (approvalDecision === ApprovalStatus.APPROVED) {
      return approveMutation.mutate({
        listingId: selectedListingForApproval.id,
      } satisfies RouterInput['listings']['approveListing'])
    }
    if (approvalDecision === ApprovalStatus.REJECTED) {
      return rejectMutation.mutate({
        listingId: selectedListingForApproval.id,
        notes: approvalNotes || undefined,
      } satisfies RouterInput['listings']['rejectListing'])
    }
  }

  if (pendingListingsQuery.error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 text-lg">
            Error loading pending listings: {pendingListingsQuery.error.message}
          </p>
          <Button onClick={() => pendingListingsQuery.refetch()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const listings = pendingListingsQuery.data?.listings ?? []
  const pagination = pendingListingsQuery.data?.pagination

  return (
    <AdminPageLayout
      title="Listing Approvals"
      description="Review and approve or reject pending listing submissions"
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
            columns={APPROVALS_COLUMNS}
            columnVisibility={columnVisibility}
          />
        </>
      }
    >
      <AdminStatsDisplay
        stats={[
          {
            label: 'Total',
            value: listingStatsQuery.data?.total,
            color: 'blue',
          },
          {
            label: 'Pending',
            value: listingStatsQuery.data?.pending,
            color: 'yellow',
          },
          {
            label: 'Approved',
            value: listingStatsQuery.data?.approved,
            color: 'green',
          },
          {
            label: 'Rejected',
            value: listingStatsQuery.data?.rejected,
            color: 'red',
          },
        ]}
        isLoading={listingStatsQuery.isPending}
      />

      {gameStatsQuery.data && gameStatsQuery.data.pending > 0 && (
        <AdminNotificationBanner
          type="warning"
          title="Pending Games Awaiting Approval"
          message={`There ${gameStatsQuery.data.pending === 1 ? 'is' : 'are'} ${gameStatsQuery.data.pending} game${gameStatsQuery.data.pending === 1 ? '' : 's'} waiting for admin approval.`}
          actionLabel="Review Games"
          actionUrl="/admin/games/approvals"
        />
      )}

      <AdminSearchFilters<ApprovalSortField> table={table} searchPlaceholder="Search listings..." />

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
              onAction: handleBulkApprovalWithConfirmation,
            },
            reject: {
              label: 'Reject Selected',
              onAction: async (listingIds, notes) => {
                await bulkRejectMutation.mutateAsync({ listingIds, notes })
                await invalidateQueries()
              },
            },
          }}
        />
      )}

      {/* Listings Table */}
      <AdminTableContainer>
        {pendingListingsQuery.isPending ? (
          <LoadingSpinner text="Loading pending listings..." />
        ) : listings.length === 0 ? (
          <AdminTableNoResults icon={Clock} hasQuery={!!table.search} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedListingIds.length === listings.length && listings.length > 0}
                      onChange={(ev) => handleSelectAll(ev.target.checked)}
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
                  <tr key={listing.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedListingIds.includes(listing.id)}
                        onChange={(e) => handleSelectListing(listing.id, e.target.checked)}
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
                        {isSystemIconsHydrated && showSystemIcons && listing.game.system?.key ? (
                          <div className="flex items-center gap-2">
                            <SystemIcon
                              name={listing.game.system.name}
                              systemKey={listing.game.system.key}
                              size="md"
                            />
                          </div>
                        ) : (
                          listing.game.system.name
                        )}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('author') && (
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        <div className="flex items-center gap-2">
                          <span>{listing.author?.name ?? 'N/A'}</span>
                          {listing.authorReportStats?.hasReports && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1">
                                  <Flag className="w-4 h-4 text-red-500" />
                                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-sm">
                                  <p className="font-medium text-red-600 mb-1">⚠️ Reported User</p>
                                  <p>
                                    This user has {listing.authorReportStats.totalReports} active
                                    reports
                                  </p>
                                  <p>
                                    against {listing.authorReportStats.reportedListingsCount} of
                                    their listings.
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Consider reviewing carefully before approval.
                                  </p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
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
                          showLogo={emulatorLogos.isHydrated && emulatorLogos.showEmulatorLogos}
                          size="sm"
                        />
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('submittedAt') && (
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="cursor-help">
                              <LocalizedDate date={listing.createdAt} format="timeAgo" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <LocalizedDate date={listing.createdAt} format="dateTime" />
                          </TooltipContent>
                        </Tooltip>
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('actions') && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <ApproveButton
                            title="Approve Listing"
                            onClick={() => openApprovalModal(listing, ApprovalStatus.APPROVED)}
                          />

                          <RejectButton
                            onClick={() => openApprovalModal(listing, ApprovalStatus.REJECTED)}
                            title="Reject Listing"
                          />
                          <ViewButton href={`/listings/${listing.id}`} title="View Details" />
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminTableContainer>

      {pagination && pagination.pages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <Pagination
            currentPage={table.page}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={table.setPage}
          />
        </div>
      )}

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
    </AdminPageLayout>
  )
}

export default AdminApprovalsPage
