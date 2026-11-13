import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/server/db'
import { PERMISSIONS } from '@/utils/permission-system'
import { ApprovalStatus, Role, PcOs, TailwindColor } from '@orm'
import { UserRepository } from './user.repository'
import { usersRouter } from './user.router'
import { UserService } from './user.service'

vi.unmock('@/server/api/trpc')
vi.unmock('@/server/api/root')

const database = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  listing: { findMany: vi.fn(), count: vi.fn(), groupBy: vi.fn() },
  pcListing: { findMany: vi.fn(), count: vi.fn(), groupBy: vi.fn() },
  vote: { findMany: vi.fn(), count: vi.fn(), groupBy: vi.fn() },
  pcListingVote: { groupBy: vi.fn() },
  trustActionLog: { findMany: vi.fn(), count: vi.fn() },
  game: { groupBy: vi.fn() },
  verifiedDeveloper: { findUnique: vi.fn() },
  $queryRawTyped: vi.fn(),
}))
const effects = vi.hoisted(() => ({
  invalidate: vi.fn(),
  updateRole: vi.fn(),
  updateClerk: vi.fn(),
  notify: vi.fn(),
}))
vi.mock('@/server/db', () => ({ prisma: database }))
vi.mock('@/server/cache/invalidation', () => ({ invalidateUser: effects.invalidate }))
vi.mock('@/server/utils/roleSync', () => ({ updateUserRole: effects.updateRole }))
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  clerkClient: async () => ({ users: { updateUser: effects.updateClerk } }),
}))
vi.mock('@/server/notifications/eventEmitter', () => ({
  NOTIFICATION_EVENTS: { USER_ROLE_CHANGED: 'user.role.changed' },
  notificationEventEmitter: { emitNotificationEvent: effects.notify },
}))

const userId = '00000000-0000-4000-a000-000000000001'
const targetId = '00000000-0000-4000-a000-000000000002'
const createdAt = new Date('2026-11-01T12:00:00.000Z')
const profile = {
  id: targetId,
  name: 'Contributor',
  profileImage: null,
  bio: null,
  role: Role.USER,
  trustScore: 10,
  createdAt,
  userBadges: [
    {
      id: targetId,
      assignedAt: createdAt,
      color: TailwindColor.blue,
      badge: { id: targetId, name: 'Contributor', description: null, color: '#3B82F6', icon: null },
    },
  ],
  _count: { listings: 1, pcListings: 1, submittedGames: 0, votes: 1, followers: 0, following: 0 },
}
const device = { id: targetId, modelName: 'Odin 2', brand: { id: targetId, name: 'AYN' } }
const report = {
  id: targetId,
  createdAt,
  status: ApprovalStatus.APPROVED,
  successRate: 100,
  game: {
    title: 'Mario Kart World',
    system: { id: targetId, name: 'Nintendo Switch 2', key: 'nintendo_switch_2' },
  },
  emulator: { name: 'NX' },
  performance: { label: 'Perfect', rank: 1, description: null },
  _count: { votes: 1 },
}

function caller(
  options: { userId?: string; role?: Role; permissions?: string[]; anonymous?: boolean } = {},
) {
  return usersRouter.createCaller({
    prisma,
    headers: new Headers(),
    session: options.anonymous
      ? null
      : {
          user: {
            id: options.userId ?? userId,
            name: null,
            email: null,
            role: options.role ?? Role.USER,
            permissions: options.permissions ?? [],
            showNsfw: false,
          },
        },
  })
}

function accessRecord(
  settings: { profilePublic?: boolean; showVotingActivity?: boolean } = {},
  banned = false,
) {
  return {
    id: targetId,
    userBans: banned ? [{ id: targetId }] : [],
    settings: {
      profilePublic: true,
      showVotingActivity: true,
      allowFollows: true,
      allowFriendRequests: true,
      followersVisible: true,
      followingVisible: true,
      ...settings,
    },
  }
}

