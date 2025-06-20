import { sendGAEvent } from '@next/third-parties/google'
import { type Role } from '@orm'

// Analytics Event Categories
export const ANALYTICS_CATEGORIES = {
  FILTER: 'filter',
  ENGAGEMENT: 'engagement',
  LISTING: 'listing',
  USER: 'user',
  NAVIGATION: 'navigation',
  PERFORMANCE: 'performance',
  ADMIN: 'admin',
  USER_JOURNEY: 'user_journey',
  CONTENT_DISCOVERY: 'content_discovery',
  TRUST: 'trust',
  CONVERSION: 'conversion',
  CONTENT_QUALITY: 'content_quality',
  SESSION: 'session',
} as const

// Filter Actions
export const FILTER_ACTIONS = {
  SYSTEM: 'system',
  DEVICE: 'device',
  SOC: 'soc',
  EMULATOR: 'emulator',
  PERFORMANCE: 'performance',
  SEARCH: 'search',
  CLEAR_ALL: 'clear_all',
  CLEAR_DEVICE_FILTER: 'clear_device_filter',
  CLEAR_SYSTEM_FILTER: 'clear_system_filter',
  CLEAR_EMULATOR_FILTER: 'clear_emulator_filter',
  CLEAR_SOC_FILTER: 'clear_soc_filter',
} as const

// Engagement Actions
export const ENGAGEMENT_ACTIONS = {
  VOTE_UP: 'vote_up',
  VOTE_DOWN: 'vote_down',
  VOTE_REMOVED: 'vote_removed',
  COMMENT_CREATED: 'comment_created',
  COMMENT_REPLY: 'comment_reply',
  COMMENT_EDITED: 'comment_edited',
  COMMENT_DELETED: 'comment_deleted',
  COMMENT_VOTE_UP: 'comment_vote_up',
  COMMENT_VOTE_DOWN: 'comment_vote_down',
  LISTING_VIEW: 'listing_view',
  GAME_VIEW: 'game_view',
  USER_PROFILE_VIEW: 'user_profile_view',
  VOTE_REMINDER_SHOWN: 'vote_reminder_shown',
  VOTE_REMINDER_CLICKED: 'vote_reminder_clicked',
  VOTE_REMINDER_DISMISSED: 'vote_reminder_dismissed',
} as const

// Listing Actions
export const LISTING_ACTIONS = {
  CREATED: 'created',
  EDITED: 'edited',
  DELETED: 'deleted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SHARED: 'shared',
} as const

// User Actions
export const USER_ACTIONS = {
  SIGNED_UP: 'signed_up',
  SIGNED_IN: 'signed_in',
  NOT_IN_DATABASE: 'not_in_database',
  PROFILE_UPDATED: 'profile_updated',
  PREFERENCES_UPDATED: 'preferences_updated',
  DEVICE_PREFERENCE_ADDED: 'device_preference_added',
  SOC_PREFERENCE_ADDED: 'soc_preference_added',
} as const

// Navigation Actions
export const NAVIGATION_ACTIONS = {
  PAGE_VIEW: 'page_view',
  PAGE_NOT_FOUND: 'page_not_found',
  MENU_ITEM_CLICKED: 'menu_item_clicked',
  SEARCH_PERFORMED: 'search_performed',
  FILTER_TOGGLE: 'filter_toggle',
} as const

// Performance Actions
export const PERFORMANCE_ACTIONS = {
  SLOW_QUERY: 'slow_query',
  ERROR_OCCURRED: 'error_occurred',
  PAGE_LOAD_TIME: 'page_load_time',
  SESSION_DURATION: 'session_duration',
} as const

