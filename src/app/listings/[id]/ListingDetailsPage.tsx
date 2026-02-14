'use client'

import { notFound, useParams } from 'next/navigation'
import { ListingDetailSkeleton } from '@/app/listings/shared/components'
import { api } from '@/lib/api'
import sanitizeForClient from '@/utils/sanitizeForClient'
import ListingDetailsClient from './components/ListingDetailsClient'

function ListingDetailsPage() {
  const params = useParams()

  const listingQuery = api.listings.byId.useQuery({ id: params.id as string })

  if (listingQuery.isPending) {
    return <ListingDetailSkeleton variant="handheld" />
  }

  if (listingQuery.error || !listingQuery.data) return notFound()

  return <ListingDetailsClient listing={sanitizeForClient(listingQuery.data)} />
}

export default ListingDetailsPage
