import { Button, Input, Modal } from '@/components/ui'
import { type RouterOutput } from '@/types/trpc'
import { getApprovalStatusColor } from '@/utils/badgeColors'
import { ApprovalStatus } from '@orm'

type ProcessedListing = RouterOutput['listings']['getProcessed']['listings'][number]

interface Props {
  isOpen: boolean
  onClose: () => void
  selectedListing: ProcessedListing | null
  newStatus: ApprovalStatus | null
  overrideNotes: string
  setOverrideNotes: (notes: string) => void
  onSubmit: () => void
  isLoading: boolean
}

function OverrideStatusModal(props: Props) {
  if (!props.selectedListing || !props.newStatus) return null

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      closeOnBackdropClick={false}
      title={`Override Status: ${props.selectedListing.game.title}`}
      size="lg"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Current Status:{' '}
          <strong
            className={`${getApprovalStatusColor(props.selectedListing.status)} px-1.5 py-0.5 rounded-md text-xs`}
          >
            {props.selectedListing.status}
          </strong>
          <br />
          New Status:{' '}
          <strong
            className={`${getApprovalStatusColor(props.newStatus)} px-1.5 py-0.5 rounded-md text-xs`}
          >
            {props.newStatus}
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
            value={props.overrideNotes}
            onChange={(ev) => props.setOverrideNotes(ev.target.value)}
            rows={4}
            placeholder={`Notes for changing status to ${props.newStatus}...`}
            className="w-full mt-1"
          />
        </div>
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
            Confirm Status Change to {props.newStatus}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default OverrideStatusModal
