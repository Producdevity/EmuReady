import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DeliveryChannel, NotificationCategory, NotificationType } from '@orm'
import { NOTIFICATION_EVENTS } from './eventEmitter'
import type { NotificationEventData } from './eventEmitter'
import type { NotificationService } from './service'
import type { NotificationData } from './types'

interface NotificationContext {
  pcListingId?: string
  listingId?: string
  listingTitle?: string
  gameTitle?: string
  gameId?: string
  deviceName?: string
  emulatorName?: string
}

interface NotificationServiceInternals {
  getUsersForEvent(eventData: NotificationEventData): Promise<string[]>
  handleNotificationEvent(eventData: NotificationEventData): Promise<void>
  notifyMatchingHardwareUsers(
    eventData: NotificationEventData,
    alreadyNotifiedIds: string[],
  ): Promise<void>
  notifyGameFollowers(
    eventData: NotificationEventData,
    alreadyNotifiedIds: string[],
    type: 'listing' | 'pcListing',
  ): Promise<void>
  mapEventToNotificationType(eventType: string): NotificationType | null
  enrichContextWithData(
    eventData: NotificationEventData,
    notificationType: NotificationType,
  ): Promise<NotificationContext>
}

interface ListingMockOptions {
  id?: string
  authorId?: string
  deviceId?: string
  gameId?: string
  gameTitle?: string
  deviceModelName?: string
  deviceBrandName?: string
  socId?: string | null
  emulatorId?: string
  emulatorName?: string
}

function getNotificationServiceInternals(
  service: NotificationService,
): NotificationServiceInternals {
  return service as unknown as NotificationServiceInternals
}

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
  mockScheduleNotification: vi
    .fn<(data: NotificationData, scheduledFor?: Date, maxAttempts?: number) => string>()
    .mockReturnValue('batch-id-1'),
}))
vi.mock('@/server/repositories/game-follow.repository', () => {
  class MockGameFollowRepository {
    iterateFollowerUserIds = mockIterateFollowerUserIds
  }
  return { GameFollowRepository: MockGameFollowRepository }
})

