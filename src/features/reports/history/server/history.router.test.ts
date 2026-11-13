import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/server/db'
import { ApprovalStatus, Role } from '@orm'
import { reportHistoryRouter } from './history.router'
import { GetReportHistorySchema } from '../shared/history.schemas'

vi.unmock('@/server/api/trpc')
vi.unmock('@/server/api/root')

const database = vi.hoisted(() => ({
  listing: { findMany: vi.fn(), count: vi.fn() },
  pcListing: { findMany: vi.fn(), count: vi.fn() },
}))
vi.mock('@/server/db', () => ({ prisma: database }))

const userId = '00000000-0000-4000-a000-000000000001'
const reportId = '00000000-0000-4000-a000-000000000002'
const report = {
  id: reportId,
  status: ApprovalStatus.REJECTED,
  createdAt: new Date('2026-11-01T12:00:00.000Z'),
  game: { title: 'Mario Kart World', system: { name: 'Nintendo Switch 2' } },
  emulator: { name: 'NX' },
  processedNotes: 'Internal moderation note',
}

function caller(authenticated = true) {
  return reportHistoryRouter.createCaller({
    prisma,
    headers: new Headers(),
    session: authenticated
      ? {
          user: {
            id: userId,
            name: null,
            email: null,
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
  database.listing.findMany.mockResolvedValue([
    { ...report, device: { modelName: 'Odin 2', brand: { name: 'AYN' } } },
  ])
  database.pcListing.findMany.mockResolvedValue([
    {
      ...report,
      cpu: { modelName: 'Ryzen 7', brand: { name: 'AMD' } },
      gpu: null,
      memorySize: 32,
    },
  ])
  database.listing.count.mockResolvedValue(21)
  database.pcListing.count.mockResolvedValue(21)
})

describe.each(['handheld', 'pc'] as const)('%s report history', (kind) => {
  function queries() {
    return kind === 'handheld' ? database.listing : database.pcListing
  }

  it('requires authentication before reading either report table', async () => {
    await expect(caller(false).get({ kind })).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    expect(database.listing.findMany).not.toHaveBeenCalled()
    expect(database.pcListing.findMany).not.toHaveBeenCalled()
  })

  it('uses the session owner even when another user ID is supplied', async () => {
    const input = { kind, userId: reportId }
    const result = await caller().get(input)
    expect(queries().findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { authorId: userId } }),
    )
    expect(queries().count).toHaveBeenCalledWith({ where: { authorId: userId } })
    expect(result.items[0]).toMatchObject({
      title: 'Mario Kart World',
      systemName: 'Nintendo Switch 2',
      status: ApprovalStatus.REJECTED,
    })
    expect(result.items[0]).not.toHaveProperty('processedNotes')
    expect(result.items[0]).not.toHaveProperty('authorId')
  })

  it.each(Object.values(ApprovalStatus))(
    'filters %s submissions without losing ownership',
    async (status) => {
      await caller().get({ kind, status, search: ' Mario ' })
      const where = {
        authorId: userId,
        status,
        game: { title: { contains: 'Mario', mode: 'insensitive' } },
      }
      expect(queries().findMany).toHaveBeenCalledWith(expect.objectContaining({ where }))
      expect(queries().count).toHaveBeenCalledWith({ where })
    },
  )

  it('paginates with deterministic ordering and bounded queries', async () => {
    const result = await caller().get({ kind, page: 2, limit: 20 })
    expect(queries().findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 20,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
    )
    expect(result.pagination).toMatchObject({ page: 2, pages: 2, total: 21 })
  })
})

it('formats PC hardware with and without a dedicated GPU', async () => {
  const integrated = await caller().get({ kind: 'pc' })
  expect(integrated.items[0]?.hardwareLabel).toBe('AMD Ryzen 7 · Integrated graphics · 32 GB RAM')
  database.pcListing.findMany.mockResolvedValue([
    {
      ...report,
      cpu: { modelName: 'Ryzen 7', brand: { name: 'AMD' } },
      gpu: { modelName: 'RTX 4090', brand: { name: 'NVIDIA' } },
      memorySize: 32,
    },
  ])
  const dedicated = await caller().get({ kind: 'pc' })
  expect(dedicated.items[0]?.hardwareLabel).toBe('AMD Ryzen 7 · NVIDIA RTX 4090 · 32 GB RAM')
})

it.each([
  { limit: 51 },
  { page: 0 },
  { status: 'INVALID' },
  { kind: 'mobile' },
  { search: 'x'.repeat(101) },
])('rejects invalid history filters: %j', (input) =>
  expect(() => GetReportHistorySchema.parse(input)).toThrow(),
)