// Admin Actions
export const ADMIN_ACTIONS = {
  LISTING_APPROVED: 'listing_approved',
  LISTING_REJECTED: 'listing_rejected',
  LISTING_BULK_APPROVED: 'listing_bulk_approved',
  LISTING_BULK_REJECTED: 'listing_bulk_rejected',
  GAME_APPROVED: 'game_approved',
  GAME_REJECTED: 'game_rejected',
  GAME_BULK_APPROVED: 'game_bulk_approved',
  GAME_BULK_REJECTED: 'game_bulk_rejected',
  USER_ROLE_CHANGED: 'user_role_changed',
  USER_DELETED: 'user_deleted',
  BULK_OPERATION: 'bulk_operation',
  TEMPLATE_CREATED: 'template_created',
  TEMPLATE_APPLIED: 'template_applied',
  ENTITY_CREATED: 'entity_created',
  ENTITY_UPDATED: 'entity_updated',
  ENTITY_DELETED: 'entity_deleted',
} as const

// User Journey Actions
export const USER_JOURNEY_ACTIONS = {
  REGISTRATION_STARTED: 'registration_started',
  REGISTRATION_COMPLETED: 'registration_completed',
  FIRST_LOGIN: 'first_login',
  FIRST_LISTING_CREATED: 'first_listing_created',
  FIRST_VOTE_CAST: 'first_vote_cast',
  FIRST_COMMENT_POSTED: 'first_comment_posted',
  BECAME_ACTIVE_USER: 'became_active_user',
  BECAME_POWER_USER: 'became_power_user',
  PROFILE_COMPLETED: 'profile_completed',
  PREFERENCES_SET: 'preferences_set',
  ONBOARDING_COMPLETED: 'onboarding_completed',
} as const

// Content Discovery Actions
export const CONTENT_DISCOVERY_ACTIONS = {
  SEARCH_PERFORMED: 'search_performed',
  SEARCH_NO_RESULTS: 'search_no_results',
  SEARCH_RESULTS_CLICKED: 'search_results_clicked',
  AUTOCOMPLETE_SELECTED: 'autocomplete_selected',
  POPULAR_CONTENT_VIEWED: 'popular_content_viewed',
  RELATED_CONTENT_CLICKED: 'related_content_clicked',
  CONTENT_SHARED: 'content_shared',
  EXTERNAL_LINK_CLICKED: 'external_link_clicked',
  FILTER_APPLIED: 'filter_applied',
  SORT_APPLIED: 'sort_applied',
} as const

// Trust System Actions
export const TRUST_ACTIONS_ANALYTICS = {
  TRUST_SCORE_INCREASED: 'trust_score_increased',
  TRUST_SCORE_DECREASED: 'trust_score_decreased',
  TRUST_LEVEL_UP: 'trust_level_up',
  TRUST_LEVEL_DOWN: 'trust_level_down',
  TRUST_ACTION_LOGGED: 'trust_action_logged',
  REPUTATION_MILESTONE: 'reputation_milestone',
} as const

// Session Actions
export const SESSION_ACTIONS = {
  SESSION_STARTED: 'session_started',
  SESSION_ENDED: 'session_ended',
  TIME_SPENT: 'time_spent',
  SCROLL_DEPTH: 'scroll_depth',
  INTERACTION_RATE: 'interaction_rate',
  DAILY_ACTIVE_USER: 'daily_active_user',
  WEEKLY_ACTIVE_USER: 'weekly_active_user',
  MONTHLY_ACTIVE_USER: 'monthly_active_user',
  USER_RETURNED: 'user_returned',
  FEATURE_DISCOVERED: 'feature_discovered',
  FEATURE_ADOPTED: 'feature_adopted',
} as const

// Content Quality Actions
export const CONTENT_QUALITY_ACTIONS = {
  CONTENT_FLAGGED: 'content_flagged',
  CONTENT_REPORTED: 'content_reported',
  CONTENT_MODERATED: 'content_moderated',
  SPAM_DETECTED: 'spam_detected',
  QUALITY_SCORE_CALCULATED: 'quality_score_calculated',
} as const

// Conversion Actions
export const CONVERSION_ACTIONS = {
  FUNNEL_STEP_COMPLETED: 'funnel_step_completed',
  CONVERSION_GOAL_REACHED: 'conversion_goal_reached',
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
  TUTORIAL_COMPLETED: 'tutorial_completed',
  FEATURE_UNLOCKED: 'feature_unlocked',
} as const

