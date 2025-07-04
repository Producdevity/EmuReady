'use client'

import { useUser } from '@clerk/nextjs'
import { Flag } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui'
import PcReportListingModal from './PcReportListingModal'

interface Props {
  pcListingId: string
  authorId: string
  onSuccess?: () => void
}

function PcReportListingButton(props: Props) {
  const { user } = useUser()
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Don't show report button if user is not logged in
  if (!user?.id) return null

  // Don't show report button if the user is the author
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
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 border-gray-300 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-600"
      >
        <Flag size={16} />
        Report
      </Button>

      <PcReportListingModal
        pcListingId={props.pcListingId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  )
}

export default PcReportListingButton
