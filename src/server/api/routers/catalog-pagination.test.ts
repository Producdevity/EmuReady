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
vi.mock('@/server/db', () => ({
  prisma: {
    game: { findMany: reads.games },
    listing: { findMany: reads.handheld },
    pcListing: { findMany: reads.pc },
  },
}))
const context = { prisma, session: null, headers: new Headers() }
const catalogs = [
  { name: 'games', get: gamesRouter.createCaller(context).get, maxLimit: 100 },
  { name: 'handheld reports', get: handheldReports.createCaller(context).get, maxLimit: 100 },
  { name: 'PC reports', get: pcReports.createCaller(context).get, maxLimit: 50 },
]

beforeEach(() => vi.clearAllMocks())

describe.each(catalogs)('$name pagination boundary', (catalog) => {
  it.each([{ page: 1.5 }, { limit: 1.5 }, { page: -1 }, { limit: 0 }])(
    'rejects %j before querying Prisma',
    async (input) => {
      await expect(catalog.get(input)).rejects.toMatchObject({ code: 'BAD_REQUEST' })
      for (const read of Object.values(reads)) expect(read).not.toHaveBeenCalled()
    },
  )

  it('rejects an excessive limit before querying Prisma', async () => {
    await expect(catalog.get({ limit: catalog.maxLimit + 1 })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    })
    for (const read of Object.values(reads)) expect(read).not.toHaveBeenCalled()
  })
})

it.each([-1, 0.5])('rejects the game offset %s before querying Prisma', async (offset) => {
  await expect(gamesRouter.createCaller(context).get({ offset })).rejects.toMatchObject({
    code: 'BAD_REQUEST',
  })
  for (const read of Object.values(reads)) expect(read).not.toHaveBeenCalled()
})
