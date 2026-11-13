import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type z } from 'zod'
import { bookmarksRouter } from '@/features/bookmarks/server/bookmarks.router'
import { BookmarkFiltersSchema } from '@/features/bookmarks/shared/bookmark-filters.schemas'
import { CreateCustomFieldCategorySchema } from '@/schemas/customFieldCategory'
import { CreateCustomFieldDefinitionSchema } from '@/schemas/customFieldDefinition'
import { CreateGameSchema } from '@/schemas/game'
import { GetListingsSchema as MobileGetListingsSchema } from '@/schemas/mobile'
import { type AdminCreateReleaseSchema, AdminPublishLatestSchema } from '@/schemas/releasesAdmin'
import { prisma } from '@/server/db'
import { PERMISSIONS } from '@/utils/permission-system'
import { CustomFieldType, Role } from '@orm'
import { adminReleasesRouter } from './admin/releases'
import { customFieldCategoryRouter } from './customFieldCategories'
import { customFieldDefinitionRouter } from './customFieldDefinitions'
import { gamesRouter } from './games'
import { coreRouter as handheldRouter } from './listings/core'
import { mobileListingsRouter } from './mobile/listings'
import { coreRouter as pcRouter } from './pcListings/core'
import { performanceScalesRouter } from './performanceScales'

