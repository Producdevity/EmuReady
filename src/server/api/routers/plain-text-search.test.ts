import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/server/db'
import { gamesRouter } from './games'
import { coreRouter } from './listings/core'

vi.unmock('@orm')
vi.unmock('@orm/client')
vi.unmock('@/server/api/trpc')
vi.unmock('@/server/api/root')
const queries = vi.hoisted(() => ({ games: vi.fn(), reports: vi.fn() }))
vi.mock('@/server/repositories/games.repository', () => ({
  GamesRepository: class {
    list = queries.games
  },
}))
vi.mock('@/server/repositories/listings.repository', () => ({
  ListingsRepository: class {
    list = queries.reports
  },
}))
const context = { prisma, session: null, headers: new Headers() }

beforeEach(() => {
  vi.clearAllMocks()
  queries.games.mockResolvedValue({ games: [], pagination: {} })
  queries.reports.mockResolvedValue({ listings: [], pagination: {} })
})

describe.each(['games', 'handheld reports'] as const)('%s search input', (kind) => {
  it.each(['resolution=1080', '1 < 2', 'javascript: 日本語'])(
    'passes the text %s to the parameterized repository query',
    async (search) => {
      if (kind === 'games') await gamesRouter.createCaller(context).get({ search: ` ${search} ` })
      else await coreRouter.createCaller(context).get({ searchTerm: ` ${search} ` })
      const query = kind === 'games' ? queries.games : queries.reports
      expect(query).toHaveBeenCalledWith(expect.objectContaining({ search }))
    },
  )
})
