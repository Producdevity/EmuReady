'use client'

import { ApprovalStatusBadge, ApproveButton, Button, RejectButton } from '@/components/ui'
import { api } from '@/lib/api'
import { logger } from '@/lib/logger'
import toast from '@/lib/toast'
import { type ListingType } from '@/schemas/common'
import { type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { roleIncludesRole } from '@/utils/permission-system'
import { ApprovalStatus, Role } from '@orm'
import { CompatibilityReportReviewModalAdapter } from './CompatibilityReportReviewModalAdapter'
import { CompatibilityReportReviewDecision } from './reviewItem'
import { useCompatibilityReportReviewDecisionModal } from './useCompatibilityReportReviewDecisionModal'

type HandheldListing = NonNullable<RouterOutput['listings']['byId']>
type PcListing = NonNullable<RouterOutput['pcListings']['byId']>

interface Props {
  listing: HandheldListing | PcListing
  listingType: ListingType
  onApprovalSuccess?: () => void | Promise<void>
  className?: string
}

function getReportLabel(listingType: ListingType): string {
  return listingType === 'handheld' ? 'Listing' : 'PC Listing'
}

export function CompatibilityReportApprovalActions(props: Props) {
  const reviewModal = useCompatibilityReportReviewDecisionModal<HandheldListing | PcListing>()

  const currentUserQuery = api.users.me.useQuery()

  const handheldApproveMutation = api.listings.approveListing.useMutation()
  const handheldRejectMutation = api.listings.rejectListing.useMutation()
  const pcApproveMutation = api.pcListings.approve.useMutation()
  const pcRejectMutation = api.pcListings.reject.useMutation()

  const handheldResetMutation = api.listings.resetToPending.useMutation()
  const pcResetMutation = api.pcListings.resetToPending.useMutation()

  const approveMutation =
    props.listingType === 'handheld' ? handheldApproveMutation : pcApproveMutation
  const rejectMutation =
    props.listingType === 'handheld' ? handheldRejectMutation : pcRejectMutation
  const resetMutation = props.listingType === 'handheld' ? handheldResetMutation : pcResetMutation

  const hasApprovalPermission =
    currentUserQuery.data &&
    (roleIncludesRole(currentUserQuery.data.role, Role.MODERATOR) ||
      roleIncludesRole(currentUserQuery.data.role, Role.DEVELOPER))

  const canResetToPending =
    currentUserQuery.data && roleIncludesRole(currentUserQuery.data.role, Role.MODERATOR)

  if (!currentUserQuery.data || !hasApprovalPermission) return null

  const isPending = props.listing.status === ApprovalStatus.PENDING
  const isAlreadyReviewed = !isPending
  const reportLabel = getReportLabel(props.listingType)

  const handleOpenModal = (decision: CompatibilityReportReviewDecision) => {
    reviewModal.open(props.listing, decision)
  }

  const handleCloseModal = () => {
    reviewModal.close()
  }

  const handleConfirm = async () => {
    if (!reviewModal.selectedReport || !reviewModal.decision) return

    try {
      if (reviewModal.decision === CompatibilityReportReviewDecision.APPROVED) {
        if (props.listingType === 'handheld') {
          await handheldApproveMutation.mutateAsync({ listingId: reviewModal.selectedReport.id })
        } else {
          await pcApproveMutation.mutateAsync({ pcListingId: reviewModal.selectedReport.id })
        }
        toast.success(`${reportLabel} approved successfully`)
      } else {
        if (props.listingType === 'handheld') {
          await handheldRejectMutation.mutateAsync({
            listingId: reviewModal.selectedReport.id,
            notes: reviewModal.notes || undefined,
          })
        } else {
          await pcRejectMutation.mutateAsync({
            pcListingId: reviewModal.selectedReport.id,
            notes: reviewModal.notes || undefined,
          })
        }
        toast.success(`${reportLabel} rejected successfully`)
      }

      handleCloseModal()

      if (props.onApprovalSuccess) {
        await props.onApprovalSuccess()
      }
    } catch (error) {
      const action =
        reviewModal.decision === CompatibilityReportReviewDecision.APPROVED ? 'approve' : 'reject'
      logger.error(`Failed to ${action} ${reportLabel}:`, error)
      toast.error(`Failed to ${action} ${reportLabel}: ${getErrorMessage(error)}`)
    }
  }

  const handleResetToPending = async () => {
    try {
      if (props.listingType === 'handheld') {
        await handheldResetMutation.mutateAsync({ listingId: props.listing.id })
      } else {
        await pcResetMutation.mutateAsync({ pcListingId: props.listing.id })
      }
      toast.success(`${reportLabel} reset to pending`)

      if (props.onApprovalSuccess) {
        await props.onApprovalSuccess()
      }
    } catch (error) {
      logger.error(`Failed to reset ${reportLabel} to pending:`, error)
      toast.error(`Failed to reset ${reportLabel}: ${getErrorMessage(error)}`)
    }
  }

  return (
    <>
      <div className={props.className}>
        {isPending && (
          <div className="flex gap-3 flex-wrap align-center justify-center">
            <ApproveButton
              onClick={() => handleOpenModal(CompatibilityReportReviewDecision.APPROVED)}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              title={`Approve ${reportLabel}`}
            />
            <RejectButton
              onClick={() => handleOpenModal(CompatibilityReportReviewDecision.REJECTED)}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              title={`Reject ${reportLabel}`}
            />
          </div>
        )}

        {isAlreadyReviewed && canResetToPending && (
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <ApprovalStatusBadge status={props.listing.status} />
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetToPending}
              disabled={resetMutation.isPending}
            >
              {resetMutation.isPending ? 'Resetting...' : 'Reset to Pending'}
            </Button>
          </div>
        )}
      </div>

      {reviewModal.isOpen && reviewModal.selectedReport && reviewModal.decision && (
        <CompatibilityReportReviewModalAdapter
          isOpen={reviewModal.isOpen}
          onClose={handleCloseModal}
          decision={reviewModal.decision}
          reportLabel={reportLabel}
          report={reviewModal.selectedReport}
          rejectionNotes={reviewModal.notes}
          onRejectionNotesChange={reviewModal.setNotes}
          onSubmit={handleConfirm}
          isSubmitting={approveMutation.isPending || rejectMutation.isPending}
        />
      )}
    </>
  )
}
