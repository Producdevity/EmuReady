import { type Metadata } from 'next'
import { notFound, useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { LoadingSpinner } from '@/components/ui'
import ListingDetailsClient from './components/ListingDetailsClient'
import sanitizeForClient from '@/utils/sanitizeForClient'

export const metadata: Metadata = {
  title: 'Listing Details | EmuReady',
  description: 'View detailed information about a compatibility listing',
}

function ListingDetailsPage() {
  const params = useParams()
  const id = params.id as string

  const { data: listing, isLoading, error } = api.listings.byId.useQuery({ id })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <LoadingSpinner text="Loading listing details..." />
        </div>
      </div>
    )
  }

  if (error || !listing) {
    notFound()
  }

  return (
    <ListingDetailsClient
      listing={sanitizeForClient(listing)}
      successRate={listing.successRate}
      upVotes={Math.round(listing.successRate * listing._count.votes)}
      totalVotes={listing._count.votes}
      userVote={listing.userVote}
    />
  )
}

export default ListingDetailsPage
