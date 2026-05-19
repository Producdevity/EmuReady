'use client'

import { Clock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { isEmpty } from 'remeda'
import { useAdminTable, useReviewRiskFilter } from '@/app/admin/hooks'
import { confirmBulkApproval } from '@/app/admin/utils'
import {
  AdminErrorState,
  AdminPageLayout,
  AdminTableContainer,
  AdminNotificationBanner,
  AdminStatsDisplay,
  AdminSearchFilters,
  AdminTableNoResults,
  ReviewRiskFilterButton,
  ReviewRiskIndicator,
} from '@/components/admin'
import {
  CompatibilityReportReviewModalAdapter,
  useCompatibilityReportReviewDecisionModal,
} from '@/components/compatibility/review'
import { EmulatorIcon, SystemIcon } from '@/components/icons'
import {
  ApproveButton,
  BulkActions,
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
  ViewUserButton,
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
import { logger } from '@/lib/logger'
import toast from '@/lib/toast'
import { type RouterOutput, type RouterInput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { hasPermission, PERMISSIONS } from '@/utils/permission-system'
import { ApprovalStatus } from '@orm'

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
  { key: 'author', label: 'Author', defaultVisible: true },
  { key: 'device', label: 'Device', defaultVisible: true },
  { key: 'emulator', label: 'Emulator', defaultVisible: true },
  { key: 'submittedAt', label: 'Submitted', defaultVisible: false },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

function AdminApprovalsPage() {
  const router = useRouter()

  const table = useAdminTable<ApprovalSortField>({
    defaultLimit: 20,
    defaultSortField: 'createdAt',
    defaultSortDirection: 'asc',
  })

  const columnVisibility = useColumnVisibility(APPROVALS_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminApprovals,
  })

  const [showSystemIcons, setShowSystemIcons, isSystemIconsHydrated] = useLocalStorage(
    storageKeys.showSystemIcons,
    true,
  )

  const emulatorLogos = useEmulatorLogos()
  const [selectedListingIds, setSelectedListingIds] = useState<string[]>([])
  const reviewRiskFilter = useReviewRiskFilter({
    clearSelection: () => setSelectedListingIds([]),
    resetPage: () => table.setPage(1),
  })

  const currentUserQuery = api.users.me.useQuery()
  const pendingListingsQuery = api.listings.getPending.useQuery({
    page: table.page,
    limit: table.limit,
    sortField: table.sortField ?? null,
    sortDirection: table.sortDirection ?? null,
    search: isEmpty(table.search) ? null : table.search,
    riskFilter: reviewRiskFilter.riskFilter,
  })

  const gameStatsQuery = api.games.stats.useQuery()
  const listingStatsQuery = api.listings.stats.useQuery()

  const approvalModal = useCompatibilityReportReviewDecisionModal<PendingListing>()
  const confirm = useConfirmDialog()

  const utils = api.useUtils()

  const invalidateQueries = async () => {
    // Invalidate all related queries
    await Promise.all([
      pendingListingsQuery.refetch(),
      utils.listings.getProcessed.invalidate(),
      utils.listings.get.invalidate(),
      utils.listings.stats.invalidate(),
      utils.games.stats.invalidate(),
      // Force refetch the stats
      utils.listings.stats.refetch(),
      utils.games.stats.refetch(),
    ])
  }

  const approveMutation = api.listings.approveListing.useMutation({
    onSuccess: async (_result, variables) => {
      toast.success('Listing approved successfully!')

      analytics.admin.listingApproved({
        listingId: variables.listingId,
        adminId: currentUserQuery.data?.id ?? 'unknown',
        gameId: approvalModal.selectedReport?.game.id,
        systemId: approvalModal.selectedReport?.game.system.id,
      })

      await invalidateQueries()
      approvalModal.close()
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
        reason: variables.notes ?? undefined,
        gameId: approvalModal.selectedReport?.game.id,
        systemId: approvalModal.selectedReport?.game.system.id,
      })

      await invalidateQueries()
      approvalModal.close()
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
        adminId: currentUserQuery.data?.id ?? 'unknown',
      })

      await invalidateQueries()
      setSelectedListingIds([])
    },
    onError: (err) => {
      logger.error('Failed to bulk approve listings:', err)
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
        adminId: currentUserQuery.data?.id ?? 'unknown',
      })

      await invalidateQueries()
      setSelectedListingIds([])
    },
    onError: (err) => {
      logger.error('Failed to bulk reject listings:', err)
      toast.error(`Failed to bulk reject listings: ${getErrorMessage(err)}`)
    },
  })

  const handleBulkApprovalWithConfirmation = async (listingIds: string[]) => {
    const confirmed = await confirmBulkApproval(listings, listingIds, confirm, 'listings')
    if (!confirmed) return

    await bulkApproveMutation.mutateAsync({ listingIds })
    await invalidateQueries()
    approvalModal.close()
  }

  const handleSelectAll = (selected: boolean) => {
    setSelectedListingIds(selected ? listings.map((l) => l.id) : [])
  }

  const handleSelectListing = (listingId: string, selected: boolean) => {
    setSelectedListingIds((prev) =>
      selected ? [...prev, listingId] : prev.filter((id) => id !== listingId),
    )
  }

  const handleApprovalSubmit = () => {
    if (!approvalModal.selectedReport || !approvalModal.decision) return
    if (approvalModal.decision === ApprovalStatus.APPROVED) {
      return approveMutation.mutate({
        listingId: approvalModal.selectedReport.id,
      } satisfies RouterInput['listings']['approveListing'])
    }
    if (approvalModal.decision === ApprovalStatus.REJECTED) {
      return rejectMutation.mutate({
        listingId: approvalModal.selectedReport.id,
        notes: approvalModal.notes || null,
      } satisfies RouterInput['listings']['rejectListing'])
    }
  }

  if (pendingListingsQuery.error) {
    return (
      <AdminErrorState
        message={`Error loading pending listings: ${pendingListingsQuery.error.message}`}
        onRetry={() => {
          void pendingListingsQuery.refetch()
        }}
      />
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

      <AdminSearchFilters<ApprovalSortField> table={table} searchPlaceholder="Search listings...">
        <ReviewRiskFilterButton
          isActive={reviewRiskFilter.isRiskOnly}
          onToggle={reviewRiskFilter.toggleRiskFilter}
        />
      </AdminSearchFilters>

      {/* Bulk Actions */}
      {listings.length > 0 && (
        <BulkActions
          selectedIds={selectedListingIds}
          totalCount={listings.length}
          onSelectAll={handleSelectAll}
          onClearSelection={() => setSelectedListingIds([])}
          actions={{
            openInTabs: {
              label: 'Open in Tabs',
              getUrl: (id) => `/listings/${id}`,
            },
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
          <AdminTableNoResults
            icon={Clock}
            hasQuery={!!table.search || reviewRiskFilter.isRiskOnly}
          />
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
                          <span>
                            {listing.author ? (
                              <Link
                                href={`/admin/users?userId=${listing.author.id}`}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
                                title="View user details"
                              >
                                {listing.author.name}
                              </Link>
                            ) : (
                              'N/A'
                            )}
                          </span>
                          <ReviewRiskIndicator
                            authorRiskProfile={listing.authorRiskProfile}
                            submissionRiskProfile={listing.submissionRiskProfile}
                            size="sm"
                            onInvestigate={(authorId) =>
                              router.push(`/admin/users?userId=${authorId}&tab=reports`)
                            }
                          />
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
                          {hasPermission(
                            currentUserQuery.data?.permissions,
                            PERMISSIONS.APPROVE_LISTINGS,
                          ) && (
                            <ApproveButton
                              title="Approve Listing"
                              onClick={() => approvalModal.open(listing, ApprovalStatus.APPROVED)}
                              disabled={approveMutation.isPending}
                            />
                          )}
                          {hasPermission(
                            currentUserQuery.data?.permissions,
                            PERMISSIONS.APPROVE_LISTINGS,
                          ) && (
                            <RejectButton
                              title="Reject Listing"
                              onClick={() => approvalModal.open(listing, ApprovalStatus.REJECTED)}
                              disabled={rejectMutation.isPending}
                            />
                          )}
                          {hasPermission(
                            currentUserQuery.data?.permissions,
                            PERMISSIONS.MANAGE_USERS,
                          ) && (
                            <ViewUserButton
                              title="View User Details"
                              href={`/admin/users?userId=${listing.author.id}`}
                            />
                          )}
                          <ViewButton title="View Details" href={`/listings/${listing.id}`} />
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
            page={table.page}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={table.setPage}
          />
        </div>
      )}

      {approvalModal.isOpen && approvalModal.selectedReport && approvalModal.decision && (
        <CompatibilityReportReviewModalAdapter
          isOpen={approvalModal.isOpen}
          onClose={approvalModal.close}
          decision={approvalModal.decision}
          reportLabel="Listing"
          report={approvalModal.selectedReport}
          rejectionNotes={approvalModal.notes}
          onRejectionNotesChange={approvalModal.setNotes}
          onSubmit={handleApprovalSubmit}
          isSubmitting={approveMutation.isPending || rejectMutation.isPending}
        />
      )}
    </AdminPageLayout>
  )
}

export default AdminApprovalsPage
