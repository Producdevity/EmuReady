import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CreateListingBaseSchema, CreatePcListingBaseSchema } from '@/schemas/listingCreate'
import { UpdatePcListingUserSchema } from '@/schemas/pcListing'
import { prisma } from '@/server/db'
import { ListingsRepository } from '@/server/repositories/listings.repository'
import { PcListingsRepository } from '@/server/repositories/pc-listings.repository'
import { normalizeCustomFieldValues } from '@/server/utils/custom-field-values'
import { PERMISSIONS } from '@/utils/permission-system'
import { ApprovalStatus, type Listing, PcOs, type PcListing, type Prisma, Role } from '@orm'
import { adminRouter as handheldAdminRouter } from './listings/admin'
import { coreRouter as handheldRouter } from './listings/core'
import { mobileListingsRouter } from './mobile/listings'
import { mobilePcListingsRouter } from './mobile/pcListings'
import { adminRouter as pcAdminRouter } from './pcListings/admin'
import { coreRouter as pcRouter } from './pcListings/core'

vi.unmock('@orm')
vi.unmock('@orm/client')
vi.unmock('@/server/api/trpc')
vi.unmock('@/server/api/root')
const transaction = vi.hoisted(() =>
  vi.fn<(run: (client: Prisma.TransactionClient) => Promise<unknown>) => Promise<unknown>>(),
)
const models = vi.hoisted(() => ({
  listing: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  pcListing: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn<(input: Prisma.PcListingUpdateArgs) => Promise<PcListing>>(),
  },
  performanceScale: { findUnique: vi.fn() },
  game: { findUnique: vi.fn() },
  emulator: { findUnique: vi.fn() },
  cpu: { findUnique: vi.fn() },
  gpu: { findUnique: vi.fn() },
  user: { findUnique: vi.fn() },
  customFieldDefinition: { findMany: vi.fn() },
}))
vi.mock('@/server/db', () => ({ prisma: { ...models, $transaction: transaction } }))
vi.mock('@/server/utils/spam-check', () => ({ checkSpamContent: vi.fn() }))

