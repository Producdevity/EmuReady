import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationType, type PrismaClient } from '@orm'
import { NotificationPreferencesRepository } from './notification-preferences.repository'

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

function createMockPrisma() {
  return {
    notificationPreference: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    listingNotificationPreference: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  } as unknown as PrismaClient
}

describe('NotificationPreferencesRepository', () => {
  let prisma: PrismaClient
  let repository: NotificationPreferencesRepository

  beforeEach(() => {
    prisma = createMockPrisma()
    repository = new NotificationPreferencesRepository(prisma)
  })

  describe('list', () => {
    it('should call findMany with userId filter, select, and orderBy', async () => {
      const prefs = [
        {
          id: 'p1',
          userId: 'user-1',
          type: NotificationType.COMMENT_ON_LISTING,
          inAppEnabled: true,
          emailEnabled: false,
        },
      ]
      vi.mocked(prisma.notificationPreference.findMany).mockResolvedValueOnce(prefs as never)

      const result = await repository.list('user-1')

      expect(result).toEqual(prefs)
      expect(prisma.notificationPreference.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: NotificationPreferencesRepository.selects.default,
        orderBy: { type: 'asc' },
      })
    })

    it('should return array of preferences', async () => {
      vi.mocked(prisma.notificationPreference.findMany).mockResolvedValueOnce([])

      const result = await repository.list('user-1')

      expect(result).toEqual([])
    })
  })

  describe('getByType', () => {
    it('should call findUnique with userId_type composite key', async () => {
      const pref = {
        id: 'p1',
        userId: 'user-1',
        type: NotificationType.LISTING_VOTE_UP,
        inAppEnabled: true,
        emailEnabled: false,
      }
      vi.mocked(prisma.notificationPreference.findUnique).mockResolvedValueOnce(pref as never)

      const result = await repository.getByType('user-1', NotificationType.LISTING_VOTE_UP)

      expect(result).toEqual(pref)
      expect(prisma.notificationPreference.findUnique).toHaveBeenCalledWith({
        where: { userId_type: { userId: 'user-1', type: NotificationType.LISTING_VOTE_UP } },
        select: NotificationPreferencesRepository.selects.default,
      })
    })

    it('should return null when not found', async () => {
      vi.mocked(prisma.notificationPreference.findUnique).mockResolvedValueOnce(null)

      const result = await repository.getByType('user-1', NotificationType.LISTING_VOTE_UP)

      expect(result).toBeNull()
    })
  })

  describe('upsertPreference', () => {
    it('should call upsert with correct where/create/update shape', async () => {
      vi.mocked(prisma.notificationPreference.upsert).mockResolvedValueOnce({
        id: 'p1',
        inAppEnabled: false,
        emailEnabled: true,
      } as never)

      await repository.upsertPreference('user-1', NotificationType.COMMENT_ON_LISTING, {
        inAppEnabled: false,
        emailEnabled: true,
      })

      expect(prisma.notificationPreference.upsert).toHaveBeenCalledWith({
        where: { userId_type: { userId: 'user-1', type: NotificationType.COMMENT_ON_LISTING } },
        update: { inAppEnabled: false, emailEnabled: true },
        create: {
          userId: 'user-1',
          type: NotificationType.COMMENT_ON_LISTING,
          inAppEnabled: false,
          emailEnabled: true,
        },
      })
    })

    it('should default inAppEnabled to true and emailEnabled to false in create when not provided', async () => {
      vi.mocked(prisma.notificationPreference.upsert).mockResolvedValueOnce({ id: 'p1' } as never)

      await repository.upsertPreference('user-1', NotificationType.LISTING_VOTE_UP, {})

      expect(prisma.notificationPreference.upsert).toHaveBeenCalledWith({
        where: { userId_type: { userId: 'user-1', type: NotificationType.LISTING_VOTE_UP } },
        update: {},
        create: {
          userId: 'user-1',
          type: NotificationType.LISTING_VOTE_UP,
          inAppEnabled: true,
          emailEnabled: false,
        },
      })
    })
  })

  describe('getListingPreference', () => {
    it('should call findUnique on listingNotificationPreference with userId_listingId', async () => {
      const pref = { id: 'lp1', userId: 'user-1', listingId: 'listing-1', isEnabled: true }
      vi.mocked(prisma.listingNotificationPreference.findUnique).mockResolvedValueOnce(
        pref as never,
      )

      const result = await repository.getListingPreference('user-1', 'listing-1')

      expect(result).toEqual(pref)
      expect(prisma.listingNotificationPreference.findUnique).toHaveBeenCalledWith({
        where: { userId_listingId: { userId: 'user-1', listingId: 'listing-1' } },
      })
    })

    it('should return null when not found', async () => {
      vi.mocked(prisma.listingNotificationPreference.findUnique).mockResolvedValueOnce(null)

      const result = await repository.getListingPreference('user-1', 'listing-999')

      expect(result).toBeNull()
    })
  })

  describe('upsertListingPreference', () => {
    it('should call upsert with correct shape for enabling', async () => {
      vi.mocked(prisma.listingNotificationPreference.upsert).mockResolvedValueOnce({
        id: 'lp1',
      } as never)

      await repository.upsertListingPreference('user-1', 'listing-1', true)

      expect(prisma.listingNotificationPreference.upsert).toHaveBeenCalledWith({
        where: { userId_listingId: { userId: 'user-1', listingId: 'listing-1' } },
        update: { isEnabled: true },
        create: { userId: 'user-1', listingId: 'listing-1', isEnabled: true },
      })
    })

    it('should call upsert with correct shape for disabling', async () => {
      vi.mocked(prisma.listingNotificationPreference.upsert).mockResolvedValueOnce({
        id: 'lp1',
      } as never)

      await repository.upsertListingPreference('user-1', 'listing-1', false)

      expect(prisma.listingNotificationPreference.upsert).toHaveBeenCalledWith({
        where: { userId_listingId: { userId: 'user-1', listingId: 'listing-1' } },
        update: { isEnabled: false },
        create: { userId: 'user-1', listingId: 'listing-1', isEnabled: false },
      })
    })
  })
})
