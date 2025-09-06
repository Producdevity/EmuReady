'use client'

import { Clock, Flag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useAdminTable } from '@/app/admin/hooks'
import {
  AdminPageLayout,
  AdminTableContainer,
  AdminSearchFilters,
  AdminStatsDisplay,
  AdminTableNoResults,
} from '@/components/admin'
import { EmulatorIcon, SystemIcon } from '@/components/icons'
import {
  ApproveButton,
  ColumnVisibilityControl,
  DisplayToggleButton,
  LoadingSpinner,
  RejectButton,
  ViewButton,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  useConfirmDialog,
  Pagination,
  BulkActions,
  Button,
  LocalizedDate,
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
import getErrorMessage from '@/utils/getErrorMessage'
import getImageUrl from '@/utils/getImageUrl'
import ApprovalModal from './components/ApprovalModal'

type PendingPcListing = RouterOutput['pcListings']['pending']['pcListings'][number]
type ApprovalSortField =
  | 'game.title'
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

  const [showSystemIcons, setShowSystemIcons, isSystemIconsHydrated] = useLocalStorage(
    storageKeys.showSystemIcons,
    false,
  )

  const emulatorLogos = useEmulatorLogos()
  const confirm = useConfirmDialog()

  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [showModal, setShowModal] = useState(false)
  const [selectedListing, setSelectedListing] = useState<PendingPcListing | null>(null)

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
    const listing = pendingPcListingsQuery.data?.pcListings.find((l) => l.id === id)
    if (!listing) return

    const confirmed = await confirm({
      title: 'Reject PC Listing',
      description: `Are you sure you want to reject the PC listing for "${listing.game.title}"? This action will notify the user.`,
      confirmText: 'Reject',
    })

    if (!confirmed) return

    await rejectMutation.mutateAsync({ pcListingId: id })
  }

  const handleBulkApprove = async () => {
    const hasReportedUsers = pendingPcListingsQuery.data?.pcListings.some(
      (listing) => listing.id && selectedRows.has(listing.id) && (listing._count?.reports ?? 0) > 0,
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
        confirmText: 'Approve Selected',
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
      confirmText: 'Reject Selected',
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
        : new Set(pendingPcListingsQuery.data.pcListings.map((listing) => listing.id))
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
      {columnVisibility.isColumnVisible('thumbnail') && (
        <td className="px-6 py-4">
          <div className="flex items-center space-x-2">
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
          </div>
        </td>
      )}
      {columnVisibility.isColumnVisible('game') && (
        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{listing.game.title}</td>
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
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <Link
              href={`/user/${listing.author.id}`}
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
                <LocalizedDate date={listing.createdAt} format="timeAgo" />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <LocalizedDate date={listing.createdAt} format="dateTime" />
            </TooltipContent>
          </Tooltip>
        </td>
      )}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end space-x-2">
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
          <ViewButton href={`/pc-listings/${listing.id}`} title="View PC Listing" />
        </div>
      </td>
    </tr>
  )

  const pcListings = pendingPcListingsQuery.data?.pcListings ?? []
  const pagination = pendingPcListingsQuery.data?.pagination

  // TODO: extract this to a generic Admin error component
  if (pendingPcListingsQuery.error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 text-lg">
            Error loading pending listings: {pendingPcListingsQuery.error.message}
          </p>
          <Button onClick={() => pendingPcListingsQuery.refetch()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <AdminPageLayout
      title="PC Listing Approvals"
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

      <AdminSearchFilters<ApprovalSortField> table={table} searchPlaceholder="Search listings..." />

      {/* Bulk Actions */}
      {pcListings.length > 0 && (
        <BulkActions
          selectedIds={Array.from(selectedRows)}
          totalCount={pcListings.length}
          onSelectAll={handleSelectAll}
          onClearSelection={() => setSelectedRows(new Set<string>())}
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

      <AdminTableContainer>
        {pendingPcListingsQuery.isPending ? (
          <LoadingSpinner text="Loading pending listings..." />
        ) : pcListings.length === 0 ? (
          <AdminTableNoResults icon={Clock} hasQuery={!!table.search} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={pcListings.length > 0 && selectedRows.size === pcListings.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  </th>
                  {columnVisibility.isColumnVisible('game') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Game
                    </th>
                  )}
                  {columnVisibility.isColumnVisible('system') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      System
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
                {pcListings.map(renderRow)}
              </tbody>
            </table>
          </div>
        )}
      </AdminTableContainer>

      {pagination && pagination.pages > 1 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.pages}
          totalItems={pagination.total}
          onPageChange={table.setPage}
        />
      )}

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