const ownerId = '00000000-0000-4000-8000-000000000001'
const id = '00000000-0000-4000-8000-000000000002'
const gameId = '00000000-0000-4000-8000-000000000003'
const deviceId = '00000000-0000-4000-8000-000000000004'
const emulatorId = '00000000-0000-4000-8000-000000000005'
const cpuId = '00000000-0000-4000-8000-000000000006'
const date = new Date('2026-01-01T00:00:00Z')
const handheldInput = { gameId, deviceId, emulatorId, performanceId: 2 }
const pcInput = {
  gameId,
  cpuId,
  emulatorId,
  performanceId: 2,
  memorySize: 16,
  os: PcOs.LINUX,
  osVersion: 'Test release',
}
const reportFields = {
  id,
  gameId,
  emulatorId,
  performanceId: 2,
  authorId: ownerId,
  notes: null,
  status: ApprovalStatus.PENDING,
  createdAt: date,
  processedAt: null,
  processedNotes: null,
  processedByUserId: null,
  pinnedCommentId: null,
  pinnedByUserId: null,
  pinnedAt: null,
  upvoteCount: 0,
  downvoteCount: 0,
  voteCount: 0,
  successRate: 0,
} satisfies Omit<Listing, 'deviceId'>
const report = { ...reportFields, deviceId } satisfies Listing
const pcReport = {
  ...reportFields,
  cpuId,
  gpuId: null,
  memorySize: 16,
  os: PcOs.LINUX,
  osVersion: 'Test release',
  updatedAt: date,
} satisfies PcListing
const context = {
  prisma,
  headers: new Headers(),
  session: {
    user: {
      id: ownerId,
      role: Role.USER,
      permissions: [PERMISSIONS.CREATE_LISTING],
      name: null,
      email: null,
      showNsfw: false,
    },
  },
}
const adminContext = {
  ...context,
  session: {
    user: {
      ...context.session.user,
      role: Role.ADMIN,
      permissions: [PERMISSIONS.APPROVE_LISTINGS],
    },
  },
}
const handheld = handheldRouter.createCaller(context)
const pc = pcRouter.createCaller(context)
const mobileHandheld = mobileListingsRouter.createCaller({ ...context, apiKey: null })
const mobilePc = mobilePcListingsRouter.createCaller({ ...context, apiKey: null })
const handheldAdmin = handheldAdminRouter.createCaller(adminContext)
const pcAdmin = pcAdminRouter.createCaller(adminContext)
const writes = [
  {
    name: 'web handheld create',
    run: (performanceId: number) => handheld.create({ ...handheldInput, performanceId }),
  },
  {
    name: 'mobile handheld create',
    run: (performanceId: number) => mobileHandheld.create({ ...handheldInput, performanceId }),
  },
  {
    name: 'web PC create',
    run: (performanceId: number) => pc.create({ ...pcInput, performanceId }),
  },
  {
    name: 'mobile PC create',
    run: (performanceId: number) => mobilePc.create({ ...pcInput, performanceId }),
  },
  {
    name: 'web handheld update',
    run: (performanceId: number) => handheld.update({ id, performanceId }),
  },
  {
    name: 'mobile handheld update',
    run: (performanceId: number) => mobileHandheld.update({ id, performanceId }),
  },
  {
    name: 'web PC update',
    run: (performanceId: number) => pc.update({ id, ...pcInput, performanceId }),
  },
  {
    name: 'mobile PC update',
    run: (performanceId: number) => mobilePc.update({ id, performanceId }),
  },
  {
    name: 'admin handheld update',
    run: (performanceId: number) =>
      handheldAdmin.updateListing({
        id,
        ...handheldInput,
        performanceId,
        status: ApprovalStatus.PENDING,
      }),
  },
  {
    name: 'admin PC update',
    run: (performanceId: number) =>
      pcAdmin.updateListing({ id, ...pcInput, performanceId, status: ApprovalStatus.PENDING }),
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  transaction.mockImplementation((run) => run(prisma))
  models.listing.findUnique.mockResolvedValue(report)
  models.listing.create.mockResolvedValue(report)
  models.listing.update.mockResolvedValue(report)
  models.pcListing.findFirst.mockResolvedValue(null)
  models.pcListing.findUnique.mockResolvedValue(pcReport)
  models.pcListing.create.mockResolvedValue(pcReport)
  models.pcListing.update.mockResolvedValue(pcReport)
  models.performanceScale.findUnique.mockResolvedValue({
    id: 2,
    label: 'Playable',
    rank: 2,
    description: null,
  })
  models.game.findUnique.mockResolvedValue({ id: gameId, systemId: id })
  models.emulator.findUnique.mockResolvedValue({ id: emulatorId, systems: [{ id }] })
  models.cpu.findUnique.mockResolvedValue({
    id: cpuId,
    brandId: id,
    modelName: 'Test CPU',
    createdAt: date,
  })
  models.user.findUnique.mockResolvedValue({ id: ownerId, trustScore: 0 })
  models.customFieldDefinition.findMany.mockResolvedValue([])
})

function expectNoDatabaseCalls() {
  expect(transaction).not.toHaveBeenCalled()
  for (const model of Object.values(models)) {
    for (const operation of Object.values(model)) expect(operation).not.toHaveBeenCalled()
  }
}

describe.each(writes)('$name performance input', (write) => {
  it.each([1.5, Infinity, NaN, 2_147_483_648, -2_147_483_649, Number.MAX_SAFE_INTEGER])(
    'rejects the unpersistable performance ID %s before database access',
    async (performanceId) => {
      await expect(write.run(performanceId)).rejects.toMatchObject({ code: 'BAD_REQUEST' })
      expectNoDatabaseCalls()
    },
  )
})

