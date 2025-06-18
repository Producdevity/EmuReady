'use client'

import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button, Modal } from '@/components/ui'
import { api } from '@/lib/api'

interface Props {
  isOpen: boolean
  onClose: () => void
  listingId: string
  currentNotes: string
  canEdit: boolean
  remainingMinutes?: number
  timeExpired?: boolean
  isPending?: boolean
  isApproved?: boolean
  onSuccess?: () => void
}

function EditListingModal(props: Props) {
  const [notes, setNotes] = useState(props.currentNotes || '')

  const updateMutation = api.listings.update.useMutation({
    onSuccess: () => {
      toast.success('Listing updated successfully!')
      props.onClose()
      props.onSuccess?.()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = (ev: FormEvent) => {
    ev.preventDefault()
    updateMutation.mutate({ id: props.listingId, notes })
  }

  useEffect(() => {
    if (!props.isOpen) return
    setNotes(props.currentNotes || '')
  }, [props.isOpen, props.currentNotes])

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title="Edit Listing"
      closeOnBackdropClick={false}
      closeOnEscape={false}
      size="md"
    >
      <div className="space-y-4">
        {/* Status indicators */}
        <div className="flex items-center gap-2 mb-4">
          {props.canEdit && props.isPending && (
            <span className="text-sm text-orange-600 bg-orange-100 dark:bg-orange-900/20 px-2 py-1 rounded">
              Pending Approval
            </span>
          )}
          {props.canEdit && props.isApproved && (
            <span className="text-sm text-green-600 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded">
              {props.remainingMinutes} minutes remaining
            </span>
          )}
        </div>

        {!props.canEdit ? (
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
                {props.isPending && (
                  <span>
                    {' '}
                    You can edit anytime while your listing is pending approval.
                  </span>
                )}
                {props.isApproved && (
                  <span>
                    {' '}
                    After approval, you have {props.remainingMinutes} minutes to
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
                onClick={props.onClose}
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
  )
}

export default EditListingModal
