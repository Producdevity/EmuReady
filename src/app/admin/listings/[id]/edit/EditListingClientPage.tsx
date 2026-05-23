'use client'

import { AdminErrorState } from '@/components/admin/AdminErrorState'
import { LoadingSpinner } from '@/components/ui'
import { api } from '@/lib/api'
import { isTRPCNotFoundError } from '@/lib/trpc-client-errors'
import ListingEditForm from './components/ListingEditForm'

interface Props {
  listingId: string
}

export default function EditListingClientPage(props: Props) {
  const listingQuery = api.listings.getForEdit.useQuery(
    { id: props.listingId },
    { enabled: !!props.listingId },
  )

  if (listingQuery.isPending) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner text="Loading handheld report..." />
      </div>
    )
  }

  if (listingQuery.error) {
    const isNotFound = isTRPCNotFoundError(listingQuery.error)
    return (
      <AdminErrorState
        title={isNotFound ? 'Handheld report not found' : 'Unable to load handheld report'}
        message={
          isNotFound
            ? 'The handheld report you are trying to edit was not found or is no longer available.'
            : 'The handheld report data could not be loaded. Please try again.'
        }
        onRetry={() => void listingQuery.refetch()}
      />
    )
  }

  if (!listingQuery.data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 text-lg">Handheld report not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Handheld Report</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Modify the handheld compatibility report for {listingQuery.data.game.title}
        </p>
      </div>

      <ListingEditForm listing={listingQuery.data} />
    </div>
  )
}