function preparePublicProfile(
  settings: { profilePublic?: boolean; showVotingActivity?: boolean } = {},
) {
  database.user.findUnique
    .mockResolvedValueOnce(accessRecord(settings))
    .mockResolvedValueOnce(profile)
}

beforeEach(() => {
  vi.resetAllMocks()
  database.listing.findMany.mockResolvedValue([])
  database.pcListing.findMany.mockResolvedValue([])
  database.vote.findMany.mockResolvedValue([])
  database.trustActionLog.findMany.mockResolvedValue([])
  database.user.findMany.mockResolvedValue([])
  database.listing.count.mockResolvedValue(0)
  database.pcListing.count.mockResolvedValue(0)
  database.vote.count.mockResolvedValue(0)
  database.trustActionLog.count.mockResolvedValue(0)
  database.user.count.mockResolvedValue(1)
  database.listing.groupBy.mockResolvedValue([])
  database.pcListing.groupBy.mockResolvedValue([])
  database.game.groupBy.mockResolvedValue([])
  database.vote.groupBy.mockResolvedValue([])
  database.pcListingVote.groupBy.mockResolvedValue([])
  database.$queryRawTyped.mockResolvedValue([])
})

describe('user profile transport', () => {
  it('evaluates active-ban expiry against the time of each profile read', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    try {
      const repository = new UserRepository(prisma)
      for (const time of ['2026-11-01T12:00:00.000Z', '2026-11-02T12:00:00.000Z']) {
        const now = new Date(time)
        vi.setSystemTime(now)
        await repository.profileAccessRecord(targetId)
        await repository.publicProfile(targetId, true)
        for (const call of database.user.findUnique.mock.calls.slice(-2)) {
          expect(call[0]).toMatchObject({
            select: {
              userBans: {
                where: { isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
              },
            },
          })
        }
      }
    } finally {
      vi.useRealTimers()
    }
  })

  it('returns the existing session contract without internal settings', async () => {
    await expect(caller({ anonymous: true }).me()).resolves.toBeNull()
    const result = await caller().me()
    expect(result).toEqual({
      id: userId,
      name: null,
      email: null,
      role: Role.USER,
      permissions: [],
    })
    expect(database.user.findUnique).not.toHaveBeenCalled()
  })

  it('reads only consumed owner-profile fields using the authenticated ID', async () => {
    database.user.findUnique.mockResolvedValue({
      ...profile,
      id: userId,
      email: 'owner@example.com',
    })
    const result = await caller().getProfile()
    expect(result._count).toEqual({ listings: 1 })
    expect(result).not.toHaveProperty('userBadges')
    expect(database.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: userId },
        select: expect.not.objectContaining({
          listings: expect.anything(),
          votes: expect.anything(),
          submittedGames: expect.anything(),
        }),
      }),
    )
  })

  it('returns a limited private profile without querying activity', async () => {
    preparePublicProfile({ profilePublic: false })
    const result = await caller().getUserById({ userId: targetId })
    expect(result.limitedProfile).toBe(true)
    expect(result.listings.items).toEqual([])
    expect(result.pcListings.items).toEqual([])
    expect(database.listing.findMany).not.toHaveBeenCalled()
    expect(database.vote.findMany).not.toHaveBeenCalled()
    expect(database.trustActionLog.findMany).not.toHaveBeenCalled()
    expect(database.$queryRawTyped).not.toHaveBeenCalled()
  })

  it.each([Role.USER, Role.MODERATOR])('preserves report visibility for %s', async (role) => {
    preparePublicProfile()
    await caller({ role }).getUserById({
      userId: targetId,
      listingsPage: 2,
      listingsSearch: 'Mario',
      pcListingsPage: 3,
    })
    expect(database.listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          authorId: targetId,
          status: role === Role.USER ? ApprovalStatus.APPROVED : undefined,
          game: { isErotic: false },
        }),
        skip: 12,
        take: 12,
      }),
    )
    expect(database.pcListing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          authorId: targetId,
          status: role === Role.USER ? ApprovalStatus.APPROVED : undefined,
        }),
        skip: 24,
        take: 12,
      }),
    )
  })

  it('allows owners to view private profiles and approved or pending reports', async () => {
    preparePublicProfile({ profilePublic: false })
    await caller({ userId: targetId }).getUserById({ userId: targetId })
    expect(database.listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: [ApprovalStatus.APPROVED, ApprovalStatus.PENDING] },
        }),
      }),
    )
  })

  it.each([true, false])(
    'hides cast votes while preserving received report feedback (anonymous: %s)',
    async (anonymous) => {
      preparePublicProfile({ showVotingActivity: false })
      database.vote.groupBy.mockResolvedValue([{ value: true, _count: { _all: 2 } }])
      database.pcListingVote.groupBy.mockResolvedValue([{ value: false, _count: { _all: 1 } }])
      const result = await caller({ anonymous }).getUserById({ userId: targetId })
      expect(result.votes.items).toEqual([])
      expect(result.voteSummary).toEqual({ total: 3, upvotes: 2, downvotes: 1 })
      expect(result._count.votes).toBe(0)
      expect(database.vote.findMany).not.toHaveBeenCalled()
      expect(database.vote.groupBy).toHaveBeenCalledWith({
        by: ['value'],
        where: { listing: { authorId: targetId } },
        _count: { _all: true },
      })
      expect(database.pcListingVote.groupBy).toHaveBeenCalledWith({
        by: ['value'],
        where: { pcListing: { authorId: targetId } },
        _count: { _all: true },
      })
    },
  )

  it.each([
    { userId: targetId, role: Role.USER },
    { userId, role: Role.MODERATOR },
  ])('retains voting summaries for an authorized viewer ($role)', async (viewer) => {
    preparePublicProfile({ showVotingActivity: false })
    database.vote.groupBy.mockResolvedValue([{ value: true, _count: { _all: 2 } }])
    database.pcListingVote.groupBy.mockResolvedValue([{ value: false, _count: { _all: 1 } }])
    const result = await caller(viewer).getUserById({ userId: targetId })
    expect(result.voteSummary).toEqual({ total: 3, upvotes: 2, downvotes: 1 })
    expect(result._count.votes).toBe(1)
    expect(database.vote.findMany).toHaveBeenCalled()
  })

  it('validates handheld and PC profile DTOs through the actual router', async () => {
    preparePublicProfile()
    database.listing.findMany.mockResolvedValue([{ ...report, device }])
    database.pcListing.findMany.mockResolvedValue([
      {
        ...report,
        cpu: { modelName: 'Ryzen 7', brand: { name: 'AMD' } },
        gpu: null,
        memorySize: 32,
        os: PcOs.LINUX,
        osVersion: '6.12',
      },
    ])
    database.vote.findMany.mockResolvedValue([
      { id: targetId, createdAt, value: true, listing: { ...report, device } },
    ])
    const result = await caller().getUserById({ userId: targetId })
    expect(result.listings.items[0]?.game.title).toBe('Mario Kart World')
    expect(result.pcListings.items[0]?.gpu).toBeNull()
    expect(result.votes.items[0]?.listing.device.modelName).toBe('Odin 2')
    expect(result).not.toHaveProperty('email')
  })

  it('rejects banned profiles before reading public or private content', async () => {
    database.user.findUnique.mockResolvedValueOnce(accessRecord({}, true))
    await expect(caller().getUserById({ userId: targetId })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
    expect(database.user.findUnique).toHaveBeenCalledTimes(1)
    expect(database.listing.findMany).not.toHaveBeenCalled()
  })

  it('keeps the contributor summary available when no contributors are returned', async () => {
    await expect(caller({ anonymous: true }).topContributorsSummary({ limit: 3 })).resolves.toEqual(
      { allTime: [], thisMonth: [], thisWeek: [] },
    )
    expect(database.$queryRawTyped).toHaveBeenCalledTimes(3)
  })
})

