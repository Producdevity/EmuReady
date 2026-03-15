'use client'

import {
  GameInfoSection,
  EmulatorInfoSection,
  UserInfoSection,
  PerformanceSection,
  NotesSection,
  RejectionNotesInput,
  CustomFieldsApprovalSection,
} from '@/app/listings/components/shared/approval/ApprovalModalSharedComponents'
import { AuthorRiskWarningBanner, Button, Modal } from '@/components/ui'
import { useEmulatorLogos } from '@/hooks'
import { type RouterOutput } from '@/types/trpc'
import { ApprovalStatus } from '@orm'

type PendingPcListing = RouterOutput['pcListings']['pending']['pcListings'][number]

interface Props {
  showApprovalModal: boolean
  closeApprovalModal: () => void
  selectedPcListingForApproval: PendingPcListing
  approvalDecision: ApprovalStatus
  approvalNotes: string
  setApprovalNotes: (notes: string) => void
  handleApprovalSubmit: () => void
  approveMutation: { isPending: boolean }
  rejectMutation: { isPending: boolean }
}

function ApprovalModal(props: Props) {
  const emulatorLogos = useEmulatorLogos()

  const hasRisk = props.selectedPcListingForApproval.authorRiskProfile?.highestSeverity !== null

  const getModalTitle = () => {
    const actionText = props.approvalDecision === ApprovalStatus.APPROVED ? 'Approve' : 'Reject'
    return `${actionText} PC Listing: ${props.selectedPcListingForApproval.game.title}`
  }

  const getButtonVariant = () => {
    if (props.approvalDecision === ApprovalStatus.REJECTED) return 'danger'
    return hasRisk ? 'destructive' : 'default'
  }

  const getButtonText = () => {
    if (props.approvalDecision === ApprovalStatus.REJECTED) return 'Confirm Rejection'
    return hasRisk ? 'Approve Anyway' : 'Confirm Approval'
  }

  return (
    <Modal
      isOpen={props.showApprovalModal}
      onClose={props.closeApprovalModal}
      title={getModalTitle()}
      size="lg"
    >
      <div className="space-y-4">
        <AuthorRiskWarningBanner
          riskProfile={props.selectedPcListingForApproval.authorRiskProfile}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GameInfoSection game={props.selectedPcListingForApproval.game} />

          {/* Hardware Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Hardware</h3>
            <div className="space-y-1">
              <p className="text-sm text-gray-900 dark:text-white">
                <span className="font-medium">CPU:</span>{' '}
                {props.selectedPcListingForApproval.cpu.brand.name}{' '}
                {props.selectedPcListingForApproval.cpu.modelName}
              </p>
              {props.selectedPcListingForApproval.gpu && (
                <p className="text-sm text-gray-900 dark:text-white">
                  <span className="font-medium">GPU:</span>{' '}
                  {props.selectedPcListingForApproval.gpu.brand.name}{' '}
                  {props.selectedPcListingForApproval.gpu.modelName}
                </p>
              )}
            </div>
          </div>

          <EmulatorInfoSection
            emulator={props.selectedPcListingForApproval.emulator}
            showLogo={emulatorLogos.showEmulatorLogos}
          />

          <UserInfoSection
            author={props.selectedPcListingForApproval.author}
            createdAt={props.selectedPcListingForApproval.createdAt}
          />
        </div>

        <PerformanceSection performance={props.selectedPcListingForApproval.performance} />

        <NotesSection notes={props.selectedPcListingForApproval.notes} />

        <CustomFieldsApprovalSection
          fieldValues={props.selectedPcListingForApproval.customFieldValues}
        />

        {props.approvalDecision === ApprovalStatus.REJECTED && (
          <RejectionNotesInput
            id="rejectionNotes"
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
            variant={getButtonVariant()}
            onClick={props.handleApprovalSubmit}
            isLoading={props.approveMutation.isPending || props.rejectMutation.isPending}
            disabled={props.approveMutation.isPending || props.rejectMutation.isPending}
          >
            {getButtonText()}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ApprovalModal
