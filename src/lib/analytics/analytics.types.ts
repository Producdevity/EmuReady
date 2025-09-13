import { type ANALYTICS_CATEGORIES, type ENGAGEMENT_ACTIONS } from './actions'

export type EngagementAction = (typeof ENGAGEMENT_ACTIONS)[keyof typeof ENGAGEMENT_ACTIONS]
export type AnalyticsCategory = (typeof ANALYTICS_CATEGORIES)[keyof typeof ANALYTICS_CATEGORIES]

// Analytics event data interface
export interface AnalyticsEventData {
  category: AnalyticsCategory
  action: string
  value?: string | number
  metadata?: Record<string, string | number | boolean>
  listingId?: string
  gameId?: string
  systemId?: string
  emulatorId?: string
  deviceId?: string
  userId?: string
  adminId?: string
  commentId?: string
  page?: string
  filterName?: string
  entityName?: string
  errorType?: string
  sessionId?: string
  url?: string
  searchQuery?: string
  feature?: string
  entityType?: string
  duration?: number
  [key: string]: string | number | boolean | Record<string, string | number | boolean> | undefined
}
