'use client'

import { useUser } from '@clerk/nextjs'
import { Edit3, Clock } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui'
import { api } from '@/lib/api'
import EditListingModal from './EditListingModal'

interface Props {
  listingId: string
  onSuccess?: () => void
}

function EditListingButton(props: Props) {
  const { user } = useUser()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const canEditQuery = api.listings.canEdit.useQuery(
    { id: props.listingId },
    {
      enabled: !!user?.id,
      refetchInterval: 60000, // Refetch every minute to update time remaining
    },
  )

  const handleOpen = () => {
    setIsModalOpen(true)
  }

  const handleClose = () => {
    setIsModalOpen(false)
  }

  // Don't show anything if user is not logged in
  if (!user?.id) {
    return null
  }

  // If it's not our listing, don't show the button at all
  if (canEditQuery.data?.isOwner === false) {
    return null
  }

  // Show loading state
  if (canEditQuery.isPending) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        title="Checking edit permissions..."
      >
        <Clock className="w-4 h-4" />
      </Button>
    )
  }

  const canEdit = canEditQuery.data?.canEdit ?? false
  const remainingMinutes = canEditQuery.data?.remainingMinutes ?? 0
  const timeExpired = canEditQuery.data?.timeExpired ?? false
  const isPending = canEditQuery.data?.isPending ?? false
  const isApproved = canEditQuery.data?.isApproved ?? false

  const buttonTitle = canEdit
    ? isPending
      ? 'Edit listing (pending approval - no time limit)'
      : `Edit listing (${remainingMinutes} minutes remaining after approval)`
    : timeExpired
      ? 'Edit time expired (60 minute limit after approval)'
      : 'Cannot edit listing'

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        disabled={!canEdit}
        title={buttonTitle}
        className={canEdit ? '' : 'opacity-50'}
      >
        <Edit3 className="w-4 h-4" />
        <span className="ml-1 hidden sm:inline">Edit</span>
      </Button>

      <EditListingModal
        isOpen={isModalOpen}
        onClose={handleClose}
        listingId={props.listingId}
        canEdit={canEdit}
        remainingMinutes={remainingMinutes}
        timeExpired={timeExpired}
        isPending={isPending}
        isApproved={isApproved}
        onSuccess={props.onSuccess}
      />
    </>
  )
}

export default EditListingButton
