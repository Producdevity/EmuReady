import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ActivityQuerySchema } from '@/schemas/activity'
import { GetPendingGamesSchema } from '@/schemas/game'
import { GetProcessedSchema } from '@/schemas/listing'
import { GetProcessedPcSchema } from '@/schemas/pcListing'
import { prisma } from '@/server/db'
import { PERMISSIONS } from '@/utils/permission-system'
import { Role } from '@orm'
import { activityRouter } from './admin/activity'
import { adminEntitlementsRouter } from './admin/entitlements'
import { apiKeysRouter } from './apiKeys'
import { auditLogsRouter } from './auditLogs'
import { badgesRouter } from './badges'
import { deviceBrandsRouter } from './deviceBrands'
import { devicesRouter } from './devices'
import { emulatorsRouter } from './emulators'
import { gamesRouter } from './games'
import { listingReportsRouter } from './listingReports'
import { adminRouter as handheldRouter } from './listings/admin'
import { listingVerificationsRouter } from './listingVerifications'
import { notificationsRouter } from './notifications'
import { pcListingReportsRouter } from './pcListingReports'
import { adminRouter as pcRouter } from './pcListings/admin'
import { permissionLogsRouter } from './permissionLogs'
import { permissionsRouter } from './permissions'
import { socsRouter } from './socs'
import { trustRouter } from './trust'
import { userBansRouter } from './userBans'
import { verifiedDevelopersRouter } from './verifiedDevelopers'
import { voteInvestigationRouter } from './voteInvestigation'

