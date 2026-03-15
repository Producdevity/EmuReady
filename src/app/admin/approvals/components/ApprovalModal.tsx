import {
  GameInfoSection,
  UserInfoSection,
  PerformanceSection,
  NotesSection,
  RejectionNotesInput,
  CustomFieldsApprovalSection,
} from '@/app/listings/components/shared/approval/ApprovalModalSharedComponents'
import { AuthorRiskWarningBanner, Modal, Button } from '@/components/ui'
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
  const hasRisk = props.selectedListingForApproval.authorRiskProfile?.highestSeverity !== null
  const actionText = props.approvalDecision === ApprovalStatus.APPROVED ? 'Approve' : 'Reject'
  const modalTitle = `${actionText} Listing: ${props.selectedListingForApproval.game.title}`

  const buttonVariant =
    props.approvalDecision === ApprovalStatus.REJECTED
      ? 'danger'
      : hasRisk
        ? 'destructive'
        : 'default'

  const buttonText =
    props.approvalDecision === ApprovalStatus.REJECTED
      ? 'Confirm Rejection'
      : hasRisk
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
        <AuthorRiskWarningBanner riskProfile={props.selectedListingForApproval.authorRiskProfile} />

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

        <CustomFieldsApprovalSection
          fieldValues={props.selectedListingForApproval.customFieldValues}
        />

        {props.approvalDecision === ApprovalStatus.REJECTED && (
          <RejectionNotesInput
            id="approvalNotes"
            value={props.approvalNotes}
            onChange={props.setApprovalNotes}
          />
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
