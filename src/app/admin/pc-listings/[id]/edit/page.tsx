'use client'

import { useParams } from 'next/navigation'
import { AdminPageLayout } from '@/components/admin'
import { LoadingSpinner } from '@/components/ui'
import { api } from '@/lib/api'
import PcListingEditForm from './components/PcListingEditForm'

function EditPcListingPage() {
  const params = useParams()
  const pcListingId = params.id as string

  const pcListingQuery = api.pcListings.getForEdit.useQuery(
    { id: pcListingId },
    { enabled: !!pcListingId },
  )

  if (pcListingQuery.isPending) {
    return (
      <AdminPageLayout title="Edit PC Listing" description="Loading PC listing…">
        <LoadingSpinner text="Loading PC listing..." />
      </AdminPageLayout>
    )
  }

  if (pcListingQuery.error) {
    return (
      <AdminPageLayout title="Edit PC Listing" description="Loading failed">
        <p className="text-red-600 dark:text-red-400 text-lg">
          Error loading PC listing: {pcListingQuery.error.message}
        </p>
      </AdminPageLayout>
    )
  }

  if (!pcListingQuery.data) {
    return (
      <AdminPageLayout title="Edit PC Listing" description="Not found">
        <p className="text-gray-600 dark:text-gray-400 text-lg">PC listing not found</p>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout
      title="Edit PC Listing"
      description={`Modify the PC compatibility report for ${pcListingQuery.data.game.title}`}
    >
      <PcListingEditForm pcListing={pcListingQuery.data} />
    </AdminPageLayout>
  )
}

export default EditPcListingPage
