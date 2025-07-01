import { type ENGAGEMENT_ACTIONS } from './actions'

export type EngagementAction =
  (typeof ENGAGEMENT_ACTIONS)[keyof typeof ENGAGEMENT_ACTIONS]

// Analytics event data interface
export interface AnalyticsEventData {
  category: string
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
  [key: string]:
    | string
    | number
    | boolean
    | Record<string, string | number | boolean>
    | undefined
}
