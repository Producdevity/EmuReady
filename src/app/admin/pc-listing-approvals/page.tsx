'use client'

import { Search, Flag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useAdminTable } from '@/app/admin/hooks'
import {
  AdminPageLayout,
  AdminTableContainer,
  AdminNotificationBanner,
  AdminSearchFilters,
  AdminStatsDisplay,
} from '@/components/admin'
import { EmulatorIcon, SystemIcon } from '@/components/icons'
import {
  ApproveButton,
  ColumnVisibilityControl,
  DisplayToggleButton,
  Input,
  LoadingSpinner,
  RejectButton,
  ViewButton,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  useConfirmDialog,
  Pagination,
} from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import {
  useEmulatorLogos,
  useLocalStorage,
  useColumnVisibility,
  type ColumnDefinition,
} from '@/hooks'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterOutput } from '@/types/trpc'
import { formatDateTime, formatTimeAgo } from '@/utils/date'
import getErrorMessage from '@/utils/getErrorMessage'
import ApprovalModal from './components/ApprovalModal'

type PendingPcListing =
  RouterOutput['pcListings']['pending']['pcListings'][number]
type ApprovalSortField =
  | 'game.title'
  | 'cpu'
  | 'gpu'
  | 'emulator.name'
  | 'createdAt'
  | 'author.name'

