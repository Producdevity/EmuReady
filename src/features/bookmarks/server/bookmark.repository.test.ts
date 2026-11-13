import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  GetListingBookmarksSchema,
  GetPcListingBookmarksSchema,
} from '@/features/bookmarks/shared/bookmark.schemas'
import { prisma } from '@/server/db'
import { Role } from '@orm'
import { BookmarkRepository } from './bookmark.repository'

const mocks = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  listingBookmark: { findMany: vi.fn(), count: vi.fn() },
  pcListingBookmark: { findMany: vi.fn(), count: vi.fn() },
}))
vi.mock('@/server/db', () => ({ prisma: mocks }))

const userId = '00000000-0000-4000-a000-000000000001'
const entityId = '00000000-0000-4000-a000-000000000002'
const owner = { requestingUserId: userId }

beforeEach(() => {
  vi.resetAllMocks()
  mocks.user.findUnique.mockResolvedValue({ settings: { bookmarksVisible: false } })
  mocks.listingBookmark.findMany.mockResolvedValue([])
  mocks.listingBookmark.count.mockResolvedValue(13)
  mocks.pcListingBookmark.findMany.mockResolvedValue([])
  mocks.pcListingBookmark.count.mockResolvedValue(13)
})

describe.each(['handheld', 'pc'] as const)('%s bookmark browsing', (variant) => {
  function list(input: Parameters<typeof GetListingBookmarksSchema.parse>[0], context = owner) {
    const repository = new BookmarkRepository(prisma)
    return variant === 'handheld'
      ? repository.list(GetListingBookmarksSchema.parse(input), context)
      : repository.pcList(GetPcListingBookmarksSchema.parse(input), context)
  }
  function model() {
    return variant === 'handheld' ? mocks.listingBookmark : mocks.pcListingBookmark
  }
  const relation = variant === 'handheld' ? 'listing' : 'pcListing'

  it('combines title, system, emulator, performance and hardware filters for rows and totals', async () => {
    const result = await list({
      userId,
      page: 2,
      limit: 12,
      search: 'Mario',
      systemIds: [entityId],
      emulatorIds: [entityId],
      performanceIds: [1],
      deviceIds: [entityId],
      socIds: [entityId],
      cpuIds: [entityId],
      gpuIds: [entityId],
      memoryMin: 16,
      memoryMax: 32,
      sortField: 'title',
      sortDirection: 'asc',
    })
    const where = {
      userId,
      [relation]: {
        status: 'APPROVED',
        game: { title: { contains: 'Mario', mode: 'insensitive' }, systemId: { in: [entityId] } },
        emulatorId: { in: [entityId] },
        performanceId: { in: [1] },
        ...(variant === 'handheld'
          ? { deviceId: { in: [entityId] }, device: { socId: { in: [entityId] } } }
          : {
              cpuId: { in: [entityId] },
              gpuId: { in: [entityId] },
              memorySize: { gte: 16, lte: 32 },
            }),
      },
    }
    expect(model().findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where,
        skip: 12,
        take: 12,
        orderBy: [{ [relation]: { game: { title: 'asc' } } }, { id: 'asc' }],
      }),
    )
    expect(model().count).toHaveBeenCalledWith({ where })
    expect(result).toMatchObject({ visibility: 'visible', pagination: { total: 13, pages: 2 } })
  })

  it.each([
    ['savedAt', { createdAt: 'desc' }],
    ['performance', { [relation]: { performance: { rank: 'desc' } } }],
    ['successRate', { [relation]: { successRate: 'desc' } }],
  ])('orders by %s with a stable tie-breaker', async (sortField, expected) => {
    await list({ userId, sortField })
    expect(model().findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: [expected, { id: 'asc' }] }),
    )
  })

  it('hides private bookmarks before querying saved reports', async () => {
    await expect(
      list({ userId, systemIds: [entityId] }, { requestingUserId: 'another-user' }),
    ).resolves.toMatchObject({ visibility: 'hidden' })
    expect(model().findMany).not.toHaveBeenCalled()
    expect(model().count).not.toHaveBeenCalled()
  })

  it('preserves moderator access to private bookmarks', async () => {
    const repository = new BookmarkRepository(prisma)
    const input = GetListingBookmarksSchema.parse({ userId })
    const context = { requestingUserRole: Role.MODERATOR }
    const result =
      variant === 'handheld'
        ? await repository.list(input, context)
        : await repository.pcList(input, context)
    expect(result.visibility).toBe('visible')
    expect(mocks.user.findUnique).not.toHaveBeenCalled()
  })
})
