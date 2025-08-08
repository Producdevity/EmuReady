import { z } from 'zod'
import { PAGINATION } from '@/data/constants'
import { NotificationCategory, NotificationType } from '@orm'

export const GetNotificationsSchema = z.object({
  limit: z.number().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
  offset: z.number().min(0).default(0),
  isRead: z.boolean().optional(),
  category: z.nativeEnum(NotificationCategory).optional(),
})

export const UpdateNotificationPreferenceSchema = z.object({
  type: z.nativeEnum(NotificationType),
  inAppEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
})

export const UpdateListingNotificationPreferenceSchema = z.object({
  listingId: z.string(),
  isEnabled: z.boolean(),
})

export const CreateSystemNotificationSchema = z.object({
  title: z.string().max(255),
  message: z.string(),
  actionUrl: z.string().optional(),
  type: z.enum([
    NotificationType.MAINTENANCE_NOTICE,
    NotificationType.FEATURE_ANNOUNCEMENT,
    NotificationType.POLICY_UPDATE,
  ]),
  metadata: z.record(z.unknown()).optional(),
})

export const MarkAsReadSchema = z.object({
  notificationId: z.string(),
})

export const DeleteNotificationSchema = z.object({
  notificationId: z.string(),
})

export const GetListingPreferencesSchema = z.object({
  listingId: z.string(),
})
