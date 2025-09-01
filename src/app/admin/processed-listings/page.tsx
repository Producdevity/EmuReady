'use client'

import { Undo, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useState, type ChangeEvent } from 'react'
import { useAdminTable } from '@/app/admin/hooks'
import {
  AdminPageLayout,
  AdminSearchFilters,
  AdminStatsDisplay,
  AdminTableContainer,
  AdminTableNoResults,
} from '@/components/admin'
import {
  ApproveButton,
  Button,
  ColumnVisibilityControl,
  EditButton,
  LoadingSpinner,
  Pagination,
  RejectButton,
  SelectInput,
  LocalizedDate,
} from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import { useColumnVisibility, type ColumnDefinition } from '@/hooks'
import analytics from '@/lib/analytics'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterOutput, type RouterInput } from '@/types/trpc'
import { getApprovalStatusColor } from '@/utils/badgeColors'
import getErrorMessage from '@/utils/getErrorMessage'
import { ApprovalStatus } from '@orm'
import OverrideStatusModal from './components/OverrideStatusModal'

type ProcessedListing = RouterOutput['listings']['getProcessed']['listings'][number]

const statusOptions = [
  { id: 'all' as const, name: 'All Processed' },
  { id: ApprovalStatus.APPROVED, name: 'Approved' },
  { id: ApprovalStatus.PENDING, name: 'Pending' },
  { id: ApprovalStatus.REJECTED, name: 'Rejected' },
]