vi.unmock('@orm')
vi.unmock('@orm/client')
vi.unmock('@/server/api/trpc')
vi.unmock('@/server/api/root')
const models = vi.hoisted(() => ({
  deviceBrand: { findMany: vi.fn(), count: vi.fn() },
  emulator: { findMany: vi.fn(), count: vi.fn() },
  device: { findMany: vi.fn(), count: vi.fn() },
  soC: { findMany: vi.fn(), count: vi.fn() },
  badge: { findMany: vi.fn(), count: vi.fn() },
  notification: { findMany: vi.fn(), count: vi.fn() },
  userBan: { findMany: vi.fn(), count: vi.fn() },
  listingDeveloperVerification: { findMany: vi.fn(), count: vi.fn() },
  verifiedDeveloper: { findMany: vi.fn(), count: vi.fn() },
  game: { findMany: vi.fn(), count: vi.fn() },
  listing: { findMany: vi.fn(), count: vi.fn() },
  pcListing: { findMany: vi.fn(), count: vi.fn() },
  auditLog: { findMany: vi.fn(), count: vi.fn() },
  permission: { findMany: vi.fn(), count: vi.fn() },
  permissionActionLog: { findMany: vi.fn(), count: vi.fn() },
  trustActionLog: { findMany: vi.fn(), count: vi.fn() },
  entitlement: { findMany: vi.fn(), count: vi.fn() },
  apiKey: { findMany: vi.fn(), count: vi.fn() },
  listingReport: { findMany: vi.fn(), count: vi.fn() },
  pcListingReport: { findMany: vi.fn(), count: vi.fn() },
  vote: { findMany: vi.fn(), count: vi.fn() },
  pcListingVote: { findMany: vi.fn(), count: vi.fn() },
  user: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
  comment: { findMany: vi.fn(), count: vi.fn() },
}))
const transaction = vi.hoisted(() => vi.fn())
vi.mock('@/server/db', () => ({ prisma: { ...models, $transaction: transaction } }))

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
const brands = deviceBrandsRouter.createCaller(context)
const emulators = emulatorsRouter.createCaller(context)
const devices = devicesRouter.createCaller(context)
const socs = socsRouter.createCaller(context)
const badges = badgesRouter.createCaller(context)
const notifications = notificationsRouter.createCaller(context)
const bans = userBansRouter.createCaller(context)
const verifications = listingVerificationsRouter.createCaller(context)
const developers = verifiedDevelopersRouter.createCaller(context)
const games = gamesRouter.createCaller(context)
const handheld = handheldRouter.createCaller(context)
const pc = pcRouter.createCaller(context)
const activity = activityRouter.createCaller(context)
const audits = auditLogsRouter.createCaller(context)
const permissions = permissionsRouter.createCaller(context)
const permissionLogs = permissionLogsRouter.createCaller(context)
const trust = trustRouter.createCaller(context)
const entitlements = adminEntitlementsRouter.createCaller(context)
const apiKeys = apiKeysRouter.createCaller(context)
const reports = listingReportsRouter.createCaller(context)
const pcReports = pcListingReportsRouter.createCaller(context)
const votes = voteInvestigationRouter.createCaller(context)
const fractionalLimits = [
  { name: 'brands', run: (limit: number) => brands.get({ limit }) },
  { name: 'emulators', run: (limit: number) => emulators.get({ limit }) },
  { name: 'admin emulators', run: (limit: number) => emulators.getForAdmin({ limit }) },
  { name: 'devices', run: (limit: number) => devices.get({ limit }) },
  { name: 'SoCs', run: (limit: number) => socs.get({ limit }) },
  { name: 'badges', run: (limit: number) => badges.get({ limit }) },
  { name: 'notifications', run: (limit: number) => notifications.get({ limit }) },
  { name: 'user bans', run: (limit: number) => bans.get({ limit }) },
  { name: 'verifications', run: (limit: number) => verifications.getMyVerifications({ limit }) },
  {
    name: 'verified developers',
    run: (limit: number) => developers.getVerifiedDevelopers({ limit }),
  },
  { name: 'pending games', run: (limit: number) => games.getPendingGames({ limit }) },
  { name: 'pending handheld reports', run: (limit: number) => handheld.getPending({ limit }) },
  { name: 'pending PC reports', run: (limit: number) => pc.getPending({ limit }) },
  { name: 'processed handheld reports', run: (limit: number) => handheld.getProcessed({ limit }) },
  { name: 'processed PC reports', run: (limit: number) => pc.getProcessed({ limit }) },
  {
    name: 'recent users',
    run: (limit: number) => activity.recentUsers({ timeRange: '24h', limit }),
  },
  {
    name: 'recent compatibility reports',
    run: (limit: number) => activity.recentListings({ timeRange: '24h', limit }),
  },
  {
    name: 'recent comments',
    run: (limit: number) => activity.recentComments({ timeRange: '24h', limit }),
  },
  {
    name: 'recent reports',
    run: (limit: number) => activity.recentReports({ timeRange: '24h', limit }),
  },
  { name: 'recent bans', run: (limit: number) => activity.recentBans({ timeRange: '24h', limit }) },
]
const pages = [
  { name: 'emulators', run: (page: number, limit: number) => emulators.get({ page, limit }) },
  {
    name: 'admin emulators',
    run: (page: number, limit: number) => emulators.getForAdmin({ page, limit }),
  },
  { name: 'devices', run: (page: number, limit: number) => devices.get({ page, limit }) },
  { name: 'SoCs', run: (page: number, limit: number) => socs.get({ page, limit }) },
  { name: 'badges', run: (page: number, limit: number) => badges.get({ page, limit }) },
  {
    name: 'notifications',
    run: (page: number, limit: number) => notifications.get({ page, limit }),
  },
  { name: 'user bans', run: (page: number, limit: number) => bans.get({ page, limit }) },
  {
    name: 'verifications',
    run: (page: number, limit: number) => verifications.getMyVerifications({ page, limit }),
  },
  {
    name: 'verified developers',
    run: (page: number, limit: number) => developers.getVerifiedDevelopers({ page, limit }),
  },
  {
    name: 'pending games',
    run: (page: number, limit: number) => games.getPendingGames({ page, limit }),
  },
  {
    name: 'pending handheld reports',
    run: (page: number, limit: number) => handheld.getPending({ page, limit }),
  },
  {
    name: 'pending PC reports',
    run: (page: number, limit: number) => pc.getPending({ page, limit }),
  },
  {
    name: 'processed handheld reports',
    run: (page: number, limit: number) => handheld.getProcessed({ page, limit }),
  },
  {
    name: 'processed PC reports',
    run: (page: number, limit: number) => pc.getProcessed({ page, limit }),
  },
  { name: 'audit logs', run: (page: number, limit: number) => audits.get({ page, limit }) },
  { name: 'permissions', run: (page: number, limit: number) => permissions.get({ page, limit }) },
  {
    name: 'permission logs',
    run: (page: number, limit: number) => permissionLogs.get({ page, limit }),
  },
  { name: 'trust logs', run: (page: number, limit: number) => trust.getTrustLogs({ page, limit }) },
  {
    name: 'entitlements',
    run: (page: number, limit: number) => entitlements.list({ page, limit }),
  },
  { name: 'API keys', run: (page: number, limit: number) => apiKeys.adminList({ page, limit }) },
  { name: 'own API keys', run: (page: number, limit: number) => apiKeys.listMine({ page, limit }) },
  {
    name: 'all handheld reports',
    run: (page: number, limit: number) => handheld.get({ page, limit }),
  },
  { name: 'all PC reports', run: (page: number, limit: number) => pc.get({ page, limit }) },
  {
    name: 'handheld reports moderation',
    run: (page: number, limit: number) => reports.get({ page, limit }),
  },
  {
    name: 'PC reports moderation',
    run: (page: number, limit: number) => pcReports.get({ page, limit }),
  },
  {
    name: 'handheld vote investigation',
    run: (page: number, limit: number) =>
      votes.getUserVotes({ userId: id, listingType: 'handheld', page, limit }),
  },
  {
    name: 'PC vote investigation',
    run: (page: number, limit: number) =>
      votes.getUserVotes({ userId: id, listingType: 'pc', page, limit }),
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  for (const model of Object.values(models)) {
    model.findMany.mockResolvedValue([])
    model.count.mockResolvedValue(0)
  }
})

