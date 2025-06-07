import { Modal, Button, Input } from '@/components/ui'
import { ApprovalStatus } from '@orm'
import { type RouterOutput } from '@/types/trpc'

type PendingListing = RouterOutput['listings']['getPending']['listings'][number]

interface Props {
  showApprovalModal: boolean
  closeApprovalModal: () => void
  selectedListingForApproval: PendingListing
  approvalDecision: ApprovalStatus
  approvalNotes: string
  setApprovalNotes: (notes: string) => void
  handleApprovalSubmit: () => void
  approveMutation: { isPending: boolean }
  rejectMutation: { isPending: boolean }
}

function ApprovalModal(props: Props) {
  return (
    <Modal
      isOpen={props.showApprovalModal}
      onClose={props.closeApprovalModal}
      title={`${props.approvalDecision === ApprovalStatus.APPROVED ? 'Approve' : 'Reject'} Listing: ${props.selectedListingForApproval.game.title}`}
      size="lg"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          You are about to{' '}
          <strong>
            {props.approvalDecision === ApprovalStatus.APPROVED
              ? 'approve'
              : 'reject'}
          </strong>{' '}
          this listing. This action will move it to the processed listings page.
        </p>
        {props.approvalDecision === ApprovalStatus.REJECTED && (
          <div>
            <label
              htmlFor="approvalNotes"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Rejection Notes (Optional)
            </label>
            <Input
              as="textarea"
              id="approvalNotes"
              value={props.approvalNotes}
              onChange={(e) => props.setApprovalNotes(e.target.value)}
              rows={4}
              placeholder="Reason for rejection..."
              className="w-full mt-1"
            />
          </div>
        )}
        <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700 mt-6">
          <Button
            variant="outline"
            onClick={props.closeApprovalModal}
            disabled={
              props.approveMutation.isPending || props.rejectMutation.isPending
            }
          >
            Cancel
          </Button>
          <Button
            variant={
              props.approvalDecision === ApprovalStatus.APPROVED
                ? 'primary'
                : 'danger'
            }
            onClick={props.handleApprovalSubmit}
            isLoading={
              props.approveMutation.isPending || props.rejectMutation.isPending
            }
            disabled={
              props.approveMutation.isPending || props.rejectMutation.isPending
            }
          >
            Confirm{' '}
            {props.approvalDecision === ApprovalStatus.APPROVED
              ? 'Approval'
              : 'Rejection'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ApprovalModal