const PROCESSED_LISTINGS_COLUMNS: ColumnDefinition[] = [
  { key: 'game', label: 'Game / System', defaultVisible: true },
  { key: 'author', label: 'Author', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'processedBy', label: 'Processed By (Admin)', defaultVisible: true },
  { key: 'processedAt', label: 'Processed At', defaultVisible: true },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

type ProcessedListingSortField = 'createdAt' | 'status' | 'game.title'

function ProcessedListingsPage() {
  const table = useAdminTable<ProcessedListingSortField>({
    defaultLimit: 20,
    defaultSortField: 'createdAt',
    defaultSortDirection: 'desc',
  })

  const columnVisibility = useColumnVisibility(PROCESSED_LISTINGS_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminProcessedListings,
  })

  const [filterStatus, setFilterStatus] = useState<ApprovalStatus | null>(null)

  const listingStatsQuery = api.listings.getStats.useQuery()
  const processedListingsQuery = api.listings.getProcessed.useQuery({
    page: table.page,
    limit: table.limit,
    filterStatus: filterStatus ?? undefined,
    search: table.debouncedSearch || undefined,
  })

  const processedListings = processedListingsQuery.data?.listings ?? []
  const paginationData = processedListingsQuery.data?.pagination

  const [showOverrideModal, setShowOverrideModal] = useState(false)
  const [selectedListingForOverride, setSelectedListingForOverride] =
    useState<ProcessedListing | null>(null)
  const [overrideNotes, setOverrideNotes] = useState('')
  const [newStatusForOverride, setNewStatusForOverride] = useState<ApprovalStatus | null>(null)

  const utils = api.useUtils()
  const overrideMutation = api.listings.overrideApprovalStatus.useMutation({
    onSuccess: async () => {
      toast.success('Listing status overridden successfully!')
      await utils.listings.getProcessed.invalidate()
      await utils.listings.getPending.invalidate()
      await utils.listings.get.invalidate()
      closeOverrideModal()
    },
    onError: (err) => {
      console.error('Failed to override status:', err)
      toast.error(`Failed to override status: ${getErrorMessage(err)}`)
    },
  })

  const openOverrideModal = (listing: ProcessedListing, targetStatus: ApprovalStatus) => {
    setSelectedListingForOverride(listing)
    setNewStatusForOverride(targetStatus)
    setOverrideNotes(listing.processedNotes ?? '')
    setShowOverrideModal(true)
  }

  const closeOverrideModal = () => {
    setShowOverrideModal(false)
    setSelectedListingForOverride(null)
    setOverrideNotes('')
    setNewStatusForOverride(null)
  }

  const handleOverrideSubmit = () => {
    if (selectedListingForOverride && newStatusForOverride) {
      overrideMutation.mutate({
        listingId: selectedListingForOverride.id,
        newStatus: newStatusForOverride,
        overrideNotes: overrideNotes ?? undefined,
      } satisfies RouterInput['listings']['overrideApprovalStatus'])
    }
  }

  const handleFilterChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const value = ev.target.value as ApprovalStatus | 'all'
    setFilterStatus(value === 'all' ? null : value)
    table.setPage(1)
  }

  if (processedListingsQuery.error) {
    return (
      <div className="container mx-auto p-6 text-red-500">
        Error loading processed listings: {processedListingsQuery.error.message}
      </div>
    )
  }

  return (
    <AdminPageLayout
      title="Processed Listings Review"
      description="Review listings that have been approved or rejected by admins. SUPER_ADMINs can override these decisions."
      headerActions={
        <ColumnVisibilityControl
          columns={PROCESSED_LISTINGS_COLUMNS}
          columnVisibility={columnVisibility}
        />
      }
    >
      <AdminStatsDisplay
        stats={[
          {
            label: 'Total',
            value: listingStatsQuery.data?.total ?? 0,
            color: 'blue',
          },
          {
            label: 'Approved',
            value: listingStatsQuery.data?.approved ?? 0,
            color: 'green',
          },
          {
            label: 'Pending',
            value: listingStatsQuery.data?.pending ?? 0,
            color: 'yellow',
          },
          {
            label: 'Rejected',
            value: listingStatsQuery.data?.rejected ?? 0,
            color: 'red',
          },
        ]}
        isLoading={listingStatsQuery.isPending}
      />

      <AdminSearchFilters<ProcessedListingSortField>
        table={table}
        searchPlaceholder="Search by game name, author, or notes..."
        onClear={() => setFilterStatus(null)}
      >
        <SelectInput
          hideLabel
          label="Filter by Status"
          options={statusOptions}
          value={filterStatus ?? 'all'}
          onChange={handleFilterChange}
        />
      </AdminSearchFilters>

      <AdminTableContainer>
        {processedListingsQuery.isPending ? (
          <LoadingSpinner text="Loading processed listings..." />
        ) : processedListings.length === 0 ? (
          <AdminTableNoResults hasQuery={!!table.search} />
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                {columnVisibility.isColumnVisible('game') && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Game / System
                  </th>
                )}
                {columnVisibility.isColumnVisible('author') && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Author
                  </th>
                )}
                {columnVisibility.isColumnVisible('status') && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                )}
                {columnVisibility.isColumnVisible('processedBy') && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Processed By (Admin)
                  </th>
                )}
                {columnVisibility.isColumnVisible('processedAt') && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Processed At
                  </th>
                )}
                {columnVisibility.isColumnVisible('actions') && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {processedListings.map((listing) => (
                <tr
                  key={listing.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  {columnVisibility.isColumnVisible('game') && (
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/listings/${listing.id}`}
                        target="_blank"
                        className="font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                        onClick={() => {
                          analytics.contentDiscovery.externalLinkClicked({
                            url: `/listings/${listing.id}`,
                            context: 'admin_processed_listings_view',
                            entityId: listing.id,
                          })
                        }}
                      >
                        {listing.game.title}
                        <ExternalLink className="ml-1.5 h-3 w-3" />
                      </Link>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {listing.game.system.name}
                      </div>
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('author') && (
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {listing.author?.name ?? 'N/A'}
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('status') && (
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getApprovalStatusColor(listing.status)}`}
                      >
                        {listing.status}
                      </span>
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('processedBy') && (
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {listing.processedByUser?.name ?? 'N/A'}
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('processedAt') && (
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {listing.processedAt ? (
                        <LocalizedDate date={listing.processedAt} format="timeAgo" />
                      ) : (
                        'N/A'
                      )}
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('actions') && (
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-1">
                      {listing.status === ApprovalStatus.APPROVED && (
                        <RejectButton
                          title="Override to Rejected"
                          onClick={() => openOverrideModal(listing, ApprovalStatus.REJECTED)}
                        />
                      )}
                      {listing.status === ApprovalStatus.REJECTED && (
                        <ApproveButton
                          title="Override to Approved"
                          onClick={() => openOverrideModal(listing, ApprovalStatus.APPROVED)}
                        />
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openOverrideModal(listing, ApprovalStatus.PENDING)}
                        title="Revert to Pending"
                        className="text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <Undo className="mr-1 h-4 w-4" /> Revert
                      </Button>
                      <EditButton
                        href={`/admin/listings/${listing.id}/edit`}
                        title="Edit Listing (Admin)"
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AdminTableContainer>

      {paginationData && paginationData.pages > 1 && (
        <Pagination
          page={paginationData.page}
          totalPages={paginationData.pages}
          onPageChange={table.setPage}
          totalItems={paginationData.total}
        />
      )}

      <OverrideStatusModal
        isOpen={showOverrideModal}
        onClose={closeOverrideModal}
        selectedListing={selectedListingForOverride}
        newStatus={newStatusForOverride}
        overrideNotes={overrideNotes}
        setOverrideNotes={setOverrideNotes}
        onSubmit={handleOverrideSubmit}
        isLoading={overrideMutation.isPending}
      />
    </AdminPageLayout>
  )
}

export default ProcessedListingsPage
