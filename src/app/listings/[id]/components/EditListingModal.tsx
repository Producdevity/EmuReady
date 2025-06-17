'use client'

import { useUser } from '@clerk/nextjs'
import { Edit3, Clock, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui'
import { api } from '@/lib/api'

interface EditListingModalProps {
  listingId: string
  authorId: string
  currentNotes: string
  onSuccess?: () => void
}

function EditListingModal(props: EditListingModalProps) {
  const { user } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [notes, setNotes] = useState(props.currentNotes || '')

  const canEditQuery = api.listings.canEdit.useQuery(
    { id: props.listingId },
    {
      enabled: !!user?.id && user.id === props.authorId,
      refetchInterval: 60000, // Refetch every minute to update time remaining
    },
  )

  const updateMutation = api.listings.update.useMutation({
    onSuccess: () => {
      toast.success('Listing updated successfully!')
      setIsEditing(false)
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

  // Don't show edit button if user is not the author
  if (!user?.id || user.id !== props.authorId) {
    return null
  }

  // Show loading state while checking edit permissions
  if (canEditQuery.isLoading) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        title="Checking edit permissions..."
      >
        <Clock className="w-4 h-4" />
      </Button>
    )
  }

  const canEdit = canEditQuery.data?.canEdit ?? false
  const remainingMinutes = canEditQuery.data?.remainingMinutes ?? 0
  const timeExpired = canEditQuery.data?.timeExpired ?? false

  if (isEditing) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center gap-2 mb-4">
            <Edit3 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-semibold">Edit Listing</h2>
            {canEdit && (
              <span className="text-sm text-gray-500">
                ({remainingMinutes} minutes remaining)
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
                  onClick={() => setIsEditing(false)}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending || !notes.trim()}
                >
                  {updateMutation.isPending ? 'Updating...' : 'Update Listing'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    )
  }

  const buttonTitle = canEdit
    ? `Edit listing (${remainingMinutes} minutes remaining)`
    : timeExpired
      ? 'Edit time expired (60 minute limit)'
      : 'Cannot edit listing'

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setIsEditing(true)}
      disabled={!canEdit}
      title={buttonTitle}
      className={canEdit ? '' : 'opacity-50'}
    >
      <Edit3 className="w-4 h-4" />
      <span className="ml-1 hidden sm:inline">Edit</span>
    </Button>
  )
}

export default EditListingModal
