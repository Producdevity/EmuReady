import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/server/db'
import { ApprovalStatus, Role } from '@orm'
import { bookmarksRouter } from './bookmarks.router'

vi.unmock('@/server/api/trpc')
vi.unmock('@/server/api/root')
const mocks = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  listing: { findUnique: vi.fn() },
  pcListing: { findUnique: vi.fn() },
  listingBookmark: { findMany: vi.fn(), count: vi.fn(), upsert: vi.fn() },
  pcListingBookmark: { findMany: vi.fn(), count: vi.fn(), upsert: vi.fn() },
}))
vi.mock('@/server/db', () => ({ prisma: mocks }))
vi.mock('@/server/utils/query-builders', () => ({ isUserBanned: async () => false }))
const userId = '00000000-0000-4000-a000-000000000001'
const reportId = '00000000-0000-4000-a000-000000000002'
const brand = { id: userId, name: 'Brand' }
const report = {
  id: reportId,
  createdAt: new Date(),
  status: ApprovalStatus.APPROVED,
  successRate: 0,
  _count: { votes: 0, comments: 0 },
  author: { id: userId, name: null, profileImage: null },
  game: {
    id: userId,
    title: 'Mario',
    system: { id: userId, name: 'Nintendo Switch 2', key: 'nintendo_switch_2' },
  },
  emulator: { id: userId, name: 'NX', logo: null },
  performance: { id: 1, label: 'Perfect', rank: 1, description: null },
}

function caller(authenticated = false) {
  return bookmarksRouter.createCaller({
    prisma,
    headers: new Headers(),
    session: authenticated
      ? {
          user: {
            id: userId,
            email: null,
            name: null,
            role: Role.USER,
            permissions: [],
            showNsfw: false,
          },
        }
      : null,
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  mocks.user.findUnique.mockResolvedValue({ settings: { bookmarksVisible: true } })
  mocks.listing.findUnique.mockResolvedValue({ id: reportId, status: ApprovalStatus.APPROVED })
  mocks.pcListing.findUnique.mockResolvedValue({ id: reportId, status: ApprovalStatus.APPROVED })
  mocks.listingBookmark.count.mockResolvedValue(1)
  mocks.pcListingBookmark.count.mockResolvedValue(1)
  mocks.listingBookmark.upsert.mockResolvedValue({ id: reportId })
  mocks.pcListingBookmark.upsert.mockResolvedValue({ id: reportId })
  mocks.listingBookmark.findMany.mockResolvedValue([
    {
      id: reportId,
      createdAt: new Date(),
      listing: { ...report, device: { id: userId, modelName: 'Device', brand } },
    },
  ])
  mocks.pcListingBookmark.findMany.mockResolvedValue([
    {
      id: reportId,
      createdAt: new Date(),
      pcListing: { ...report, cpu: { id: userId, modelName: 'CPU', brand }, gpu: null },
    },
  ])
})

describe.each(['handheld', 'pc'] as const)('%s bookmark transport', (variant) => {
  function read(input: { userId: string; sortField?: 'title' }) {
    return variant === 'handheld'
      ? caller().getListingBookmarks(input)
      : caller().getPcListingBookmarks(input)
  }

  it('validates the existing visible response shape and nullable fields', async () => {
    const result = await read({ userId, sortField: 'title' })
    expect(result).toMatchObject({ visibility: 'visible', pagination: { total: 1, page: 1 } })
    if (result.visibility === 'visible') expect(result.items).toHaveLength(1)
  })

  it('keeps a bookmarked report readable after its author has been deleted', async () => {
    if (variant === 'handheld') {
      mocks.listingBookmark.findMany.mockResolvedValue([
        {
          id: reportId,
          createdAt: new Date(),
          listing: { ...report, author: null, device: { id: userId, modelName: 'Device', brand } },
        },
      ])
    } else {
      mocks.pcListingBookmark.findMany.mockResolvedValue([
        {
          id: reportId,
          createdAt: new Date(),
          pcListing: {
            ...report,
            author: null,
            cpu: { id: userId, modelName: 'CPU', brand },
            gpu: null,
          },
        },
      ])
    }
    await expect(read({ userId })).resolves.toMatchObject({
      visibility: 'visible',
      pagination: { total: 1 },
      items: [
        variant === 'handheld' ? { listing: { author: null } } : { pcListing: { author: null } },
      ],
    })
  })

  it('returns only the hidden receipt for private profiles', async () => {
    mocks.user.findUnique.mockResolvedValue({ settings: { bookmarksVisible: false } })
    await expect(read({ userId })).resolves.toEqual({ visibility: 'hidden' })
    expect(mocks.listingBookmark.findMany).not.toHaveBeenCalled()
    expect(mocks.pcListingBookmark.findMany).not.toHaveBeenCalled()
  })

  it('rejects inverted memory bounds before any database access', async () => {
    const query =
      variant === 'handheld' ? caller().getListingBookmarks : caller().getPcListingBookmarks
    await expect(query({ userId, memoryMin: 32, memoryMax: 16 })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      cause: { issues: expect.arrayContaining([expect.objectContaining({ path: ['memoryMax'] })]) },
    })
    expect(mocks.user.findUnique).not.toHaveBeenCalled()
    expect(mocks.listingBookmark.findMany).not.toHaveBeenCalled()
    expect(mocks.pcListingBookmark.findMany).not.toHaveBeenCalled()
  })

  it('uses the session owner for writes even when input includes another user', async () => {
    if (variant === 'handheld') {
      const input = { listingId: reportId, userId: reportId }
      await expect(caller(true).bookmark(input)).resolves.toEqual({ success: true })
      expect(mocks.listingBookmark.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ create: { userId, listingId: reportId } }),
      )
    } else {
      const input = { pcListingId: reportId, userId: reportId }
      await expect(caller(true).pcBookmark(input)).resolves.toEqual({ success: true })
      expect(mocks.pcListingBookmark.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ create: { userId, pcListingId: reportId } }),
      )
    }
  })
})
