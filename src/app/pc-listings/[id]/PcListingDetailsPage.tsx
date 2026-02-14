'use client'

import { notFound, useParams } from 'next/navigation'
import { ListingDetailSkeleton } from '@/app/listings/shared/components'
import { api } from '@/lib/api'
import sanitizeForClient from '@/utils/sanitizeForClient'
import PcListingDetailsClient from './components/PcListingDetailsClient'

function PcListingDetailsPage() {
  const params = useParams()

  const pcListingQuery = api.pcListings.byId.useQuery({
    id: params.id as string,
  })

  if (pcListingQuery.isPending) {
    return <ListingDetailSkeleton variant="pc" />
  }

  if (pcListingQuery.error || !pcListingQuery.data) return notFound()

  return <PcListingDetailsClient pcListing={sanitizeForClient(pcListingQuery.data)} />
}

export default PcListingDetailsPage
