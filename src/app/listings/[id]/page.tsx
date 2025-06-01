'use client'

import { notFound, useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { LoadingSpinner } from '@/components/ui'
import ListingDetailsClient from './components/ListingDetailsClient'
import sanitizeForClient from '@/utils/sanitizeForClient'

function ListingDetailsPage() {
  const params = useParams()

  const listingQuery = api.listings.byId.useQuery({ id: params.id as string })

  if (listingQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <LoadingSpinner text="Loading listing details..." />
        </div>
      </div>
    )
  }

  if (listingQuery.error || !listingQuery.data) return notFound()

  return (
    <ListingDetailsClient
      listing={sanitizeForClient(listingQuery.data)}
      successRate={listingQuery.data.successRate}
      upVotes={Math.round(
        listingQuery.data.successRate * listingQuery.data._count.votes,
      )}
      totalVotes={listingQuery.data._count.votes}
      userVote={listingQuery.data.userVote}
    />
  )
}

export default ListingDetailsPage