describe('valid report persistence', () => {
  it('passes a parsed handheld create into the actual repository unchanged', async () => {
    const parsed = CreateListingBaseSchema.parse(handheldInput)
    expect(
      await new ListingsRepository(prisma).create({
        ...parsed,
        authorId: ownerId,
        userRole: Role.USER,
        customFieldValues: normalizeCustomFieldValues(parsed.customFieldValues),
      }),
    ).toEqual(report)
    expect(models.listing.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ...handheldInput,
          authorId: ownerId,
          status: ApprovalStatus.PENDING,
        }),
      }),
    )
  })

  it('passes a parsed PC create into the actual repository unchanged', async () => {
    const parsed = CreatePcListingBaseSchema.parse(pcInput)
    expect(
      await new PcListingsRepository(prisma).create({
        ...parsed,
        gpuId: null,
        authorId: ownerId,
        userRole: Role.USER,
        customFieldValues: normalizeCustomFieldValues(parsed.customFieldValues),
      }),
    ).toEqual(pcReport)
    expect(models.pcListing.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ...pcInput,
          authorId: ownerId,
          status: ApprovalStatus.PENDING,
        }),
      }),
    )
  })

  it('keeps valid web and mobile update DTOs', async () => {
    expect(await handheld.update({ id, performanceId: 2 })).toEqual(report)
    expect(await mobileHandheld.update({ id, performanceId: 2 })).toEqual(report)
    expect(await pc.update({ id, ...pcInput })).toEqual(pcReport)
    expect(await mobilePc.update({ id, performanceId: 2, memorySize: 16 })).toEqual(pcReport)
    expect(models.pcListing.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ performanceId: 2, memorySize: 16 }),
      }),
    )
  })

  it('retains ownership checks before web and mobile report updates', async () => {
    const authorId = '00000000-0000-4000-8000-000000000099'
    models.listing.findUnique.mockResolvedValue({ ...report, authorId })
    models.pcListing.findUnique.mockResolvedValue({ ...pcReport, authorId })
    await Promise.all(
      [
        handheld.update({ id, performanceId: 2 }),
        mobileHandheld.update({ id, performanceId: 2 }),
        pc.update({ id, ...pcInput }),
        mobilePc.update({ id, performanceId: 2 }),
      ].map((result) => expect(result).rejects.toMatchObject({ code: 'FORBIDDEN' })),
    )
    expect(models.listing.update).not.toHaveBeenCalled()
    expect(models.pcListing.update).not.toHaveBeenCalled()
  })

  it.each([8.5, 0, 257, Infinity, NaN])(
    'rejects mobile PC memory size %s before database access',
    async (memorySize) => {
      await expect(mobilePc.update({ id, memorySize })).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      })
      expectNoDatabaseCalls()
    },
  )

  it('preserves a mobile PC edit that omits numeric fields', async () => {
    expect(await mobilePc.update({ id, notes: 'Updated notes' })).toEqual(pcReport)
    expect(models.pcListing.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ notes: 'Updated notes' }) }),
    )
    expect(models.pcListing.update.mock.calls[0]?.[0].data).not.toHaveProperty('performanceId')
    expect(models.pcListing.update.mock.calls[0]?.[0].data).not.toHaveProperty('memorySize')
  })
})

it.each([-2_147_483_648, -1, 0, 2_147_483_647])(
  'preserves representable signed performance ID %s',
  (performanceId) => {
    expect(CreateListingBaseSchema.parse({ ...handheldInput, performanceId }).performanceId).toBe(
      performanceId,
    )
    expect(CreatePcListingBaseSchema.parse({ ...pcInput, performanceId }).performanceId).toBe(
      performanceId,
    )
  },
)

it('preserves PC web-update coercion while rejecting fractional or overflowing strings', () => {
  expect(
    UpdatePcListingUserSchema.parse({ id, ...pcInput, performanceId: '2' }).performanceId,
  ).toBe(2)
  expect(
    UpdatePcListingUserSchema.safeParse({ id, ...pcInput, performanceId: '2.5' }).success,
  ).toBe(false)
  expect(
    UpdatePcListingUserSchema.safeParse({ id, ...pcInput, performanceId: '2147483648' }).success,
  ).toBe(false)
})
