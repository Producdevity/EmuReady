import { beforeEach, describe, expect, it, vi } from 'vitest'
import { bookmarksRouter } from '@/features/bookmarks/server/bookmarks.router'
import { cpuRouter } from '@/features/hardware/cpu/server/cpu.router'
import {
  GetCpuOptionsSchema,
  MobileGetCpusSchema,
  MobilePcListingCpusSchema,
} from '@/features/hardware/cpu/shared/cpu.schemas'
import { gpuRouter } from '@/features/hardware/gpu/server/gpu.router'
import {
  GetGpuOptionsSchema,
  MobileGetGpusSchema,
  MobilePcListingGpusSchema,
} from '@/features/hardware/gpu/shared/gpu.schemas'
import { GetUserByIdSchema } from '@/features/users/shared/user.schemas'
import { GetDeviceOptionsSchema } from '@/schemas/device'
import { type PaginationInput } from '@/schemas/pagination'
import { GetSoCOptionsSchema } from '@/schemas/soc'
import { appRouter } from '@/server/api/root'
import { prisma } from '@/server/db'
import { PERMISSIONS } from '@/utils/permission-system'
import { Role } from '@orm'
import { devicesRouter } from './devices'
import { gameFollowsRouter } from './gameFollows'
import { mobileCpusRouter } from './mobile/cpus'
import { mobileGpusRouter } from './mobile/gpus'
import { mobilePcListingsRouter } from './mobile/pcListings'
import { socialRouter } from './social'
import { socsRouter } from './socs'

vi.unmock('@orm')
vi.unmock('@orm/client')
vi.unmock('@/server/api/trpc')
vi.unmock('@/server/api/root')
const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn() },
  userFollow: { findMany: vi.fn(), count: vi.fn() },
  userRelationship: { findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn() },
  gameFollow: { findMany: vi.fn(), count: vi.fn() },
  listingBookmark: { findMany: vi.fn(), count: vi.fn() },
  pcListingBookmark: { findMany: vi.fn(), count: vi.fn() },
  listing: { findMany: vi.fn(), count: vi.fn() },
  pcListing: { findMany: vi.fn(), count: vi.fn() },
  vote: { findMany: vi.fn(), count: vi.fn() },
  trustActionLog: { findMany: vi.fn(), count: vi.fn() },
  cpu: { findMany: vi.fn(), count: vi.fn() },
  gpu: { findMany: vi.fn(), count: vi.fn() },
  device: { findMany: vi.fn(), count: vi.fn() },
  soC: { findMany: vi.fn(), count: vi.fn() },
}))
vi.mock('@/server/db', () => ({ prisma: db }))

const userId = '00000000-0000-4000-8000-000000000001'
const context = {
  prisma,
  headers: new Headers(),
  apiKey: null,
  session: {
    user: {
      id: userId,
      email: null,
      name: null,
      role: Role.SUPER_ADMIN,
      permissions: [PERMISSIONS.VIEW_USER_BANS],
      showNsfw: false,
    },
  },
}
const users = appRouter.createCaller(context).users
const bookmarks = bookmarksRouter.createCaller(context)
const social = socialRouter.createCaller(context)
const gameFollows = gameFollowsRouter.createCaller(context)
const cpus = cpuRouter.createCaller(context)
const gpus = gpuRouter.createCaller(context)
const mobileCpus = mobileCpusRouter.createCaller(context)
const mobileGpus = mobileGpusRouter.createCaller(context)
const mobilePc = mobilePcListingsRouter.createCaller(context)

