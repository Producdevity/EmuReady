import type { RouterOutput } from '@/types/trpc'

type Listing = NonNullable<RouterOutput['listings']['byId']>
type PcListing = NonNullable<RouterOutput['pcListings']['byId']>

export function hasHandheldDevice(listing: Listing | PcListing): listing is Listing {
  return 'device' in listing && listing.device !== null && listing.device !== undefined
}
