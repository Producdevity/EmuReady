import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/server/db'
import { PERMISSIONS } from '@/utils/permission-system'
import { PcOs, type Prisma, Role } from '@orm'
import { mobileAdminRouter } from './admin'
import { mobileDevicesRouter } from './devices'
import { mobileEmulatorsRouter } from './emulators'
import { mobileGamesRouter } from './games'
import { mobileListingsRouter } from './listings'
import { mobileNotificationsRouter } from './notifications'
import { mobilePcListingsRouter } from './pcListings'
import { mobilePcPresetsRouter } from './pcPresets'
import type { UserPcPresetsRepository } from '@/server/repositories/user-pc-presets.repository'

vi.unmock('@orm')
vi.unmock('@orm/client')
vi.unmock('@/server/api/trpc')
vi.unmock('@/server/api/root')
const db = vi.hoisted(() => ({
  game: { findMany: vi.fn(), count: vi.fn() },
  listing: { findMany: vi.fn(), count: vi.fn() },
  pcListing: { findMany: vi.fn(), count: vi.fn() },
  device: { findMany: vi.fn(), count: vi.fn() },
  emulator: { findMany: vi.fn(), count: vi.fn() },
  notification: { findMany: vi.fn(), count: vi.fn() },
  listingReport: { findMany: vi.fn(), count: vi.fn() },
  userBan: { findMany: vi.fn(), count: vi.fn() },
  userPcPreset: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  cpu: { findUnique: vi.fn() },
  gpu: { findUnique: vi.fn() },
}))
vi.mock('@/server/db', () => ({ prisma: db }))

const context = { prisma, session: null, headers: new Headers(), apiKey: null }
const ownerId = '00000000-0000-4000-8000-000000000001'
const presetId = '00000000-0000-4000-8000-000000000002'
const cpuId = '00000000-0000-4000-8000-000000000003'
const gpuId = '00000000-0000-4000-8000-000000000004'
const date = new Date('2026-01-01T00:00:00Z')
const hardware = {
  brandId: '00000000-0000-4000-8000-000000000005',
  modelName: 'Test hardware',
  createdAt: date,
  brand: {
    id: '00000000-0000-4000-8000-000000000005',
    name: 'Test brand',
    createdAt: date,
  },
}
const preset = {
  id: presetId,
  userId: ownerId,
  name: 'Test PC',
  cpuId,
  gpuId,
  memorySize: 16,
  os: PcOs.LINUX,
  osVersion: 'Test release',
  createdAt: date,
  updatedAt: date,
  cpu: { id: cpuId, ...hardware },
  gpu: { id: gpuId, ...hardware },
} satisfies Prisma.UserPcPresetGetPayload<{
  include: typeof UserPcPresetsRepository.includes.full
}>
const userContext = {
  ...context,
  session: {
    user: {
      id: ownerId,
      email: null,
      name: null,
      role: Role.USER,
      permissions: [],
      showNsfw: false,
    },
  },
}
const presets = mobilePcPresetsRouter.createCaller(userContext)
const admin = mobileAdminRouter.createCaller({
  ...userContext,
  session: {
    user: {
      ...userContext.session.user,
      role: Role.ADMIN,
      permissions: [
        PERMISSIONS.APPROVE_LISTINGS,
        PERMISSIONS.APPROVE_GAMES,
        PERMISSIONS.MANAGE_USERS,
      ],
    },
  },
})
const catalogs = [
  {
    name: 'games',
    get: mobileGamesRouter.createCaller(context).get,
    read: db.game.findMany,
    maxLimit: 50,
  },
  {
    name: 'handheld reports',
    get: mobileListingsRouter.createCaller(context).get,
    read: db.listing.findMany,
    maxLimit: 50,
  },
  {
    name: 'handheld report alias',
    get: mobileListingsRouter.createCaller(context).getListings,
    read: db.listing.findMany,
    maxLimit: 50,
  },
  {
    name: 'PC reports',
    get: mobilePcListingsRouter.createCaller(context).get,
    read: db.pcListing.findMany,
    maxLimit: 50,
  },
  {
    name: 'notifications',
    get: mobileNotificationsRouter.createCaller(userContext).get,
    read: db.notification.findMany,
    maxLimit: 50,
  },
  {
    name: 'pending handheld reports',
    get: admin.getPendingListings,
    read: db.listing.findMany,
    maxLimit: 100,
  },
  {
    name: 'pending games',
    get: admin.getPendingGames,
    read: db.game.findMany,
    maxLimit: 100,
  },
  {
    name: 'moderation reports',
    get: admin.getReports,
    read: db.listingReport.findMany,
    maxLimit: 100,
  },
  {
    name: 'user bans',
    get: admin.getUserBans,
    read: db.userBan.findMany,
    maxLimit: 100,
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  for (const catalog of [
    db.game,
    db.listing,
    db.pcListing,
    db.device,
    db.emulator,
    db.notification,
    db.listingReport,
    db.userBan,
  ]) {
    catalog.findMany.mockResolvedValue([])
    catalog.count.mockResolvedValue(0)
  }
  db.userPcPreset.findMany.mockResolvedValue([preset])
  db.userPcPreset.findFirst.mockResolvedValue(null)
  db.userPcPreset.findUnique.mockResolvedValue(preset)
  db.userPcPreset.create.mockResolvedValue(preset)
  db.userPcPreset.update.mockResolvedValue(preset)
  db.cpu.findUnique.mockResolvedValue(preset.cpu)
  db.gpu.findUnique.mockResolvedValue(preset.gpu)
})

function expectNoDatabaseCalls() {
  for (const model of Object.values(db)) {
    for (const operation of Object.values(model)) expect(operation).not.toHaveBeenCalled()
  }
}