function expectNoDatabaseCalls() {
  expect(transaction).not.toHaveBeenCalled()
  for (const model of Object.values(models)) {
    for (const operation of Object.values(model)) expect(operation).not.toHaveBeenCalled()
  }
}

describe.each(fractionalLimits)('$name limit', (query) => {
  it('rejects fractional take before database access', async () => {
    await expect(query.run(1.5)).rejects.toMatchObject({ code: 'BAD_REQUEST' })
    expectNoDatabaseCalls()
  })
})

describe.each(pages)('$name pagination', (query) => {
  it.each([1.5, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER + 1, -1])(
    'rejects fractional, unsafe or negative effective skip from page %s',
    async (page) => {
      await expect(query.run(page, 20)).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        cause: { issues: expect.arrayContaining([expect.objectContaining({ path: ['page'] })]) },
      })
      expectNoDatabaseCalls()
    },
  )
})

describe('legacy pagination forwarding', () => {
  it.each(['handheld', 'pc'])(
    'rejects the negative direct %s risk-only offset before database access',
    async (variant) => {
      const query = variant === 'handheld' ? handheld.getPending : pc.getPending
      await expect(query({ page: 0, limit: 20, riskFilter: 'risky' })).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        cause: { issues: expect.arrayContaining([expect.objectContaining({ path: ['page'] })]) },
      })
      expectNoDatabaseCalls()
    },
  )

  it.each(['handheld', 'pc'])(
    'preserves normal %s pending page-zero normalization and reverse take',
    async (variant) => {
      const query = variant === 'handheld' ? handheld.getPending : pc.getPending
      const model = variant === 'handheld' ? models.listing : models.pcListing
      await query({ page: 0, limit: 20 })
      expect(model.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      )
      await query({ page: 1, limit: -5 })
      expect(model.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({ skip: -0, take: -5 }),
      )
    },
  )

  it('preserves brand defaults, large safe values and reverse take', async () => {
    await brands.get()
    expect(models.deviceBrand.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ take: 50 }),
    )
    await brands.get({ limit: 2_147_483_648 })
    expect(models.deviceBrand.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ take: 2_147_483_648 }),
    )
    await brands.get({ limit: -5 })
    expect(models.deviceBrand.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ take: -5 }),
    )
  })

  it('preserves effective offset precedence and page-zero normalization for emulators', async () => {
    await emulators.get({ offset: 7, page: 2, limit: 5 })
    expect(models.emulator.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ skip: 5, take: 5 }),
    )
    await emulators.get({ offset: 7, page: 0, limit: 5 })
    expect(models.emulator.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ skip: 7, take: 5 }),
    )
    await emulators.get({ offset: -7, page: 2, limit: 5 })
    expect(models.emulator.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ skip: 5, take: 5 }),
    )
    await emulators.get({ offset: 2_147_483_648, limit: 5 })
    expect(models.emulator.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ skip: 2_147_483_648, take: 5 }),
    )
    await emulators.get({ page: 1, limit: -5 })
    expect(models.emulator.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ skip: -0, take: -5 }),
    )
  })

  it.each([1.5, -1, Number.MAX_SAFE_INTEGER + 1])(
    'rejects unrepresentable effective explicit offset %s',
    async (offset) => {
      await expect(emulators.get({ offset })).rejects.toMatchObject({ code: 'BAD_REQUEST' })
      expectNoDatabaseCalls()
    },
  )

  it('preserves pending-games omitted versus object defaults', async () => {
    expect(GetPendingGamesSchema.parse(undefined)).toBeUndefined()
    expect(GetPendingGamesSchema.parse({})).toMatchObject({ limit: 50, offset: 0 })
    await games.getPendingGames()
    expect(models.game.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ take: 20, skip: 0 }),
    )
    await games.getPendingGames({})
    expect(models.game.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ take: 50, skip: 0 }),
    )
  })

  it.each(['handheld', 'pc'])(
    'validates the direct %s processed offset including page zero',
    async (variant) => {
      const query = variant === 'handheld' ? handheld.getProcessed : pc.getProcessed
      await expect(query({ page: 0, limit: 20 })).rejects.toMatchObject({ code: 'BAD_REQUEST' })
      expectNoDatabaseCalls()
      await query({ page: 0, limit: 0 })
      const model = variant === 'handheld' ? models.listing : models.pcListing
      expect(model.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({ skip: -0, take: 0 }),
      )
      expect(
        (variant === 'handheld' ? GetProcessedSchema : GetProcessedPcSchema).parse({}),
      ).toMatchObject({ page: 1, limit: 10 })
    },
  )

  it('retains numeric-string coercion in report moderation inputs', async () => {
    const url = new URL('http://localhost/trpc/get')
    url.searchParams.set('input', JSON.stringify({ json: { page: '2', limit: '5' } }))
    const handheldResponse = await fetchRequestHandler({
      endpoint: '/trpc',
      req: new Request(url),
      router: listingReportsRouter,
      createContext: () => context,
    })
    expect(handheldResponse.status).toBe(200)
    expect(models.listingReport.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ skip: 5, take: 5 }),
    )
    const pcResponse = await fetchRequestHandler({
      endpoint: '/trpc',
      req: new Request(url),
      router: pcListingReportsRouter,
      createContext: () => context,
    })
    expect(pcResponse.status).toBe(200)
    expect(models.pcListingReport.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ skip: 5, take: 5 }),
    )
  })

  it('keeps activity schema composition and the existing limit default', async () => {
    expect(ActivityQuerySchema.pick({ timeRange: true }).parse({ timeRange: '24h' })).toEqual({
      timeRange: '24h',
    })
    await activity.recentUsers({ timeRange: '24h' })
    expect(models.user.findMany).toHaveBeenLastCalledWith(expect.objectContaining({ take: 10 }))
  })
})