const paginated = [
  {
    name: 'admin users',
    read: (input: PaginationInput) => users.get(input),
    query: db.user.findMany,
  },
  {
    name: 'admin social list',
    read: (input: PaginationInput) =>
      users.adminGetSocialList({ userId, section: 'followers', ...input }),
    query: db.userFollow.findMany,
  },
  {
    name: 'followers',
    read: (input: PaginationInput) => social.getFollowers({ userId, ...input }),
    query: db.userFollow.findMany,
  },
  {
    name: 'following',
    read: (input: PaginationInput) => social.getFollowing({ userId, ...input }),
    query: db.userFollow.findMany,
  },
  {
    name: 'friend requests',
    read: (input: PaginationInput) => social.getFriendRequests({ direction: 'sent', ...input }),
    query: db.userRelationship.findMany,
  },
  {
    name: 'friends',
    read: (input: PaginationInput) => social.getFriends({ userId, ...input }),
    query: db.userRelationship.findMany,
  },
  {
    name: 'blocked users',
    read: (input: PaginationInput) => social.getBlockedUsers(input),
    query: db.userRelationship.findMany,
  },
  {
    name: 'followed games',
    read: (input: PaginationInput) => gameFollows.getFollowedGames({ userId, ...input }),
    query: db.gameFollow.findMany,
  },
  {
    name: 'handheld bookmarks',
    read: (input: PaginationInput) => bookmarks.getListingBookmarks({ userId, ...input }),
    query: db.listingBookmark.findMany,
  },
  {
    name: 'PC bookmarks',
    read: (input: PaginationInput) => bookmarks.getPcListingBookmarks({ userId, ...input }),
    query: db.pcListingBookmark.findMany,
  },
  { name: 'web CPUs', read: (input: PaginationInput) => cpus.get(input), query: db.cpu.findMany },
  { name: 'web GPUs', read: (input: PaginationInput) => gpus.get(input), query: db.gpu.findMany },
  {
    name: 'mobile CPUs',
    read: (input: PaginationInput) => mobileCpus.get(input),
    query: db.cpu.findMany,
  },
  {
    name: 'mobile GPUs',
    read: (input: PaginationInput) => mobileGpus.get(input),
    query: db.gpu.findMany,
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  for (const model of [
    db.user,
    db.userFollow,
    db.userRelationship,
    db.gameFollow,
    db.listingBookmark,
    db.pcListingBookmark,
    db.listing,
    db.pcListing,
    db.vote,
    db.trustActionLog,
    db.cpu,
    db.gpu,
    db.device,
    db.soC,
  ]) {
    model.findMany.mockResolvedValue([])
    model.count.mockResolvedValue(0)
  }
  db.user.findUnique.mockResolvedValue({
    id: userId,
    userBans: [],
    settings: {
      profilePublic: true,
      bookmarksVisible: true,
      followersVisible: true,
      followingVisible: true,
      gameFollowsVisible: true,
    },
  })
  db.userRelationship.findFirst.mockResolvedValue(null)
})

function expectNoDatabaseCalls() {
  for (const model of Object.values(db))
    for (const operation of Object.values(model)) expect(operation).not.toHaveBeenCalled()
}

describe.each(paginated)('$name pagination inputs', (endpoint) => {
  it.each([
    { input: { page: 1.5 }, field: 'page' },
    { input: { limit: 1.5 }, field: 'limit' },
    { input: { page: Number.MAX_SAFE_INTEGER + 1 }, field: 'page' },
    { input: { page: Number.MAX_SAFE_INTEGER, limit: 20 }, field: 'page' },
  ])('rejects $input before database access', async (testCase) => {
    await expect(endpoint.read(testCase.input)).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      cause: {
        issues: expect.arrayContaining([expect.objectContaining({ path: [testCase.field] })]),
      },
    })
    expectNoDatabaseCalls()
  })

  it('passes the requested page and limit to Prisma', async () => {
    await endpoint.read({ page: 2, limit: 10 })
    expect(endpoint.query).toHaveBeenCalledWith(expect.objectContaining({ skip: 10, take: 10 }))
  })

  it('accepts an exactly representable offset above Int32', async () => {
    await endpoint.read({ page: 2 ** 31 + 1, limit: 1 })
    expect(endpoint.query).toHaveBeenCalledWith(expect.objectContaining({ skip: 2 ** 31, take: 1 }))
  })

  it('accepts the last safe offset and rejects the following page', async () => {
    const page = Math.floor(Number.MAX_SAFE_INTEGER / 10) + 1
    await endpoint.read({ page, limit: 10 })
    expect(endpoint.query).toHaveBeenCalledWith(
      expect.objectContaining({ skip: (page - 1) * 10, take: 10 }),
    )
    vi.clearAllMocks()
    await expect(endpoint.read({ page: page + 1, limit: 10 })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      cause: { issues: expect.arrayContaining([expect.objectContaining({ path: ['page'] })]) },
    })
    expectNoDatabaseCalls()
  })
})

