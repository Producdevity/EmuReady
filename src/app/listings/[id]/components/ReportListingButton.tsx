'use client'

import { Flag } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui'
import ReportListingModal from './ReportListingModal'

interface Props {
  listingId: string
  authorId: string
  currentUserId?: string | null
  onSuccess?: () => void
}

function ReportListingButton(props: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (!props.currentUserId) return null
  if (props.currentUserId === props.authorId) return null

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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  )
}

export default ReportListingButton
