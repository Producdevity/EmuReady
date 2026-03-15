'use client'

import { Clock } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { isEmpty } from 'remeda'
import { useAdminTable } from '@/app/admin/hooks'
import { confirmBulkApproval } from '@/app/admin/utils'
import {
  AdminPageLayout,
  AdminTableContainer,
  AdminNotificationBanner,
  AdminSearchFilters,
  AdminStatsDisplay,
  AdminTableNoResults,
} from '@/components/admin'
import { EmulatorIcon, SystemIcon } from '@/components/icons'
import {
  ApproveButton,
  AuthorRiskIndicator,
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
import getImageUrl from '@/utils/getImageUrl'
import { hasPermission, PERMISSIONS } from '@/utils/permission-system'
import { ApprovalStatus } from '@orm'
import ApprovalModal from './components/ApprovalModal'

type PendingPcListing = RouterOutput['pcListings']['pending']['pcListings'][number]
type PcApprovalSortField =
  | 'game.title'
  | 'game.system.name'
  | 'cpu'
  | 'gpu'
  | 'emulator.name'
  | 'createdAt'
  | 'author.name'

const PC_APPROVALS_COLUMNS: ColumnDefinition[] = [
  { key: 'thumbnail', label: 'Thumbnail', defaultVisible: true },
  { key: 'game', label: 'Game', defaultVisible: true },
  { key: 'system', label: 'System', defaultVisible: true },
  { key: 'cpu', label: 'CPU', defaultVisible: true },
  { key: 'gpu', label: 'GPU', defaultVisible: true },
  { key: 'emulator', label: 'Emulator', defaultVisible: true },
  { key: 'user', label: 'User', defaultVisible: true },
  { key: 'createdAt', label: 'Submitted', defaultVisible: false },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

function PcListingApprovalsPage() {
  const router = useRouter()

  const table = useAdminTable<PcApprovalSortField>({
    defaultLimit: 20,
    defaultSortField: 'createdAt',
    defaultSortDirection: 'asc',
  })

  const columnVisibility = useColumnVisibility(PC_APPROVALS_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminPcListingApprovals,
  })

  const [showSystemIcons, setShowSystemIcons, isSystemIconsHydrated] = useLocalStorage(
    storageKeys.showSystemIcons,
    true,
  )

  const emulatorLogos = useEmulatorLogos()

  const currentUserQuery = api.users.me.useQuery()
  const pendingPcListingsQuery = api.pcListings.pending.useQuery({
    page: table.page,
    limit: table.limit,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
    search: isEmpty(table.search) ? undefined : table.search,
  })

  const gameStatsQuery = api.games.stats.useQuery()
  const pcListingsStatsQuery = api.pcListings.stats.useQuery(undefined, {
    refetchInterval: 30000,
  })

  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [selectedListingForApproval, setSelectedListingForApproval] =
    useState<PendingPcListing | null>(null)
  const [approvalNotes, setApprovalNotes] = useState('')
  const [approvalDecision, setApprovalDecision] = useState<ApprovalStatus | null>(null)
  const [selectedListingIds, setSelectedListingIds] = useState<string[]>([])
  const confirm = useConfirmDialog()

  const utils = api.useUtils()

  const invalidateQueries = async () => {
    await Promise.all([
      pendingPcListingsQuery.refetch(),
      utils.pcListings.stats.invalidate(),
      utils.games.stats.invalidate(),
      utils.pcListings.stats.refetch(),
      utils.games.stats.refetch(),
    ])
  }

  const approveMutation = api.pcListings.approve.useMutation({
    onSuccess: async (_result, variables) => {
      toast.success('PC Listing approved successfully!')

      analytics.admin.listingApproved({
        listingId: variables.pcListingId,
        adminId: currentUserQuery.data?.id ?? 'unknown',
        gameId: selectedListingForApproval?.game.id,
        systemId: selectedListingForApproval?.game.system.id,
      })

      await invalidateQueries()
      closeApprovalModal()
    },
    onError: (err) => {
      logger.error('Failed to approve PC listing:', err)
      toast.error(`Failed to approve PC listing: ${getErrorMessage(err)}`)
    },
  })

  const rejectMutation = api.pcListings.reject.useMutation({
    onSuccess: async (_result, variables) => {
      toast.success('PC Listing rejected successfully!')

      analytics.admin.listingRejected({
        listingId: variables.pcListingId,
        adminId: currentUserQuery.data?.id ?? 'unknown',
        reason: variables.notes ?? undefined,
        gameId: selectedListingForApproval?.game.id,
        systemId: selectedListingForApproval?.game.system.id,
      })

      await invalidateQueries()
      closeApprovalModal()
    },
    onError: (err) => {
      logger.error('Failed to reject PC listing:', err)
      toast.error(`Failed to reject PC listing: ${getErrorMessage(err)}`)
    },
  })

  const bulkApproveMutation = api.pcListings.bulkApprove.useMutation({
    onSuccess: async (result, variables) => {
      toast.success(`Approved ${result.count} PC listings`)

      analytics.admin.bulkOperation({
        operation: 'approve',
        entityType: 'listing',
        count: variables.pcListingIds.length,
        adminId: currentUserQuery.data?.id ?? 'unknown',
      })

      await invalidateQueries()
      setSelectedListingIds([])
    },
    onError: (err) => {
      logger.error('Failed to bulk approve PC listings:', err)
      toast.error(`Failed to bulk approve PC listings: ${getErrorMessage(err)}`)
    },
  })

  const bulkRejectMutation = api.pcListings.bulkReject.useMutation({
    onSuccess: async (result, variables) => {
      toast.success(`Rejected ${result.count} PC listings`)

      analytics.admin.bulkOperation({
        operation: 'reject',
        entityType: 'listing',
        count: variables.pcListingIds.length,
        adminId: currentUserQuery.data?.id ?? 'unknown',
      })

      await invalidateQueries()
      setSelectedListingIds([])
    },
    onError: (err) => {
      logger.error('Failed to bulk reject PC listings:', err)
      toast.error(`Failed to bulk reject PC listings: ${getErrorMessage(err)}`)
    },
  })

  const handleBulkApprovalWithConfirmation = async (listingIds: string[]) => {
    const confirmed = await confirmBulkApproval(pcListings, listingIds, confirm, 'PC listings')
    if (!confirmed) return

    await bulkApproveMutation.mutateAsync({ pcListingIds: listingIds })
    await invalidateQueries()
    closeApprovalModal()
  }

  const handleSelectAll = (selected: boolean) => {
    setSelectedListingIds(selected ? pcListings.map((l) => l.id) : [])
  }

  const handleSelectListing = (listingId: string, selected: boolean) => {
    setSelectedListingIds((prev) =>
      selected ? [...prev, listingId] : prev.filter((id) => id !== listingId),
    )
  }

  const openApprovalModal = (listing: PendingPcListing, decision: ApprovalStatus) => {
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
        pcListingId: selectedListingForApproval.id,
      } satisfies RouterInput['pcListings']['approve'])
    }
    if (approvalDecision === ApprovalStatus.REJECTED) {
      return rejectMutation.mutate({
        pcListingId: selectedListingForApproval.id,
        notes: approvalNotes || undefined,
      } satisfies RouterInput['pcListings']['reject'])
    }
  }

  if (pendingPcListingsQuery.error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 text-lg">
            Error loading pending PC listings: {pendingPcListingsQuery.error.message}
          </p>
          <Button onClick={() => pendingPcListingsQuery.refetch()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const pcListings = pendingPcListingsQuery.data?.pcListings ?? []
  const pagination = pendingPcListingsQuery.data?.pagination

  return (
    <AdminPageLayout
      title="PC Listing Approvals"
      description="Review and approve or reject pending PC listing submissions"
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
            columns={PC_APPROVALS_COLUMNS}
            columnVisibility={columnVisibility}
          />
        </>
      }
    >
      <AdminStatsDisplay
        stats={[
          {
            label: 'Total',
            value: pcListingsStatsQuery.data?.total,
            color: 'blue',
          },
          {
            label: 'Pending',
            value: pcListingsStatsQuery.data?.pending,
            color: 'yellow',
          },
          {
            label: 'Approved',
            value: pcListingsStatsQuery.data?.approved,
            color: 'green',
          },
          {
            label: 'Rejected',
            value: pcListingsStatsQuery.data?.rejected,
            color: 'red',
          },
        ]}
        isLoading={pcListingsStatsQuery.isPending}
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

      <AdminSearchFilters<PcApprovalSortField>
        table={table}
        searchPlaceholder="Search PC listings..."
      />

      {pcListings.length > 0 && (
        <BulkActions
          selectedIds={selectedListingIds}
          totalCount={pcListings.length}
          onSelectAll={handleSelectAll}
          onClearSelection={() => setSelectedListingIds([])}
          actions={{
            openInTabs: {
              label: 'Open in Tabs',
              getUrl: (id) => `/pc-listings/${id}`,
            },
            approve: {
              label: 'Approve Selected',
              onAction: handleBulkApprovalWithConfirmation,
            },
            reject: {
              label: 'Reject Selected',
              onAction: async (listingIds, notes) => {
                await bulkRejectMutation.mutateAsync({ pcListingIds: listingIds, notes })
                await invalidateQueries()
              },
            },
          }}
        />
      )}

      <AdminTableContainer>
        {pendingPcListingsQuery.isPending ? (
          <LoadingSpinner text="Loading pending PC listings..." />
        ) : pcListings.length === 0 ? (
          <AdminTableNoResults icon={Clock} hasQuery={!!table.search} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedListingIds.length === pcListings.length && pcListings.length > 0
                      }
                      onChange={(ev) => handleSelectAll(ev.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </th>
                  {columnVisibility.isColumnVisible('thumbnail') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Thumbnail
                    </th>
                  )}
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
                  {columnVisibility.isColumnVisible('cpu') && (
                    <SortableHeader
                      label="CPU"
                      field="cpu"
                      currentSortField={table.sortField}
                      currentSortDirection={table.sortDirection}
                      onSort={table.handleSort}
                      className="px-6 py-3 text-left"
                    />
                  )}
                  {columnVisibility.isColumnVisible('gpu') && (
                    <SortableHeader
                      label="GPU"
                      field="gpu"
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
                  {columnVisibility.isColumnVisible('user') && (
                    <SortableHeader
                      label="User"
                      field="author.name"
                      currentSortField={table.sortField}
                      currentSortDirection={table.sortDirection}
                      onSort={table.handleSort}
                      className="px-6 py-3 text-left"
                    />
                  )}
                  {columnVisibility.isColumnVisible('createdAt') && (
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
                {pcListings.map((listing: PendingPcListing) => (
                  <tr key={listing.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedListingIds.includes(listing.id)}
                        onChange={(e) => handleSelectListing(listing.id, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    {columnVisibility.isColumnVisible('thumbnail') && (
                      <td className="px-6 py-4">
                        {listing.game.imageUrl && (
                          <Image
                            src={getImageUrl(listing.game.imageUrl, listing.game.title)}
                            alt={listing.game.title}
                            width={40}
                            height={40}
                            className="object-cover rounded"
                            unoptimized
                          />
                        )}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('game') && (
                      <td className="px-6 py-4">
                        <Link
                          href={`/pc-listings/${listing.id}`}
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
                    {columnVisibility.isColumnVisible('cpu') && (
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {listing.cpu.brand.name} {listing.cpu.modelName}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('gpu') && (
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {listing.gpu?.brand.name} {listing.gpu?.modelName}
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
                    {columnVisibility.isColumnVisible('user') && (
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
                          <AuthorRiskIndicator
                            riskProfile={listing.authorRiskProfile}
                            size="sm"
                            onInvestigate={(authorId) =>
                              router.push(`/admin/users?userId=${authorId}&tab=reports`)
                            }
                          />
                        </div>
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('createdAt') && (
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
                              title="Approve PC Listing"
                              onClick={() => openApprovalModal(listing, ApprovalStatus.APPROVED)}
                              disabled={approveMutation.isPending}
                            />
                          )}
                          {hasPermission(
                            currentUserQuery.data?.permissions,
                            PERMISSIONS.APPROVE_LISTINGS,
                          ) && (
                            <RejectButton
                              title="Reject PC Listing"
                              onClick={() => openApprovalModal(listing, ApprovalStatus.REJECTED)}
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
                          <ViewButton title="View PC Listing" href={`/pc-listings/${listing.id}`} />
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

      {showApprovalModal && selectedListingForApproval && approvalDecision && (
        <ApprovalModal
          showApprovalModal={showApprovalModal}
          closeApprovalModal={closeApprovalModal}
          selectedPcListingForApproval={selectedListingForApproval}
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

export default PcListingApprovalsPage
