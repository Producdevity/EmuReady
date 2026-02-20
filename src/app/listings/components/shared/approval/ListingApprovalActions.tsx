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
import { ListingApprovalModal } from './ListingApprovalModal'

type HandheldListing = RouterOutput['listings']['byId']
type PcListing = RouterOutput['pcListings']['byId']

interface Props {
  listing: HandheldListing | PcListing
  listingType: ListingType
  onApprovalSuccess?: () => void | Promise<void>
  className?: string
}

export function ListingApprovalActions(props: Props) {
  const [showModal, setShowModal] = useState(false)
  const [modalAction, setModalAction] = useState<'approve' | 'reject'>('approve')
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

  const handleOpenModal = (action: 'approve' | 'reject') => {
    setModalAction(action)
    setRejectionNotes('')
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setRejectionNotes('')
  }

  const handleConfirm = async () => {
    try {
      if (modalAction === 'approve') {
        if (props.listingType === 'handheld') {
          await handheldApproveMutation.mutateAsync({ listingId: props.listing.id })
        } else {
          await pcApproveMutation.mutateAsync({ pcListingId: props.listing.id })
        }
        toast.success('Listing approved successfully')
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
        toast.success('Listing rejected successfully')
      }

      handleCloseModal()

      if (props.onApprovalSuccess) {
        await props.onApprovalSuccess()
      }
    } catch (error) {
      logger.error('Failed to approve listing:', error)
      const message = getErrorMessage(error)
      toast.error(`Failed to ${modalAction} listing: ${message}`)
    }
  }

  const handleResetToPending = async () => {
    try {
      if (props.listingType === 'handheld') {
        await handheldResetMutation.mutateAsync({ listingId: props.listing.id })
      } else {
        await pcResetMutation.mutateAsync({ pcListingId: props.listing.id })
      }
      toast.success('Listing reset to pending')

      if (props.onApprovalSuccess) {
        await props.onApprovalSuccess()
      }
    } catch (error) {
      logger.error('Failed to reset listing to pending:', error)
      toast.error(`Failed to reset listing: ${getErrorMessage(error)}`)
    }
  }

  return (
    <>
      <div className={props.className}>
        {isPending && (
          <div className="flex gap-3 flex-wrap align-center justify-center">
            <ApproveButton
              onClick={() => handleOpenModal('approve')}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              title="Approve Listing"
            />
            <RejectButton
              onClick={() => handleOpenModal('reject')}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              title="Reject Listing"
            />
          </div>
        )}

        {isAlreadyReviewed && canResetToPending && (
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <ApprovalStatusBadge status={props.listing.status as ApprovalStatus} />
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
        <ListingApprovalModal
          listing={props.listing}
          listingType={props.listingType}
          action={modalAction}
          rejectionNotes={rejectionNotes}
          onRejectionNotesChange={setRejectionNotes}
          onConfirm={handleConfirm}
          onClose={handleCloseModal}
          isLoading={approveMutation.isPending || rejectMutation.isPending}
        />
      )}
    </>
  )
}
