'use client'

import { useState } from 'react'
import { ApprovalStatusBadge, ApproveButton, Button, RejectButton } from '@/components/ui'
import { api } from '@/lib/api'
import { logger } from '@/lib/logger'
import toast from '@/lib/toast'
import { type ListingType } from '@/schemas/common'
import { type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { roleIncludesRole } from '@/utils/permission-system'
import { ApprovalStatus, Role } from '@orm'
import {
  CompatibilityReportReviewModal,
  type CompatibilityReportReviewAuthor,
  type CompatibilityReportReviewItem,
} from './CompatibilityReportReviewModal'

type HandheldListing = NonNullable<RouterOutput['listings']['byId']>
type PcListing = NonNullable<RouterOutput['pcListings']['byId']>

interface Props {
  listing: HandheldListing | PcListing
  listingType: ListingType
  onApprovalSuccess?: () => void | Promise<void>
  className?: string
}

function isHandheldListing(listing: HandheldListing | PcListing): listing is HandheldListing {
  return 'device' in listing
}

function getAuthor(listing: HandheldListing | PcListing): CompatibilityReportReviewAuthor {
  return {
    id: listing.author?.id ?? listing.authorId,
    name: listing.author?.name ?? null,
  }
}

function toReviewItem(listing: HandheldListing | PcListing): CompatibilityReportReviewItem {
  return {
    game: listing.game,
    hardware: isHandheldListing(listing)
      ? { type: 'device', device: listing.device }
      : { type: 'pc', cpu: listing.cpu, gpu: listing.gpu },
    emulator: listing.emulator,
    author: getAuthor(listing),
    createdAt: listing.createdAt,
    performance: listing.performance,
    notes: listing.notes,
    customFieldValues: listing.customFieldValues,
    authorRiskProfile: listing.authorRiskProfile,
    submissionRiskProfile: listing.submissionRiskProfile,
  }
}

function getReportLabel(listingType: ListingType): string {
  return listingType === 'handheld' ? 'Listing' : 'PC Listing'
}

export function CompatibilityReportApprovalActions(props: Props) {
  const [showModal, setShowModal] = useState(false)
  const [approvalDecision, setApprovalDecision] = useState<ApprovalStatus>(ApprovalStatus.APPROVED)
  const [rejectionNotes, setRejectionNotes] = useState('')

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

  const handleOpenModal = (decision: ApprovalStatus) => {
    setApprovalDecision(decision)
    setRejectionNotes('')
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setRejectionNotes('')
  }

  const handleConfirm = async () => {
    try {
      if (approvalDecision === ApprovalStatus.APPROVED) {
        if (props.listingType === 'handheld') {
          await handheldApproveMutation.mutateAsync({ listingId: props.listing.id })
        } else {
          await pcApproveMutation.mutateAsync({ pcListingId: props.listing.id })
        }
        toast.success(`${reportLabel} approved successfully`)
      } else {
        if (props.listingType === 'handheld') {
          await handheldRejectMutation.mutateAsync({
            listingId: props.listing.id,
            notes: rejectionNotes || undefined,
          })
        } else {
          await pcRejectMutation.mutateAsync({
            pcListingId: props.listing.id,
            notes: rejectionNotes || undefined,
          })
        }
        toast.success(`${reportLabel} rejected successfully`)
      }

      handleCloseModal()

      if (props.onApprovalSuccess) {
        await props.onApprovalSuccess()
      }
    } catch (error) {
      const action = approvalDecision === ApprovalStatus.APPROVED ? 'approve' : 'reject'
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
              onClick={() => handleOpenModal(ApprovalStatus.APPROVED)}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              title={`Approve ${reportLabel}`}
            />
            <RejectButton
              onClick={() => handleOpenModal(ApprovalStatus.REJECTED)}
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

      {showModal && (
        <CompatibilityReportReviewModal
          isOpen={showModal}
          onClose={handleCloseModal}
          decision={approvalDecision}
          reportLabel={reportLabel}
          report={toReviewItem(props.listing)}
          rejectionNotes={rejectionNotes}
          onRejectionNotesChange={setRejectionNotes}
          onSubmit={handleConfirm}
          isSubmitting={approveMutation.isPending || rejectMutation.isPending}
        />
      )}
    </>
  )
}
