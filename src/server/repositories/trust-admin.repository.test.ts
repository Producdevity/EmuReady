import { beforeEach, expect, it, vi } from 'vitest'
import { GetTrustLogsSchema } from '@/schemas/trust'
import { prisma } from '@/server/db'
import { TrustAdminRepository } from './trust-admin.repository'

const mocks = vi.hoisted(() => ({ trustActionLog: { findMany: vi.fn(), count: vi.fn() } }))
vi.mock('@/server/db', () => ({ prisma: mocks }))

beforeEach(() => {
  vi.resetAllMocks()
  mocks.trustActionLog.findMany.mockResolvedValue([])
  mocks.trustActionLog.count.mockResolvedValue(21)
})

it.each([
  { sortField: 'createdAt', order: { createdAt: 'asc' } },
  { sortField: 'action', order: { action: 'asc' } },
  { sortField: 'weight', order: { weight: 'asc' } },
  { sortField: 'user.trustScore', order: { user: { trustScore: 'asc' } } },
] as const)('adds a unique tiebreaker to $sortField pagination', async (input) => {
  await new TrustAdminRepository(prisma).listLogs(
    GetTrustLogsSchema.parse({
      page: 2,
      limit: 10,
      sortField: input.sortField,
      sortDirection: 'asc',
    }),
  )
  expect(mocks.trustActionLog.findMany).toHaveBeenCalledWith(
    expect.objectContaining({ orderBy: [input.order, { id: 'asc' }], skip: 10, take: 10 }),
  )
})

it('keeps the default latest-first ordering stable', async () => {
  await new TrustAdminRepository(prisma).listLogs(GetTrustLogsSchema.parse({}))
  expect(mocks.trustActionLog.findMany).toHaveBeenCalledWith(
    expect.objectContaining({ orderBy: [{ createdAt: 'desc' }, { id: 'asc' }] }),
  )
})
