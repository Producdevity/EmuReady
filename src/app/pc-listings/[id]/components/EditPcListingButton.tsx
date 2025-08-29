'use client'

import { useUser } from '@clerk/nextjs'
import { Edit3, Clock } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui'
import { api } from '@/lib/api'
import EditPcListingModal from './EditPcListingModal'

interface Props {
  pcListingId: string
  onSuccess?: () => void
}

function EditPcListingButton(props: Props) {
  const { user } = useUser()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const canEditQuery = api.pcListings.canEdit.useQuery(
    { id: props.pcListingId },
    {
      enabled: !!user?.id,
      refetchInterval: 60000, // Refetch every minute to update time remaining
    },
  )

  // Don't show anything if user is not logged in
  if (!user?.id) return null

  // Show loading state
  if (canEditQuery.isPending) {
    return (
      <Button variant="outline" size="sm" disabled title="Checking edit permissions...">
        <Clock className="w-4 h-4" />
      </Button>
    )
  }

  // If user can't edit (not owner and not moderator), don't show the button
  if (!canEditQuery.data?.canEdit) return null

  const canEdit = canEditQuery.data?.canEdit ?? false
  const isOwner = canEditQuery.data?.isOwner ?? true
  const remainingMinutes = canEditQuery.data?.remainingMinutes ?? 0
  const timeExpired = canEditQuery.data?.timeExpired ?? false
  const isPending = canEditQuery.data?.isPending ?? false
  const isApproved = canEditQuery.data?.isApproved ?? false

  const buttonTitle = canEdit
    ? !isOwner
      ? 'Edit PC listing (moderator override)'
      : isPending
        ? 'Edit PC listing (pending approval - no time limit)'
        : `Edit PC listing (${remainingMinutes} minutes remaining after approval)`
    : timeExpired
      ? 'Edit time expired (60 minute limit after approval)'
      : 'Cannot edit PC listing'

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        disabled={!canEdit}
        title={buttonTitle}
        className={canEdit ? '' : 'opacity-50'}
      >
        <Edit3 className="w-4 h-4" />
        <span className="ml-1 hidden sm:inline">Edit</span>
      </Button>

      <EditPcListingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        pcListingId={props.pcListingId}
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

export default EditPcListingButton
