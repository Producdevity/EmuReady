'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, ExternalLink, Eye, Search } from 'lucide-react'
import Link from 'next/link'
import toast from '@/lib/toast'
import { Button, Modal, Input, SortableHeader } from '@/components/ui'
import { formatDateTime, formatTimeAgo } from '@/utils/date'
import { api } from '@/lib/api'
import { type RouterOutput } from '@/types/trpc'
import useAdminTable from '@/hooks/useAdminTable'
import { isEmpty } from 'remeda'

type PendingListing = RouterOutput['listings']['getPending'][number]
type PendingListingSortField =
  | 'game.title'
  | 'game.system.name'
  | 'device'
  | 'emulator.name'
  | 'author.name'
  | 'createdAt'

function AdminApprovalsPage() {
  const table = useAdminTable<PendingListingSortField>()

  const {
    data: pendingListings,
    isLoading,
    refetch,
  } = api.listings.getPending.useQuery(
    {
      search: isEmpty(table.search) ? undefined : table.search,
      sortField: table.sortField ?? undefined,
      sortDirection: table.sortDirection ?? undefined,
    },
    {
      staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes to allow for refetch on focus/reconnect
    },
  )
  const utils = api.useUtils()

  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [selectedListingForRejection, setSelectedListingForRejection] =
    useState<PendingListing | null>(null)
  const [rejectionNotes, setRejectionNotes] = useState('')

  const approveMutation = api.listings.approveListing.useMutation({
    onSuccess: async () => {
      toast.success('Listing approved!')
      await refetch()
      await utils.listings.get.invalidate()
    },
    onError: (error) => {
      toast.error(`Approval failed: ${error.message}`)
    },
  })

  const rejectMutation = api.listings.rejectListing.useMutation({
    onSuccess: async () => {
      toast.success('Listing rejected!')
      await refetch()
      await utils.listings.get.invalidate()
      closeRejectionModal()
    },
    onError: (error) => {
      toast.error(`Rejection failed: ${error.message}`)
    },
  })

  const openRejectionModal = (listing: PendingListing) => {
    setSelectedListingForRejection(listing)
    setRejectionNotes(listing.processedNotes ?? '')
    setShowRejectionModal(true)
  }

  const closeRejectionModal = () => {
    setShowRejectionModal(false)
    setSelectedListingForRejection(null)
    setRejectionNotes('')
  }

  const handleRejectSubmit = () => {
    if (selectedListingForRejection) {
      rejectMutation.mutate({
        listingId: selectedListingForRejection.id,
        notes: rejectionNotes ?? undefined,
      })
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p>Loading pending approvals...</p>
      </div>
    )
  }

  if (!pendingListings || pendingListings.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">
          Listing Approvals
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          No listings are currently awaiting approval.
        </p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-4 text-gray-800 dark:text-white">
        Listing Approvals
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Review and approve or reject new game listings submitted by users.
      </p>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Search pending listings..."
            value={table.search}
            onChange={table.handleSearchChange}
            className="pl-10"
          />
        </div>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-xl rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <SortableHeader
                label="Game"
                field="game.title"
                currentSortField={table.sortField}
                currentSortDirection={table.sortDirection}
                onSort={table.handleSort}
              />
              <SortableHeader
                label="System"
                field="game.system.name"
                currentSortField={table.sortField}
                currentSortDirection={table.sortDirection}
                onSort={table.handleSort}
              />
              <SortableHeader
                label="Device"
                field="device"
                currentSortField={table.sortField}
                currentSortDirection={table.sortDirection}
                onSort={table.handleSort}
              />
              <SortableHeader
                label="Emulator"
                field="emulator.name"
                currentSortField={table.sortField}
                currentSortDirection={table.sortDirection}
                onSort={table.handleSort}
              />
              <SortableHeader
                label="Author"
                field="author.name"
                currentSortField={table.sortField}
                currentSortDirection={table.sortDirection}
                onSort={table.handleSort}
              />
              <SortableHeader
                label="Submitted"
                field="createdAt"
                currentSortField={table.sortField}
                currentSortDirection={table.sortDirection}
                onSort={table.handleSort}
              />
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {pendingListings.map((listing) => (
              <tr
                key={listing.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  <Link
                    href={`/listings/${listing.id}`}
                    target="_blank"
                    className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center"
                  >
                    {listing.game.title}
                    <ExternalLink className="ml-1.5 h-3 w-3 text-gray-400 dark:text-gray-500" />
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {listing.game.system.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {listing.device.brand.name} {listing.device.modelName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {listing.emulator.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {listing.author?.name ?? 'N/A'}
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    ({listing.author?.email ?? 'No email'})
                  </span>
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                  title={formatDateTime(listing.createdAt)}
                >
                  {formatTimeAgo(listing.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      approveMutation.mutate({ listingId: listing.id })
                    }
                    isLoading={
                      approveMutation.isPending &&
                      approveMutation.variables?.listingId === listing.id
                    }
                    aria-label="Approve"
                    className="text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400 p-1.5"
                  >
                    <CheckCircle className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openRejectionModal(listing)}
                    aria-label="Reject"
                    className="text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 p-1.5"
                  >
                    <XCircle className="h-5 w-5" />
                  </Button>
                  <Link
                    href={`/listings/${listing.id}`}
                    target="_blank"
                    className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-500 p-1.5 inline-flex items-center"
                    aria-label="View Listing"
                    title="View Public Listing"
                  >
                    <Eye className="h-5 w-5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showRejectionModal && selectedListingForRejection && (
        <Modal
          isOpen={showRejectionModal}
          onClose={closeRejectionModal}
          title={`Reject Listing: ${selectedListingForRejection.game.title}`}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              You are about to reject the listing for
              <strong className="text-gray-800 dark:text-white">
                {' '}
                {selectedListingForRejection.game.title}
              </strong>{' '}
              on
              <strong className="text-gray-800 dark:text-white">
                {' '}
                {selectedListingForRejection.device.brand.name}{' '}
                {selectedListingForRejection.device.modelName}
              </strong>{' '}
              (submitted by{' '}
              {selectedListingForRejection.author?.name ?? 'Unknown User'}).
            </p>
            <div>
              <label
                htmlFor="rejectionNotes"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Rejection Notes (Optional)
              </label>
              <Input
                as="textarea"
                id="rejectionNotes"
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                rows={3}
                placeholder="Provide a reason for rejection (this may be visible to the author)..."
                className="w-full mt-1"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700 mt-6">
              <Button
                variant="outline"
                onClick={closeRejectionModal}
                disabled={rejectMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleRejectSubmit}
                isLoading={rejectMutation.isPending}
                disabled={rejectMutation.isPending}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default AdminApprovalsPage
