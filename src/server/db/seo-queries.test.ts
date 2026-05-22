import { beforeEach, describe, expect, it, vi } from 'vitest'

const cacheMocks = vi.hoisted(() => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}))

const prismaMocks = vi.hoisted(() => ({
  game: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  listing: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  pcListing: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
}))

vi.mock('next/cache', () => cacheMocks)
vi.mock('@/server/db', () => ({ prisma: prismaMocks }))

const { getApprovedGamesForSitemap, getGameForSEO, getListingForSEO, getPcListingForSEO } =
  await import('./seo-queries')

describe('SEO query cache metadata', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses a short cache profile for missing SEO records', async () => {
    prismaMocks.game.findUnique.mockResolvedValueOnce(null)

    await getGameForSEO('game-1')

    expect(cacheMocks.cacheTag).toHaveBeenCalledWith('games', 'game-game-1')
    expect(cacheMocks.cacheLife).toHaveBeenCalledWith('seo-miss')
  })

  it('does not convert SEO query failures into cacheable misses', async () => {
    const error = new Error('database unavailable')
    prismaMocks.game.findUnique.mockRejectedValueOnce(error)

    await expect(getGameForSEO('game-1')).rejects.toThrow(error)

    expect(cacheMocks.cacheLife).not.toHaveBeenCalled()
  })

  it('tags handheld report metadata by listing, game, device, and emulator', async () => {
    const listing = {
      id: 'listing-1',
      gameId: 'game-1',
      deviceId: 'device-1',
      emulatorId: 'emulator-1',
      notes: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      game: { title: 'Game', imageUrl: null },
      device: { modelName: 'Pocket', brand: { name: 'Brand' } },
      emulator: { name: 'Emulator' },
      performance: { label: 'Perfect', rank: 5 },
      author: { name: 'Author' },
    }
    prismaMocks.listing.findUnique.mockResolvedValueOnce(listing)

    await getListingForSEO('listing-1')

    expect(cacheMocks.cacheTag).toHaveBeenCalledWith('listings', 'listing-listing-1')
    expect(cacheMocks.cacheTag).toHaveBeenCalledWith(
      'game-game-1',
      'device-device-1',
      'emulator-emulator-1',
    )
    expect(cacheMocks.cacheLife).toHaveBeenCalledWith('seo-report')
  })

  it('tags PC report metadata by listing, game, CPU, and GPU', async () => {
    const listing = {
      id: 'pc-listing-1',
      gameId: 'game-1',
      cpuId: 'cpu-1',
      gpuId: 'gpu-1',
      notes: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      game: { title: 'Game', imageUrl: null },
      cpu: { modelName: 'CPU', brand: { name: 'Brand' } },
      gpu: { modelName: 'GPU', brand: { name: 'Brand' } },
      performance: { label: 'Perfect', rank: 5 },
      author: { name: 'Author' },
    }
    prismaMocks.pcListing.findUnique.mockResolvedValueOnce(listing)

    await getPcListingForSEO('pc-listing-1')

    expect(cacheMocks.cacheTag).toHaveBeenCalledWith('pc-listings', 'pc-listing-pc-listing-1')
    expect(cacheMocks.cacheTag).toHaveBeenCalledWith('game-game-1', 'cpu-cpu-1', 'gpu-gpu-1')
    expect(cacheMocks.cacheLife).toHaveBeenCalledWith('seo-report')
  })

  it('uses the sitemap cache profile and tags sitemap data', async () => {
    prismaMocks.game.findMany.mockResolvedValueOnce([])

    await getApprovedGamesForSitemap(1000)

    expect(cacheMocks.cacheLife).toHaveBeenCalledWith('seo-sitemap')
    expect(cacheMocks.cacheTag).toHaveBeenCalledWith('sitemap', 'games')
  })

  it('does not cache an empty sitemap when the sitemap query fails', async () => {
    const error = new Error('database unavailable')
    prismaMocks.game.findMany.mockRejectedValueOnce(error)

    await expect(getApprovedGamesForSitemap(1000)).rejects.toThrow(error)

    expect(cacheMocks.cacheLife).not.toHaveBeenCalled()
  })
})