describe.each(catalogs)('mobile $name pagination', (catalog) => {
  it.each([
    { page: 1.5 },
    { limit: 20.5 },
    { page: 0 },
    { limit: 0 },
    { page: Infinity },
    { limit: NaN },
    { page: 1e40 },
    { page: Number.MAX_SAFE_INTEGER + 1 },
    { page: Number.MAX_SAFE_INTEGER, limit: 50 },
    { limit: catalog.maxLimit + 1 },
  ])('rejects %j before any database operation', async (input) => {
    await expect(catalog.get(input)).rejects.toMatchObject({ code: 'BAD_REQUEST' })
    expectNoDatabaseCalls()
  })

  it.each([{}, { page: null }])('preserves first-page defaults for %j', async (input) => {
    const response = await catalog.get(input)
    expect(catalog.read).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 20 }))
    expect(response.pagination).toEqual({
      total: 0,
      page: 1,
      limit: 20,
      pages: 0,
      offset: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    })
  })

  it('preserves the maximum page size and requested page', async () => {
    await catalog.get({ page: 2, limit: catalog.maxLimit })
    expect(catalog.read).toHaveBeenCalledWith(
      expect.objectContaining({ skip: catalog.maxLimit, take: catalog.maxLimit }),
    )
  })

  it('accepts the last safe computed offset and rejects the next page', async () => {
    const page = Math.floor(Number.MAX_SAFE_INTEGER / catalog.maxLimit) + 1
    await catalog.get({ page, limit: catalog.maxLimit })
    expect(catalog.read).toHaveBeenCalledWith(
      expect.objectContaining({ skip: (page - 1) * catalog.maxLimit, take: catalog.maxLimit }),
    )
    vi.clearAllMocks()
    await expect(catalog.get({ page: page + 1, limit: catalog.maxLimit })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    })
    expectNoDatabaseCalls()
  })
})

it('preserves omitted game and handheld catalog inputs', async () => {
  await mobileGamesRouter.createCaller(context).get()
  await mobileListingsRouter.createCaller(context).get()
  await mobileListingsRouter.createCaller(context).getListings()
  expect(db.game.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 20 }))
  expect(db.listing.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 20 }))
})

it('preserves omitted notification and admin pagination inputs', async () => {
  await mobileNotificationsRouter.createCaller(userContext).get()
  await admin.getPendingListings()
  await admin.getPendingGames()
  await admin.getReports()
  await admin.getUserBans()
  for (const model of [db.notification, db.listing, db.game, db.listingReport, db.userBan]) {
    expect(model.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 20 }))
  }
})

describe.each([
  {
    name: 'devices',
    get: mobileDevicesRouter.createCaller(context).get,
    read: db.device.findMany,
    maxLimit: 1000,
  },
  {
    name: 'emulators',
    get: mobileEmulatorsRouter.createCaller(context).get,
    read: db.emulator.findMany,
    maxLimit: 100,
  },
])('mobile $name limits', (catalog) => {
  it.each([1.5, 0, Infinity, NaN, catalog.maxLimit + 1])(
    'rejects limit %s before any database operation',
    async (limit) => {
      await expect(catalog.get({ limit })).rejects.toMatchObject({ code: 'BAD_REQUEST' })
      expectNoDatabaseCalls()
    },
  )

  it('preserves the default and maximum page sizes', async () => {
    await catalog.get({})
    expect(catalog.read).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 50 }))
    await catalog.get({ limit: catalog.maxLimit })
    expect(catalog.read).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: catalog.maxLimit }),
    )
  })
})

it('preserves the omitted device input and existing response shape', async () => {
  expect(await mobileDevicesRouter.createCaller(context).get()).toEqual({
    devices: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 20,
      pages: 0,
      offset: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  })
  expect(await mobileEmulatorsRouter.createCaller(context).get({})).toEqual([])
})

describe('mobile PC preset numeric inputs', () => {
  it('rejects a fractional list limit before any database operation', async () => {
    await expect(presets.get({ limit: 20.5 })).rejects.toMatchObject({ code: 'BAD_REQUEST' })
    expectNoDatabaseCalls()
  })

  it.each([{}, { limit: 50 }])('preserves the preset list contract for %j', async (input) => {
    expect(await presets.get(input)).toEqual([preset])
    expect(db.userPcPreset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: ownerId }, take: input.limit ?? 20 }),
    )
  })

  it.each([8.5, 0, 257, Infinity, NaN])(
    'rejects memory size %s on create before any database operation',
    async (memorySize) => {
      await expect(presets.create({ ...preset, memorySize })).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      })
      expectNoDatabaseCalls()
    },
  )

  it.each([8.5, 0, 257, Infinity, NaN])(
    'rejects memory size %s on update before any database operation',
    async (memorySize) => {
      await expect(presets.update({ id: presetId, memorySize })).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      })
      expectNoDatabaseCalls()
    },
  )

  it('preserves integer memory and the authenticated owner on create', async () => {
    const input = { ...preset, userId: '00000000-0000-4000-8000-000000000099' }
    expect(await presets.create(input)).toEqual(preset)
    expect(db.userPcPreset.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          userId: ownerId,
          name: preset.name,
          cpuId,
          gpuId,
          memorySize: 16,
          os: PcOs.LINUX,
          osVersion: preset.osVersion,
        },
      }),
    )
  })

  it.each([{ memorySize: 16 }, { osVersion: 'Updated release' }])(
    'preserves partial preset updates for %j',
    async (changes) => {
      expect(await presets.update({ id: presetId, ...changes })).toEqual(preset)
      expect(db.userPcPreset.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: presetId }, data: changes }),
      )
    },
  )
})
