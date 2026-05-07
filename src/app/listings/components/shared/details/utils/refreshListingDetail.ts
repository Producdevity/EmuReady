import { type api } from '@/lib/api'
import { type ListingType } from '@/lib/api/useListingApi'

type Utils = ReturnType<typeof api.useUtils>

interface Params {
  utils: {
    listings: {
      byId?: Pick<Utils['listings']['byId'], 'invalidate' | 'refetch'>
      moderatorInfo: Pick<Utils['listings']['moderatorInfo'], 'invalidate'>
    }
    pcListings?: {
      byId: Pick<Utils['pcListings']['byId'], 'invalidate'>
    }
  }
  listingId: string
  listingType: ListingType
}

export async function refreshListingDetail(params: Params): Promise<void> {
  if (params.listingType === 'pc') {
    if (!params.utils.pcListings) return
    await Promise.all([
      params.utils.pcListings.byId.invalidate({ id: params.listingId }),
      params.utils.listings.moderatorInfo.invalidate({ id: params.listingId, type: 'pc' }),
    ])
    return
  }

  if (!params.utils.listings.byId) return
  await Promise.all([
    params.utils.listings.byId.invalidate({ id: params.listingId }),
    params.utils.listings.moderatorInfo.invalidate({ id: params.listingId, type: 'handheld' }),
  ])
  await params.utils.listings.byId.refetch({ id: params.listingId })
}
