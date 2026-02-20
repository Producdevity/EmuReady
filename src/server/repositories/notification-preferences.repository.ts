import { BaseRepository } from './base.repository'
import type { NotificationType, Prisma } from '@orm'

export class NotificationPreferencesRepository extends BaseRepository {
  static readonly selects = {
    default: {
      id: true,
      userId: true,
      type: true,
      inAppEnabled: true,
      emailEnabled: true,
    } satisfies Prisma.NotificationPreferenceSelect,
  } as const

  async list(userId: string) {
    return this.handleDatabaseOperation(
      () =>
        this.prisma.notificationPreference.findMany({
          where: { userId },
          select: NotificationPreferencesRepository.selects.default,
          orderBy: { type: this.sortOrder },
        }),
      'NotificationPreference',
    )
  }

  async getByType(userId: string, type: NotificationType) {
    return this.handleDatabaseOperation(
      () =>
        this.prisma.notificationPreference.findUnique({
          where: { userId_type: { userId, type } },
          select: NotificationPreferencesRepository.selects.default,
        }),
      'NotificationPreference',
    )
  }

  async upsertPreference(
    userId: string,
    type: NotificationType,
    preferences: { inAppEnabled?: boolean; emailEnabled?: boolean },
  ) {
    return this.handleDatabaseOperation(
      () =>
        this.prisma.notificationPreference.upsert({
          where: { userId_type: { userId, type } },
          update: preferences,
          create: {
            userId,
            type,
            inAppEnabled: preferences.inAppEnabled ?? true,
            emailEnabled: preferences.emailEnabled ?? false,
          },
        }),
      'NotificationPreference',
    )
  }

  async getListingPreference(userId: string, listingId: string) {
    return this.handleDatabaseOperation(
      () =>
        this.prisma.listingNotificationPreference.findUnique({
          where: { userId_listingId: { userId, listingId } },
        }),
      'ListingNotificationPreference',
    )
  }

  async upsertListingPreference(userId: string, listingId: string, isEnabled: boolean) {
    return this.handleDatabaseOperation(
      () =>
        this.prisma.listingNotificationPreference.upsert({
          where: { userId_listingId: { userId, listingId } },
          update: { isEnabled },
          create: { userId, listingId, isEnabled },
        }),
      'ListingNotificationPreference',
    )
  }
}