// Types for type safety
type EngagementAction =
  (typeof ENGAGEMENT_ACTIONS)[keyof typeof ENGAGEMENT_ACTIONS]

// Analytics event data interface
interface AnalyticsEventData {
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

/**
 * Recursively filter out undefined and null values from an object
 * @param obj
 */
function filterUndefinedValues(
  obj: Record<string, unknown>,
): Record<string, string | number | boolean> {
  const filtered: Record<string, string | number | boolean> = {}
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(
          filtered,
          filterUndefinedValues(value as Record<string, unknown>),
        )
      } else {
        filtered[key] = value as string | number | boolean
      }
    }
  })
  return filtered
}

interface LocalPreferences {
  analytics?: boolean
  performance?: boolean
  marketing?: boolean
}

/**
 * Check if analytics tracking is allowed based on cookie consent
 * Only applies to client-side tracking
 */
function isTrackingAllowed(category: string): boolean {
  // Server-side: always allow (no cookie consent needed)
  if (typeof window === 'undefined') {
    return true
  }

  // Client-side: check cookie consent
  const necessaryCategories = ['performance'] as const

  try {
    const consent = localStorage.getItem('cookieConsent')
    if (consent) {
      const preferences = JSON.parse(consent) as LocalPreferences

      // Always allow necessary performance events
      if (necessaryCategories.includes(category as 'performance')) {
        return true
      }

      // Check analytics consent for other categories
      return preferences.analytics === true
    } else {
      // No consent given, only allow necessary events
      return necessaryCategories.includes(category as 'performance')
    }
  } catch (error) {
    console.error('Error checking cookie consent:', error)
    // Fail safely - only allow necessary events
    return necessaryCategories.includes(category as 'performance')
  }
}

/**
 * Send analytics event with proper consent checking and environment handling
 */
function sendAnalyticsEvent(params: AnalyticsEventData) {
  // Check if tracking is allowed (handles client/server-side logic)
  if (!isTrackingAllowed(params.category)) {
    console.warn(
      'Analytics event blocked by cookie consent:',
      params.category,
      params.action,
    )
    return
  }

  // Build event data with proper typing
  const eventData: Record<string, string | number | boolean> = {
    category: params.category,
    action: params.action,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
  }

  // Add optional fields if they exist
  if (params.listingId) eventData.listingId = params.listingId
  if (params.gameId) eventData.gameId = params.gameId
  if (params.systemId) eventData.systemId = params.systemId
  if (params.emulatorId) eventData.emulatorId = params.emulatorId
  if (params.deviceId) eventData.deviceId = params.deviceId
  if (params.userId) eventData.userId = params.userId
  if (params.adminId) eventData.adminId = params.adminId
  if (params.commentId) eventData.commentId = params.commentId
  if (params.page) eventData.page = params.page
  if (params.filterName) eventData.filterName = params.filterName
  if (params.entityName) eventData.entityName = params.entityName
  if (params.errorType) eventData.errorType = params.errorType
  if (params.sessionId) eventData.sessionId = params.sessionId
  if (params.url) eventData.url = params.url
  if (params.searchQuery) eventData.searchQuery = params.searchQuery
  if (params.feature) eventData.feature = params.feature
  if (params.entityType) eventData.entityType = params.entityType
  if (params.duration) eventData.duration = params.duration
  if (params.value !== undefined) eventData.value = params.value

  // Add metadata
  if (params.metadata) {
    Object.entries(params.metadata).forEach(([key, value]) => {
      eventData[key] = value
    })
  }

  // Log in development, send to external service in production
  if (process.env.NODE_ENV === 'development') {
    const context = typeof window !== 'undefined' ? 'CLIENT' : 'SERVER'
    console.info(`📊 Analytics Event [${context}]:`, {
      category: params.category,
      action: params.action,
      data: eventData,
    })
  } else {
    // Only send to GA on client-side (GA requires browser environment)
    if (typeof window !== 'undefined') {
      sendGAEvent('event', params.action, {
        event_category: params.category,
        ...eventData,
      })
    }

    // For server-side events, you might want to send to a different service
    // or queue them for later processing
  }
}

