import { describe, expect, it, vi } from 'vitest'
import { refreshHandheldListingDetail, refreshPcListingDetail } from './refreshListingDetail'

function createMockUtils() {
  return {
    listings: {
      byId: {
        invalidate: vi.fn().mockResolvedValue(undefined),
        refetch: vi.fn().mockResolvedValue(undefined),
      },
      moderatorInfo: {
        invalidate: vi.fn().mockResolvedValue(undefined),
      },
    },
    pcListings: {
      byId: {
        invalidate: vi.fn().mockResolvedValue(undefined),
      },
    },
  }
}

describe('refreshHandheldListingDetail', () => {
  const LISTING_ID = '00000000-0000-4000-a000-000000000010'

  it('invalidates listings.byId and listings.moderatorInfo with type=handheld', async () => {
    const utils = createMockUtils()

    await refreshHandheldListingDetail({ utils, listingId: LISTING_ID })

    expect(utils.listings.byId.invalidate).toHaveBeenCalledWith({ id: LISTING_ID })
    expect(utils.listings.moderatorInfo.invalidate).toHaveBeenCalledWith({
      id: LISTING_ID,
      type: 'handheld',
    })
  })

  it('refetches listings.byId after invalidation completes', async () => {
    const utils = createMockUtils()
    const refetchOrder: string[] = []
    vi.mocked(utils.listings.byId.invalidate).mockImplementation(async () => {
      refetchOrder.push('invalidate-byId')
    })
    vi.mocked(utils.listings.moderatorInfo.invalidate).mockImplementation(async () => {
      refetchOrder.push('invalidate-moderatorInfo')
    })
    vi.mocked(utils.listings.byId.refetch).mockImplementation(async () => {
      refetchOrder.push('refetch-byId')
    })

    await refreshHandheldListingDetail({ utils, listingId: LISTING_ID })

    expect(refetchOrder.indexOf('refetch-byId')).toBeGreaterThan(
      refetchOrder.indexOf('invalidate-byId'),
    )
    expect(refetchOrder.indexOf('refetch-byId')).toBeGreaterThan(
      refetchOrder.indexOf('invalidate-moderatorInfo'),
    )
  })

  it('does NOT touch the pcListings utils', async () => {
    const utils = createMockUtils()

    await refreshHandheldListingDetail({ utils, listingId: LISTING_ID })

    expect(utils.pcListings.byId.invalidate).not.toHaveBeenCalled()
  })
})

describe('refreshPcListingDetail', () => {
  const PC_LISTING_ID = '00000000-0000-4000-a000-000000000011'

  it('invalidates pcListings.byId and listings.moderatorInfo with type=pc', async () => {
    const utils = createMockUtils()

    await refreshPcListingDetail({ utils, pcListingId: PC_LISTING_ID })

    expect(utils.pcListings.byId.invalidate).toHaveBeenCalledWith({ id: PC_LISTING_ID })
    expect(utils.listings.moderatorInfo.invalidate).toHaveBeenCalledWith({
      id: PC_LISTING_ID,
      type: 'pc',
    })
  })

  it('does NOT touch the handheld listings.byId utils', async () => {
    const utils = createMockUtils()

    await refreshPcListingDetail({ utils, pcListingId: PC_LISTING_ID })

    expect(utils.listings.byId.invalidate).not.toHaveBeenCalled()
    expect(utils.listings.byId.refetch).not.toHaveBeenCalled()
  })

  it('does NOT call refetch', async () => {
    const utils = createMockUtils()

    await refreshPcListingDetail({ utils, pcListingId: PC_LISTING_ID })

    expect(utils.listings.byId.refetch).not.toHaveBeenCalled()
  })
})
