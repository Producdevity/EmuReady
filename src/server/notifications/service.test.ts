import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationType } from '@orm'
import { NOTIFICATION_EVENTS } from './eventEmitter'
import type { NotificationEventData } from './eventEmitter'
import type { NotificationService } from './service'

// ── Mocks ──────────────────────────────────────────────────────────

vi.mock('@orm', async () => {
  const actual = await import('@orm')
  return {
    ...actual,
    Prisma: {
      ...actual.Prisma,
      QueryMode: { insensitive: 'insensitive' },
      SortOrder: { asc: 'asc', desc: 'desc' },
    },
  }
})

const mockPrisma = {
  listing: { findUnique: vi.fn() },
  pcListing: { findUnique: vi.fn() },
  user: { findUnique: vi.fn(), findMany: vi.fn() },
  comment: { findUnique: vi.fn() },
  notification: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
  },
  userBan: { findMany: vi.fn() },
  userRelationship: { findMany: vi.fn() },
  device: { findUnique: vi.fn() },
  soC: { findUnique: vi.fn() },
  emulator: { findUnique: vi.fn() },
  game: { findUnique: vi.fn() },
  gameFollow: { findMany: vi.fn(), count: vi.fn() },
}

vi.mock('@/server/db', () => ({ prisma: mockPrisma }))

vi.mock('@/server/notifications/analyticsService', () => ({
  notificationAnalyticsService: { clearCache: vi.fn() },
}))

vi.mock('@/server/notifications/batchingService', () => ({
  notificationBatchingService: {
    scheduleNotification: mockScheduleNotification,
  },
}))

vi.mock('@/server/notifications/rateLimitService', () => ({
  notificationRateLimitService: {
    checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
    recordNotification: vi.fn(),
  },
}))

vi.mock('@/server/notifications/realtimeService', () => ({
  realtimeNotificationService: {
    sendNotificationToUser: vi.fn().mockReturnValue(true),
    sendUnreadCountToUser: vi.fn(),
  },
}))

vi.mock('@/server/notifications/emailService', () => ({
  createEmailService: vi.fn().mockReturnValue({
    sendNotificationEmail: vi.fn().mockResolvedValue({ success: true }),
  }),
}))

vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn(), error: vi.fn() },
}))

const { mockIterateFollowerUserIds, mockScheduleNotification } = vi.hoisted(() => ({
  mockIterateFollowerUserIds: vi.fn(),
  mockScheduleNotification: vi.fn().mockReturnValue('batch-id-1'),
}))
vi.mock('@/server/repositories/game-follow.repository', () => {
  class MockGameFollowRepository {
    iterateFollowerUserIds = mockIterateFollowerUserIds
  }
  return { GameFollowRepository: MockGameFollowRepository }
})

vi.mock('@/server/repositories/notification-preferences.repository', () => ({
  NotificationPreferencesRepository: vi.fn().mockImplementation(() => ({
    getByType: vi.fn().mockResolvedValue(null),
    getListingPreference: vi.fn().mockResolvedValue(null),
  })),
}))

// ── Helpers ────────────────────────────────────────────────────────

function resetMocks() {
  for (const model of Object.values(mockPrisma)) {
    for (const fn of Object.values(model)) {
      ;(fn as ReturnType<typeof vi.fn>).mockReset()
    }
  }
  mockIterateFollowerUserIds.mockReset()
  mockScheduleNotification.mockClear()
  mockPrisma.userBan.findMany.mockResolvedValue([])
  mockPrisma.userRelationship.findMany.mockResolvedValue([])
  mockPrisma.notification.findFirst.mockResolvedValue(null)
  mockPrisma.notification.count.mockResolvedValue(0)
}

function makeEvent(overrides: Partial<NotificationEventData> = {}): NotificationEventData {
  return {
    eventType: NOTIFICATION_EVENTS.LISTING_APPROVED,
    entityType: 'listing',
    entityId: 'listing-1',
    triggeredBy: 'admin-1',
    payload: { listingId: 'listing-1' },
    ...overrides,
  }
}

function mockGameFollowIterator(userIds: string[]) {
  mockIterateFollowerUserIds.mockImplementation(async function* () {
    yield userIds
  })
}

function getScheduledUserIds(): string[] {
  return mockScheduleNotification.mock.calls.map((call: { userId: string }[]) => call[0].userId)
}

// ── Tests ──────────────────────────────────────────────────────────

