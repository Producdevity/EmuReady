'use client'

import {
  CompatibilityReportReviewModal,
  type CompatibilityReportReviewItem,
} from '@/components/compatibility/review'
import { type RouterOutput } from '@/types/trpc'
import { type ApprovalStatus } from '@orm'

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

function toReviewItem(pcListing: PendingPcListing): CompatibilityReportReviewItem {
  return {
    game: pcListing.game,
    hardware: { type: 'pc', cpu: pcListing.cpu, gpu: pcListing.gpu },
    emulator: pcListing.emulator,
    author: pcListing.author,
    createdAt: pcListing.createdAt,
    performance: pcListing.performance,
    notes: pcListing.notes,
    customFieldValues: pcListing.customFieldValues,
    authorRiskProfile: pcListing.authorRiskProfile,
    submissionRiskProfile: pcListing.submissionRiskProfile,
  }
}

function ApprovalModal(props: Props) {
  return (
    <CompatibilityReportReviewModal
      isOpen={props.showApprovalModal}
      onClose={props.closeApprovalModal}
      decision={props.approvalDecision}
      reportLabel="PC Listing"
      report={toReviewItem(props.selectedPcListingForApproval)}
      rejectionNotes={props.approvalNotes}
      onRejectionNotesChange={props.setApprovalNotes}
      onSubmit={props.handleApprovalSubmit}
      isSubmitting={props.approveMutation.isPending || props.rejectMutation.isPending}
    />
  )
}

export default ApprovalModal