vi.mock('@/server/repositories/notification-preferences.repository', () => ({
  NotificationPreferencesRepository: vi
    .fn()
    .mockImplementation(function MockNotificationPreferencesRepository() {
      return {
        getByType: vi.fn().mockResolvedValue(null),
        getListingPreference: vi.fn().mockResolvedValue(null),
      }
    }),
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

function makeListingRecord(options: ListingMockOptions = {}) {
  const id = options.id ?? 'listing-1'
  const deviceId = options.deviceId ?? 'device-1'
  const gameId = options.gameId ?? 'game-1'
  const gameTitle = options.gameTitle ?? 'Test Game'
  const emulatorId = options.emulatorId ?? 'emu-1'
  const emulatorName = options.emulatorName ?? 'Emu'

  return {
    id,
    authorId: options.authorId ?? 'author-1',
    deviceId,
    game: { id: gameId, title: gameTitle },
    device: {
      id: deviceId,
      modelName: options.deviceModelName ?? 'RP4',
      brand: { name: options.deviceBrandName ?? 'Retroid' },
      socId: options.socId ?? null,
    },
    emulator: { id: emulatorId, name: emulatorName },
  }
}

function mockGameFollowIterator(userIds: string[]) {
  mockIterateFollowerUserIds.mockImplementation(async function* () {
    yield userIds
  })
}

function getScheduledUserIds(): string[] {
  return mockScheduleNotification.mock.calls.map((call) => call[0].userId)
}

describe('NotificationService', () => {
  let service: NotificationService
  let serviceInternals: NotificationServiceInternals
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(async () => {
    resetMocks()
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { NotificationService } = await import('./service')
    service = new NotificationService()
    serviceInternals = getNotificationServiceInternals(service)
  })

  afterEach(() => {
    expect(consoleErrorSpy).not.toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
    vi.clearAllMocks()
  })

  describe('getUsersForEvent', () => {
    it('listing.approved returns the listing author', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(makeListingRecord())

      const users = await serviceInternals.getUsersForEvent(makeEvent())
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

      const users = await serviceInternals.getUsersForEvent(event)
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

      const users = await serviceInternals.getUsersForEvent(event)
      expect(users).toContain('pc-author-1')
    })

    it('excludes the actor from recipients', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(makeListingRecord({ authorId: 'admin-1' }))

      const users = await serviceInternals.getUsersForEvent(makeEvent({ triggeredBy: 'admin-1' }))
      expect(users).not.toContain('admin-1')
    })

    it('filters out banned users', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(
        makeListingRecord({ authorId: 'banned-author' }),
      )
      mockPrisma.userBan.findMany.mockResolvedValue([{ userId: 'banned-author' }])

      const users = await serviceInternals.getUsersForEvent(makeEvent())
      expect(users).not.toContain('banned-author')
    })

    it('filters out users who blocked the triggering user', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(
        makeListingRecord({ authorId: 'blocker-user' }),
      )
      mockPrisma.userRelationship.findMany.mockResolvedValue([{ senderId: 'blocker-user' }])

      const users = await serviceInternals.getUsersForEvent(makeEvent())
      expect(users).not.toContain('blocker-user')
    })

    it('game_follow synthetic events return no direct recipients', async () => {
      for (const eventType of [
        NOTIFICATION_EVENTS.FOLLOWED_GAME_NEW_LISTING,
        NOTIFICATION_EVENTS.FOLLOWED_GAME_NEW_PC_LISTING,
      ]) {
        const event = makeEvent({ eventType, payload: { gameId: 'game-1' } })
        const users = await serviceInternals.getUsersForEvent(event)
        expect(users).toEqual([])
      }
    })
  })

  describe('handleNotificationEvent', () => {
    it('listing.approved triggers notifyGameFollowers for handheld', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(makeListingRecord())
      mockPrisma.user.findUnique.mockResolvedValue({ name: 'Admin' })
      mockPrisma.user.findMany.mockResolvedValue([])
      mockPrisma.device.findUnique.mockResolvedValue(null)
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' })
      mockPrisma.notification.findUnique.mockResolvedValue({ id: 'notif-1' })

      const spy = vi.spyOn(serviceInternals, 'notifyGameFollowers').mockResolvedValue(undefined)

      await serviceInternals.handleNotificationEvent(makeEvent())

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

      const spy = vi.spyOn(serviceInternals, 'notifyGameFollowers').mockResolvedValue(undefined)

      const event = makeEvent({
        eventType: NOTIFICATION_EVENTS.PC_LISTING_APPROVED,
        entityType: 'pcListing',
        entityId: 'pc-listing-1',
        payload: { pcListingId: 'pc-listing-1' },
      })

      await serviceInternals.handleNotificationEvent(event)

      expect(spy).toHaveBeenCalledWith(event, ['pc-author-1'], 'pcListing')
    })

    it('listing.approved triggers notifyMatchingHardwareUsers', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(
        makeListingRecord({ gameTitle: 'Test', socId: 'soc-1' }),
      )
      mockPrisma.user.findUnique.mockResolvedValue({ name: 'Admin' })
      mockPrisma.user.findMany.mockResolvedValue([])
      mockPrisma.device.findUnique.mockResolvedValue(null)
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' })
      mockPrisma.notification.findUnique.mockResolvedValue({ id: 'notif-1' })

      vi.spyOn(serviceInternals, 'notifyGameFollowers').mockResolvedValue(undefined)
      const spy = vi.spyOn(serviceInternals, 'notifyMatchingHardwareUsers')

      await serviceInternals.handleNotificationEvent(makeEvent())

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

      vi.spyOn(serviceInternals, 'notifyGameFollowers').mockResolvedValue(undefined)
      const spy = vi.spyOn(serviceInternals, 'notifyMatchingHardwareUsers')

      const event = makeEvent({
        eventType: NOTIFICATION_EVENTS.PC_LISTING_APPROVED,
        entityType: 'pcListing',
        entityId: 'pc-listing-1',
        payload: { pcListingId: 'pc-listing-1' },
      })

      await serviceInternals.handleNotificationEvent(event)

      expect(spy).not.toHaveBeenCalled()
    })

    it('does not crash on unknown event types', async () => {
      await expect(
        serviceInternals.handleNotificationEvent(
          makeEvent({ eventType: 'unknown.event', payload: {} }),
        ),
      ).resolves.not.toThrow()
    })
  })

  describe('notifyGameFollowers', () => {
    it('creates notifications for game followers (handheld)', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(makeListingRecord({ gameTitle: 'Zelda' }))
      mockGameFollowIterator(['follower-1', 'follower-2'])
      mockPrisma.user.findUnique.mockResolvedValue({ name: 'Admin' })
      mockPrisma.game.findUnique.mockResolvedValue({ id: 'game-1', title: 'Zelda' })
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' })
      mockPrisma.notification.findUnique.mockResolvedValue({ id: 'notif-1' })

      await serviceInternals.notifyGameFollowers(
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

      await serviceInternals.notifyGameFollowers(event, [], 'pcListing')

      const call = mockScheduleNotification.mock.calls[0][0] as {
        userId: string
        type: NotificationType
      }
      expect(call.userId).toBe('pc-follower-1')
      expect(call.type).toBe(NotificationType.FOLLOWED_GAME_NEW_PC_LISTING)
    })

    it('excludes already-notified users', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(makeListingRecord({ gameTitle: 'Zelda' }))
      mockGameFollowIterator(['author-1', 'follower-1'])
      mockPrisma.user.findUnique.mockResolvedValue({ name: 'Admin' })
      mockPrisma.game.findUnique.mockResolvedValue({ id: 'game-1', title: 'Zelda' })
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' })
      mockPrisma.notification.findUnique.mockResolvedValue({ id: 'notif-1' })

      await serviceInternals.notifyGameFollowers(
        makeEvent({ payload: { listingId: 'listing-1' } }),
        ['author-1'],
        'listing',
      )

      const ids = getScheduledUserIds()
      expect(ids).not.toContain('author-1')
      expect(ids).toContain('follower-1')
    })

    it('excludes the triggering user', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(makeListingRecord({ gameTitle: 'Zelda' }))
      mockGameFollowIterator(['admin-1', 'follower-1'])
      mockPrisma.user.findUnique.mockResolvedValue({ name: 'Admin' })
      mockPrisma.game.findUnique.mockResolvedValue({ id: 'game-1', title: 'Zelda' })
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' })
      mockPrisma.notification.findUnique.mockResolvedValue({ id: 'notif-1' })

      await serviceInternals.notifyGameFollowers(
        makeEvent({ triggeredBy: 'admin-1', payload: { listingId: 'listing-1' } }),
        [],
        'listing',
      )

      const ids = getScheduledUserIds()
      expect(ids).not.toContain('admin-1')
      expect(ids).toContain('follower-1')
    })

    it('filters out banned followers', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(makeListingRecord({ gameTitle: 'Zelda' }))
      mockGameFollowIterator(['banned-user', 'clean-user'])
      mockPrisma.userBan.findMany.mockResolvedValue([{ userId: 'banned-user' }])
      mockPrisma.user.findUnique.mockResolvedValue({ name: 'Admin' })
      mockPrisma.game.findUnique.mockResolvedValue({ id: 'game-1', title: 'Zelda' })
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' })
      mockPrisma.notification.findUnique.mockResolvedValue({ id: 'notif-1' })

      await serviceInternals.notifyGameFollowers(
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

      await serviceInternals.notifyGameFollowers(
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
      const result = serviceInternals.mapEventToNotificationType(eventType)
      expect(result).toBe(expectedType)
    })

    it('returns null for unknown event types', () => {
      expect(serviceInternals.mapEventToNotificationType('unknown.event')).toBeNull()
    })
  })

  describe('enrichContextWithData', () => {
    it('enriches PC listing data when pcListingId is present', async () => {
      mockPrisma.pcListing.findUnique.mockResolvedValue({
        game: { id: 'game-1', title: 'PC Game Title' },
      })
      mockPrisma.user.findUnique.mockResolvedValue({ name: 'Admin' })

      const context = await serviceInternals.enrichContextWithData(
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
      mockPrisma.listing.findUnique.mockResolvedValue(
        makeListingRecord({
          gameTitle: 'Zelda',
          deviceId: 'dev-1',
          emulatorName: 'AetherSX2',
        }),
      )
      mockPrisma.user.findUnique.mockResolvedValue({ name: 'Admin' })

      const context = await serviceInternals.enrichContextWithData(
        makeEvent({ payload: { listingId: 'listing-1' } }),
        NotificationType.LISTING_APPROVED,
      )

      expect(context.listingId).toBe('listing-1')
      expect(context.listingTitle).toBe('Zelda')
      expect(context.deviceName).toBe('Retroid RP4')
      expect(context.emulatorName).toBe('AetherSX2')
    })
  })

  describe('createNotificationFromEvent', () => {
    it('creates a scheduled listing approval notification from enriched listing data', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(
        makeListingRecord({
          gameTitle: 'The Legend of Zelda',
          deviceModelName: 'Pocket S',
          deviceBrandName: 'AYN',
          emulatorName: 'Sudachi',
        }),
      )
      mockPrisma.user.findUnique.mockResolvedValue({ name: 'Moderator' })

      const result = await service.createNotificationFromEvent(
        makeEvent({
          payload: {
            listingId: 'listing-1',
            approvedBy: 'admin-1',
            approvedAt: '2026-05-13T14:00:00.000Z',
          },
        }),
        'author-1',
      )

      expect(result).toBe('batch-id-1')
      expect(mockPrisma.notification.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'author-1',
            type: NotificationType.LISTING_APPROVED,
          }),
        }),
      )
      expect(mockScheduleNotification).toHaveBeenCalledTimes(1)

      const notification = mockScheduleNotification.mock.calls[0][0]
      expect(notification).toMatchObject({
        userId: 'author-1',
        type: NotificationType.LISTING_APPROVED,
        category: NotificationCategory.MODERATION,
        title: 'Your listing has been approved',
        message: 'Your listing "The Legend of Zelda" has been approved by Moderator',
        actionUrl: '/listings/listing-1',
        deliveryChannel: DeliveryChannel.IN_APP,
        metadata: {
          listingId: 'listing-1',
          approvedBy: 'Moderator',
          approvedAt: '2026-05-13T14:00:00.000Z',
        },
      })
    })

    it('creates a scheduled PC listing approval notification with the PC listing URL', async () => {
      mockPrisma.pcListing.findUnique.mockResolvedValue({
        game: { id: 'game-2', title: 'Elden Ring' },
      })
      mockPrisma.user.findUnique.mockResolvedValue({ name: 'Moderator' })

      const result = await service.createNotificationFromEvent(
        makeEvent({
          eventType: NOTIFICATION_EVENTS.PC_LISTING_APPROVED,
          entityType: 'pcListing',
          entityId: 'pc-listing-1',
          payload: {
            pcListingId: 'pc-listing-1',
            approvedBy: 'admin-1',
            approvedAt: '2026-05-13T14:00:00.000Z',
          },
        }),
        'pc-author-1',
      )

      expect(result).toBe('batch-id-1')
      expect(mockScheduleNotification).toHaveBeenCalledTimes(1)

      const notification = mockScheduleNotification.mock.calls[0][0]
      expect(notification).toMatchObject({
        userId: 'pc-author-1',
        type: NotificationType.LISTING_APPROVED,
        category: NotificationCategory.MODERATION,
        title: 'Your listing has been approved',
        message: 'Your listing "Elden Ring" has been approved by Moderator',
        actionUrl: '/pc-listings/pc-listing-1',
        deliveryChannel: DeliveryChannel.IN_APP,
        metadata: {
          pcListingId: 'pc-listing-1',
          approvedBy: 'Moderator',
          approvedAt: '2026-05-13T14:00:00.000Z',
        },
      })
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