describe('NotificationService', () => {
  let service: NotificationService

  beforeEach(async () => {
    resetMocks()
    const { NotificationService } = await import('./service')
    service = new NotificationService()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('getUsersForEvent', () => {
    it('listing.approved returns the listing author', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({
        authorId: 'author-1',
        deviceId: 'device-1',
        device: { socId: null },
      })

      // @ts-expect-error accessing private method for testing
      const users = await service.getUsersForEvent(makeEvent())
      expect(users).toContain('author-1')
    })

    it('pcListing.approved returns the PC listing author', async () => {
      mockPrisma.pcListing.findUnique.mockResolvedValue({ authorId: 'pc-author-1' })

      const event = makeEvent({
        eventType: NOTIFICATION_EVENTS.PC_LISTING_APPROVED,
        entityType: 'pcListing',
        entityId: 'pc-listing-1',
        payload: { pcListingId: 'pc-listing-1' },
      })

      // @ts-expect-error accessing private method for testing
      const users = await service.getUsersForEvent(event)
      expect(users).toContain('pc-author-1')
    })

    it('pcListing.rejected returns the PC listing author', async () => {
      mockPrisma.pcListing.findUnique.mockResolvedValue({ authorId: 'pc-author-1' })

      const event = makeEvent({
        eventType: NOTIFICATION_EVENTS.PC_LISTING_REJECTED,
        entityType: 'pcListing',
        entityId: 'pc-listing-1',
        payload: { pcListingId: 'pc-listing-1' },
      })

      // @ts-expect-error accessing private method for testing
      const users = await service.getUsersForEvent(event)
      expect(users).toContain('pc-author-1')
    })

    it('excludes the actor from recipients', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({
        authorId: 'admin-1',
        deviceId: 'device-1',
        device: { socId: null },
      })

      // @ts-expect-error accessing private method for testing
      const users = await service.getUsersForEvent(makeEvent({ triggeredBy: 'admin-1' }))
      expect(users).not.toContain('admin-1')
    })

    it('filters out banned users', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({
        authorId: 'banned-author',
        deviceId: 'device-1',
        device: { socId: null },
      })
      mockPrisma.userBan.findMany.mockResolvedValue([{ userId: 'banned-author' }])

      // @ts-expect-error accessing private method for testing
      const users = await service.getUsersForEvent(makeEvent())
      expect(users).not.toContain('banned-author')
    })

    it('filters out users who blocked the triggering user', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({
        authorId: 'blocker-user',
        deviceId: 'device-1',
        device: { socId: null },
      })
      mockPrisma.userRelationship.findMany.mockResolvedValue([{ senderId: 'blocker-user' }])

      // @ts-expect-error accessing private method for testing
      const users = await service.getUsersForEvent(makeEvent())
      expect(users).not.toContain('blocker-user')
    })

    it('game_follow synthetic events return no direct recipients', async () => {
      for (const eventType of [
        NOTIFICATION_EVENTS.FOLLOWED_GAME_NEW_LISTING,
        NOTIFICATION_EVENTS.FOLLOWED_GAME_NEW_PC_LISTING,
      ]) {
        const event = makeEvent({ eventType, payload: { gameId: 'game-1' } })
        // @ts-expect-error accessing private method for testing
        const users = await service.getUsersForEvent(event)
        expect(users).toEqual([])
      }
    })
  })

  describe('handleNotificationEvent', () => {
    it('listing.approved triggers notifyGameFollowers for handheld', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({
        authorId: 'author-1',
        deviceId: 'device-1',
        device: { socId: null },
        game: { id: 'game-1', title: 'Test Game' },
        emulator: { name: 'Emu', id: 'emu-1' },
      })
      mockPrisma.user.findUnique.mockResolvedValue({ name: 'Admin' })
      mockPrisma.user.findMany.mockResolvedValue([])
      mockPrisma.device.findUnique.mockResolvedValue(null)
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' })
      mockPrisma.notification.findUnique.mockResolvedValue({ id: 'notif-1' })

      const spy = vi.spyOn(service as never, 'notifyGameFollowers').mockResolvedValue(undefined)

      // @ts-expect-error accessing private method for testing
      await service.handleNotificationEvent(makeEvent())

      expect(spy).toHaveBeenCalledWith(makeEvent(), ['author-1'], 'listing')
    })

    it('pcListing.approved triggers notifyGameFollowers for pcListing', async () => {
      mockPrisma.pcListing.findUnique.mockResolvedValue({
        authorId: 'pc-author-1',
        game: { id: 'game-1', title: 'PC Game' },
      })
      mockPrisma.user.findUnique.mockResolvedValue({ name: 'Admin' })
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-2' })
      mockPrisma.notification.findUnique.mockResolvedValue({ id: 'notif-2' })

      const spy = vi.spyOn(service as never, 'notifyGameFollowers').mockResolvedValue(undefined)

      const event = makeEvent({
        eventType: NOTIFICATION_EVENTS.PC_LISTING_APPROVED,
        entityType: 'pcListing',
        entityId: 'pc-listing-1',
        payload: { pcListingId: 'pc-listing-1' },
      })

      // @ts-expect-error accessing private method for testing
      await service.handleNotificationEvent(event)

      expect(spy).toHaveBeenCalledWith(event, ['pc-author-1'], 'pcListing')
    })

    it('listing.approved triggers notifyMatchingHardwareUsers', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({
        authorId: 'author-1',
        deviceId: 'device-1',
        device: { socId: 'soc-1' },
        game: { id: 'game-1', title: 'Test' },
        emulator: { name: 'Emu', id: 'emu-1' },
      })
      mockPrisma.user.findUnique.mockResolvedValue({ name: 'Admin' })
      mockPrisma.user.findMany.mockResolvedValue([])
      mockPrisma.device.findUnique.mockResolvedValue(null)
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' })
      mockPrisma.notification.findUnique.mockResolvedValue({ id: 'notif-1' })

      vi.spyOn(service as never, 'notifyGameFollowers').mockResolvedValue(undefined)
      const spy = vi.spyOn(service as never, 'notifyMatchingHardwareUsers')

      // @ts-expect-error accessing private method for testing
      await service.handleNotificationEvent(makeEvent())

      expect(spy).toHaveBeenCalledWith(makeEvent(), ['author-1'])
    })

    it('pcListing.approved does NOT trigger notifyMatchingHardwareUsers', async () => {
      mockPrisma.pcListing.findUnique.mockResolvedValue({
        authorId: 'pc-author-1',
        game: { id: 'game-1', title: 'PC Game' },
      })
      mockPrisma.user.findUnique.mockResolvedValue({ name: 'Admin' })
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-2' })
      mockPrisma.notification.findUnique.mockResolvedValue({ id: 'notif-2' })

      vi.spyOn(service as never, 'notifyGameFollowers').mockResolvedValue(undefined)
      const spy = vi.spyOn(service as never, 'notifyMatchingHardwareUsers')

      const event = makeEvent({
        eventType: NOTIFICATION_EVENTS.PC_LISTING_APPROVED,
        entityType: 'pcListing',
        entityId: 'pc-listing-1',
        payload: { pcListingId: 'pc-listing-1' },
      })

      // @ts-expect-error accessing private method for testing
      await service.handleNotificationEvent(event)

      expect(spy).not.toHaveBeenCalled()
    })

    it('does not crash on unknown event types', async () => {
      await expect(
        // @ts-expect-error accessing private method for testing
        service.handleNotificationEvent(makeEvent({ eventType: 'unknown.event', payload: {} })),
      ).resolves.not.toThrow()
    })
  })

  describe('notifyGameFollowers', () => {
    it('creates notifications for game followers (handheld)', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({
        game: { id: 'game-1', title: 'Zelda' },
      })
      mockGameFollowIterator(['follower-1', 'follower-2'])
      mockPrisma.user.findUnique.mockResolvedValue({ name: 'Admin' })
      mockPrisma.game.findUnique.mockResolvedValue({ id: 'game-1', title: 'Zelda' })
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' })
      mockPrisma.notification.findUnique.mockResolvedValue({ id: 'notif-1' })

      // @ts-expect-error accessing private method for testing
      await service.notifyGameFollowers(
        makeEvent({ payload: { listingId: 'listing-1' } }),
        ['author-1'],
        'listing',
      )

      const ids = getScheduledUserIds()
      expect(ids).toContain('follower-1')
      expect(ids).toContain('follower-2')
    })

    it('creates notifications for game followers (PC listing)', async () => {
      mockPrisma.pcListing.findUnique.mockResolvedValue({
        game: { id: 'game-2', title: 'Elden Ring' },
      })
      mockGameFollowIterator(['pc-follower-1'])
      mockPrisma.user.findUnique.mockResolvedValue({ name: 'Admin' })
      mockPrisma.game.findUnique.mockResolvedValue({ id: 'game-2', title: 'Elden Ring' })
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' })
      mockPrisma.notification.findUnique.mockResolvedValue({ id: 'notif-1' })

      const event = makeEvent({
        eventType: NOTIFICATION_EVENTS.PC_LISTING_APPROVED,
        entityType: 'pcListing',
        entityId: 'pc-listing-1',
        payload: { pcListingId: 'pc-listing-1' },
      })

      // @ts-expect-error accessing private method for testing
      await service.notifyGameFollowers(event, [], 'pcListing')

      const call = mockScheduleNotification.mock.calls[0][0] as {
        userId: string
        type: NotificationType
      }
      expect(call.userId).toBe('pc-follower-1')
      expect(call.type).toBe(NotificationType.FOLLOWED_GAME_NEW_PC_LISTING)
    })

    it('excludes already-notified users', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({
        game: { id: 'game-1', title: 'Zelda' },
      })
      mockGameFollowIterator(['author-1', 'follower-1'])
      mockPrisma.user.findUnique.mockResolvedValue({ name: 'Admin' })
      mockPrisma.game.findUnique.mockResolvedValue({ id: 'game-1', title: 'Zelda' })
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' })
      mockPrisma.notification.findUnique.mockResolvedValue({ id: 'notif-1' })

      // @ts-expect-error accessing private method for testing
      await service.notifyGameFollowers(
        makeEvent({ payload: { listingId: 'listing-1' } }),
        ['author-1'],
        'listing',
      )

      const ids = getScheduledUserIds()
      expect(ids).not.toContain('author-1')
      expect(ids).toContain('follower-1')
    })

    it('excludes the triggering user', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({
        game: { id: 'game-1', title: 'Zelda' },
      })
      mockGameFollowIterator(['admin-1', 'follower-1'])
      mockPrisma.user.findUnique.mockResolvedValue({ name: 'Admin' })
      mockPrisma.game.findUnique.mockResolvedValue({ id: 'game-1', title: 'Zelda' })
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' })
      mockPrisma.notification.findUnique.mockResolvedValue({ id: 'notif-1' })

      // @ts-expect-error accessing private method for testing
      await service.notifyGameFollowers(
        makeEvent({ triggeredBy: 'admin-1', payload: { listingId: 'listing-1' } }),
        [],
        'listing',
      )

      const ids = getScheduledUserIds()
      expect(ids).not.toContain('admin-1')
      expect(ids).toContain('follower-1')
    })

    it('filters out banned followers', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({
        game: { id: 'game-1', title: 'Zelda' },
      })
      mockGameFollowIterator(['banned-user', 'clean-user'])
      mockPrisma.userBan.findMany.mockResolvedValue([{ userId: 'banned-user' }])
      mockPrisma.user.findUnique.mockResolvedValue({ name: 'Admin' })
      mockPrisma.game.findUnique.mockResolvedValue({ id: 'game-1', title: 'Zelda' })
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' })
      mockPrisma.notification.findUnique.mockResolvedValue({ id: 'notif-1' })

      // @ts-expect-error accessing private method for testing
      await service.notifyGameFollowers(
        makeEvent({ payload: { listingId: 'listing-1' } }),
        [],
        'listing',
      )

      const ids = getScheduledUserIds()
      expect(ids).not.toContain('banned-user')
      expect(ids).toContain('clean-user')
    })

    it('skips when no game found for listing', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(null)

      // @ts-expect-error accessing private method for testing
      await service.notifyGameFollowers(
        makeEvent({ payload: { listingId: 'non-existent' } }),
        [],
        'listing',
      )

      expect(mockPrisma.notification.create).not.toHaveBeenCalled()
    })
  })

  describe('mapEventToNotificationType', () => {
    const mappings: [string, NotificationType][] = [
      ['listing.approved', NotificationType.LISTING_APPROVED],
      ['pcListing.approved', NotificationType.LISTING_APPROVED],
      ['listing.rejected', NotificationType.LISTING_REJECTED],
      ['pcListing.rejected', NotificationType.LISTING_REJECTED],
      ['game_follow.new_listing', NotificationType.FOLLOWED_GAME_NEW_LISTING],
      ['game_follow.new_pc_listing', NotificationType.FOLLOWED_GAME_NEW_PC_LISTING],
      ['listing.commented', NotificationType.COMMENT_ON_LISTING],
    ]

    it.each(mappings)('%s maps to correct NotificationType', (eventType, expectedType) => {
      // @ts-expect-error accessing private method for testing
      const result = service.mapEventToNotificationType(eventType)
      expect(result).toBe(expectedType)
    })

    it('returns null for unknown event types', () => {
      // @ts-expect-error accessing private method for testing
      expect(service.mapEventToNotificationType('unknown.event')).toBeNull()
    })
  })

  describe('enrichContextWithData', () => {
    it('enriches PC listing data when pcListingId is present', async () => {
      mockPrisma.pcListing.findUnique.mockResolvedValue({
        game: { id: 'game-1', title: 'PC Game Title' },
      })
      mockPrisma.user.findUnique.mockResolvedValue({ name: 'Admin' })

      // @ts-expect-error accessing private method for testing
      const context = await service.enrichContextWithData(
        makeEvent({
          eventType: NOTIFICATION_EVENTS.PC_LISTING_APPROVED,
          payload: { pcListingId: 'pc-listing-1' },
        }),
        NotificationType.LISTING_APPROVED,
      )

      expect(context.pcListingId).toBe('pc-listing-1')
      expect(context.listingTitle).toBe('PC Game Title')
      expect(context.gameTitle).toBe('PC Game Title')
      expect(context.gameId).toBe('game-1')
    })

    it('enriches handheld listing data when listingId is present', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({
        id: 'listing-1',
        game: { title: 'Zelda', id: 'game-1' },
        device: { modelName: 'RP4', id: 'dev-1', brand: { name: 'Retroid' } },
        emulator: { name: 'AetherSX2', id: 'emu-1' },
      })
      mockPrisma.user.findUnique.mockResolvedValue({ name: 'Admin' })

      // @ts-expect-error accessing private method for testing
      const context = await service.enrichContextWithData(
        makeEvent({ payload: { listingId: 'listing-1' } }),
        NotificationType.LISTING_APPROVED,
      )

      expect(context.listingId).toBe('listing-1')
      expect(context.listingTitle).toBe('Zelda')
      expect(context.deviceName).toBe('Retroid RP4')
      expect(context.emulatorName).toBe('AetherSX2')
    })
  })

  describe('notification template integration', () => {
    it('LISTING_APPROVED uses /pc-listings/ URL for PC listings', async () => {
      const { notificationTemplateEngine } = await import('./templates')
      const template = notificationTemplateEngine.generateTemplate(
        NotificationType.LISTING_APPROVED,
        { pcListingId: 'pc-123', listingTitle: 'Elden Ring' },
      )
      expect(template.actionUrl).toBe('/pc-listings/pc-123')
      expect(template.message).toContain('Elden Ring')
    })

    it('LISTING_APPROVED uses /listings/ URL for handheld listings', async () => {
      const { notificationTemplateEngine } = await import('./templates')
      const template = notificationTemplateEngine.generateTemplate(
        NotificationType.LISTING_APPROVED,
        { listingId: 'listing-456', listingTitle: 'Zelda' },
      )
      expect(template.actionUrl).toBe('/listings/listing-456')
    })

    it('FOLLOWED_GAME_NEW_PC_LISTING links to /pc-listings/', async () => {
      const { notificationTemplateEngine } = await import('./templates')
      const template = notificationTemplateEngine.generateTemplate(
        NotificationType.FOLLOWED_GAME_NEW_PC_LISTING,
        { pcListingId: 'pc-789', gameTitle: 'Cyberpunk' },
      )
      expect(template.actionUrl).toBe('/pc-listings/pc-789')
      expect(template.message).toContain('Cyberpunk')
    })

    it('LISTING_REJECTED uses /pc-listings/ URL for PC listings', async () => {
      const { notificationTemplateEngine } = await import('./templates')
      const template = notificationTemplateEngine.generateTemplate(
        NotificationType.LISTING_REJECTED,
        {
          pcListingId: 'pc-456',
          listingTitle: 'Cyberpunk',
          rejectedBy: 'Admin',
          rejectionReason: 'Incomplete',
        },
      )
      expect(template.actionUrl).toBe('/pc-listings/pc-456')
      expect(template.message).toContain('Cyberpunk')
      expect(template.message).toContain('Incomplete')
    })

    it('LISTING_REJECTED uses /listings/ URL for handheld listings', async () => {
      const { notificationTemplateEngine } = await import('./templates')
      const template = notificationTemplateEngine.generateTemplate(
        NotificationType.LISTING_REJECTED,
        { listingId: 'listing-789', listingTitle: 'Zelda' },
      )
      expect(template.actionUrl).toBe('/listings/listing-789')
    })

    it('FOLLOWED_GAME_NEW_LISTING links to /listings/', async () => {
      const { notificationTemplateEngine } = await import('./templates')
      const template = notificationTemplateEngine.generateTemplate(
        NotificationType.FOLLOWED_GAME_NEW_LISTING,
        { listingId: 'listing-101', gameTitle: 'Mario' },
      )
      expect(template.actionUrl).toBe('/listings/listing-101')
      expect(template.message).toContain('Mario')
    })
  })
})
