import { AlertTriangle, Flag } from 'lucide-react'
import {
  GameInfoSection,
  UserInfoSection,
  PerformanceSection,
  NotesSection,
} from '@/app/listings/components/shared/approval/ApprovalModalSharedComponents'
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
  const hasReports = props.selectedListingForApproval.authorReportStats?.hasReports ?? false
  const actionText = props.approvalDecision === ApprovalStatus.APPROVED ? 'Approve' : 'Reject'
  const modalTitle = `${actionText} Listing: ${props.selectedListingForApproval.game.title}`

  const buttonVariant =
    props.approvalDecision === ApprovalStatus.REJECTED
      ? 'danger'
      : hasReports
        ? 'destructive'
        : 'default'

  const buttonText =
    props.approvalDecision === ApprovalStatus.REJECTED
      ? 'Confirm Rejection'
      : hasReports
        ? 'Approve Anyway'
        : 'Confirm Approval'

  return (
    <Modal
      isOpen={props.showApprovalModal}
      onClose={props.closeApprovalModal}
      title={modalTitle}
      size="lg"
    >
      <div className="space-y-4">
        {/* Report Warning */}
        {props.selectedListingForApproval.authorReportStats?.hasReports && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-1 flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <Flag className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                  ⚠️ Reported User Warning
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300">
                  The author of this listing ({props.selectedListingForApproval.author?.name}) has{' '}
                  <strong>
                    {props.selectedListingForApproval.authorReportStats.totalReports} active reports
                  </strong>{' '}
                  against {props.selectedListingForApproval.authorReportStats.reportedListingsCount}{' '}
                  of their listings.
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Please review this listing carefully before{' '}
                  {props.approvalDecision === ApprovalStatus.APPROVED ? 'approval' : 'rejection'}.
                  Consider checking the reports page for more details.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Listing Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GameInfoSection game={props.selectedListingForApproval.game} />

          {/* Device Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Device</h3>
            <p className="text-gray-900 dark:text-white">
              {props.selectedListingForApproval.device.brand.name}{' '}
              {props.selectedListingForApproval.device.modelName}
            </p>
          </div>

          {/* Emulator Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Emulator</h3>
            <p className="text-gray-900 dark:text-white">
              {props.selectedListingForApproval.emulator.name}
            </p>
          </div>

          <UserInfoSection
            author={props.selectedListingForApproval.author}
            createdAt={props.selectedListingForApproval.createdAt}
          />
        </div>

        <PerformanceSection performance={props.selectedListingForApproval.performance} />

        <NotesSection notes={props.selectedListingForApproval.notes} />
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
            variant="ghost"
            onClick={props.closeApprovalModal}
            disabled={props.approveMutation.isPending || props.rejectMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant={buttonVariant}
            onClick={props.handleApprovalSubmit}
            isLoading={props.approveMutation.isPending || props.rejectMutation.isPending}
            disabled={props.approveMutation.isPending || props.rejectMutation.isPending}
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ApprovalModal
