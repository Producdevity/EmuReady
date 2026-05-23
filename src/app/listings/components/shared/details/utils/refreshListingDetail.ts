import { type api } from '@/lib/api'

type Utils = ReturnType<typeof api.useUtils>

interface RefreshHandheldParams {
  utils: {
    listings: {
      byId: Pick<Utils['listings']['byId'], 'invalidate' | 'refetch'>
      moderatorInfo: Pick<Utils['listings']['moderatorInfo'], 'invalidate'>
    }
  }
  listingId: string
}

export async function refreshHandheldListingDetail(params: RefreshHandheldParams): Promise<void> {
  await Promise.all([
    params.utils.listings.byId.invalidate({ id: params.listingId }),
    params.utils.listings.moderatorInfo.invalidate({ id: params.listingId, type: 'handheld' }),
  ])
  await params.utils.listings.byId.refetch({ id: params.listingId })
}

interface RefreshPcParams {
  utils: {
    pcListings: {
      byId: Pick<Utils['pcListings']['byId'], 'invalidate'>
    }
    listings: {
      moderatorInfo: Pick<Utils['listings']['moderatorInfo'], 'invalidate'>
    }
  }
  pcListingId: string
}

export async function refreshPcListingDetail(params: RefreshPcParams): Promise<void> {
  await Promise.all([
    params.utils.pcListings.byId.invalidate({ id: params.pcListingId }),
    params.utils.listings.moderatorInfo.invalidate({ id: params.pcListingId, type: 'pc' }),
  ])
}
