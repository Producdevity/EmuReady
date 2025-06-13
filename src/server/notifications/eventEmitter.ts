import { EventEmitter } from 'events'
import type { NotificationEventPayload } from './types'

export interface NotificationEventData {
  eventType: string
  entityType: string
  entityId: string
  triggeredBy?: string
  payload?: NotificationEventPayload
}

class NotificationEventEmitter extends EventEmitter {
  private static instance: NotificationEventEmitter

  private constructor() {
    super()
    this.setMaxListeners(100)
  }

  static getInstance(): NotificationEventEmitter {
    if (!NotificationEventEmitter.instance) {
      NotificationEventEmitter.instance = new NotificationEventEmitter()
    }
    return NotificationEventEmitter.instance
  }

  emitNotificationEvent(data: NotificationEventData): void {
    this.emit('notification', data)
  }

  onNotificationEvent(callback: (data: NotificationEventData) => void): void {
    this.on('notification', callback)
  }

  removeNotificationListener(
    callback: (data: NotificationEventData) => void,
  ): void {
    this.off('notification', callback)
  }
}

export const notificationEventEmitter = NotificationEventEmitter.getInstance()

// Event type constants
export const NOTIFICATION_EVENTS = {
  LISTING_CREATED: 'listing.created',
  LISTING_COMMENTED: 'listing.commented',
  LISTING_VOTED: 'listing.voted',
  COMMENT_CREATED: 'comment.created',
  COMMENT_REPLIED: 'comment.replied',
  COMMENT_UPDATED: 'comment.updated',
  COMMENT_DELETED: 'comment.deleted',
  COMMENT_VOTED: 'comment.voted',
  USER_MENTIONED: 'user.mentioned',
  LISTING_APPROVED: 'listing.approved',
  LISTING_REJECTED: 'listing.rejected',
  LISTING_STATUS_OVERRIDDEN: 'listing.status_overridden',
  CONTENT_FLAGGED: 'content.flagged',
  GAME_ADDED: 'game.added',
  EMULATOR_UPDATED: 'emulator.updated',
  MAINTENANCE_SCHEDULED: 'maintenance.scheduled',
  FEATURE_ANNOUNCED: 'feature.announced',
} as const

export type NotificationEventType =
  (typeof NOTIFICATION_EVENTS)[keyof typeof NOTIFICATION_EVENTS]
