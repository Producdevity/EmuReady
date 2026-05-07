'use client'

import { useUser } from '@clerk/nextjs'
import { Flag } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui'
import { type ListingType } from '@/lib/api/useListingApi'
import ReportListingModal from './ReportListingModal'

interface Props {
  listingId: string
  listingType: ListingType
  authorId: string
  onSuccess?: () => void
}

function ReportListingButton(props: Props) {
  const { user } = useUser()
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (!user?.id) return null
  if (user.id === props.authorId) return null

  const handleSuccess = () => {
    setIsModalOpen(false)
    props.onSuccess?.()
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        icon={Flag}
        onClick={() => setIsModalOpen(true)}
        className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 border-gray-300 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-600"
      >
        Report
      </Button>

      <ReportListingModal
        listingId={props.listingId}
        listingType={props.listingType}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  )
}

export default ReportListingButton
