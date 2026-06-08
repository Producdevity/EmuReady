'use client'

import { Button, Input, Modal } from '@/components/ui'
import { getApprovalStatusColor } from '@/utils/badge-colors'
import { ApprovalStatus } from '@orm'

interface Props {
  isOpen: boolean
  onClose: () => void
  title: string
  currentStatus: ApprovalStatus | null
  newStatus: ApprovalStatus | null
  overrideNotes: string
  onOverrideNotesChange: (notes: string) => void
  onSubmit: () => void
  isLoading: boolean
}

export function ApprovalStatusOverrideModal(props: Props) {
  if (!props.currentStatus || !props.newStatus) return null

  const isReturningToPending = props.newStatus === ApprovalStatus.PENDING

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      closeOnBackdropClick={false}
      title={props.title}
      size="lg"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Current Status:{' '}
          <strong
            className={`${getApprovalStatusColor(props.currentStatus)} px-1.5 py-0.5 rounded-md text-xs`}
          >
            {props.currentStatus}
          </strong>
          <br />
          New Status:{' '}
          <strong
            className={`${getApprovalStatusColor(props.newStatus)} px-1.5 py-0.5 rounded-md text-xs`}
          >
            {props.newStatus}
          </strong>
        </p>
        {isReturningToPending ? (
          <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            This returns the report to the review queue and clears its processed admin, processed
            date, and processed notes.
          </p>
        ) : (
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
              value={props.overrideNotes}
              onChange={(ev) => props.onOverrideNotesChange(ev.target.value)}
              rows={4}
              placeholder={`Notes for changing status to ${props.newStatus}...`}
              className="w-full mt-1"
            />
          </div>
        )}
        <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700 mt-6">
          <Button variant="outline" onClick={props.onClose} disabled={props.isLoading}>
            Cancel
          </Button>
          <Button
            variant={props.newStatus === ApprovalStatus.REJECTED ? 'danger' : 'primary'}
            onClick={props.onSubmit}
            isLoading={props.isLoading}
            disabled={props.isLoading}
          >
            {isReturningToPending
              ? 'Return to Pending Review'
              : `Confirm Status Change to ${props.newStatus}`}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