vi.unmock('@orm')
vi.unmock('@orm/client')
vi.unmock('@/server/api/trpc')
vi.unmock('@/server/api/root')
const database = vi.hoisted(() => ({
  performanceScale: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  customFieldCategory: {
    findUnique: vi.fn(),
    aggregate: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  customFieldDefinition: { findUnique: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn() },
  game: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  system: { findUnique: vi.fn() },
  release: { findFirst: vi.fn(), create: vi.fn() },
  listing: { findMany: vi.fn(), count: vi.fn() },
  pcListing: { findMany: vi.fn(), count: vi.fn() },
  listingBookmark: { findMany: vi.fn(), count: vi.fn() },
  pcListingBookmark: { findMany: vi.fn(), count: vi.fn() },
  vote: { findMany: vi.fn() },
  verifiedDeveloper: { findUnique: vi.fn() },
  user: { findUnique: vi.fn() },
}))
const transaction = vi.hoisted(() => vi.fn())
vi.mock('@/server/db', () => ({ prisma: { ...database, $transaction: transaction } }))
vi.mock('@/server/utils/spam-check', () => ({ checkSpamContent: vi.fn() }))

const id = '00000000-0000-4000-8000-000000000001'
const context = {
  prisma,
  headers: new Headers(),
  session: {
    user: {
      id,
      role: Role.SUPER_ADMIN,
      permissions: Object.values(PERMISSIONS),
      name: null,
      email: null,
      showNsfw: false,
    },
  },
}
const performance = performanceScalesRouter.createCaller(context)
const categories = customFieldCategoryRouter.createCaller(context)
const fields = customFieldDefinitionRouter.createCaller(context)
const games = gamesRouter.createCaller(context)
const releases = adminReleasesRouter.createCaller(context)
const handheld = handheldRouter.createCaller(context)
const pc = pcRouter.createCaller(context)
const mobile = mobileListingsRouter.createCaller({ ...context, apiKey: null })
const bookmarks = bookmarksRouter.createCaller(context)
const gameInput = { title: 'Test game', systemId: id }
const fieldInput = {
  emulatorId: id,
  name: 'test_field',
  label: 'Test field',
  type: CustomFieldType.TEXT,
}
const releaseInput = {
  channel: 'beta',
  versionName: '1.0',
  fileKey: 'android/beta/test.apk',
  fileSha256: 'a'.repeat(64),
  sizeBytes: 1,
} satisfies Omit<z.input<typeof AdminCreateReleaseSchema>, 'versionCode'>
const operations = [
  { name: 'performance lookup', run: (value: number) => performance.byId({ id: value }) },
  {
    name: 'performance create rank',
    run: (value: number) => performance.create({ label: 'Test', rank: value }),
  },
  {
    name: 'performance update ID',
    run: (value: number) => performance.update({ id: value, label: 'Test', rank: 1 }),
  },
  {
    name: 'performance update rank',
    run: (value: number) => performance.update({ id: 1, label: 'Test', rank: value }),
  },
  { name: 'performance delete ID', run: (value: number) => performance.delete({ id: value }) },
  {
    name: 'performance replacement ID',
    run: (value: number) => performance.delete({ id: 1, replacementId: value }),
  },
  {
    name: 'category create order',
    run: (value: number) =>
      categories.create({ emulatorId: id, name: 'Test', displayOrder: value }),
  },
  {
    name: 'category update order',
    run: (value: number) => categories.update({ id, displayOrder: value }),
  },
  {
    name: 'category reorder',
    run: (value: number) => categories.updateOrder([{ id, displayOrder: value }]),
  },
  {
    name: 'field create order',
    run: (value: number) => fields.create({ ...fieldInput, categoryOrder: value }),
  },
  {
    name: 'field update order',
    run: (value: number) => fields.update({ id, categoryOrder: value }),
  },
  {
    name: 'field reorder',
    run: (value: number) => fields.updateOrder([{ id, displayOrder: value }]),
  },
  {
    name: 'game create ID',
    run: (value: number) => games.create({ ...gameInput, tgdbGameId: value }),
  },
  {
    name: 'game update ID',
    run: (value: number) => games.update({ id, ...gameInput, tgdbGameId: value }),
  },
  {
    name: 'own game update ID',
    run: (value: number) => games.updateOwnPendingGame({ id, ...gameInput, tgdbGameId: value }),
  },
  {
    name: 'game exact-ID lookup',
    run: (value: number) => games.checkExistingByTgdbIds({ tgdbGameIds: [value] }),
  },
  {
    name: 'release version',
    run: (value: number) => releases.create({ ...releaseInput, versionCode: value }),
  },
  {
    name: 'handheld exact-ID filter',
    run: (value: number) => handheld.get({ performanceIds: [value] }),
  },
  { name: 'PC exact-ID filter', run: (value: number) => pc.get({ performanceIds: [value] }) },
  { name: 'PC memory minimum', run: (value: number) => pc.get({ memoryMin: value }) },
  { name: 'PC memory maximum', run: (value: number) => pc.get({ memoryMax: value }) },
  {
    name: 'mobile exact-ID filter',
    run: (value: number) => mobile.get({ performanceIds: [value] }),
  },
  {
    name: 'mobile compatibility exact-ID filter',
    run: (value: number) => mobile.getListings({ performanceIds: [value] }),
  },
  {
    name: 'handheld bookmark exact-ID filter',
    run: (value: number) => bookmarks.getListingBookmarks({ userId: id, performanceIds: [value] }),
  },
  {
    name: 'PC bookmark exact-ID filter',
    run: (value: number) =>
      bookmarks.getPcListingBookmarks({ userId: id, performanceIds: [value] }),
  },
  {
    name: 'bookmark memory minimum',
    run: (value: number) => bookmarks.getPcListingBookmarks({ userId: id, memoryMin: value }),
  },
  {
    name: 'bookmark memory maximum',
    run: (value: number) => bookmarks.getPcListingBookmarks({ userId: id, memoryMax: value }),
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  database.performanceScale.findFirst.mockResolvedValue(null)
  database.customFieldCategory.findUnique.mockResolvedValue(null)
  database.customFieldCategory.aggregate.mockResolvedValue({ _max: { displayOrder: null } })
  database.customFieldCategory.create.mockResolvedValue({ id })
  database.customFieldDefinition.findUnique.mockResolvedValue(null)
  database.customFieldDefinition.count.mockResolvedValue(0)
  database.customFieldDefinition.create.mockResolvedValue({ id })
  database.game.findMany.mockResolvedValue([])
  database.release.findFirst.mockResolvedValue(null)
  database.release.create.mockResolvedValue({ id })
  database.listing.findMany.mockResolvedValue([])
  database.listing.count.mockResolvedValue(0)
  database.vote.findMany.mockResolvedValue([])
  database.verifiedDeveloper.findUnique.mockResolvedValue(null)
})

function expectNoDatabaseCalls() {
  expect(transaction).not.toHaveBeenCalled()
  for (const model of Object.values(database)) {
    for (const operation of Object.values(model)) expect(operation).not.toHaveBeenCalled()
  }
}

describe.each(operations)('$name', (operation) => {
  it.each([1.5, -2_147_483_649, 2_147_483_648, Infinity])(
    'rejects unrepresentable integer %s before database access',
    async (value) => {
      await expect(operation.run(value)).rejects.toMatchObject({ code: 'BAD_REQUEST' })
      expectNoDatabaseCalls()
    },
  )
})

describe('preserved stored integer contracts', () => {
  it.each([-2_147_483_648, -1, 0, 2_147_483_647])(
    'passes signed ID %s to Prisma unchanged',
    async (value) => {
      const scale = { id: value, label: 'Test', rank: value, description: null }
      database.performanceScale.findUnique.mockResolvedValue(scale)
      expect(await performance.byId({ id: value })).toEqual(scale)
      expect(database.performanceScale.findUnique).toHaveBeenCalledExactlyOnceWith({
        where: { id: value },
      })
      database.performanceScale.create.mockResolvedValue(scale)
      expect(await performance.create({ label: 'Test', rank: value })).toEqual(scale)
      expect(database.performanceScale.create).toHaveBeenCalledWith({
        data: { label: 'Test', rank: value },
      })
      expect(
        CreateCustomFieldCategorySchema.parse({ emulatorId: id, name: 'Test', displayOrder: value })
          .displayOrder,
      ).toBe(value)
      expect(
        CreateCustomFieldDefinitionSchema.parse({ ...fieldInput, categoryOrder: value })
          .categoryOrder,
      ).toBe(value)
      expect(CreateGameSchema.parse({ ...gameInput, tgdbGameId: value }).tgdbGameId).toBe(value)
    },
  )

  it('retains order defaults and partial updates without replacing omitted fields', async () => {
    await categories.create({ emulatorId: id, name: 'Test' })
    expect(database.customFieldCategory.create).toHaveBeenCalledWith({
      data: { emulatorId: id, name: 'Test', displayOrder: 0 },
    })
    await fields.create(fieldInput)
    expect(database.customFieldDefinition.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ categoryOrder: 0 }) }),
    )
    database.customFieldCategory.findUnique.mockResolvedValue({ id, emulatorId: id })
    await categories.update({ id })
    expect(database.customFieldCategory.update).toHaveBeenCalledWith({
      where: { id },
      data: { name: undefined, displayOrder: undefined },
    })
    database.customFieldDefinition.findUnique.mockResolvedValue({
      id,
      emulatorId: id,
      type: CustomFieldType.TEXT,
    })
    await fields.update({ id })
    expect(database.customFieldDefinition.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ categoryOrder: undefined }) }),
    )
  })

  it('preserves nullable game IDs and bookmark defaults', () => {
    expect(CreateGameSchema.parse({ ...gameInput, tgdbGameId: null }).tgdbGameId).toBeNull()
    expect(CreateGameSchema.parse(gameInput)).not.toHaveProperty('tgdbGameId')
    expect(BookmarkFiltersSchema.parse({})).toMatchObject({
      performanceIds: [],
      memoryMin: null,
      memoryMax: null,
    })
  })

  it('keeps existing positive domains and their representable upper bound', async () => {
    await releases.create({ ...releaseInput, versionCode: 2_147_483_647 })
    expect(database.release.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ versionCode: 2_147_483_647, sizeBytes: BigInt(1) }),
      }),
    )
    expect(
      BookmarkFiltersSchema.parse({
        performanceIds: [2_147_483_647],
        memoryMin: 1,
        memoryMax: 2_147_483_647,
      }),
    ).toMatchObject({ performanceIds: [2_147_483_647], memoryMin: 1, memoryMax: 2_147_483_647 })
    for (const value of [-1, 0]) {
      expect(BookmarkFiltersSchema.safeParse({ performanceIds: [value] }).success).toBe(false)
      expect(BookmarkFiltersSchema.safeParse({ memoryMin: value }).success).toBe(false)
      expect(
        AdminPublishLatestSchema.safeParse({ ...releaseInput, versionCode: value }).success,
      ).toBe(false)
    }
  })

  it.each(['-2147483648', '-1', '0', '2.0', '2e2', '0x10', ''])(
    'retains mobile numeric-string conversion for %j',
    async (value) => {
      expect(MobileGetListingsSchema.parse({ performanceIds: [value] })?.performanceIds).toEqual([
        Number(value),
      ])
      await mobile.get({ performanceIds: [value] })
      expect(database.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ performanceId: { in: [Number(value)] } }),
        }),
      )
    },
  )

  it('retains the verified-developer check for representable field edits', async () => {
    database.customFieldDefinition.findUnique.mockResolvedValue({ id, emulatorId: id })
    const developer = customFieldDefinitionRouter.createCaller({
      ...context,
      session: {
        user: {
          ...context.session.user,
          role: Role.DEVELOPER,
          permissions: [PERMISSIONS.MANAGE_CUSTOM_FIELDS],
        },
      },
    })
    await expect(developer.update({ id, categoryOrder: -1 })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
    expect(database.verifiedDeveloper.findUnique).toHaveBeenCalledWith({
      where: { userId_emulatorId: { userId: id, emulatorId: id } },
    })
    expect(database.customFieldDefinition.update).not.toHaveBeenCalled()
  })

  it.each(['1.5', '2147483648', '-2147483649', 'Infinity', 'invalid'])(
    'rejects mobile numeric string %j before database access',
    async (value) => {
      await expect(mobile.get({ performanceIds: [value] })).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      })
      expectNoDatabaseCalls()
    },
  )
})
