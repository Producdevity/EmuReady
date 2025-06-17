'use client'

import { useUser } from '@clerk/nextjs'
import { Edit3, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button, Modal } from '@/components/ui'
import { api } from '@/lib/api'

interface Props {
  listingId: string
  currentNotes: string
  onSuccess?: () => void
}

function EditListingModal(props: Props) {
  const { user } = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const [notes, setNotes] = useState(props.currentNotes || '')

  const canEditQuery = api.listings.canEdit.useQuery(
    { id: props.listingId },
    {
      enabled: !!user?.id,
      refetchInterval: 60000, // Refetch every minute to update time remaining
    },
  )

  const updateMutation = api.listings.update.useMutation({
    onSuccess: () => {
      toast.success('Listing updated successfully!')
      setIsOpen(false)
      props.onSuccess?.()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate({
      id: props.listingId,
      notes,
    })
  }

  const handleOpen = () => {
    setNotes(props.currentNotes || '')
    setIsOpen(true)
  }

  // Don't show anything if user is not logged in
  if (!user?.id) {
    return null
  }

  // If it's not our listing, don't show the button at all
  if (canEditQuery.data?.isOwner === false) {
    return null
  }

  const canEdit = canEditQuery.data?.canEdit ?? false
  const remainingMinutes = canEditQuery.data?.remainingMinutes ?? 0
  const timeExpired = canEditQuery.data?.timeExpired ?? false
  const isPending = canEditQuery.data?.isPending ?? false
  const isApproved = canEditQuery.data?.isApproved ?? false

  const buttonTitle = canEdit
    ? isPending
      ? 'Edit listing (pending approval - no time limit)'
      : `Edit listing (${remainingMinutes} minutes remaining after approval)`
    : timeExpired
      ? 'Edit time expired (60 minute limit after approval)'
      : 'Cannot edit listing'

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        disabled={!canEdit || canEditQuery.isLoading}
        title={buttonTitle}
        className={canEdit ? '' : 'opacity-50'}
      >
        <Edit3 className="w-4 h-4" />
        <span className="ml-1 hidden sm:inline">Edit</span>
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Edit Listing"
        size="md"
      >
        <div className="space-y-4">
          {/* Status indicators */}
          <div className="flex items-center gap-2 mb-4">
            {canEdit && isPending && (
              <span className="text-sm text-orange-600 bg-orange-100 dark:bg-orange-900/20 px-2 py-1 rounded">
                Pending Approval
              </span>
            )}
            {canEdit && isApproved && (
              <span className="text-sm text-green-600 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded">
                {remainingMinutes} minutes remaining
              </span>
            )}
          </div>

          {!canEdit ? (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <div>
                  <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                    Edit Time Expired
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                    You can only edit listings within 60 minutes of approval.
                    Since this time has passed, you&apos;ll need to create a new
                    listing if you want to make changes.
                  </p>
                  <Link href="/listings/new">
                    <Button variant="outline" size="sm" className="gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Create New Listing
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Note:</strong> You can only edit the notes section.
                  {isPending && (
                    <span>
                      {' '}
                      You can edit anytime while your listing is pending
                      approval.
                    </span>
                  )}
                  {isApproved && (
                    <span>
                      {' '}
                      After approval, you have {remainingMinutes} minutes to
                      make edits.
                    </span>
                  )}
                  This feature is intended for fixing typos, not major changes.
                </p>
              </div>

              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter your notes about this listing..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={updateMutation.isPending}
                  disabled={updateMutation.isPending || !notes.trim()}
                >
                  Update Listing
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </>
  )
}

export default EditListingModal
