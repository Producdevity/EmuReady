import { AlertTriangle, Flag } from 'lucide-react'
import { Modal, Button, Input } from '@/components/ui'
import { type RouterOutput } from '@/types/trpc'
import { ApprovalStatus } from '@orm'

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
            {props.approvalDecision === ApprovalStatus.APPROVED ? 'approve' : 'reject'}
          </strong>{' '}
          this listing. This action will move it to the processed listings page.
        </p>

        {/* Report Warning */}
        {props.selectedListingForApproval.authorReportStats?.hasReports && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-1 flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <Flag className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  ⚠️ Reported User Warning
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  The author of this listing ({props.selectedListingForApproval.author?.name}) has{' '}
                  <strong>
                    {props.selectedListingForApproval.authorReportStats.totalReports} active reports
                  </strong>{' '}
                  against {props.selectedListingForApproval.authorReportStats.reportedListingsCount}{' '}
                  of their listings.
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  Please review this listing carefully before approval. Consider checking the
                  reports page for more details.
                </p>
              </div>
            </div>
          </div>
        )}
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
              onChange={(ev) => props.setApprovalNotes(ev.target.value)}
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
            disabled={props.approveMutation.isPending || props.rejectMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant={props.approvalDecision === ApprovalStatus.APPROVED ? 'primary' : 'danger'}
            onClick={props.handleApprovalSubmit}
            isLoading={props.approveMutation.isPending || props.rejectMutation.isPending}
            disabled={props.approveMutation.isPending || props.rejectMutation.isPending}
          >
            Confirm {props.approvalDecision === ApprovalStatus.APPROVED ? 'Approval' : 'Rejection'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ApprovalModal
