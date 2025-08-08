'use client'

import { notFound, useParams } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui'
import { api } from '@/lib/api'
import sanitizeForClient from '@/utils/sanitizeForClient'
import PcListingDetailsClient from './components/PcListingDetailsClient'

function PcListingDetailsPage() {
  const params = useParams()

  const pcListingQuery = api.pcListings.byId.useQuery({
    id: params.id as string,
  })

  if (pcListingQuery.isPending) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <LoadingSpinner text="Loading PC listing details..." />
        </div>
      </div>
    )
  }

  if (pcListingQuery.error || !pcListingQuery.data) return notFound()

  return <PcListingDetailsClient pcListing={sanitizeForClient(pcListingQuery.data)} />
}

export default PcListingDetailsPage
