'use client'

import { AlertTriangle, Flag } from 'lucide-react'
import {
  GameInfoSection,
  EmulatorInfoSection,
  UserInfoSection,
  PerformanceSection,
  NotesSection,
} from '@/app/listings/components/shared/approval/ApprovalModalSharedComponents'
import { Button, Modal, Input } from '@/components/ui'
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

  const hasReports = (props.selectedPcListingForApproval._count?.reports ?? 0) > 0

  const getModalTitle = () => {
    const actionText = props.approvalDecision === ApprovalStatus.APPROVED ? 'Approve' : 'Reject'
    return `${actionText} PC Listing: ${props.selectedPcListingForApproval.game.title}`
  }

  const getButtonVariant = () => {
    if (props.approvalDecision === ApprovalStatus.REJECTED) return 'danger'
    return hasReports ? 'destructive' : 'default'
  }

  const getButtonText = () => {
    if (props.approvalDecision === ApprovalStatus.REJECTED) return 'Confirm Rejection'
    return hasReports ? 'Approve Anyway' : 'Confirm Approval'
  }

  return (
    <Modal
      isOpen={props.showApprovalModal}
      onClose={props.closeApprovalModal}
      title={getModalTitle()}
      size="lg"
    >
      <div className="space-y-4">
        {hasReports && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-1 flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <Flag className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                  ⚠️ Reported Listing Warning
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300">
                  This PC listing has{' '}
                  <strong>
                    {props.selectedPcListingForApproval._count?.reports ?? 0} active reports
                  </strong>
                  .
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

        {/* Rejection Notes Input */}
        {props.approvalDecision === ApprovalStatus.REJECTED && (
          <div>
            <label
              htmlFor="rejectionNotes"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Rejection Notes (Optional)
            </label>
            <Input
              as="textarea"
              id="rejectionNotes"
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
