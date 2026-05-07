'use client'

import { useParams } from 'next/navigation'
import { AdminPageLayout } from '@/components/admin'
import { LoadingSpinner } from '@/components/ui'
import { api } from '@/lib/api'
import ListingEditForm from './components/ListingEditForm'

function EditListingPage() {
  const params = useParams()
  const listingId = params.id as string

  const listingQuery = api.listings.getForEdit.useQuery({ id: listingId }, { enabled: !!listingId })

  if (listingQuery.isPending) {
    return (
      <AdminPageLayout title="Edit Listing" description="Loading listing…">
        <LoadingSpinner text="Loading listing..." />
      </AdminPageLayout>
    )
  }

  if (listingQuery.error) {
    return (
      <AdminPageLayout title="Edit Listing" description="Loading failed">
        <p className="text-red-600 dark:text-red-400 text-lg">
          Error loading listing: {listingQuery.error.message}
        </p>
      </AdminPageLayout>
    )
  }

  if (!listingQuery.data) {
    return (
      <AdminPageLayout title="Edit Listing" description="Not found">
        <p className="text-gray-600 dark:text-gray-400 text-lg">Listing not found</p>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout
      title="Edit Listing"
      description={`Modify the performance listing for ${listingQuery.data.game.title}`}
    >
      <ListingEditForm listing={listingQuery.data} />
    </AdminPageLayout>
  )
}

export default EditListingPage
