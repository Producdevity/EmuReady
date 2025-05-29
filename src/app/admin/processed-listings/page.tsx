'use client'

import { useState, type ChangeEvent } from 'react'
import { api } from '@/lib/api'
import { Eye, CheckCircle, XCircle, Undo, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import toast from '@/lib/toast'
import storageKeys from '@/data/storageKeys'
import {
  Button,
  Modal,
  Input,
  SelectInput,
  ColumnVisibilityControl,
} from '@/components/ui'
import useColumnVisibility, {
  type ColumnDefinition,
} from '@/hooks/useColumnVisibility'
import { ListingApprovalStatus } from '@orm'
import { formatDateTime, formatTimeAgo } from '@/utils/date'
import Pagination from '@/components/ui/Pagination'
import getStatusBadgeColor from './utils/getStatusBadgeColor'
import { type RouterOutput } from '@/types/trpc'

type ProcessedListing =
  RouterOutput['listings']['getProcessed']['listings'][number]

const statusOptions = [
  { id: 'all' as const, name: 'All Processed' },
  { id: ListingApprovalStatus.APPROVED, name: 'Approved' },
  { id: ListingApprovalStatus.PENDING, name: 'Pending' },
  { id: ListingApprovalStatus.REJECTED, name: 'Rejected' },
]

const PROCESSED_LISTINGS_COLUMNS: ColumnDefinition[] = [
  { key: 'game', label: 'Game / System', defaultVisible: true },
  { key: 'author', label: 'Author', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'processedBy', label: 'Processed By (Admin)', defaultVisible: true },
  { key: 'processedAt', label: 'Processed At', defaultVisible: true },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

function ProcessedListingsPage() {
  const columnVisibility = useColumnVisibility(PROCESSED_LISTINGS_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminProcessedListings,
  })

  const [currentPage, setCurrentPage] = useState(1)
  const [filterStatus, setFilterStatus] =
    useState<ListingApprovalStatus | null>(null)
  const itemsPerPage = 10

  const { data, isLoading, error, refetch } =
    api.listings.getProcessed.useQuery({
      page: currentPage,
      limit: itemsPerPage,
      filterStatus: filterStatus ?? undefined,
    })

  const processedListings = data?.listings ?? []
  const paginationData = data?.pagination

  const [showOverrideModal, setShowOverrideModal] = useState(false)
  const [selectedListingForOverride, setSelectedListingForOverride] =
    useState<ProcessedListing | null>(null)
  const [overrideNotes, setOverrideNotes] = useState('')
  const [newStatusForOverride, setNewStatusForOverride] =
    useState<ListingApprovalStatus | null>(null)

  const utils = api.useUtils()
  const overrideMutation = api.listings.overrideApprovalStatus.useMutation({
    onSuccess: async () => {
      toast.success('Listing status overridden successfully!')
      await refetch()
      await utils.listings.getPending.invalidate()
      await utils.listings.get.invalidate()
      closeOverrideModal()
    },
    onError: (err) => {
      console.error('Failed to override status:', err)
      toast.error(`Failed to override status: ${err.message}`)
    },
  })

  const openOverrideModal = (
    listing: ProcessedListing,
    targetStatus: ListingApprovalStatus,
  ) => {
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
      })
    }
  }

  const handleFilterChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const value = ev.target.value as ListingApprovalStatus | 'all'
    setFilterStatus(value === 'all' ? null : value)
    setCurrentPage(1)
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 text-red-500">
        Error loading processed listings: {error.message}
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Processed Listings Review
        </h1>
        <ColumnVisibilityControl
          columns={PROCESSED_LISTINGS_COLUMNS}
          columnVisibility={columnVisibility}
        />
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Review listings that have been approved or rejected by admins.
        SUPER_ADMINs can override these decisions.
      </p>

      <div className="mb-6 max-w-xs">
        <SelectInput
          label="Filter by Status"
          options={statusOptions}
          value={filterStatus ?? 'all'}
          onChange={handleFilterChange}
        />
      </div>

      {isLoading && (
        <div className="text-center py-8">
          <p>Loading processed listings...</p>
        </div>
      )}

      {!isLoading && processedListings.length === 0 && (
        <p className="text-gray-600 dark:text-gray-400 text-center py-8">
          No listings match the current filter.
        </p>
      )}

      {!isLoading && processedListings.length > 0 && (
        <>
          <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-xl rounded-lg">
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
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(listing.status)}`}
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
                      <td
                        className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                        title={
                          listing.processedAt
                            ? formatDateTime(listing.processedAt)
                            : 'N/A'
                        }
                      >
                        {listing.processedAt
                          ? formatTimeAgo(listing.processedAt)
                          : 'N/A'}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('actions') && (
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-1">
                        {listing.status === ListingApprovalStatus.APPROVED && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              openOverrideModal(
                                listing,
                                ListingApprovalStatus.REJECTED,
                              )
                            }
                            title="Override to Rejected"
                            className="text-yellow-600 border-yellow-400 hover:bg-yellow-50 dark:text-yellow-400 dark:border-yellow-500 dark:hover:bg-yellow-700/20"
                          >
                            <XCircle className="mr-1 h-4 w-4" /> Reject
                          </Button>
                        )}
                        {listing.status === ListingApprovalStatus.REJECTED && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              openOverrideModal(
                                listing,
                                ListingApprovalStatus.APPROVED,
                              )
                            }
                            title="Override to Approved"
                            className="text-green-600 border-green-400 hover:bg-green-50 dark:text-green-400 dark:border-green-500 dark:hover:bg-green-700/20"
                          >
                            <CheckCircle className="mr-1 h-4 w-4" /> Approve
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            openOverrideModal(
                              listing,
                              ListingApprovalStatus.PENDING,
                            )
                          }
                          title="Revert to Pending"
                          className="text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          <Undo className="mr-1 h-4 w-4" /> Revert
                        </Button>
                        <Link
                          href={`/admin/listings/${listing.id}/edit`}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400 p-1.5 inline-flex items-center ml-1"
                          aria-label="Edit Listing"
                          title="Edit Listing (Admin)"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {paginationData && paginationData.pages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={paginationData.currentPage}
                totalPages={paginationData.pages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}

      {showOverrideModal && selectedListingForOverride && (
        <Modal
          isOpen={showOverrideModal}
          onClose={closeOverrideModal}
          title={`Override Status: ${selectedListingForOverride.game.title}`}
          size="lg"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Current Status:{' '}
              <strong
                className={`${getStatusBadgeColor(selectedListingForOverride.status)} px-1.5 py-0.5 rounded-md text-xs`}
              >
                {selectedListingForOverride.status}
              </strong>
              <br />
              New Status:{' '}
              <strong
                className={`${getStatusBadgeColor(newStatusForOverride!)} px-1.5 py-0.5 rounded-md text-xs`}
              >
                {newStatusForOverride}
              </strong>
            </p>
            <div>
              <label
                htmlFor="overrideNotes"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Override Notes (Optional)
              </label>
              <Input
                as="textarea"
                id="overrideNotes"
                value={overrideNotes}
                onChange={(e) => setOverrideNotes(e.target.value)}
                rows={4}
                placeholder={`Notes for changing status to ${newStatusForOverride}...`}
                className="w-full mt-1"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700 mt-6">
              <Button
                variant="outline"
                onClick={closeOverrideModal}
                disabled={overrideMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant={
                  newStatusForOverride === ListingApprovalStatus.REJECTED
                    ? 'danger'
                    : 'primary'
                }
                onClick={handleOverrideSubmit}
                isLoading={overrideMutation.isPending}
                disabled={overrideMutation.isPending}
              >
                Confirm Status Change to {newStatusForOverride}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default ProcessedListingsPage