describe('nested profile pagination', () => {
  it.each(['listingsPage', 'pcListingsPage', 'votesPage', 'trustActionsPage'] as const)(
    'rejects unsafe %s at the correct field before any read',
    async (field) => {
      await expect(
        users.getUserById({ userId, [field]: Number.MAX_SAFE_INTEGER }),
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        cause: { issues: expect.arrayContaining([expect.objectContaining({ path: [field] })]) },
      })
      expectNoDatabaseCalls()
    },
  )

  it('retains all four profile defaults', () => {
    expect(GetUserByIdSchema.parse({ userId })).toMatchObject({
      listingsPage: 1,
      listingsLimit: 12,
      pcListingsPage: 1,
      pcListingsLimit: 12,
      votesPage: 1,
      votesLimit: 12,
      trustActionsPage: 1,
      trustActionsLimit: 10,
    })
  })
})

it('rejects fractional user search limits before database access', async () => {
  await expect(users.searchUsers({ query: 'owner', limit: 1.5 })).rejects.toMatchObject({
    code: 'BAD_REQUEST',
    cause: { issues: expect.arrayContaining([expect.objectContaining({ path: ['limit'] })]) },
  })
  expectNoDatabaseCalls()
})

it.each([{}, { limit: 50 }])('preserves user search defaults and cap for %j', async (input) => {
  await users.searchUsers({ query: 'owner', ...input })
  expect(db.user.findMany).toHaveBeenCalledWith(
    expect.objectContaining({ take: input.limit ?? 20 }),
  )
})

const options = [
  { name: 'CPU', schema: GetCpuOptionsSchema, read: cpus.options, query: db.cpu.findMany },
  { name: 'GPU', schema: GetGpuOptionsSchema, read: gpus.options, query: db.gpu.findMany },
  {
    name: 'device',
    schema: GetDeviceOptionsSchema,
    read: devicesRouter.createCaller(context).options,
    query: db.device.findMany,
  },
  {
    name: 'SoC',
    schema: GetSoCOptionsSchema,
    read: socsRouter.createCaller(context).options,
    query: db.soC.findMany,
  },
]

describe.each(options)('$name option offsets', (endpoint) => {
  it.each([Number.MAX_SAFE_INTEGER + 1, -1, 0.5])(
    'rejects offset %s before database access',
    async (offset) => {
      await expect(endpoint.read({ offset })).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        cause: { issues: expect.arrayContaining([expect.objectContaining({ path: ['offset'] })]) },
      })
      expectNoDatabaseCalls()
    },
  )

  it('retains omission, null rejection, defaults, and the existing cap', async () => {
    expect(endpoint.schema.safeParse(undefined).success).toBe(true)
    expect(endpoint.schema.safeParse(null).success).toBe(false)
    await endpoint.read({})
    expect(endpoint.query).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 51 }))
    await endpoint.read({ offset: 2 ** 31, limit: 1000 })
    expect(endpoint.query).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 2 ** 31, take: 1001 }),
    )
    expect(endpoint.schema.safeParse({ limit: 1001 }).success).toBe(false)
  })
})

