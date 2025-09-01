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

  if (!user?.id) return null

  // Show loading state while checking permissions
  if (canEditQuery.isPending || canEditQuery.isLoading) {
    return (
      <Button variant="outline" size="sm" disabled title="Checking edit permissions...">
        <Clock className="w-4 h-4" />
        <span className="ml-1 hidden sm:inline">Loading...</span>
      </Button>
    )
  }

  // Handle error state
  if (canEditQuery.isError) {
    return null
  }

  // If data is not available for some reason, don't show the button
  if (!canEditQuery.data) return null

  // If user can't edit (not owner and not moderator), don't show the button
  if (!canEditQuery.data.canEdit) return null

  const canEdit = canEditQuery.data.canEdit
  const isOwner = canEditQuery.data.isOwner
  const remainingMinutes = canEditQuery.data.remainingMinutes ?? 0
  const timeExpired = canEditQuery.data.timeExpired ?? false
  const isPending = canEditQuery.data.isPending ?? false
  const isApproved = canEditQuery.data.isApproved ?? false

  const buttonTitle = canEdit
    ? !isOwner
      ? 'Edit listing (moderator override)'
      : isPending
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
        onClick={() => setIsModalOpen(true)}
        disabled={!canEdit}
        title={buttonTitle}
        className={canEdit ? '' : 'opacity-50'}
      >
        <Edit3 className="w-4 h-4" />
        <span className="ml-1 hidden sm:inline">Edit</span>
      </Button>

      <EditListingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
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
