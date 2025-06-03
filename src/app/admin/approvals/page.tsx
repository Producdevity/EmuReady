'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { Eye, CheckCircle, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import toast from '@/lib/toast'
import storageKeys from '@/data/storageKeys'
import { Button, ColumnVisibilityControl } from '@/components/ui'
import useColumnVisibility, {
  type ColumnDefinition,
} from '@/hooks/useColumnVisibility'
import { ListingApprovalStatus } from '@orm'
import { formatDateTime, formatTimeAgo } from '@/utils/date'
import { type RouterOutput, type RouterInput } from '@/types/trpc'
import LoadingSpinner from '../../../components/ui/LoadingSpinner'
import ApprovalModal from './components/ApprovalModal'

type PendingListing = RouterOutput['listings']['getPending'][number]

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
  const columnVisibility = useColumnVisibility(APPROVALS_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminApprovals,
  })
  const pendingListingsQuery = api.listings.getPending.useQuery()

  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [selectedListingForApproval, setSelectedListingForApproval] =
    useState<PendingListing | null>(null)
  const [approvalNotes, setApprovalNotes] = useState('')
  const [approvalDecision, setApprovalDecision] =
    useState<ListingApprovalStatus | null>(null)

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
      toast.error(`Failed to approve listing: ${err.message}`)
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
      toast.error(`Failed to reject listing: ${err.message}`)
    },
  })

  const openApprovalModal = (
    listing: PendingListing,
    decision: ListingApprovalStatus,
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
      if (approvalDecision === ListingApprovalStatus.APPROVED) {
        approveMutation.mutate({
          listingId: selectedListingForApproval.id,
        } satisfies RouterInput['listings']['approveListing'])
      } else if (approvalDecision === ListingApprovalStatus.REJECTED) {
        rejectMutation.mutate({
          listingId: selectedListingForApproval.id,
          notes: approvalNotes || undefined,
        } satisfies RouterInput['listings']['rejectListing'])
      }
    }
  }

  if (pendingListingsQuery.error) {
    return (
      <div className="container mx-auto p-6 text-red-500">
        Error loading pending listings: {pendingListingsQuery.error.message}
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Listing Approvals
        </h1>
        <ColumnVisibilityControl
          columns={APPROVALS_COLUMNS}
          columnVisibility={columnVisibility}
        />
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Review and approve or reject pending listing submissions.
      </p>

      {pendingListingsQuery.isLoading && (
        <LoadingSpinner text="Loading pending listings..." />
      )}

      {!pendingListingsQuery.isLoading &&
        (!pendingListingsQuery.data ||
          pendingListingsQuery.data.length === 0) && (
          <div className="text-center py-8">
            <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No pending listings to review.
            </p>
          </div>
        )}

      {!pendingListingsQuery.isLoading &&
        pendingListingsQuery.data &&
        pendingListingsQuery.data.length > 0 && (
          <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-xl rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {columnVisibility.isColumnVisible('game') && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Game
                    </th>
                  )}
                  {columnVisibility.isColumnVisible('system') && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      System
                    </th>
                  )}
                  {columnVisibility.isColumnVisible('author') && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Author
                    </th>
                  )}
                  {columnVisibility.isColumnVisible('device') && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Device
                    </th>
                  )}
                  {columnVisibility.isColumnVisible('emulator') && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Emulator
                    </th>
                  )}
                  {columnVisibility.isColumnVisible('submittedAt') && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Submitted
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
                {pendingListingsQuery.data.map((listing: PendingListing) => (
                  <tr
                    key={listing.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    {columnVisibility.isColumnVisible('game') && (
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        <Link
                          href={`/listings/${listing.id}`}
                          target="_blank"
                          className="hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {listing.game.title}
                        </Link>
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('system') && (
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {listing.game.system.name}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('author') && (
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {listing.author?.name ?? 'N/A'}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('device') && (
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {listing.device.brand.name} {listing.device.modelName}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('emulator') && (
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {listing.emulator.name}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('submittedAt') && (
                      <td
                        className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                        title={formatDateTime(listing.createdAt)}
                      >
                        {formatTimeAgo(listing.createdAt)}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('actions') && (
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            openApprovalModal(
                              listing,
                              ListingApprovalStatus.APPROVED,
                            )
                          }
                          className="text-green-600 border-green-400 hover:bg-green-50 dark:text-green-400 dark:border-green-500 dark:hover:bg-green-700/20"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            openApprovalModal(
                              listing,
                              ListingApprovalStatus.REJECTED,
                            )
                          }
                          className="text-red-600 border-red-400 hover:bg-red-50 dark:text-red-400 dark:border-red-500 dark:hover:bg-red-700/20"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                        <Link
                          href={`/listings/${listing.id}`}
                          target="_blank"
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400 p-1.5 inline-flex items-center"
                          aria-label="View Listing"
                          title="View Listing Details"
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
        )}

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
