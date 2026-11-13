import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/server/db'
import { gamesRouter } from './games'
import { coreRouter as handheldReports } from './listings/core'
import { coreRouter as pcReports } from './pcListings/core'

vi.unmock('@orm')
vi.unmock('@orm/client')
vi.unmock('@/server/api/trpc')
vi.unmock('@/server/api/root')
const reads = vi.hoisted(() => ({ games: vi.fn(), handheld: vi.fn(), pc: vi.fn() }))
const counts = vi.hoisted(() => ({ games: vi.fn(), handheld: vi.fn(), pc: vi.fn() }))
vi.mock('@/server/db', () => ({
  prisma: {
    game: { findMany: reads.games, count: counts.games },
    listing: { findMany: reads.handheld, count: counts.handheld },
    pcListing: { findMany: reads.pc, count: counts.pc },
  },
}))
const context = { prisma, session: null, headers: new Headers() }
const catalogs = [
  {
    name: 'games',
    get: gamesRouter.createCaller(context).get,
    read: reads.games,
    maxLimit: 100,
    defaultLimit: 50,
  },
  {
    name: 'handheld reports',
    get: handheldReports.createCaller(context).get,
    read: reads.handheld,
    maxLimit: 100,
    defaultLimit: 10,
  },
  {
    name: 'PC reports',
    get: pcReports.createCaller(context).get,
    read: reads.pc,
    maxLimit: 50,
    defaultLimit: 10,
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  for (const read of Object.values(reads)) read.mockResolvedValue([])
  for (const count of Object.values(counts)) count.mockResolvedValue(0)
})

describe.each(catalogs)('$name pagination boundary', (catalog) => {
  it.each([
    { page: 1.5 },
    { limit: 1.5 },
    { page: -1 },
    { limit: 0 },
    { page: 1e40 },
    { page: Number.MAX_SAFE_INTEGER + 1 },
  ])('rejects %j before querying Prisma', async (input) => {
    await expect(catalog.get(input)).rejects.toMatchObject({ code: 'BAD_REQUEST' })
    for (const read of [...Object.values(reads), ...Object.values(counts)]) {
      expect(read).not.toHaveBeenCalled()
    }
  })

  it('rejects an excessive limit before querying Prisma', async () => {
    await expect(catalog.get({ limit: catalog.maxLimit + 1 })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    })
    for (const read of [...Object.values(reads), ...Object.values(counts)]) {
      expect(read).not.toHaveBeenCalled()
    }
  })

  it('preserves the default first-page query', async () => {
    await catalog.get({})
    expect(catalog.read).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: catalog.defaultLimit }),
    )
  })

  it('queries the requested page at the existing maximum limit', async () => {
    await catalog.get({ page: 2, limit: catalog.maxLimit })
    expect(catalog.read).toHaveBeenCalledWith(
      expect.objectContaining({ skip: catalog.maxLimit, take: catalog.maxLimit }),
    )
  })

  it('rejects a safe page number whose calculated offset is unsafe before querying Prisma', async () => {
    await expect(
      catalog.get({ page: Number.MAX_SAFE_INTEGER, limit: catalog.maxLimit }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })
    for (const read of [...Object.values(reads), ...Object.values(counts)]) {
      expect(read).not.toHaveBeenCalled()
    }
  })

  it('accepts the last safe calculated offset without imposing an arbitrary page cap', async () => {
    const page = Math.floor(Number.MAX_SAFE_INTEGER / catalog.maxLimit) + 1
    await catalog.get({ page, limit: catalog.maxLimit })
    expect(catalog.read).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: (page - 1) * catalog.maxLimit,
        take: catalog.maxLimit,
      }),
    )
  })
})

it.each([-1, 0.5, 1e40, Number.MAX_SAFE_INTEGER + 1])(
  'rejects the game offset %s before querying Prisma',
  async (offset) => {
    await expect(gamesRouter.createCaller(context).get({ offset })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    })
    for (const read of [...Object.values(reads), ...Object.values(counts)]) {
      expect(read).not.toHaveBeenCalled()
    }
  },
)

it('preserves the games limit when the entire input is omitted', async () => {
  await gamesRouter.createCaller(context).get()
  expect(reads.games).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 20 }))
})

it('preserves a game offset without a page', async () => {
  await gamesRouter.createCaller(context).get({ offset: 25, limit: 100 })
  expect(reads.games).toHaveBeenCalledWith(expect.objectContaining({ skip: 25, take: 100 }))
})