const PC_APPROVALS_COLUMNS: ColumnDefinition[] = [
  { key: 'game', label: 'Game', defaultVisible: true },
  { key: 'cpu', label: 'CPU', defaultVisible: true },
  { key: 'gpu', label: 'GPU', defaultVisible: true },
  { key: 'emulator', label: 'Emulator', defaultVisible: true },
  { key: 'user', label: 'User', defaultVisible: true },
  { key: 'createdAt', label: 'Submitted', defaultVisible: true },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

function PcListingApprovalsPage() {
  const table = useAdminTable<ApprovalSortField>({
    defaultLimit: 20,
    defaultSortField: 'createdAt',
    defaultSortDirection: 'desc',
  })

  const columnVisibility = useColumnVisibility(PC_APPROVALS_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminApprovals,
  })

  const [showSystemIcons, setShowSystemIcons] = useLocalStorage(
    storageKeys.showSystemIcons,
    false,
  )

  const emulatorLogos = useEmulatorLogos()
  const confirm = useConfirmDialog()

  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [showModal, setShowModal] = useState(false)
  const [selectedListing, setSelectedListing] =
    useState<PendingPcListing | null>(null)

  const pendingPcListingsQuery = api.pcListings.pending.useQuery({
    page: table.page,
    limit: table.limit,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
    search: table.search || undefined,
  })

  const pcListingsStatsQuery = api.pcListings.stats.useQuery(undefined, {
    refetchInterval: 30000,
  })

  const utils = api.useUtils()
  const approveMutation = api.pcListings.approve.useMutation({
    onSuccess: () => {
      void utils.pcListings.pending.invalidate()
      void utils.pcListings.stats.invalidate()
      setSelectedRows(new Set())
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })

  const rejectMutation = api.pcListings.reject.useMutation({
    onSuccess: () => {
      void utils.pcListings.pending.invalidate()
      void utils.pcListings.stats.invalidate()
      setSelectedRows(new Set())
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })

  const bulkApproveMutation = api.pcListings.bulkApprove.useMutation({
    onSuccess: (data) => {
      void utils.pcListings.pending.invalidate()
      void utils.pcListings.stats.invalidate()
      setSelectedRows(new Set())
      toast.success(`Approved ${data.count} PC listings`)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })

  const bulkRejectMutation = api.pcListings.bulkReject.useMutation({
    onSuccess: (data) => {
      void utils.pcListings.pending.invalidate()
      void utils.pcListings.stats.invalidate()
      setSelectedRows(new Set())
      toast.success(`Rejected ${data.count} PC listings`)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })

  const handleApprove = async (id: string) => {
    await approveMutation.mutateAsync({ pcListingId: id })
  }

  const handleReject = async (id: string) => {
    await rejectMutation.mutateAsync({ pcListingId: id })
  }

  const handleBulkApprove = async () => {
    const hasReportedUsers = pendingPcListingsQuery.data?.pcListings.some(
      (listing) =>
        listing.id &&
        selectedRows.has(listing.id) &&
        (listing._count?.reports ?? 0) > 0,
    )

    if (hasReportedUsers) {
      const confirmed = await confirm({
        title: 'Approve PC Listings from Reported Users?',
        description:
          'Some selected PC listings are from users with active reports. Are you sure you want to approve them?',
      })
      if (!confirmed) return
    } else {
      const confirmed = await confirm({
        title: 'Bulk Approval Confirmation',
        description: `You are about to approve ${selectedRows.size} listings. Are you sure you want to proceed?`,
        confirmText: 'Yes, Approve All',
        cancelText: 'Cancel',
      })

      if (!confirmed) return
    }

    await bulkApproveMutation.mutateAsync({
      pcListingIds: Array.from(selectedRows),
    })
  }

  const handleBulkReject = async () => {
    const confirmed = await confirm({
      title: 'Bulk Reject Confirmation',
      description: `You are about to reject ${selectedRows.size} listings. Are you sure you want to proceed?`,
      confirmText: 'Yes, Reject All',
      cancelText: 'Cancel',
    })
    if (!confirmed) return

    await bulkRejectMutation.mutateAsync({
      pcListingIds: Array.from(selectedRows),
    })
  }

  const handleSelectAll = () => {
    if (!pendingPcListingsQuery.data) return
    const newSet =
      selectedRows.size === pendingPcListingsQuery.data.pcListings.length
        ? new Set<string>()
        : new Set(
            pendingPcListingsQuery.data.pcListings.map((listing) => listing.id),
          )
    setSelectedRows(newSet)
  }

  const handleSelectRow = (id: string) => {
    const newSet = new Set(selectedRows)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedRows(newSet)
  }

  const openModal = (listing: PendingPcListing) => {
    setSelectedListing(listing)
    setShowModal(true)
  }

  const renderRow = (listing: PendingPcListing) => (
    <tr
      key={listing.id}
      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={selectedRows.has(listing.id)}
          onChange={() => handleSelectRow(listing.id)}
          className="rounded border-gray-300 dark:border-gray-600"
        />
      </td>
      {columnVisibility.isColumnVisible('game') && (
        <td className="px-6 py-4">
          <div className="flex items-center space-x-2">
            {showSystemIcons && listing.game.imageUrl && (
              <Image
                src={listing.game.imageUrl}
                alt={listing.game.title}
                width={40}
                height={40}
                className="object-cover rounded"
                unoptimized
              />
            )}
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {listing.game.title}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <SystemIcon
                  systemKey={listing.game.system.key}
                  name={listing.game.system.name}
                  size="sm"
                />
                {listing.game.system.name}
              </div>
            </div>
          </div>
        </td>
      )}
      {columnVisibility.isColumnVisible('cpu') && (
        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
          {listing.cpu.brand.name} {listing.cpu.modelName}
        </td>
      )}
      {columnVisibility.isColumnVisible('gpu') && (
        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
          {listing.gpu?.brand.name} {listing.gpu?.modelName}
        </td>
      )}
      {columnVisibility.isColumnVisible('emulator') && (
        <td className="px-6 py-4">
          <div className="flex items-center space-x-2">
            <EmulatorIcon
              logo={listing.emulator.logo}
              name={listing.emulator.name}
              size="md"
              showLogo={emulatorLogos.showEmulatorLogos}
            />
            <span className="text-sm text-gray-900 dark:text-white">
              {listing.emulator.name}
            </span>
          </div>
        </td>
      )}
      {columnVisibility.isColumnVisible('user') && (
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <Link
              href={`/user/${listing.author.name}`}
              className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
            >
              {listing.author.name}
            </Link>
            {(listing._count?.reports ?? 0) > 0 && (
              <Tooltip>
                <TooltipTrigger>
                  <Flag className="w-4 h-4 text-red-500" />
                </TooltipTrigger>
                <TooltipContent>This listing has active reports</TooltipContent>
              </Tooltip>
            )}
          </div>
        </td>
      )}
      {columnVisibility.isColumnVisible('createdAt') && (
        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
          <Tooltip>
            <TooltipTrigger>
              <span className="cursor-help">
                {formatTimeAgo(listing.createdAt)}
              </span>
            </TooltipTrigger>
            <TooltipContent>{formatDateTime(listing.createdAt)}</TooltipContent>
          </Tooltip>
        </td>
      )}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end space-x-2">
          <ViewButton
            href={`/pc-listings/${listing.id}`}
            title="View PC Listing"
          />
          <ApproveButton
            onClick={() => openModal(listing)}
            disabled={approveMutation.isPending}
            title="Approve PC Listing"
          />
          <RejectButton
            onClick={() => handleReject(listing.id)}
            disabled={rejectMutation.isPending}
            title="Reject PC Listing"
          />
        </div>
      </td>
    </tr>
  )

  const renderEmptyState = () => (
    <tr>
      <td
        colSpan={columnVisibility.visibleColumns.size + 1}
        className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
      >
        {table.search
          ? 'No PC listings found matching your search'
          : 'No pending PC listings to review'}
      </td>
    </tr>
  )

  const isLoading =
    pendingPcListingsQuery.isPending ||
    approveMutation.isPending ||
    rejectMutation.isPending ||
    bulkApproveMutation.isPending ||
    bulkRejectMutation.isPending

  const data = pendingPcListingsQuery.data
  const pagination = pendingPcListingsQuery.data?.pagination

  return (
    <AdminPageLayout
      title="PC Listing Approvals"
      description="Review and approve user-submitted PC compatibility listings"
    >
      {pcListingsStatsQuery.data && pcListingsStatsQuery.data.pending > 0 && (
        <AdminNotificationBanner
          type="warning"
          title="Pending Approvals"
          message={`${pcListingsStatsQuery.data.pending} PC listings are waiting for approval`}
        />
      )}

      {pcListingsStatsQuery.data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Total
            </h3>
            <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {pcListingsStatsQuery.data.total}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-yellow-600">Pending</h3>
            <p className="text-2xl font-bold text-yellow-600">
              {pcListingsStatsQuery.data.pending}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-green-600">Approved</h3>
            <p className="text-2xl font-bold text-green-600">
              {pcListingsStatsQuery.data.approved}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-red-600">Rejected</h3>
            <p className="text-2xl font-bold text-red-600">
              {pcListingsStatsQuery.data.rejected}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Pending PC Listings
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                PC listings submitted by users that need approval
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ColumnVisibilityControl
                columns={PC_APPROVALS_COLUMNS}
                columnVisibility={columnVisibility}
              />
              <DisplayToggleButton
                showLogos={showSystemIcons}
                onToggle={() => setShowSystemIcons(!showSystemIcons)}
                isHydrated={true}
                logoLabel="Show Icons"
                nameLabel="Hide Icons"
              />
            </div>
          </div>
        </div>

        <AdminStatsDisplay
          stats={[
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

        <AdminSearchFilters<ApprovalSortField>
          table={table}
          searchPlaceholder="Search listings..."
        />

        <AdminTableContainer>
          <div className="mb-4 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search by game, CPU, GPU, emulator, or user..."
                  value={table.search}
                  onChange={(e) => table.setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {selectedRows.size > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={handleBulkApprove}
                  disabled={bulkApproveMutation.isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Approve {selectedRows.size}
                </button>
                <button
                  onClick={handleBulkReject}
                  disabled={bulkRejectMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Reject {selectedRows.size}
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        data?.pcListings &&
                        data.pcListings.length > 0 &&
                        selectedRows.size === data.pcListings.length
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  </th>
                  {columnVisibility.isColumnVisible('game') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Game
                    </th>
                  )}
                  {columnVisibility.isColumnVisible('cpu') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      CPU
                    </th>
                  )}
                  {columnVisibility.isColumnVisible('gpu') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      GPU
                    </th>
                  )}
                  {columnVisibility.isColumnVisible('emulator') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Emulator
                    </th>
                  )}
                  {columnVisibility.isColumnVisible('user') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                  )}
                  {columnVisibility.isColumnVisible('createdAt') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Submitted
                    </th>
                  )}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={columnVisibility.visibleColumns.size + 1}
                      className="px-6 py-12 text-center"
                    >
                      <LoadingSpinner size="lg" />
                    </td>
                  </tr>
                ) : pendingPcListingsQuery.isError ? (
                  <tr>
                    <td
                      colSpan={columnVisibility.visibleColumns.size + 1}
                      className="px-6 py-12 text-center text-red-600 dark:text-red-400"
                    >
                      Failed to load PC listings. Please try again.
                    </td>
                  </tr>
                ) : !data?.pcListings || data.pcListings.length === 0 ? (
                  renderEmptyState()
                ) : (
                  data.pcListings.map(renderRow)
                )}
              </tbody>
            </table>
          </div>
        </AdminTableContainer>

        {pagination && pagination.pages > 1 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            onPageChange={table.setPage}
          />
        )}
      </div>

      {showModal && selectedListing && (
        <ApprovalModal
          listing={selectedListing}
          onClose={() => {
            setShowModal(false)
            setSelectedListing(null)
          }}
          onApprove={handleApprove}
          isLoading={approveMutation.isPending}
        />
      )}
    </AdminPageLayout>
  )
}

export default PcListingApprovalsPage
