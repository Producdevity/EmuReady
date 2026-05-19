import {
  CompatibilityReportReviewModal,
  type CompatibilityReportReviewItem,
} from '@/components/compatibility/review'
import { type RouterOutput } from '@/types/trpc'
import { type ApprovalStatus } from '@orm'

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

function toReviewItem(listing: PendingListing): CompatibilityReportReviewItem {
  return {
    game: listing.game,
    hardware: { type: 'device', device: listing.device },
    emulator: listing.emulator,
    author: listing.author,
    createdAt: listing.createdAt,
    performance: listing.performance,
    notes: listing.notes,
    customFieldValues: listing.customFieldValues,
    authorRiskProfile: listing.authorRiskProfile,
    submissionRiskProfile: listing.submissionRiskProfile,
  }
}

function ApprovalModal(props: Props) {
  return (
    <CompatibilityReportReviewModal
      isOpen={props.showApprovalModal}
      onClose={props.closeApprovalModal}
      decision={props.approvalDecision}
      reportLabel="Listing"
      report={toReviewItem(props.selectedListingForApproval)}
      rejectionNotes={props.approvalNotes}
      onRejectionNotesChange={props.setApprovalNotes}
      onSubmit={props.handleApprovalSubmit}
      isSubmitting={props.approveMutation.isPending || props.rejectMutation.isPending}
    />
  )
}

export default ApprovalModal