describe('activity feed fetch count', () => {
  it('rejects an unsafe take even when its offset is safe', async () => {
    const page = Math.floor(Number.MAX_SAFE_INTEGER / 50) + 1
    expect(Number.isSafeInteger((page - 1) * 50)).toBe(true)
    await expect(
      social.getActivityFeed({ scope: 'community', page, limit: 50 }),
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      cause: { issues: expect.arrayContaining([expect.objectContaining({ path: ['page'] })]) },
    })
    expectNoDatabaseCalls()
  })

  it('passes the last safe computed take unchanged', async () => {
    const page = Math.floor(Number.MAX_SAFE_INTEGER / 50)
    await social.getActivityFeed({ scope: 'community', page, limit: 50 })
    for (const query of [db.listing.findMany, db.pcListing.findMany])
      expect(query).toHaveBeenCalledWith(expect.objectContaining({ take: page * 50 }))
  })
})

describe.each([
  { name: 'CPU', schema: MobilePcListingCpusSchema, read: mobilePc.cpus, query: db.cpu.findMany },
  { name: 'GPU', schema: MobilePcListingGpusSchema, read: mobilePc.gpus, query: db.gpu.findMany },
])('mobile PC $name lookup', (endpoint) => {
  it('rejects fractional limits before database access', async () => {
    await expect(endpoint.read({ limit: 1.5 })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      cause: { issues: expect.arrayContaining([expect.objectContaining({ path: ['limit'] })]) },
    })
    expectNoDatabaseCalls()
  })

  it('retains default50 and cap100', async () => {
    await endpoint.read({})
    expect(endpoint.query).toHaveBeenCalledWith(expect.objectContaining({ take: 50 }))
    await endpoint.read({ limit: 100 })
    expect(endpoint.query).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }))
    expect(endpoint.schema.safeParse({ limit: 101 }).success).toBe(false)
  })
})

it.each([MobileGetCpusSchema, MobileGetGpusSchema])(
  'preserves the mobile catalog optional/default contract',
  (schema) => {
    expect(schema.safeParse(undefined).success).toBe(true)
    expect(schema.safeParse(null).success).toBe(false)
    expect(schema.parse({})).toEqual({ limit: 20, offset: 0 })
    expect(schema.safeParse({ page: null }).success).toBe(false)
    expect(schema.safeParse({ limit: 2 ** 31 }).success).toBe(true)
    expect(schema.safeParse({ page: 0 }).success).toBe(false)
    expect(schema.safeParse({ page: 1, limit: 0 }).success).toBe(false)
    expect(schema.safeParse({ page: 1, limit: -5 }).success).toBe(false)
  },
)

describe.each([
  { name: 'CPU', read: mobileCpus.get, query: db.cpu.findMany },
  { name: 'GPU', read: mobileGpus.get, query: db.gpu.findMany },
])('mobile $name effective offset', (endpoint) => {
  it.each([
    { input: { limit: 0 }, field: 'limit' },
    { input: { limit: -5 }, field: 'limit' },
    { input: { page: 0 }, field: 'page' },
    { input: { page: -1, limit: -20 }, field: 'page' },
    { input: { page: -1 }, field: 'page' },
  ])('rejects the unsupported response domain for $input before reading', async (testCase) => {
    const result = await endpoint.read(testCase.input).catch((error: unknown) => error)
    expect({ result, reads: endpoint.query.mock.calls.length }).toMatchObject({
      result: {
        code: 'BAD_REQUEST',
        cause: {
          issues: expect.arrayContaining([expect.objectContaining({ path: [testCase.field] })]),
        },
      },
      reads: 0,
    })
    expectNoDatabaseCalls()
  })

  it.each([-1, Number.MAX_SAFE_INTEGER + 1, 0.5])(
    'rejects offset %s before reading',
    async (offset) => {
      await expect(endpoint.read({ offset })).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        cause: { issues: expect.arrayContaining([expect.objectContaining({ path: ['offset'] })]) },
      })
      expectNoDatabaseCalls()
    },
  )

  it('uses page precedence without rejecting a previously ignored negative offset', async () => {
    await endpoint.read({ page: 1, offset: -1 })
    expect(endpoint.query).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 20 }))
  })

  it('retains uncapped safe integer take values above Int32', async () => {
    await endpoint.read({ limit: 2 ** 31 })
    expect(endpoint.query).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 2 ** 31 }))
  })
})
