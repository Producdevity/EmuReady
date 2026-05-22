import { beforeEach, describe, expect, it, vi } from 'vitest'

const nextCacheMocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

vi.mock('next/cache', () => nextCacheMocks)

const {
  invalidateListingSeo,
  invalidatePcListing,
  invalidatePcListingSeoForUpdate,
  revalidateByTag,
} = await import('./invalidation')

describe('cache invalidation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses the stale-while-revalidate profile for tag invalidation', async () => {
    await revalidateByTag('games')

    expect(nextCacheMocks.revalidateTag).toHaveBeenCalledWith('games', 'max')
  })

  it('invalidates PC listing paths and tags consistently', async () => {
    await invalidatePcListing('pc-listing-1')

    expect(nextCacheMocks.revalidatePath).toHaveBeenCalledWith('/pc-listings/pc-listing-1')
    expect(nextCacheMocks.revalidateTag).toHaveBeenCalledWith('pc-listing-pc-listing-1', 'max')
  })

  it('deduplicates related PC listing SEO tags for updates', async () => {
    await invalidatePcListingSeoForUpdate(
      { id: 'pc-listing-1', gameId: 'old-game', cpuId: 'old-cpu', gpuId: 'gpu-1' },
      { id: 'pc-listing-1', gameId: 'new-game', cpuId: 'new-cpu', gpuId: 'gpu-1' },
    )

    expect(nextCacheMocks.revalidatePath).toHaveBeenCalledWith('/pc-listings/pc-listing-1')
    expect(nextCacheMocks.revalidatePath).toHaveBeenCalledWith('/pc-listings')
    expect(nextCacheMocks.revalidatePath).toHaveBeenCalledWith('/sitemap.xml')
    expect(nextCacheMocks.revalidateTag).toHaveBeenCalledWith('pc-listings', 'max')
    expect(nextCacheMocks.revalidateTag).toHaveBeenCalledWith('game-old-game', 'max')
    expect(nextCacheMocks.revalidateTag).toHaveBeenCalledWith('game-new-game', 'max')
    expect(nextCacheMocks.revalidateTag).toHaveBeenCalledWith('cpu-old-cpu', 'max')
    expect(nextCacheMocks.revalidateTag).toHaveBeenCalledWith('cpu-new-cpu', 'max')
    expect(nextCacheMocks.revalidateTag).toHaveBeenCalledWith('gpu-gpu-1', 'max')
    expect(nextCacheMocks.revalidateTag).toHaveBeenCalledTimes(8)
  })

  it('invalidates handheld listing SEO paths and tags consistently', async () => {
    await invalidateListingSeo({
      id: 'listing-1',
      gameId: 'game-1',
      deviceId: 'device-1',
      emulatorId: 'emulator-1',
    })

    expect(nextCacheMocks.revalidatePath).toHaveBeenCalledWith('/listings/listing-1')
    expect(nextCacheMocks.revalidatePath).toHaveBeenCalledWith('/listings')
    expect(nextCacheMocks.revalidatePath).toHaveBeenCalledWith('/sitemap.xml')
    expect(nextCacheMocks.revalidateTag).toHaveBeenCalledWith('listing-listing-1', 'max')
    expect(nextCacheMocks.revalidateTag).toHaveBeenCalledWith('listings', 'max')
    expect(nextCacheMocks.revalidateTag).toHaveBeenCalledWith('game-game-1', 'max')
    expect(nextCacheMocks.revalidateTag).toHaveBeenCalledWith('device-device-1', 'max')
    expect(nextCacheMocks.revalidateTag).toHaveBeenCalledWith('emulator-emulator-1', 'max')
  })
})
