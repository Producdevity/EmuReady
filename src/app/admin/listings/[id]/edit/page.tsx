'use client'

import { useParams } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui'
import { api } from '@/lib/api'
import ListingEditForm from './components/ListingEditForm'

function EditListingPage() {
  const params = useParams()
  const listingId = params.id as string

  const listingQuery = api.listings.getForEdit.useQuery({ id: listingId }, { enabled: !!listingId })

  if (listingQuery.isPending) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner text="Loading listing..." />
      </div>
    )
  }

  if (listingQuery.error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 text-lg">
            Error loading listing: {listingQuery.error.message}
          </p>
        </div>
      </div>
    )
  }

  if (!listingQuery.data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 text-lg">Listing not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Listing</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Modify the performance listing for {listingQuery.data.game.title}
        </p>
      </div>

      <ListingEditForm listing={listingQuery.data} />
    </div>
  )
}

export default EditListingPage