describe('user administration and edits', () => {
  it('validates admin list, search, and statistics responses', async () => {
    const admin = caller({ permissions: [PERMISSIONS.VIEW_USER_BANS, PERMISSIONS.VIEW_STATISTICS] })
    database.user.findMany.mockResolvedValue([
      { ...profile, email: 'contributor@example.com', _count: { ...profile._count, comments: 2 } },
    ])
    const list = await admin.get({
      page: 2,
      limit: 10,
      search: 'Contributor',
      sortField: 'name',
      sortDirection: 'asc',
    })
    expect(list.users[0]?.name).toBe('Contributor')
    expect(list.users[0]).not.toHaveProperty('bio')
    expect(database.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
        orderBy: expect.arrayContaining([{ name: 'asc' }]),
      }),
    )
    const search = await admin.searchUsers({ minRole: Role.MODERATOR })
    expect(search[0]?.id).toBe(targetId)
    expect(database.user.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: { in: [Role.MODERATOR, Role.ADMIN, Role.SUPER_ADMIN] },
        }),
      }),
    )
    await expect(admin.stats()).resolves.toMatchObject({
      total: 6,
      bannedUsers: 1,
      byRole: { author: 1, superAdmin: 1 },
    })
  })

  it('rejects conflicting emails or usernames before writing or calling Clerk', async () => {
    database.user.findUnique
      .mockResolvedValueOnce({ id: userId, email: 'old@example.com', clerkId: 'user_clerk' })
      .mockResolvedValueOnce({ id: targetId })
    await expect(caller().update({ email: 'existing@example.com' })).rejects.toMatchObject({
      code: 'CONFLICT',
    })
    database.user.findUnique.mockResolvedValue({
      id: userId,
      email: 'owner@example.com',
      clerkId: 'user_clerk',
    })
    database.user.findFirst.mockResolvedValue({ id: targetId })
    await expect(caller().update({ name: 'Existing' })).rejects.toMatchObject({ code: 'CONFLICT' })
    expect(database.user.update).not.toHaveBeenCalled()
    expect(effects.updateClerk).not.toHaveBeenCalled()
  })

  it('translates a profile disappearing during a write into a not-found response', async () => {
    database.user.findUnique.mockResolvedValue({
      id: userId,
      email: 'owner@example.com',
      clerkId: 'user_clerk',
    })
    database.user.update.mockRejectedValue(Object.assign(new Error('Not found'), { code: 'P2025' }))
    await expect(caller().update({ bio: '' })).rejects.toMatchObject({ code: 'NOT_FOUND' })
    expect(effects.invalidate).not.toHaveBeenCalled()
  })

  it('does not announce role changes when synchronization fails', async () => {
    database.user.findUnique.mockResolvedValue({ id: targetId, role: Role.USER })
    effects.updateRole.mockRejectedValue(new Error('Role synchronization failed'))
    await expect(
      caller({ permissions: [PERMISSIONS.CHANGE_USER_ROLES] }).updateRole({
        userId: targetId,
        role: Role.AUTHOR,
      }),
    ).rejects.toThrow('Role synchronization failed')
    expect(effects.notify).not.toHaveBeenCalled()
    expect(effects.invalidate).not.toHaveBeenCalled()
  })

  it('returns a success receipt for authorized deletion of another user', async () => {
    database.user.delete.mockResolvedValue({ id: targetId })
    await expect(
      caller({ permissions: [PERMISSIONS.MANAGE_USERS] }).delete({ userId: targetId }),
    ).resolves.toEqual({ success: true })
    expect(database.user.delete).toHaveBeenCalledWith({
      where: { id: targetId },
      select: { id: true },
    })
  })

  it('enforces permissions again when a service is called without its transport', () => {
    const service = new UserService(new UserRepository(prisma))
    expect(() => service.statistics({ type: 'anonymous' })).toThrow()
    expect(() =>
      service.search(
        { type: 'user', userId, role: Role.ADMIN, permissions: [], showNsfw: false },
        { limit: 20 },
      ),
    ).toThrow()
    expect(database.user.count).not.toHaveBeenCalled()
    expect(database.user.findMany).not.toHaveBeenCalled()
  })

  it('blocks unauthorized admin routes before querying users', async () => {
    await expect(caller().get()).rejects.toMatchObject({ code: 'FORBIDDEN' })
    await expect(caller().delete({ userId: targetId })).rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(database.user.findMany).not.toHaveBeenCalled()
    expect(database.user.delete).not.toHaveBeenCalled()
  })

  it('prevents self-deletion and self-demotion', async () => {
    const admin = caller({
      role: Role.ADMIN,
      permissions: [PERMISSIONS.MANAGE_USERS, PERMISSIONS.CHANGE_USER_ROLES],
    })
    await expect(admin.delete({ userId })).rejects.toThrow('cannot delete your own')
    database.user.findUnique.mockResolvedValue({ id: userId, role: Role.ADMIN })
    await expect(admin.updateRole({ userId, role: Role.USER })).rejects.toThrow(
      'cannot demote yourself',
    )
    expect(effects.updateRole).not.toHaveBeenCalled()
    expect(database.user.delete).not.toHaveBeenCalled()
  })

  it.each([Role.USER, Role.SUPER_ADMIN])(
    'requires the dedicated capability to modify or assign super admin (%s)',
    async (role) => {
      database.user.findUnique.mockResolvedValue({ id: targetId, role })
      await expect(
        caller({ permissions: [PERMISSIONS.CHANGE_USER_ROLES] }).updateRole({
          userId: targetId,
          role: Role.SUPER_ADMIN,
        }),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
      expect(effects.updateRole).not.toHaveBeenCalled()
    },
  )

  it('syncs an allowed role change, emits its notification, and returns a receipt', async () => {
    database.user.findUnique.mockResolvedValue({ id: targetId, role: Role.USER })
    const result = await caller({ permissions: [PERMISSIONS.CHANGE_USER_ROLES] }).updateRole({
      userId: targetId,
      role: Role.AUTHOR,
    })
    expect(result).toEqual({ success: true })
    expect(effects.updateRole).toHaveBeenCalledWith(targetId, Role.AUTHOR)
    expect(effects.notify).toHaveBeenCalledWith(
      expect.objectContaining({ triggeredBy: userId, entityId: targetId }),
    )
    expect(effects.invalidate).toHaveBeenCalledWith(targetId)
    expect(database.user.findUnique).toHaveBeenCalledTimes(1)
  })

  it('writes profile changes only to the current user and clears the bio', async () => {
    database.user.findUnique.mockResolvedValue({
      id: userId,
      email: 'owner@example.com',
      clerkId: 'user_clerk',
    })
    database.user.findFirst.mockResolvedValue(null)
    database.user.update.mockResolvedValue({ id: userId })
    const input = { name: 'New Name', bio: '', userId: targetId }
    await expect(caller().update(input)).resolves.toEqual({ success: true })
    expect(database.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: userId },
        data: expect.objectContaining({ name: 'New Name', bio: null }),
      }),
    )
    expect(effects.updateClerk).toHaveBeenCalledWith('user_clerk', { username: 'New Name' })
  })

  it('keeps profile writes available if Clerk username synchronization fails', async () => {
    database.user.findUnique.mockResolvedValue({
      id: userId,
      email: 'owner@example.com',
      clerkId: 'user_clerk',
    })
    database.user.findFirst.mockResolvedValue(null)
    database.user.update.mockResolvedValue({ id: userId })
    effects.updateClerk.mockRejectedValue(new Error('Clerk unavailable'))
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await expect(caller().update({ name: 'New Name' })).resolves.toEqual({ success: true })
    expect(database.user.update).toHaveBeenCalledTimes(1)
    log.mockRestore()
  })

  it('checks verified-developer membership for the authenticated user', async () => {
    database.verifiedDeveloper.findUnique.mockResolvedValue({ id: targetId })
    await expect(caller().isVerifiedDeveloper({ emulatorId: targetId })).resolves.toBe(true)
    expect(database.verifiedDeveloper.findUnique).toHaveBeenCalledWith({
      where: { userId_emulatorId: { userId, emulatorId: targetId } },
      select: { id: true },
    })
  })
})