// Main analytics object with typesafe methods
const analytics = {
  // Filter events
  filter: {
    system: (systemIds: string[], systemNames?: string[]) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.FILTER,
        action: FILTER_ACTIONS.SYSTEM,
        value: systemIds.length.toString(),
        metadata: {
          count: systemIds.length,
          systems: systemNames?.join(',') || systemIds.join(','),
        },
      })
    },

    device: (deviceIds: string[], deviceNames?: string[]) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.FILTER,
        action: FILTER_ACTIONS.DEVICE,
        value: deviceIds.length.toString(),
        metadata: {
          count: deviceIds.length,
          devices: deviceNames?.join(',') || deviceIds.join(','),
        },
      })
    },

    soc: (socIds: string[], socNames?: string[]) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.FILTER,
        action: FILTER_ACTIONS.SOC,
        value: socIds.length.toString(),
        metadata: {
          count: socIds.length,
          socs: socNames?.join(',') || socIds.join(','),
        },
      })
    },

    emulator: (emulatorIds: string[], emulatorNames?: string[]) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.FILTER,
        action: FILTER_ACTIONS.EMULATOR,
        value: emulatorIds.length.toString(),
        metadata: {
          count: emulatorIds.length,
          emulators: emulatorNames?.join(',') || emulatorIds.join(','),
        },
      })
    },

    performance: (performanceIds: number[], performanceLabels?: string[]) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.FILTER,
        action: FILTER_ACTIONS.PERFORMANCE,
        value: performanceIds.length.toString(),
        metadata: {
          count: performanceIds.length,
          levels: performanceLabels?.join(',') || performanceIds.join(','),
        },
      })
    },

    search: (searchTerm: string) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.FILTER,
        action: FILTER_ACTIONS.SEARCH,
        value: searchTerm.length.toString(),
        metadata: {
          hasSearchTerm: searchTerm.length > 0,
          searchLength: searchTerm.length,
        },
      })
    },

    clearAll: () => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.FILTER,
        action: FILTER_ACTIONS.CLEAR_ALL,
      })
    },

    clearDeviceFilter: () => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.FILTER,
        action: FILTER_ACTIONS.CLEAR_DEVICE_FILTER,
      })
    },

    clearSocFilter: () => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.FILTER,
        action: FILTER_ACTIONS.CLEAR_SOC_FILTER,
      })
    },

    clearSystemFilter: () => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.FILTER,
        action: FILTER_ACTIONS.CLEAR_SYSTEM_FILTER,
      })
    },

    clearEmulatorFilter: () => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.FILTER,
        action: FILTER_ACTIONS.CLEAR_EMULATOR_FILTER,
      })
    },
  },

  // Engagement events
  engagement: {
    vote: (params: {
      listingId: string
      voteValue: boolean | null // true = up, false = down, null = removed
      previousVote?: boolean | null
      gameId?: string
      systemId?: string
      emulatorId?: string
      deviceId?: string
    }) => {
      const { listingId, voteValue, previousVote, ...metadata } = params

      let action: EngagementAction
      if (voteValue === null) {
        action = ENGAGEMENT_ACTIONS.VOTE_REMOVED
      } else if (voteValue) {
        action = ENGAGEMENT_ACTIONS.VOTE_UP
      } else {
        action = ENGAGEMENT_ACTIONS.VOTE_DOWN
      }

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.ENGAGEMENT,
        action,
        entityType: 'listing',
        entityId: listingId,
        metadata: {
          ...metadata,
          previousVote: previousVote?.toString() || 'none',
          voteChanged: previousVote !== voteValue,
        },
      })
    },

    commentVote: (params: {
      commentId: string
      voteValue: boolean | null
      previousVote?: boolean | null
      listingId?: string
    }) => {
      const { commentId, voteValue, previousVote, ...metadata } = params

      let action: EngagementAction
      if (voteValue === null) {
        action = ENGAGEMENT_ACTIONS.VOTE_REMOVED
      } else if (voteValue) {
        action = ENGAGEMENT_ACTIONS.COMMENT_VOTE_UP
      } else {
        action = ENGAGEMENT_ACTIONS.COMMENT_VOTE_DOWN
      }

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.ENGAGEMENT,
        action,
        entityType: 'comment',
        entityId: commentId,
        metadata: {
          ...metadata,
          previousVote: previousVote?.toString() || 'none',
          voteChanged: previousVote !== voteValue,
        },
      })
    },

    comment: (params: {
      action: 'created' | 'edited' | 'deleted' | 'reply'
      commentId: string
      listingId: string
      isReply?: boolean
      contentLength?: number
      gameId?: string
      systemId?: string
    }) => {
      const { action, commentId, listingId, ...metadata } = params

      let analyticsAction: EngagementAction
      switch (action) {
        case 'created':
          analyticsAction = ENGAGEMENT_ACTIONS.COMMENT_CREATED
          break
        case 'reply':
          analyticsAction = ENGAGEMENT_ACTIONS.COMMENT_REPLY
          break
        case 'edited':
          analyticsAction = ENGAGEMENT_ACTIONS.COMMENT_EDITED
          break
        case 'deleted':
          analyticsAction = ENGAGEMENT_ACTIONS.COMMENT_DELETED
          break
      }

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.ENGAGEMENT,
        action: analyticsAction,
        entityType: 'comment',
        entityId: commentId,
        metadata: {
          listingId,
          ...metadata,
        },
      })
    },

    view: (params: {
      entityType: 'listing' | 'game' | 'user'
      entityId: string
      referrer?: string
      systemId?: string
      emulatorId?: string
      deviceId?: string
    }) => {
      const { entityType, entityId, ...metadata } = params

      let action: EngagementAction
      switch (entityType) {
        case 'listing':
          action = ENGAGEMENT_ACTIONS.LISTING_VIEW
          break
        case 'game':
          action = ENGAGEMENT_ACTIONS.GAME_VIEW
          break
        case 'user':
          action = ENGAGEMENT_ACTIONS.USER_PROFILE_VIEW
          break
      }

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.ENGAGEMENT,
        action,
        entityType,
        entityId,
        metadata,
      })
    },

    voteReminderShown: (params: { listingId: string; timeOnPage: number }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.ENGAGEMENT,
        action: ENGAGEMENT_ACTIONS.VOTE_REMINDER_SHOWN,
        entityType: 'listing',
        entityId: params.listingId,
        metadata: {
          timeOnPage: params.timeOnPage,
        },
      })
    },

    voteReminderClicked: (params: {
      listingId: string
      timeOnPage: number
    }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.ENGAGEMENT,
        action: ENGAGEMENT_ACTIONS.VOTE_REMINDER_CLICKED,
        entityType: 'listing',
        entityId: params.listingId,
        metadata: {
          timeOnPage: params.timeOnPage,
        },
      })
    },

    voteReminderDismissed: (params: {
      listingId: string
      timeOnPage: number
    }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.ENGAGEMENT,
        action: ENGAGEMENT_ACTIONS.VOTE_REMINDER_DISMISSED,
        entityType: 'listing',
        entityId: params.listingId,
        metadata: {
          timeOnPage: params.timeOnPage,
        },
      })
    },
  },

  // Listing events
  listing: {
    created: (params: {
      listingId: string
      gameId: string
      systemId: string
      emulatorId: string
      deviceId: string
      performanceId: number
      hasCustomFields?: boolean
      customFieldCount?: number
    }) => {
      const { listingId, ...metadata } = params

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.LISTING,
        action: LISTING_ACTIONS.CREATED,
        listingId,
        metadata,
      })
    },

    edited: (params: {
      listingId: string
      fieldsChanged: string[]
      gameId?: string
      systemId?: string
    }) => {
      const { listingId, fieldsChanged, ...metadata } = params

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.LISTING,
        action: LISTING_ACTIONS.EDITED,
        listingId,
        metadata: {
          ...metadata,
          fieldsChanged: fieldsChanged.join(','),
          fieldCount: fieldsChanged.length,
        },
      })
    },

    deleted: (params: {
      listingId: string
      gameId?: string
      systemId?: string
      reason?: string
    }) => {
      const { listingId, ...metadata } = params

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.LISTING,
        action: LISTING_ACTIONS.DELETED,
        listingId,
        metadata,
      })
    },

    approved: (params: {
      listingId: string
      gameId?: string
      systemId?: string
      approvedBy?: string
    }) => {
      const { listingId, ...metadata } = params

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.LISTING,
        action: LISTING_ACTIONS.APPROVED,
        listingId,
        metadata,
      })
    },

    rejected: (params: {
      listingId: string
      gameId?: string
      systemId?: string
      rejectedBy?: string
      reason?: string
    }) => {
      const { listingId, ...metadata } = params

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.LISTING,
        action: LISTING_ACTIONS.REJECTED,
        listingId,
        metadata,
      })
    },
  },

  // User events
  user: {
    signedUp: (params: {
      userId: string
      method?: 'clerk' | 'google' | 'email'
      referrer?: string
    }) => {
      const { userId, ...metadata } = params

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.USER,
        action: USER_ACTIONS.SIGNED_UP,
        userId,
        metadata,
      })
    },

    // TODO
    signedIn: (params: {
      userId: string
      method?: 'clerk' | 'google' | 'email' | 'discord' | 'github'
    }) => {
      const { userId, ...metadata } = params

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.USER,
        action: USER_ACTIONS.SIGNED_IN,
        userId,
        metadata,
      })
    },

    preferencesUpdated: (params: {
      userId: string
      preferenceType: 'device' | 'soc' | 'notification' | 'general'
      action: 'added' | 'removed' | 'updated'
      entityId?: string
    }) => {
      const { userId, ...metadata } = params

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.USER,
        action: USER_ACTIONS.PREFERENCES_UPDATED,
        userId,
        metadata,
      })
    },

    notInDatabase: (params: { userId: string; userRole: Role }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.USER,
        action: USER_ACTIONS.NOT_IN_DATABASE,
        userId: params.userId,
        metadata: {
          errorType: 'user_not_in_database',
          userRole: params.userRole,
        },
      })
    },
  },

  // Navigation events
  navigation: {
    pageNotFound: (params: { page: string }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.NAVIGATION,
        action: NAVIGATION_ACTIONS.PAGE_NOT_FOUND,
        page: params.page,
        metadata: { errorType: 'page_not_found' },
      })
    },

    pageView: (params: {
      page: string
      section?: string
      referrer?: string
      loadTime?: number
    }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.NAVIGATION,
        action: NAVIGATION_ACTIONS.PAGE_VIEW,
        page: params.page,
        metadata: filterUndefinedValues({
          section: params.section,
          referrer: params.referrer,
          loadTime: params.loadTime,
        }),
      })
    },

    menuItemClicked: (params: {
      menuItem: string
      section: string
      page: string
    }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.NAVIGATION,
        action: NAVIGATION_ACTIONS.MENU_ITEM_CLICKED,
        metadata: params,
      })
    },
  },

  // Performance events
  performance: {
    slowQuery: (params: {
      queryName: string
      duration: number
      threshold: number
    }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.PERFORMANCE,
        action: PERFORMANCE_ACTIONS.SLOW_QUERY,
        duration: params.duration,
        metadata: {
          queryName: params.queryName,
          threshold: params.threshold,
          exceededBy: params.duration - params.threshold,
        },
      })
    },

    errorOccurred: (params: {
      errorType: string
      errorMessage?: string
      page?: string
      userId?: string
      reason?: string
    }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.PERFORMANCE,
        action: PERFORMANCE_ACTIONS.ERROR_OCCURRED,
        errorType: params.errorType,
        metadata: filterUndefinedValues({
          errorMessage: params.errorMessage,
          reason: params.reason ?? 'unknown',
          page: params.page,
          userId: params.userId,
        }),
      })
    },
  },

  // Admin events
  admin: {
    listingApproved: (params: {
      listingId: string
      adminId: string
      gameId?: string
      systemId?: string
    }) => {
      const { listingId, adminId, ...metadata } = params

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.ADMIN,
        action: ADMIN_ACTIONS.LISTING_APPROVED,
        listingId,
        adminId,
        metadata: filterUndefinedValues(metadata),
      })
    },

    listingRejected: (params: {
      listingId: string
      adminId: string
      reason?: string
      gameId?: string
      systemId?: string
    }) => {
      const { listingId, adminId, ...metadata } = params

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.ADMIN,
        action: ADMIN_ACTIONS.LISTING_REJECTED,
        listingId,
        adminId,
        metadata: filterUndefinedValues(metadata),
      })
    },

    bulkOperation: (params: {
      operation: 'approve' | 'reject' | 'delete'
      entityType: 'listing' | 'game' | 'user'
      count: number
      adminId: string
    }) => {
      const { adminId, ...metadata } = params

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.ADMIN,
        action: ADMIN_ACTIONS.BULK_OPERATION,
        adminId,
        metadata,
      })
    },

    entityCreated: (params: {
      entityType: 'system' | 'emulator' | 'device' | 'soc' | 'brand' | 'game'
      entityId: string
      adminId: string
    }) => {
      const { adminId, ...metadata } = params

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.ADMIN,
        action: ADMIN_ACTIONS.ENTITY_CREATED,
        adminId,
        metadata,
      })
    },

    userRoleChanged: (params: {
      userId: string
      adminId: string
      oldRole: string
      newRole: string
    }) => {
      const { adminId, ...metadata } = params

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.ADMIN,
        action: ADMIN_ACTIONS.USER_ROLE_CHANGED,
        adminId,
        metadata,
      })
    },
  },

  // User Journey events
  userJourney: {
    registrationStarted: (params: { userId: string }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.USER_JOURNEY,
        action: USER_JOURNEY_ACTIONS.REGISTRATION_STARTED,
        userId: params.userId,
      })
    },

    registrationCompleted: (params: { userId: string }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.USER_JOURNEY,
        action: USER_JOURNEY_ACTIONS.REGISTRATION_COMPLETED,
        userId: params.userId,
      })
    },

    firstTimeAction: (params: {
      userId: string
      action: 'first_listing' | 'first_vote' | 'first_comment'
    }) => {
      const { userId, action, ...metadata } = params

      let analyticsAction: string
      switch (action) {
        case 'first_listing':
          analyticsAction = USER_JOURNEY_ACTIONS.FIRST_LISTING_CREATED
          break
        case 'first_vote':
          analyticsAction = USER_JOURNEY_ACTIONS.FIRST_VOTE_CAST
          break
        case 'first_comment':
          analyticsAction = USER_JOURNEY_ACTIONS.FIRST_COMMENT_POSTED
          break
        default:
          return
      }

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.USER_JOURNEY,
        action: analyticsAction,
        userId,
        metadata: filterUndefinedValues(metadata),
      })
    },
  },

  // Content Discovery events
  contentDiscovery: {
    searchPerformed: (params: {
      query: string
      resultCount: number
      category?: string
      page?: string
    }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.CONTENT_DISCOVERY,
        action: CONTENT_DISCOVERY_ACTIONS.SEARCH_PERFORMED,
        searchQuery: params.query,
        metadata: filterUndefinedValues({
          resultCount: params.resultCount,
          hasResults: params.resultCount > 0,
          queryLength: params.query.length,
          category: params.category,
          page: params.page,
        }),
      })
    },

    // TODO
    externalLinkClicked: (params: {
      url: string
      context: string
      entityId?: string
    }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.CONTENT_DISCOVERY,
        action: CONTENT_DISCOVERY_ACTIONS.EXTERNAL_LINK_CLICKED,
        url: params.url,
        metadata: filterUndefinedValues({
          context: params.context,
          entityId: params.entityId,
        }),
      })
    },
  },

  // Trust System events
  trust: {
    trustScoreChanged: (params: {
      userId: string
      oldScore: number
      newScore: number
      action: string
      weight: number
    }) => {
      const { userId, ...metadata } = params
      const action =
        params.newScore > params.oldScore
          ? TRUST_ACTIONS_ANALYTICS.TRUST_SCORE_INCREASED
          : TRUST_ACTIONS_ANALYTICS.TRUST_SCORE_DECREASED

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.TRUST,
        action,
        userId,
        metadata,
      })
    },

    trustLevelChanged: (params: {
      userId: string
      oldLevel: string
      newLevel: string
      score: number
    }) => {
      const { userId, ...metadata } = params

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.TRUST,
        action: TRUST_ACTIONS_ANALYTICS.TRUST_LEVEL_UP,
        userId,
        metadata,
      })
    },
  },

  // Session tracking
  session: {
    sessionStarted: (params: {
      userId?: string
      sessionId: string
      referrer?: string
      userAgent?: string
    }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.SESSION,
        action: SESSION_ACTIONS.SESSION_STARTED,
        sessionId: params.sessionId,
        metadata: filterUndefinedValues({
          userId: params.userId,
          referrer: params.referrer,
          userAgent: params.userAgent,
        }),
      })
    },

    sessionEnded: (params: {
      userId?: string
      sessionId: string
      duration: number
      pageViews: number
      interactions: number
    }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.SESSION,
        action: SESSION_ACTIONS.SESSION_ENDED,
        sessionId: params.sessionId,
        duration: params.duration,
        metadata: filterUndefinedValues({
          userId: params.userId,
          pageViews: params.pageViews,
          interactions: params.interactions,
          engagementRate: params.interactions / Math.max(params.pageViews, 1),
        }),
      })
    },

    featureDiscovered: (params: {
      userId?: string
      feature: string
      context: string
      sessionTime?: number
    }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.SESSION,
        action: SESSION_ACTIONS.FEATURE_DISCOVERED,
        feature: params.feature,
        metadata: filterUndefinedValues({
          userId: params.userId,
          context: params.context,
          sessionTime: params.sessionTime,
        }),
      })
    },
  },

  // Content Quality events
  contentQuality: {
    // TODO
    contentFlagged: (params: {
      entityType: 'listing' | 'comment' | 'game'
      entityId: string
      flaggedBy: string
      reason: string
    }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.CONTENT_QUALITY,
        action: CONTENT_QUALITY_ACTIONS.CONTENT_FLAGGED,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: {
          flaggedBy: params.flaggedBy,
          reason: params.reason,
        },
      })
    },

    // TODO
    spamDetected: (params: {
      entityType: string
      entityId: string
      confidence: number
      method: string
    }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.CONTENT_QUALITY,
        action: CONTENT_QUALITY_ACTIONS.SPAM_DETECTED,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: {
          confidence: params.confidence,
          method: params.method,
        },
      })
    },
  },

  // Conversion tracking
  conversion: {
    goalCompleted: (params: {
      userId?: string
      goalType:
        | 'listing_created'
        | 'first_vote'
        | 'first_comment'
        | 'profile_completed'
      goalValue?: number
      conversionPath?: string[]
    }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.CONVERSION,
        action: CONVERSION_ACTIONS.CONVERSION_GOAL_REACHED,
        userId: params.userId,
        metadata: filterUndefinedValues({
          goalType: params.goalType,
          goalValue: params.goalValue,
          conversionPathLength: params.conversionPath?.length,
        }),
      })
    },

    funnelStepCompleted: (params: {
      userId?: string
      funnelName: string
      stepName: string
      stepIndex: number
      timeToComplete?: number
    }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.CONVERSION,
        action: CONVERSION_ACTIONS.FUNNEL_STEP_COMPLETED,
        userId: params.userId,
        metadata: filterUndefinedValues({
          funnelName: params.funnelName,
          stepName: params.stepName,
          stepIndex: params.stepIndex,
          timeToComplete: params.timeToComplete,
        }),
      })
    },
  },
}

export default analytics
